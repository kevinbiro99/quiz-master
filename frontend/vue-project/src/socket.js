import { reactive } from "vue";
import { io } from "socket.io-client";
import { environment } from "./environments/environment";

export const state = reactive({
  connected: false,
  participants: [],
  roomCode: "",
  error: "",
  quizStarted: false,
  quizId: "",
  answerCounts: [0, 0, 0, 0],
});

const URL = environment.apiEndpoint;

export const socket = io(URL, {
  withCredentials: true,
  autoConnect: false
});

export const socketFunctions = {
  joinQuiz(code, userId) {
    socket.emit("joinQuiz", code, userId);
    state.error = "";
  },
  createRoom(code) {
    socket.emit("createRoom", code);
  },
  startQuiz(code, quizId) {
    state.quizId = quizId;
    socket.emit("startQuiz", code, quizId);
  },
  resetState() {
    state.connected = false;
    state.participants = [];
    state.roomCode = "";
    state.error = "";
    state.quizStarted = false;
    state.quizId = "";
    state.answerCounts = [0, 0, 0, 0];
  },
  selectAnswer(userId, answerIndex, score) {
    socket.emit("selectAnswer", { code: state.roomCode, answerIndex: answerIndex, userId: userId, score: score});
  },
  endQuestion() {
    state.answerCounts = [0, 0, 0, 0];
  },
}

socket.on("roomNotFound", () => {
  console.error("Room not found");
  state.error = "Room not found";
});

socket.on("roomCreated", ({ code }) => {
  state.roomCode = code;
});

socket.on("connect", () => {
  state.connected = true;
});

socket.on("disconnect", () => {
  state.connected = false;
});

socket.on("userJoined", ({ code, userId }) => {
  state.participants.push({ id: userId, score: 0 });
  state.roomCode = code;
});

socket.on("quizStarted", ({ quizId }) => {
  console.log("Quiz started");
  state.quizId = quizId;
  state.quizStarted = true;
});

socket.on("answerSelected", ({ answerIndex, userId, score }) => {
  state.answerCounts[answerIndex]++;
  state.participants.find(p => p.id === userId).score += score;
});

socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});
