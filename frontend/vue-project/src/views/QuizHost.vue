<template>
  <div v-loading="isLoading" class="main-content container">
    <h2>Host Quiz: {{ quizTitle }}</h2>
    <div>
      <button
        v-if="state.roomCode.length < 1"
        :class="{ disabled: state.roomCode.length > 0 }"
        :disabled="state.roomCode.length > 0"
        @click="startSession"
      >
        Start Session
      </button>
      <div v-if="state.roomCode.length > 0">
        <p>Room Created: {{ state.roomCode }}</p>
        <button
          :class="{ disabled: state.participants.length < 1 }"
          :disabled="state.participants.length < 1"
          @click="startQuiz"
        >
          Start Quiz
        </button>
        <ParticipantsComponent />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiService from '../services/api-service'
import { socket, state, socketFunctions } from '@/socket'
import { useAuthStore } from '@/stores/index'
import ParticipantsComponent from '@/components/ParticipantsComponent.vue'

const route = useRoute()
const router = useRouter()
const authState = useAuthStore()

const quizId = ref(0)
const quizTitle = ref('Quiz Title')
const isLoading = ref(false)

const fetchQuiz = () => {
  quizId.value = route.params.quizId
  isLoading.value = true
  apiService.getQuiz(authState.userId, quizId.value).then((res) => {
    isLoading.value = false
    if (res.error) {
      console.error(res.error)
    } else {
      quizTitle.value = res.quiz.title
    }
  })
}

const startSession = () => {
  isLoading.value = true
  socket.connect()
  socketFunctions.createRoom(authState.username)
}

const startQuiz = () => {
  if (state.roomCode.length > 0 && state.participants.length > 0) {
    isLoading.value = true
    socketFunctions.startQuiz(state.roomCode, quizId.value)
  } else {
    alert('Cannot start quiz without participants')
  }
}

watch([() => state.quizStarted, () => state.roomCode], ([quizStarted, roomCode]) => {
  if (quizStarted) {
    router.push({ name: 'QuizPage' })
  }

  if (roomCode.length > 0) {
    isLoading.value = false
  }
})

onMounted(() => {
  fetchQuiz()
})

onBeforeUnmount(() => {
  isLoading.value = false
  if (route.name !== 'QuizPage') {
    socket.disconnect()
  }
})
</script>

<style scoped>
h1 {
  color: #969f96;
}

button {
  background-color: #00bd7e;
  color: #fff;
  border: none;
  padding: 10px 20px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 25px;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #008c63;
}

button.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

p {
  color: #969f96;
}
</style>
