<template>
  <button v-loading="isLoading" class="logout" :disabled="isQuizPage" @click="logout">
    Logout
  </button>
</template>

<script>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import apiService from '@/services/api-service'
import { checkAuthStatus } from '@/utils/auth'
import { state } from '@/socket'
import { vLoading } from '/src/directives/LoadingDirective.js'

export default {
  name: 'LogoutButton',
  directives: {
    loading: vLoading
  },
  onBeforeUnmount() {
    this.isLoading.value = false
  },
  setup() {
    const route = useRoute()
    const isQuizPage = computed(() => route.name === 'QuizPage' && state.quizStarted)
    const isLoading = ref(false)

    const logout = () => {
      if (isQuizPage.value) return

      try {
        isLoading.value = true
        apiService.signout().then(() => {
          checkAuthStatus()
        })
      } catch (error) {
        console.error('Error during logout', error)
      }
    }

    return {
      logout,
      isQuizPage,
      isLoading
    }
  }
}
</script>

<style scoped>
.logout {
  position: relative;
  background-color: #f44336;
  color: white;
  border: none;
  margin: 10px 20px;
  cursor: pointer;
  border-radius: 5px;
}

.logout:hover {
  background-color: #d32f2f;
}

.logout:disabled {
  background-color: #f44336;
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
