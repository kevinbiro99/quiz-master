import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/index'
import { vLoading } from '@/directives/LoadingDirective.js'

const app = createApp(App)

app.directive('loading', vLoading)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Sync session storage with store state on app created.
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
