<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="greetings">
    <h1 class="green main-title">{{ msg }}</h1>
    <h3 class="text">
      QuizMaster is your ultimate platform for creating engaging, real-time multiplayer quizzes from
      video content. Whether you want to test your friends, challenge your colleagues, or simply
      have fun with family, QuizMaster makes it easy and exciting.
    </h3>
  </div>
</template>

<style scoped>
.main-title {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

.text {
  font-size: 1.2rem;
}

.greetings .main-title,
.greetings .text {
  text-align: center;
}

@media (min-width: 1024px) {
  .greetings .main-title,
  .greetings .text {
    text-align: left;
  }
}
</style>
