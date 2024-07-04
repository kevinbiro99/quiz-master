<template>
  <main class="main-content">
    <h1>Join a Quiz</h1>
    <p v-if="state.error">Error: {{ state.error }}</p>
    <p v-if="state.roomCode">Joined Room: {{ state.roomCode }}</p>
    <input v-if="!state.roomCode" type="text" v-model="code" placeholder="Enter Quiz Code" />
    <input v-if="!state.roomCode" type="text" v-model="username" placeholder="Optional: Username" />
    <button v-if="!state.roomCode" @click="joinQuiz">Join Quiz</button>
  </main>
</template>

<script>
import { socket } from '@/socket'
import { socketFunctions } from '@/socket'
import { state } from '@/socket'
import { watch } from 'vue'
import { inject } from 'vue'

export default {
  data() {
    return {
      code: '',
      username: null,
      socket: null,
      authState: inject('authState')
    }
  },
  computed: {
    state() {
      return state
    }
  },
  mounted() {
    this.initializeSocket()
    watch(
      () => state.quizStarted,
      (newVal) => {
        if (newVal) {
          this.$router.push({ name: 'QuizPage' })
        }
      }
    )
  },
  beforeUnmount() {
    if (this.$route.name !== 'QuizPage') {
      socketFunctions.resetState()
      socket.disconnect()
    }
  },
  methods: {
    initializeSocket() {
      socket.connect()
    },
    joinQuiz() {
      if (this.code) {
        socketFunctions.joinQuiz(this.code, this.authState.userId)
      }
    }
  }
}
</script>

<style scoped>
input {
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #969f96;
}
</style>
