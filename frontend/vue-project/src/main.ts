import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/index'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Sync session storage with store state on app created
app.mixin({
  created() {
    const authStore = useAuthStore()
    const sessionAuthState = sessionStorage.getItem('authState')
    const savedAuthState = sessionAuthState ? JSON.parse(sessionAuthState) : null
    if (savedAuthState) {
      authStore.setAuthState(savedAuthState)
    }

    authStore.$subscribe((mutation, state) => {
      sessionStorage.setItem('authState', JSON.stringify(state))
    })
  }
})

app.mount('#app')
