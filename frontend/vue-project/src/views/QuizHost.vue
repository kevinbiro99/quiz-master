<template>
  <div>
    <h1>Host Quiz: {{ quizTitle }}</h1>
    <p>Socket-io connection: {{ state.connected }}</p>
    <div>
      <button :class="{ disabled: state.roomCode.length > 0 } " :disabled="state.roomCode.length > 0" @click="startSession">Start Session</button>
      <div v-if="sessionCode">
        <p>Session Code: {{ sessionCode }}</p>
        <p>Room Created: {{ state.roomCode }}</p>
        <button :class="{ disabled: state.participants.length < 1 } " :disabled="state.participants < 1" @click="startQuiz">Start Quiz</button>
        <div>
          <h3>Participants:</h3>
          <ul>
            <li v-for="participant in state.participants" :key="participant.id">{{ participant.id }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiService from '../services/api-service';
import { socket } from "@/socket";
import { state } from "@/socket";
import { socketFunctions } from "@/socket";
import { watch } from "vue";

export default {
  data() {
    return {
      quizId: 0,
      sessionCode: null,
      participants: [],
      userId: 5, // TODO: Replace with actual user ID
      quizTitle: "Quiz Title"
    };
  },
  computed: {
    state() {
      return state;
    }
  },
  mounted() {
    this.quizId = this.$route.params.quizId;

    this.fetchQuiz();
    watch(() => state.quizStarted, (newVal) => {
      if (newVal) {
        this.$router.push({ name: 'QuizPage' });
      }
    });
  },
  beforeUnmount() {
    // TODO: prevent leaving the host page when a session is active
    // do the following if the next page loaded is not the QuizPage
    if (this.$route.name !== 'QuizPage') {
      socketFunctions.resetState();
      socket.disconnect();
    }
  },
  methods: {
    async fetchQuiz() {
      const {quiz, questions} = await apiService.getQuiz(this.userId, this.quizId);
      this.quizTitle = quiz.title;
    },
    startSession() {
      socket.connect();
      this.sessionCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      socketFunctions.createRoom(this.sessionCode);
    },
    startQuiz() {
      if (this.sessionCode && state.participants.length > 0) {
        socketFunctions.startQuiz(this.sessionCode, this.quizId);
      }
      else {
        alert('Cannot start quiz without participants');
      }
    }
  }
};
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
}

button:hover {
  background-color: #008c63;
}

p {
  color: #969f96;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  background-color: #969f96;
  margin: 5px 0;
  padding: 10px;
  color: #fff;
}
</style>
