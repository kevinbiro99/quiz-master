<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import TheGreeting from './components/TheGreeting.vue'
import ProfileComponent from './components/ProfileComponent.vue'
import LogoutComponent from './components/LogoutComponent.vue'
import { useAuthStore } from '@/stores/index'
import { checkAuthStatus } from '@/utils/auth'
import { state } from '@/socket'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const showMenu = ref(false)
const isMobile = ref(window.innerWidth <= 767)
const showGreeting = ref(true)
const isLoading = ref(false)

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const handleResize = () => {
  isMobile.value = window.innerWidth <= 767
  if (!isMobile.value) {
    showMenu.value = false
  }
}

const confirmNavigation = (to: any, from: any, next: any) => {
  isLoading.value = true
  if (from.name === 'QuizPage' && state.quizStarted) {
    if (confirm('Are you sure you want to navigate away? You will leave the quiz.')) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
}

router.afterEach(() => {
  isLoading.value = false
})
router.beforeEach(confirmNavigation)

watch(route, (newRoute) => {
  showGreeting.value = newRoute.name !== 'QuizPage'
})

onMounted(() => {
  checkAuthStatus()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  isLoading.value = false
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <header>
    <div class="navbar">
      <RouterLink
        to="/"
        class="logo-title"
        :class="{ disabled: route.name === 'QuizPage' && state.quizStarted }"
      >
        <img alt="Vue logo" class="logo" src="@/assets/idea.png" />
        <span>QuizMaster</span>
      </RouterLink>
      <button class="menu-button" @click="toggleMenu">☰</button>
      <nav :class="{ 'nav-open': showMenu }">
        <RouterLink
          to="/"
          @click="toggleMenu"
          :class="{ disabled: route.name === 'QuizPage' && state.quizStarted }"
          >Home</RouterLink
        >
        <RouterLink
          to="/credits"
          @click="toggleMenu"
          :class="{ disabled: route.name === 'QuizPage' && state.quizStarted }"
          >Credits</RouterLink
        >
        <RouterLink
          to="/login"
          v-if="!authStore.isAuthenticated"
          @click="toggleMenu"
          :class="{ disabled: route.name === 'QuizPage' && state.quizStarted }"
          >Login</RouterLink
        >
        <RouterLink
          to="/join"
          @click="toggleMenu"
          :class="{ disabled: route.name === 'QuizPage' && state.quizStarted }"
          >Join</RouterLink
        >
        <RouterLink
          to="/host"
          v-if="authStore.isAuthenticated"
          @click="toggleMenu"
          :class="{ disabled: route.name === 'QuizPage' && state.quizStarted }"
          >Host</RouterLink
        >
        <RouterLink
          to="/upload"
          v-if="authStore.isAuthenticated"
          @click="toggleMenu"
          :class="{ disabled: route.name === 'QuizPage' && state.quizStarted }"
          >Upload</RouterLink
        >
      </nav>
      <div v-if="authStore.isAuthenticated" class="profile">
        <ProfileComponent />
        <LogoutComponent />
      </div>
    </div>
  </header>

  <div v-loading="isLoading" id="content" :class="{ 'quiz-mode': route.name === 'QuizPage' }">
    <div v-if="showGreeting" class="greeting-container">
      <TheGreeting msg="Welcome to QuizMaster" />
    </div>
    <main :class="{ 'full-screen': !showGreeting }">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
@import './assets/main.css';

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  width: 100%;
  border-radius: 10px;
  background: linear-gradient(to right, var(--vt-c-green-soft), var(--vt-c-black-mute));
  border-bottom: 1px solid var(--color-border);
}

.logo-title {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--color-text);
  font-size: 1.5rem;
  padding: 0.5rem;
}

.logo {
  width: 50px;
  height: 50px;
  margin-right: 0.5rem;
}

.menu-button {
  width: 100%;
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 1.5rem;
  cursor: pointer;
  display: none;
}

nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
}

nav a {
  padding: 0.5rem 1rem;
  color: var(--color-text);
  text-decoration: none;
  border: 2px solid var(--color-border);
  border-radius: 20px;
  margin: 0.5rem 0.5rem;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

nav a:hover,
nav a:active {
  background-color: var(--color-highlight);
  transform: scale(1.05);
}

.nav-open {
  max-height: 500px;
  opacity: 1;
}

.profile {
  display: flex;
  flex-direction: column;
  align-items: center;
}

#content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  min-height: 70vh;
}

.greeting-container {
  padding: 2rem;
  margin: 1rem;
  border-radius: 15px;
  animation: fadeIn 1s ease-in-out;
}

.full-screen {
  width: 100%;
  min-height: 70vh;
  padding: 0;
  margin: 0;
}

.disabled {
  pointer-events: none;
  opacity: 0.6;
}

@media (min-width: 1024px) {
  body {
    display: flex;
    place-items: center;
    justify-content: center;
  }

  #content {
    padding: 2rem;
  }

  #content:not(.quiz-mode) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 767px) {
  .menu-button {
    display: none;
  }

  nav {
    flex-direction: row;
    max-height: none;
    opacity: 1;
  }

  nav a {
    border: 2px solid var(--color-border);
    width: auto;
  }
}

@media (max-width: 767px) {
  .navbar {
    flex-direction: column;
  }
  .menu-button {
    display: block;
  }

  nav.nav-open {
    max-height: 500px;
    opacity: 1;
  }

  #content {
    padding: 0.5rem;
  }

  .greeting-container {
    padding: 1rem;
  }
}
</style>
