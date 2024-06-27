import { ref } from 'vue'
import apiService from '../../services/api-service'
import { inject } from 'vue'

export default {
  setup() {
    const username = ref('')
    const password = ref('')
    const errorMessage = ref('')
    const authState = inject('authState')

    const handleLogin = async () => {
      try {
        apiService.signin()
        apiService.me().then((response) => {
          authState.isAuthenticated = !response.error
        })
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
