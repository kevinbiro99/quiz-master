<template>
  <div>
    <h1>Join a Quiz</h1>
    <p v-if="state.error">Error: {{ state.error }}</p>
    <p v-if="state.roomCode">Joined Room: {{ state.roomCode }}</p>
    <input v-if="!state.roomCode" type="text" v-model="code" placeholder="Enter Quiz Code" />
    <button v-if="!state.roomCode" @click="joinQuiz">Join Quiz</button>
  </div>
</template>

<script>
import { socket } from '@/socket';
import { socketFunctions } from '@/socket';
import { state } from '@/socket';
import { watch } from 'vue';

export default {
  data() {
    return {
      code: '',
      socket: null,
      userId: 5 // TODO: Replace with actual user ID
    };
  },
  computed: {
    state() {
      return state;
    }
  },
  mounted() {
    this.initializeSocket();
    watch(() => state.quizStarted, (newVal) => {
      if (newVal) {
        this.$router.push({ name: 'QuizPage' });
      }
    });
  },
  beforeUnmount() {
    if (this.$route.name !== 'QuizPage') {
      socketFunctions.resetState();
      socket.disconnect();
    }
  },
  methods: {
    initializeSocket() {
      socket.connect();
    },
    joinQuiz() {
      if (this.code) {
        socketFunctions.joinQuiz(this.code, this.userId);
      }
    }
  }
};
</script>

<style scoped>
h1 {
  color: #969f96;
}

input {
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #969f96;
}

button {
  background-color: #00bd7e;
  color: #fff;
  border: none;
  padding: 10px 20px;
  margin: 10px 0;
  cursor: pointer;
}

button:hover {
  background-color: #008c63;
}
</style>
