<template>
  <div v-if="visible" class="overlay">
    <div class="message-box">
      <p>Connection lost</p>
      <router-link class="btn" to="/">Back to Home</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConnectionLostComponent',
  props: {
    visible: {
      type: Boolean,
      required: true
    }
  },
  setup() {
    'use strict'
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.message-box {
  background: white;
  padding: 20px 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.message-box p {
  margin: 20px;
  color: black;
  font-size: 1.2em;
}
</style>
