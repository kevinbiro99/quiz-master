<template>
  <div>
    <h1>Join a Quiz</h1>
    <input type="text" v-model="code" placeholder="Enter Quiz Code" />
    <button @click="joinQuiz">Join Quiz</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      code: ''
    }
  },
  methods: {
    joinQuiz() {
      // Add join quiz functionality here
    }
  }
}
</script>
