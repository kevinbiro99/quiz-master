<template>
  <div class="main-content">
    <div class="container">
      <ConnectionLostComponent :visible="!state.connected" />
      <h2>Join a Quiz</h2>
      <p v-if="state.error">Error: {{ state.error }}</p>
      <p v-if="state.roomCode">Joined Room: {{ state.roomCode }}</p>
      <form @submit.prevent="joinQuiz">
        <div class="form-group" v-if="!state.roomCode">
          <input type="text" v-model="code" placeholder="Enter Quiz Code" required />
          <input
            type="text"
            v-model="username"
            placeholder="Optional: Username"
            :required="!authStore.isAuthenticated"
          />
        </div>
        <div class="button-group">
          <button class="btn" v-if="!state.roomCode">Join Quiz</button>
        </div>
      </form>
      <ParticipantsComponent v-if="state.roomCode" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { socket, state, socketFunctions } from '@/socket'
import { useAuthStore } from '@/stores/index'
import ParticipantsComponent from '@/components/ParticipantsComponent.vue'
import ConnectionLostComponent from '@/components/ConnectionLostComponent.vue'

const authStore = useAuthStore()
const code = ref('')
const username = ref('')
const router = useRouter()
const route = useRoute()

const joinQuiz = () => {
  if (code.value) {
    // Use the username from the authStore if the user does not provide one
    if (!username.value) {
      username.value = authStore.username
    }
    socketFunctions.joinQuiz(code.value, username.value)
  }
}

const initializeSocket = () => {
  socket.connect()
}

watch(
  () => state.quizStarted,
  (newVal) => {
    if (newVal) {
      router.push({ name: 'QuizPage' })
    }
  }
)

onMounted(initializeSocket)

onBeforeUnmount(() => {
  if (route.name !== 'QuizPage') {
    socketFunctions.resetState()
    socket.disconnect()
  }
})
</script>

<style scoped>
@import '../assets/form.css';

input {
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #969f96;
}

.btn {
  width: 100%;
}
</style>
