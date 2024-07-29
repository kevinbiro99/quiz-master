<template>
  <div>
    <h2 class="title">Participants:</h2>
    <div class="participants-grid">
      <div v-for="participant in participants" :key="participant.username" class="participant-card">
        {{ participant.username }}
      </div>
      <div v-if="participants.length < 1">No participants</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { state } from '@/socket'

const participants = computed(() => state.participants)
</script>

<style scoped>
@import '../assets/main.css';

.participants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.participant-card {
  background-color: #00bd7e;
  color: #fff;
  padding: 10px;
  border-radius: 10px;
  text-align: center;
  transition: background-color 0.3s ease;
}

.participant-card:hover {
  background-color: #008c63;
}
</style>
