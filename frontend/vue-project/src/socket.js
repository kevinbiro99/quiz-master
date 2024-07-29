import { reactive } from 'vue'
import { io } from 'socket.io-client'
import { environment } from './environments/environment'

export const state = reactive({
  connected: false,
  participants: [],
  roomCode: '',
  error: '',
  quizStarted: false,
  quizId: '',
  answerCounts: [0, 0, 0, 0],
  username: '',
  question: '',
  numQuestions: 0,
  questionIndex: 0,
  title: '',
  hostConnected: false,
  hostSocketId: '',
  answerIndex: 0, // the host will store the correct answer index here after broadcasting a question
  // participants will have this updated after submitting an answer
  hostId: ''
})

const URL = environment.apiEndpoint

export const socket = io(URL, {
  withCredentials: true,
  autoConnect: false
})

export const socketFunctions = {
  joinQuiz(code, username) {
    socket.emit('joinQuiz', code, username)
    state.error = ''
  },
  createRoom(username, quizId) {
    state.quizId = quizId
    socket.emit('createRoom', username, quizId)
  },
  startQuiz(code, quizId, hostId) {
    state.quizId = quizId
    state.hostId = hostId
    socket.emit('startQuiz', code, quizId, hostId)
  },
  resetState() {
    state.connected = false
    state.participants = []
    state.roomCode = ''
    state.error = ''
    state.quizStarted = false
    state.quizId = ''
    state.answerCounts = [0, 0, 0, 0]
    ;(state.username = ''),
      (state.question = ''),
      (state.numQuestions = 0),
      (state.questionIndex = 0),
      (state.title = ''),
      (state.hostConnected = false),
      (state.answerIndex = 0),
      (state.hostSocketId = '')
  },
  selectAnswer(answerIndex, timeLeft) {
    socket.emit('selectAnswer', {
      code: state.roomCode,
      answerIndex: answerIndex,
      timeLeft: timeLeft,
      username: state.username,
      hostSocketId: state.hostSocketId
    })
  },
  revealCorrectAnswer() {
    socket.emit('revealCorrectAnswer', {
      code: state.roomCode,
      answer: state.answerIndex,
      quizId: state.quizId
    })
  },
  endQuestion() {
    state.answerCounts = [0, 0, 0, 0]
  },
  broadcastQuestion(question, questionIndex, username, answer) {
    // store the answer for the question but don't broadcast it
    state.answerIndex = answer
    socket.emit('broadcastQuestion', {
      code: state.roomCode,
      question,
      questionIndex,
      username,
      answer,
      quizId: state.quizId
    })
  },
  broadcastQuizInfo(title, numQuestions) {
    socket.emit('broadcastQuizInfo', {
      code: state.roomCode,
      numQuestions,
      title,
      quizId: state.quizId
    })
  }
}

socket.on('roomNotFound', () => {
  console.error('Room not found')
  state.error = 'Room not found'
})

socket.on('roomCreated', ({ code }) => {
  state.roomCode = code
  state.hostConnected = true
})

socket.on('disconnect', () => {
  socketFunctions.resetState()
})

socket.on('connect', () => {
  state.connected = true
})

socket.on('hostLeft', () => {
  state.connected = false
  state.quizStarted = false
})

socket.on('userJoined', ({ code, username, hostSocketId }) => {
  if (state.username === '') {
    state.username = username
    state.roomCode = code
    state.hostSocketId = hostSocketId
  }
})

socket.on('quizStarted', ({ quizId, hostId }) => {
  state.quizStarted = true
  state.quizId = quizId
  state.hostId = hostId
})

socket.on('answerSelected', ({ answerIndex }) => {
  state.answerCounts[answerIndex]++
})

socket.on('correctAnswerRevealed', ({ answer }) => {
  state.answerIndex = answer
})

socket.on('duplicateUsername', () => {
  state.error = 'Username already exists'
})

socket.on('updateParticipants', (participants) => {
  state.participants = participants
})

socket.on('questionBroadcasted', ({ question, questionIndex }) => {
  state.question = question
  state.questionIndex = questionIndex
})

socket.on('quizInfoBroadcasted', ({ title, numQuestions }) => {
  state.numQuestions = numQuestions
  state.title = title
})

socket.on('connect_error', (err) => {
  console.error(`connect_error due to ${err.message}`)
})
