// src/views/AuthSuccess.vue or a similar component
<template>
  <div>
    <p v-if="loading">Checking authentication...</p>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { checkAuthStatus } from '@/utils/auth'

export default {
  setup() {
    const error = ref('')
    const loading = ref(true)

    const checkIfAuthenticated = async () => {
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
      loading
    }
  }
}
</script>
