import { ref } from 'vue'
import apiService from '/src/services/api-service.ts'
import { checkAuthStatus } from '/src/utils/auth.js'
import { vLoading } from '/src/directives/LoadingDirective.js'

export default {
  directives: {
    loading: vLoading
  },
  onBeforeUnmount() {
    this.isLoading.value = false
  },
  setup() {
    'use strict'
    const username = ref('')
    const password = ref('')
    const errorMessage = ref('')
    const actionType = ref('signin')
    let isLoading = ref(false)

    const setActionType = (type) => {
      actionType.value = type
    }

    const handleLogin = async () => {
      isLoading.value = true
      try {
        let res
        if (actionType.value === 'signin') {
          res = await apiService.signin(username.value, password.value)
        } else {
          res = await apiService.signup(username.value, password.value)
          username.value = ''
          password.value = ''
        }
        isLoading.value = false
        if (res.error) {
          errorMessage.value = res.error
        }
        if (res.success) {
          errorMessage.value = res.success
          if (actionType.value === 'signin') {
            isLoading.value = true
            checkAuthStatus()
          }
        }
      } catch (error) {
        isLoading.value = false
        errorMessage.value = error.message
      }
    }

    const handleGoogleLogin = async () => {
      isLoading.value = true
      try {
        await apiService.googleSignin()
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
      setActionType,
      isLoading
    }
  }
}
