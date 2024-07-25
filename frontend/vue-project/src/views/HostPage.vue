<template>
  <div v-loading="isLoading" class="main-content container">
    <h2>Host a Quiz</h2>
    <p v-if="!this.authState.isAuthenticated">Must be logged in to host a quiz</p>
    <div v-else>
      <div v-if="quizzes.length < 1">No quizzes found</div>
      <div v-for="quiz in quizzes" :key="quiz.id" class="row quiz-row">
        <div class="col-10 col-sm-10">
          <router-link
            class="select-quiz-btn"
            :to="{ name: 'QuizHost', params: { quizId: quiz.id } }"
            >{{ quiz.title }}</router-link
          >
        </div>
        <div class="col-2 col-sm-2">
          <button @click="deleteQuiz(quiz.id)" class="delete"></button>
        </div>
      </div>
    </div>
    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="btn">Previous</button>
      <span class="no-wrap">Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage >= totalPages" class="btn">Next</button>
    </div>
  </div>
</template>

<script>
import apiService from '../services/api-service'
import { useAuthStore } from '@/stores/index'
import { vLoading } from '/src/directives/LoadingDirective.js'
import { ref } from 'vue'

export default {
  directives: {
    loading: vLoading
  },
  setup() {
    const authState = useAuthStore()
    const isLoading = ref(false)
    return { authState, isLoading }
  },
  data() {
    return {
      quizzes: [],
      currentPage: 1,
      pageSize: 5, // number of quizzes per page
      totalPages: 0 // total number of pages
    }
  },
  mounted() {
    this.fetchQuizzes()
  },
  onBeforeUnmount() {
    this.isLoading = false
  },
  methods: {
    fetchQuizzes() {
      this.isLoading = true
      apiService
        .getQuizzes(this.authState.userId, this.currentPage - 1, this.pageSize)
        .then((res) => {
          this.isLoading = false
          if (res.error) this.quizzes = []
          else {
            this.quizzes = res.quizzes
            this.totalPages = res.numPages
            if (this.currentPage > this.totalPages) {
              this.currentPage = Math.max(1, this.totalPages)
              this.fetchQuizzes()
            }
          }
        })
    },
    deleteQuiz(quizId) {
      this.isLoading = true
      apiService.deleteQuiz(this.authState.userId, quizId).then((res) => {
        this.isLoading = false
        if (res.error) console.error(res.error)
        else this.fetchQuizzes()
      })
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
        this.fetchQuizzes()
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
        this.fetchQuizzes()
      }
    }
  }
}
</script>

<style scoped>
@import '../assets/cols.css';
@import '../assets/main.css';

.quiz-row {
  border-bottom: 1px solid #ccc;
  padding: 10px 0;
}

.select-quiz-btn {
  display: block;
  width: 100%;
  padding: 12px;
  background-color: #00bd7e;
  color: #ffffff;
  text-align: center;
  border-radius: 15px;
  text-decoration: none;
  transition: background-color 0.3s ease;
}

.select-quiz-btn:hover {
  background-color: #007f52;
}
</style>
