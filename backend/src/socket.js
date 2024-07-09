import { Server } from "socket.io";
import { Mutex } from "async-mutex";

const joinQuizMutex = new Mutex();
const createRoomMutex = new Mutex();

const existingCodes = new Set();

const generateUniqueCode = () => {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (existingCodes.has(code));
  existingCodes.add(code);
  return code;
};

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    socket.on("createRoom", async (username) => {
      const code = await createRoomMutex.runExclusive(async () => {
        return generateUniqueCode();
      });
      socket.username = username;
      socket.join(code);
      io.to(code).emit("roomCreated", { code });
      io.to(code).emit("userJoined", { code, username });
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

        socket.join(code);

        // Get updated list of participants
        const participants = roomUsers
          .map((socketId) => {
            const userSocket = io.sockets.sockets.get(socketId);
            return userSocket
              ? { username: userSocket.username, score: userSocket.score || 0 }
              : null;
          })
          .filter((user) => user !== null);

        participants.push({ username, score: 0 });
        io.to(code).emit("userJoined", { code, username, participants });

        socket.emit("updateParticipants", participants);
      });
    });

    socket.on("startQuiz", (code, quizId) => {
      io.to(code).emit("quizStarted", { quizId });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
      const rooms = Array.from(socket.rooms).slice(1); // exclude socket's own room
      rooms.forEach((room) => {
        const roomUsers = io.sockets.adapter.rooms.get(room);
        if (roomUsers && roomUsers.size === 1) {
          // if last user leaving
          existingCodes.delete(room);
        }
      });
    });

    socket.on("selectAnswer", ({ code, answerIndex, score, username }) => {
      io.to(code).emit("answerSelected", { answerIndex, score, username });
    });

    socket.on("broadcastQuestion", ({ code, question, questionIndex }) => {
      io.to(code).emit("questionBroadcasted", { question, questionIndex });
    });

    socket.on("broadcastQuizInfo", ({ code, numQuestions, title }) => {
      io.to(code).emit("quizInfoBroadcasted", { title, numQuestions });
    });
  });

  return io;
};
