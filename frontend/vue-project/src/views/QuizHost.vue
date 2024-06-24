<template>
  <div>
    <h1>Host Quiz: {{ quizTitle }}</h1>
    <!-- Add host quiz functionality here -->
  </div>
</template>

<script>
import apiService from '../services/api-service'
export default {
  data() {
    return {
      quizTitle: ''
    }
  },
  mounted() {
    this.fetchQuiz()
  },
  methods: {
    async fetchQuiz() {
      const userId = 5 // Replace with actual user ID
      const quizId = this.$route.params.quizId
      const quiz = await apiService.getQuiz(userId, quizId)
      this.quizTitle = quiz.title
    }
  }
}
</script>
