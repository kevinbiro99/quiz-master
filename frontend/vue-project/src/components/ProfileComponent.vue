<template>
  <div>
    <img src="@/assets/profile.png" alt="User Profile" class="profile-image" />
    <div class="text">{{ authState.username }}</div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/index'

export default {
  name: 'ProfileComponent',
  setup() {
    const authState = useAuthStore()
    return { authState }
  }
}
</script>

<style scoped>
.text {
  text-align: center;
}

.profile-image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin: 0 0.5rem;
}
</style>
