<template>
  <div v-loading="isLoading" class="main-content container">
    <h2 class="title">Host Quiz: {{ quizTitle }}</h2>
    <div class="box">
      <button
        v-if="state.roomCode.length < 1"
        :class="{ disabled: state.roomCode.length > 0 }"
        :disabled="state.roomCode.length > 0"
        @click="startSession"
        class="btn"
      >
        Start Session
      </button>
      <div v-if="state.roomCode.length > 0" class="inner-box">
        <p class="text">Room Created: {{ state.roomCode }}</p>
        <button
          :class="{ disabled: state.participants.length < 1 }"
          :disabled="state.participants.length < 1"
          @click="startQuiz"
          class="btn"
        >
          Start Quiz
        </button>
        <ParticipantsComponent />
      </div>
    </div>
  </div>
</template>

<script setup>
'use strict'
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
      isLoading.value = false
      if (route.name !== 'QuizPage') {
        socket.disconnect()
      }
      console.error(res.error)
    } else {
      quizTitle.value = res.quiz.title
    }
  })
}

const startSession = () => {
  isLoading.value = true
  socket.connect()
  socketFunctions.createRoom(authState.username, quizId.value)
}

const startQuiz = () => {
  if (state.roomCode.length > 0 && state.participants.length > 0) {
    isLoading.value = true
    socketFunctions.startQuiz(state.roomCode, quizId.value, authState.userId)
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
@import '../assets/main.css';

.box {
  display: flex;
  justify-content: center;
}

.inner-box {
  width: 100%;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  text-align: center;
}

.btn {
  background-color: #00bd7e;
  color: #fff;
  border: none;
  padding: 10px 20px;
  margin: 10px 0;
  cursor: pointer;
  border-radius: 25px;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: #008c63;
}

.btn.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.text {
  color: #969f96;
  text-align: center;
  font-size: 1.3rem;
}
</style>
