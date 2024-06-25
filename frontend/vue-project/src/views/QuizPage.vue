<template>
  <div>
    <h1>{{ quizTitle }}</h1>
    <div v-if="!questionEnded">
      <h2>{{ currentQuestion.text }}</h2>
      <div
        v-for="(choice, index) in currentQuestion.choices"
        :key="index"
        @click="selectAnswer(index)"
        :class="{ selected: selectedAnswer === index }"
      >
        {{ choice }}
      </div>
      <p>Time left: {{ timeLeft }} seconds</p>
    </div>
    <div v-else>
      <h2>Question Results</h2>
      <div
        v-for="(choice, index) in currentQuestion.choices"
        :key="index"
        :class="{
          selected: selectedAnswer === index,
          correct: index === optionsMap[correctAnswer]
        }"
      >
        {{ choice }}: {{ state.answerCounts[index] }} votes
      </div>
    </div>
    <div v-if="quizEnded">
      <h2>Quiz Ended</h2>
      <router-link to="/">Back to Home</router-link>
    </div>
    <div>
      <h2>Leaderboard</h2>
      <div v-for="participant in sortedParticipants" :key="participant.id">
        {{ participant.id }}: {{ participant.score }}
      </div>
    </div>
  </div>
</template>

<script>
import { socket, state } from '@/socket'
import apiService from '@/services/api-service'
import { socketFunctions } from '@/socket'

export default {
  data() {
    return {
      quizId: 0,
      quizQuestionIndex: -1,
      questions: [],
      quizTitle: '',
      currentQuestion: {
        text: 'Sample Question?',
        choices: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4']
      },
      selectedAnswer: null, // The index of the option picked by the user
      isAnswered: false, // Whether the user has picked an answer
      answerTimeLeft: 1, // How much time the user has left after answering
      timePerQuiz: 10,
      timeLeft: this.timePerQuiz,
      questionEnded: false,
      quizEnded: false,
      correctAnswer: 0, // Fetch the correct answer index from your API
      userId: 5, // TODO: Replace with actual user ID
      optionsMap: {
        option1: 0,
        option2: 1,
        option3: 2,
        option4: 3
      }
    }
  },
  computed: {
    state() {
      return state
    },
    sortedParticipants() {
      return [...state.participants].sort((a, b) => b.score - a.score)
    }
  },
  mounted() {
    this.fetchQuiz()
  },
  beforeUnmount() {
    socketFunctions.resetState()
    socket.disconnect()
  },
  methods: {
    async fetchQuiz() {
      this.quizId = state.quizId
      const { quiz, questions } = await apiService.getQuiz(this.userId, this.quizId)
      this.quizTitle = quiz.title
      this.questions = questions
      this.loadNextQuestion()
    },
    loadNextQuestion() {
      this.quizQuestionIndex++
      const question = this.questions[this.quizQuestionIndex]
      this.currentQuestion.text = question.text
      this.currentQuestion.choices = [
        question.option1,
        question.option2,
        question.option3,
        question.option4
      ]
      this.correctAnswer = question.correctAnswer
      this.selectedAnswer = null
      this.answerTimeLeft = 1
      this.isAnswered = false
      this.timeLeft = this.timePerQuiz
      this.questionEnded = false
      this.startTimer()
    },
    startTimer() {
      const timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--
        } else {
          clearInterval(timer)
          this.questionEnded = true
          this.startTimerBetweenQuestions()
        }
      }, 1000)
    },
    startTimerBetweenQuestions() {
      setTimeout(() => {
        this.endQuestion()
      }, 5000)
    },
    selectAnswer(index) {
      if (this.isAnswered) return
      this.isAnswered = true
      this.selectedAnswer = index
      this.answerTimeLeft = this.timeLeft
      const score =
        (this.selectedAnswer === this.optionsMap[this.correctAnswer] ? 1 : 0) *
        (1 + this.answerTimeLeft)
      socketFunctions.selectAnswer(this.userId, this.selectedAnswer, score)
    },
    endQuestion() {
      if (this.quizQuestionIndex < this.questions.length - 1) {
        socketFunctions.endQuestion()
        this.loadNextQuestion()
      } else {
        this.quizEnded = true
        socket.disconnect()
      }
    }
  }
}
</script>

<style scoped>
.selected {
  color: black;
  background-color: yellow;
}
.correct {
  color: black;
  background-color: green;
}
</style>
