import { Server } from "socket.io";
import { Mutex } from "async-mutex";
import env from "dotenv";
import { ensureAuthenticatedSocket } from "./middlewares/auth.js";
import { Quiz } from "./models/quizzes.js";
import { User } from "./models/users.js";

env.config();

const joinQuizMutex = new Mutex();
const createRoomMutex = new Mutex();

const existingCodes = new Set();

const optionsMap = {
  option1: 0,
  option2: 1,
  option3: 2,
  option4: 3,
};

const generateUniqueCode = () => {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (existingCodes.has(code));
  existingCodes.add(code);
  return code;
};

export const initializeSocket = (server, sessionMiddleware) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.API_CORS_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });

  io.on("connection", (socket) => {
    ensureAuthenticatedSocket(socket, (err) => {
      const wrapAuthenticated = (handler) => {
        return (...args) => {
          ensureAuthenticatedSocket(socket, (err) => {
            if (err) {
              console.error("Unauthorized socket event access");
              socket.disconnect();
              return;
            }
            handler(...args);
          });
        };
      };

      socket.on(
        "createRoom",
        wrapAuthenticated(async (username, quizId) => {
          const code = await createRoomMutex.runExclusive(async () => {
            return generateUniqueCode();
          });
          const quiz = await Quiz.findOne({
            where: { id: quizId },
          });
          const user = await User.findOne({
            where: { username: username },
          });
          if (!quiz || !user) {
            return;
          }
          if (quiz.UserId !== user.id) {
            return;
          }
          socket.username = username;
          socket.isHost = true;
          socket.participants = [{ username, score: 0 }];
          socket.quizId = quizId;
          socket.join(code);
          io.to(code).emit("roomCreated", { code });
          io.to(code).emit("userJoined", {
            code,
            username,
            hostSocketId: socket.id,
          });
          io.to(code).emit("updateParticipants", socket.participants);
        }),
      );

      socket.on(
        "startQuiz",
        wrapAuthenticated(async (code, quizId, hostId) => {
          if (!socket.isHost) {
            return;
          }
          const quiz = await Quiz.findOne({
            where: { id: quizId },
          });
          const user = await User.findOne({
            where: { username: socket.username },
          });
          if (!quiz || !user) {
            return;
          }
          if (quiz.UserId !== user.id) {
            return;
          }
          socket.quizId = quizId;
          io.to(code).emit("quizStarted", { quizId, hostId });
        }),
      );

      socket.on(
        "broadcastQuestion",
        wrapAuthenticated(
          async ({
            code,
            question,
            questionIndex,
            username,
            answer,
            quizId,
          }) => {
            if (!socket.isHost || socket.username !== username) {
              return;
            }
            const quiz = await Quiz.findOne({
              where: { id: quizId },
            });
            const user = await User.findOne({
              where: { username: socket.username },
            });
            if (!quiz || !user) {
              return;
            }
            if (quiz.UserId !== user.id) {
              return;
            }
            // updates the answer and answerers for the current question
            socket.currentQuestionAnswerIndex = answer;
            socket.currentQuestionAnswerers = []; // keep track of who answered the question

            io.to(code).emit("questionBroadcasted", {
              question,
              questionIndex,
            });
          },
        ),
      );

      socket.on(
        "revealCorrectAnswer",
        wrapAuthenticated(async ({ code, answer, quizId }) => {
          if (!socket.isHost) {
            return;
          }
          const quiz = await Quiz.findOne({
            where: { id: quizId },
          });
          const user = await User.findOne({
            where: { username: socket.username },
          });
          if (!quiz || !user) {
            return;
          }
          if (quiz.UserId !== user.id) {
            return;
          }
          io.to(code).emit("correctAnswerRevealed", { answer });
        }),
      );

      socket.on(
        "broadcastQuizInfo",
        wrapAuthenticated(async ({ code, numQuestions, title, quizId }) => {
          if (!socket.isHost) {
            return;
          }
          const quiz = await Quiz.findOne({
            where: { id: quizId },
          });
          const user = await User.findOne({
            where: { username: socket.username },
          });
          if (!quiz || !user) {
            return;
          }
          if (quiz.UserId !== user.id) {
            return;
          }
          io.to(code).emit("quizInfoBroadcasted", { title, numQuestions });
        }),
      );
    });

    socket.on("joinQuiz", async (code, username) => {
      // Check if the room exists
      if (!io.sockets.adapter.rooms.has(code)) {
        return socket.emit("roomNotFound");
      }

      // Acquire the lock
      await joinQuizMutex.runExclusive(async () => {
        const roomUsers = Array.from(io.sockets.adapter.rooms.get(code) || []);
        const isDuplicateUsername = roomUsers.some((socketId) => {
          const userSocket = io.sockets.sockets.get(socketId);
          return userSocket && userSocket.username === username;
        });

        if (isDuplicateUsername) {
          return socket.emit("duplicateUsername");
        }

        // Set the username on the socket
        socket.username = username;
        socket.isHost = false;

        socket.join(code);

        // Find the host's socket ID
        const hostSocketId = roomUsers.find((socketId) => {
          const userSocket = io.sockets.sockets.get(socketId);
          return userSocket && userSocket.isHost;
        });

        io.sockets.sockets
          .get(hostSocketId)
          .participants.push({ username, score: 0 });

        io.to(code).emit("userJoined", { code, username, hostSocketId });
        io.to(code).emit(
          "updateParticipants",
          io.sockets.sockets.get(hostSocketId).participants,
        );
      });
    });

    socket.on(
      "selectAnswer",
      ({ code, answerIndex, timeLeft, username, hostSocketId }) => {
        const host = io.sockets.sockets.get(hostSocketId);
        if (
          !host.isHost ||
          !host.currentQuestionAnswerIndex ||
          !host.currentQuestionAnswerers
        ) {
          return;
        }
        if (host.currentQuestionAnswerers.includes(username)) {
          return;
        }
        host.currentQuestionAnswerers.push(username);
        const answer = host.currentQuestionAnswerIndex;
        const score =
          (answerIndex === optionsMap[answer] ? 1 : 0) * (1 + timeLeft) * 100;
        host.participants.find((p) => p.username === username).score += score;
        io.to(code).emit("updateParticipants", host.participants);
        io.to(code).emit("answerSelected", { answerIndex });
      },
    );

    socket.on("doneWithVideo", (code) => {
      io.to(code).emit("increaseDoneVideoCount");
    });

    socket.on("disconnecting", () => {
      const rooms = Array.from(socket.rooms).slice(1);
      rooms.forEach(async (room) => {
        const roomUsers = io.sockets.adapter.rooms.get(room);
        if (socket.isHost) {
          if (
            !(
              (socket.request.session &&
                socket.request.session.passport &&
                socket.request.session.passport.user) ||
              (socket.request.session && socket.request.session.username)
            )
          ) {
            return;
          }
          const quiz = await Quiz.findOne({
            where: { id: socket.quizId },
          });
          const user = await User.findOne({
            where: { username: socket.username },
          });
          if (!quiz || !user) {
            return;
          }
          if (quiz.UserId !== user.id) {
            return;
          }
          // Notify other users that the host has left
          io.to(room).emit("hostLeft");
        } else {
          const roomUsers = Array.from(
            io.sockets.adapter.rooms.get(room) || [],
          );
          if (roomUsers) {
            const hostSocketId = roomUsers.find((socketId) => {
              const userSocket = io.sockets.sockets.get(socketId);
              return userSocket && userSocket.isHost;
            });
            if (hostSocketId) {
              const host = io.sockets.sockets.get(hostSocketId);
              host.participants = host.participants.filter(
                (p) => p.username !== socket.username,
              );
              io.to(room).emit("updateParticipants", host.participants);
            }
          }
        }
        if (roomUsers && roomUsers.size === 1) {
          // if last user leaving
          existingCodes.delete(room);
        }
      });
    });
  });

  return io;
};
