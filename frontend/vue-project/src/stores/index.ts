import { defineStore } from 'pinia'

// Define your store
export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    username: '',
    userId: ''
  }),
  actions: {
    setAuthState(authState: { isAuthenticated: any; username: any; userId: any }) {
      this.isAuthenticated = authState.isAuthenticated
      this.username = authState.username
      this.userId = authState.userId
    }
  }
})
