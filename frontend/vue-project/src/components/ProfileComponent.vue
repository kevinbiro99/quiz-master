<template>
  <div>
    <img src="@/assets/profile.png" alt="User Profile" class="profile-image" />
  </div>
</template>

<script>
export default {
  name: 'ProfileComponent'
}
</script>

<style scoped>
.profile-image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin: 0.5rem;
}
</style>
