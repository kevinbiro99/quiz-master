<template>
  <div v-loading="isLoading" class="quiz-container">
    <ConnectionLostComponent :visible="!state.connected" />
    <h1>{{ state.title }} : {{ state.questionIndex + 1 + '/' + state.numQuestions }}</h1>
    <div v-if="!questionEnded" class="question-container">
      <h2>{{ currentQuestion.text }}</h2>
      <div class="timer-bar-container">
        <div class="timer-bar" :style="{ width: timeBarWidth + '%' }"></div>
      </div>
      <div class="choices-container">
        <div
          v-for="(choice, index) in currentQuestion.choices"
          :key="index"
          @click="selectAnswer(index)"
          :class="{
            selected: selectedAnswer === index,
            locked: isAnswered && selectedAnswer !== index
          }"
          class="choice-box"
        >
          {{ choice }}
        </div>
      </div>
    </div>
    <div class="results" v-else>
      <h2>Question Results</h2>
      <div class="results-container">
        <div
          v-for="(choice, index) in currentQuestion.choices"
          :key="index"
          class="result-outline"
          :style="{ backgroundColor: index === optionsMap[correctAnswer] ? '#00bd7e' : '#333' }"
        >
          <div class="result-label">{{ choice }}</div>
          <div class="result-count">{{ state.answerCounts[index] }}</div>
          <div class="result-bar"></div>
        </div>
      </div>
      <div v-if="isHost && !quizEnded">
        <button class="btn" @click="endQuestion">Next Question</button>
      </div>
      <button v-if="isHost" class="btn" @click="loadVideo">Video answer</button>
      <div class="video-container"></div>
    </div>
    <div v-if="quizEnded">
      <h2 class="title">Quiz Ended</h2>
      <router-link class="btn" to="/">Back to Home</router-link>
    </div>
    <LeaderBoardComponent />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { socket, state as socketState } from '@/socket'
import apiService from '@/services/api-service'
import { socketFunctions } from '@/socket'
import { useAuthStore } from '@/stores/index'
import LeaderBoardComponent from '@/components/LeaderboardComponent.vue'
import ConnectionLostComponent from '@/components/ConnectionLostComponent.vue'
import { environment } from '@/environments/environment'

// Define reactive state variables
const quizId = ref(0)
const quizQuestionIndex = ref(-1)
const questions = ref([])
const currentQuestion = ref({
  text: 'Sample Question?',
  choices: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4']
})
const selectedAnswer = ref(null)
const isAnswered = ref(false)
const answerTimeLeft = ref(1)
const timePerQuiz = ref(10)
const timeLeft = ref(timePerQuiz.value)
const questionEnded = ref(false)
const quizEnded = ref(false)

const optionsMap = {
  option1: 0,
  option2: 1,
  option3: 2,
  option4: 3
}
const isLoading = ref(false)
const playVideo = ref(false)
const videoStartTime = ref(0)

// Auth store
const authState = useAuthStore()

// Computed properties
const state = computed(() => socketState)
const isHost = computed(() => questions.value.length > 0)
const timeBarWidth = computed(() => (timeLeft.value / timePerQuiz.value) * 100)
const maxVotes = computed(() => Math.max(...state.value.answerCounts, 1)) // Avoid division by zero
const correctAnswer = computed(() => state.value.answerIndex)

// Lifecycle hooks
onMounted(() => {
  fetchQuiz()
})

onBeforeUnmount(() => {
  isLoading.value = false
  socket.disconnect()
})

watch(
  () => state.value.question,
  (newVal) => {
    if (newVal) {
      isLoading.value = false
      loadNextQuestion()
    }
  }
)

// Methods
const fetchQuiz = () => {
  quizId.value = state.value.quizId
  try {
    isLoading.value = true
    apiService.getQuiz(authState.userId, quizId.value).then((res) => {
      if (res.error) {
        // Not the host of the quiz
        console.error('Error fetching quiz:', res.error)
      } else {
        questions.value = res.questions
        socketFunctions.broadcastQuizInfo(res.quiz.title, res.questions.length)
        broadcastQuestion()
      }
    })
  } catch (error) {
    isLoading.value = false
    console.error('Error fetching quiz:', error)
  }
}

const broadcastQuestion = () => {
  quizQuestionIndex.value++
  if (quizQuestionIndex.value >= questions.value.length) {
    quizEnded.value = true
    return
  }
  const question = questions.value[quizQuestionIndex.value]

  const questionWithoutAnswer = {
    text: question.text,
    option1: question.option1,
    option2: question.option2,
    option3: question.option3,
    option4: question.option4,
    correctAnswer: question.correctAnswer,
    timestamp: question.timestamp
  }
  socketFunctions.broadcastQuestion(
    questionWithoutAnswer,
    quizQuestionIndex.value,
    authState.username,
    question.correctAnswer
  )
}

const loadNextQuestion = () => {
  const question = state.value.question
  currentQuestion.value.text = question.text
  currentQuestion.value.choices = [
    question.option1,
    question.option2,
    question.option3,
    question.option4
  ]
  selectedAnswer.value = null
  answerTimeLeft.value = 1
  isAnswered.value = false
  timeLeft.value = timePerQuiz.value
  questionEnded.value = false
  state.value.answerCounts = [0, 0, 0, 0] // Reset answer counts
  videoStartTime.value = question.timestamp
  startTimer()
}

const startTimer = () => {
  const timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(timer)
      questionEnded.value = true
      revealCorrectAnswer()
    }
  }, 1000)
}

const revealCorrectAnswer = () => {
  if (isHost.value) {
    socketFunctions.revealCorrectAnswer()
  }
  if (state.value.questionIndex >= state.value.numQuestions - 1) {
    quizEnded.value = true
    state.value.quizStarted = false
  }
  setTimeout(() => {
    const resultBars = document.querySelectorAll('.result-bar')
    resultBars.forEach((bar, index) => {
      bar.style.width = `${Math.max(0.01, state.value.answerCounts[index] / maxVotes.value) * 75}%`
    })
  }, 500)
}

const selectAnswer = (index) => {
  if (isAnswered.value) return
  isAnswered.value = true
  selectedAnswer.value = index
  answerTimeLeft.value = timeLeft.value
  socketFunctions.selectAnswer(selectedAnswer.value, answerTimeLeft.value)
}

const endQuestion = () => {
  isLoading.value = true
  playVideo.value = false
  if (quizQuestionIndex.value < questions.value.length - 1) {
    socketFunctions.endQuestion()
    broadcastQuestion()
  } else {
    quizEnded.value = true
    socket.disconnect()
  }
}

const loadVideo = () => {
  if (playVideo.value) {
    playVideo.value = false
    document.querySelector('.video-container').innerHTML = ''
    return
  }
  playVideo.value = true
  const videoContainer = document.querySelector('.video-container')
  videoContainer.innerHTML = `
    <video id="video" width="90%" class="video-player" controls src=${environment.apiEndpoint}/api/users/${authState.userId}/quizzes/${quizId.value}/video></video>
  `
  videoContainer.querySelector('#video').currentTime = videoStartTime.value / 1000
}
</script>

<style scoped>
.quiz-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.question-container {
  text-align: center;
  width: 100%;
  height: 50%;
  margin-bottom: 20px;
  display: grid;
}

.timer-bar-container {
  justify-content: center;
  align-items: center;
  height: 20px;
  width: auto;
  margin: 0 10px;
}

.timer-bar {
  height: 100%;
  background-color: #00bd7e;
  transition: width 1s linear;
  border-radius: 10px;
  animation: flow 5s infinite;
}

@keyframes flow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

.choices-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  margin: 20px;
  height: 70%;
}

.choice-box {
  padding: 20px;
  background-color: #333;
  color: #fff;
  border-radius: 10px;
  cursor: pointer;
  flex: 1 1 calc(50% - 40px);
  text-align: center;
  transition: transform 0.3s;
}

.choice-box.selected {
  background-color: #00bd7e;
}

.choice-box.locked {
  cursor: not-allowed;
  opacity: 0.5;
}

.results-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 20px;
}

.results {
  width: 100%;
}

.result-outline {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 10px;
  padding: 5px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.result-label {
  width: 20%;
  text-align: left;
  font-size: 1em;
  font-weight: bold;
  margin-right: 10px;
}

.result-count {
  font-size: 1em;
  font-weight: bold;
  margin-left: 10px;
}

.result-bar {
  height: 20px;
  background-color: var(--color-text);
  border-radius: 5px;
  transition: width 1s ease-in-out;
  margin-left: 10px;
  width: 1%;
}

.btn {
  width: 80%;
  margin: 10px;
}

.video-player {
  width: 80%;
  height: 80%;
}

.video-container {
  width: 100%;
  height: 100%;
}
</style>
