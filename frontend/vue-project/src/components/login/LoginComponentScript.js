import { ref } from 'vue'
import apiService from '../../services/api-service'
import { inject } from 'vue'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const username = ref('')
    const password = ref('')
    const errorMessage = ref('')
    const authState = inject('authState')
    const actionType = ref('signin')
    const router = useRouter()

    const setActionType = (type) => {
      actionType.value = type
    }

    const handleLogin = async () => {
      try {
        if (actionType.value === 'signin') {
          apiService.signin(username.value, password.value).then((res) => {
            if (res.error) {
              errorMessage.value = res.error
            }
            if (res.success) {
              errorMessage.value = res.success
            }
            apiService.me().then((response) => {
              authState.isAuthenticated = !response.error
              if (authState.isAuthenticated) router.push({ name: 'home' })
            })
          })
        } else {
          apiService.signup(username.value, password.value).then((res) => {
            if (res.error) {
              errorMessage.value = res.error
            }
            if (res.success) {
              errorMessage.value = res.success
            }
          })
        }
      } catch (error) {
        errorMessage.value = error.message
      }
    }

    const handleGoogleLogin = async () => {
      try {
        apiService.googleSignin().then(() => {
          apiService.me().then((response) => {
            authState.isAuthenticated = !response.error
          })
        })
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
