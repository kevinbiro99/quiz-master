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
  title: ''
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
  createRoom(username) {
    socket.emit('createRoom', username)
  },
  startQuiz(code, quizId) {
    state.quizId = quizId
    socket.emit('startQuiz', code, quizId)
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
      (state.title = '')
  },
  selectAnswer(answerIndex, score) {
    socket.emit('selectAnswer', {
      code: state.roomCode,
      answerIndex: answerIndex,
      score: score,
      username: state.username
    })
  },
  endQuestion() {
    state.answerCounts = [0, 0, 0, 0]
  },
  broadcastQuestion(question, questionIndex) {
    socket.emit('broadcastQuestion', {
      code: state.roomCode,
      question,
      questionIndex
    })
  },
  broadcastQuizInfo(title, numQuestions) {
    socket.emit('broadcastQuizInfo', {
      code: state.roomCode,
      numQuestions,
      title
    })
  }
}

socket.on('roomNotFound', () => {
  console.error('Room not found')
  state.error = 'Room not found'
})

socket.on('roomCreated', ({ code }) => {
  state.roomCode = code
})

socket.on('connect', () => {
  state.connected = true
})

socket.on('disconnect', () => {
  socketFunctions.resetState()
  state.connected = false
})

socket.on('userJoined', ({ code, username }) => {
  if (state.username === '') state.username = username
  state.participants.push({ score: 0, username })
  state.roomCode = code
})

socket.on('quizStarted', ({ quizId }) => {
  console.log('Quiz started')
  state.quizId = quizId
  state.quizStarted = true
})

socket.on('answerSelected', ({ answerIndex, score, username }) => {
  state.answerCounts[answerIndex]++
  state.participants.find((p) => p.username === username).score += score
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
  console.log(`connect_error due to ${err.message}`)
})
