<template>
  <div v-loading="isLoading" class="auth">
    <p v-if="loading">Checking authentication...</p>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { checkAuthStatus } from '@/utils/auth'
import { vLoading } from '@/directives/LoadingDirective'

export default {
  directives: {
    loading: vLoading
  },
  onBeforeUnmount() {
    this.isLoading.value = false
  },
  setup() {
    'use strict'
    const error = ref('')
    const loading = ref(true)
    let isLoading = ref(false)

    const checkIfAuthenticated = async () => {
      isLoading.value = true
      try {
        if (!checkAuthStatus()) {
          error.value = 'Authentication failed. Please try again.'
        }
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      checkIfAuthenticated()
    })

    return {
      error,
      loading,
      isLoading
    }
  }
}
</script>

<style scoped>
.auth {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  color: #333;
  position: relative;
}
</style>
