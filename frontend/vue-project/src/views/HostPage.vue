<template>
  <div>
    <h1>Host a Quiz</h1>
    <div v-for="quiz in quizzes" :key="quiz.id">
      <router-link :to="{ name: 'QuizHost', params: { quizId: quiz.id } }">{{
        quiz.title
      }}</router-link>
    </div>
    <p v-if="!this.authState.isAuthenticated">Must be logged in to host a quiz</p>
  </div>
</template>

<script>
import apiService from '../services/api-service'
import { inject } from 'vue'
export default {
  data() {
    return {
      quizzes: [],
      authState: inject('authState')
    }
  },
  mounted() {
    this.fetchQuizzes()
  },
  methods: {
    async fetchQuizzes() {
      if (this.authState.userId > 0) {
        apiService.getQuizzes(this.authState.userId).then((res) => {
          if (res.error) this.quizzes = []
          else this.quizzes = res
        })
      }
    }
  }
}
</script>
