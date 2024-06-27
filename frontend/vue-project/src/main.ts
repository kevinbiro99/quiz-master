import './assets/main.css'

import { createApp, reactive } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import apiService from './services/api-service'

const app = createApp(App)

app.use(createPinia())
app.use(router)

export const authState = reactive({
  isAuthenticated: false,
  userId: -1
})

apiService.me().then((res) => {
  if (res.error) {
    authState.isAuthenticated = false
    authState.userId = -1
  } else {
    authState.isAuthenticated = true
    authState.userId = res.id
  }
})

app.provide('authState', authState)

app.mount('#app')
