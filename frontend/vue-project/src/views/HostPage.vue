<template>
  <div>
    <h1>Host a Quiz</h1>
    <div v-for="quiz in quizzes" :key="quiz.id">
      <router-link :to="{ name: 'QuizHost', params: { quizId: quiz.id } }">{{
        quiz.title
      }}</router-link>
      <button @click="deleteQuiz(quiz.id)">Delete</button>
    </div>
  </div>
</template>

<script>
import apiService from '../services/api-service'
export default {
  data() {
    return {
      quizzes: [],
      userId: 1 // Replace with actual user ID
    }
  },
  mounted() {
    this.fetchQuizzes()
  },
  methods: {
    async fetchQuizzes() {
      this.quizzes = await apiService.getQuizzes(this.userId)
    },
    async deleteQuiz(quizId) {
      await apiService.deleteQuiz(this.userId, quizId)
      this.fetchQuizzes()
    }
  }
}
</script>
