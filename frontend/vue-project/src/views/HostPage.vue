<template>
  <div>
    <h1>Host a Quiz</h1>
    <div v-for="quiz in quizzes" :key="quiz.id">
      <router-link :to="{ name: 'QuizHost', params: { quizId: quiz.id } }">{{
        quiz.title
      }}</router-link>
    </div>
  </div>
</template>

<script>
import apiService from '../services/api-service'
export default {
  data() {
    return {
      quizzes: []
    }
  },
  mounted() {
    this.fetchQuizzes()
  },
  methods: {
    async fetchQuizzes() {
      const userId = 5 // Replace with actual user ID
      this.quizzes = await apiService.getQuizzes(userId)
    }
  }
}
</script>
