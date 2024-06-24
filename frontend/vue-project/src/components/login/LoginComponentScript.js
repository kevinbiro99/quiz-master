import { ref } from 'vue'
import apiService from '../../services/api-service'

export default {
  setup() {
    const username = ref('')
    const password = ref('')
    const errorMessage = ref('')

    const handleLogin = async () => {
      try {
        const response = await apiService.login(username.value, password.value)
        // Handle successful login response (e.g., redirect to another page)
      } catch (error) {
        errorMessage.value = error.message
      }
    }

    return {
      username,
      password,
      errorMessage,
      handleLogin
    }
  }
}
