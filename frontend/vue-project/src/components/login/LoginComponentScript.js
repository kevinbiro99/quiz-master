import { ref } from 'vue'
import apiService from '../../services/api-service'
import { checkAuthStatus } from '@/utils/auth'

export default {
  setup() {
    const username = ref('')
    const password = ref('')
    const errorMessage = ref('')
    const actionType = ref('signin')

    const setActionType = (type) => {
      actionType.value = type
    }

    const handleLogin = () => {
      try {
        if (actionType.value === 'signin') {
          apiService.signin(username.value, password.value).then((res) => {
            if (res.error) {
              errorMessage.value = res.error
            }
            if (res.success) {
              errorMessage.value = res.success
            }
            checkAuthStatus()
          })
        } else {
          apiService.signup(username.value, password.value).then((res) => {
            if (res.error) {
              errorMessage.value = res.error
            }
            if (res.success) {
              errorMessage.value = res.success
            }
            username.value = ''
            password.value = ''
          })
        }
      } catch (error) {
        errorMessage.value = error.message
      }
    }

    const handleGoogleLogin = () => {
      try {
        apiService.googleSignin()
      } catch (error) {
        errorMessage.value = error.message
      }
    }

    return {
      username,
      password,
      errorMessage,
      handleLogin,
      handleGoogleLogin,
      setActionType
    }
  }
}
