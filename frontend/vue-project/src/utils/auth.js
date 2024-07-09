import apiService from '@/services/api-service'
import { useAuthStore } from '@/stores/index'
import router from '@/router'

export function checkAuthStatus() {
  const authStore = useAuthStore()
  let state = { isAuthenticated: false, username: '', userId: '' }

  try {
    apiService.me().then((response) => {
      if (response.error) {
        authStore.setAuthState(state)
        sessionStorage.setItem('authState', JSON.stringify(state))
        router.push({ name: 'login' })
        return false
      }
      state.isAuthenticated = true
      state.username = response.username
      state.userId = response.id
      authStore.setAuthState(state)
      sessionStorage.setItem('authState', JSON.stringify(state))
      router.push({ name: 'home' })
      return true
    })
  } catch (err) {
    console.error('Error checking authentication status:', err)
  }
}
