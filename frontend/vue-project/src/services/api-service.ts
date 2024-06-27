import { environment } from '@/environments/environment'
import fetchWrapper from './fetch-wrapper'

export default {
  async getUsers() {
    return await fetchWrapper(`/api/users`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
  },

  async signup(username, password) {
    return await fetchWrapper(`/api/users/signup`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
  },

  async signin() {
    return window.open(`${environment.apiEndpoint}/auth/google`, '_self')
  },

  async signout() {
    return fetchWrapper(`/auth/logout`)
  },

  async me() {
    return fetchWrapper(`/api/users/me`)
  },

  async getQuizzes(userId) {
    return await fetchWrapper(`/api/users/${userId}/quizzes`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  },

  async getQuiz(userId, quizId) {
    return await fetchWrapper(`/api/users/${userId}/quizzes/${quizId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  }
}
