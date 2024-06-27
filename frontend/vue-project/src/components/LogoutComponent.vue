<template>
  <button class="logout" @click="logout">Logout</button>
</template>

<script>
import { inject } from 'vue'
import apiService from '@/services/api-service'

export default {
  name: 'LogoutButton',
  setup() {
    const authState = inject('authState')

    const logout = () => {
      try {
        apiService.signout().then(() => {
          apiService.me().then((res) => {
            if (res.error) authState.isAuthenticated = false
            else authState.isAuthenticated = true
          })
        })
      } catch (error) {
        console.error('Error during logout', error)
      }
    }

    return {
      logout
    }
  }
}
</script>

<style scoped>
.logout {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 5px;
}

.logout:hover {
  background-color: #d32f2f;
}
</style>
