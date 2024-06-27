<template>
  <div
    :class="{
      'auth-status': true,
      authenticated: authState.isAuthenticated,
      'not-authenticated': !authState.isAuthenticated
    }"
  >
    <p v-if="authState.isAuthenticated">Authenticated</p>
    <p v-else>Not Authenticated</p>
  </div>
</template>

<script>
import { inject } from 'vue'

export default {
  name: 'ProfileComponent',
  setup() {
    const authState = inject('authState')
    return {
      authState
    }
  }
}
</script>

<style scoped>
.auth-status {
  margin: 20px;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
  font-weight: bold;
}

.authenticated {
  background-color: green;
  color: white;
}

.not-authenticated {
  background-color: red;
  color: white;
}
</style>
