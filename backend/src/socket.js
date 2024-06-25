import { Server } from "socket.io";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    
    socket.on("createRoom", (code) => {
      socket.join(code);
      io.to(code).emit("roomCreated", { code });
    });

    socket.on("joinQuiz", (code, userId) => {
      // Check if the room exists
      if (!io.sockets.adapter.rooms.has(code)) {
        return socket.emit("roomNotFound");
      }
      socket.join(code);
      io.to(code).emit("userJoined", { code, userId });
    });

    socket.on('startQuiz', (code, quizId) => {
      io.to(code).emit('quizStarted', { quizId });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });

    socket.on('selectAnswer', ({ code, answerIndex, userId, score }) => {
      io.to(code).emit('answerSelected', { answerIndex, userId, score });
    });
  });

  return io;
};


