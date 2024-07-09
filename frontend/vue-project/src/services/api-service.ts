import { environment } from '@/environments/environment'
import fetchWrapper from './fetch-wrapper'

export default {
  getUsers() {
    return fetchWrapper(`/api/users`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
  },

  signup(username, password) {
    return fetchWrapper(`/api/users/signup`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
  },

  signin(username, password) {
    return fetchWrapper(`/api/users/signin`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
  },

  googleSignin() {
    return window.open(`${environment.apiEndpoint}/auth/google`, '_self')
  },

  signout() {
    return fetchWrapper(`/auth/logout`)
  },

  me() {
    return fetchWrapper(`/api/users/me`)
  },

  getQuizzes(userId) {
    return fetchWrapper(`/api/users/${userId}/quizzes`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  },

  getQuiz(userId, quizId) {
    return fetchWrapper(`/api/users/${userId}/quizzes/${quizId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  },

  deleteQuiz(userId, quizId) {
    return fetchWrapper(`/api/users/${userId}/quizzes/${quizId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  },

  async createQuizFromTxt(userId, textFile) {
    const formData = new FormData()
    formData.append('textFile', textFile)
    return await fetchWrapper(`/api/users/${userId}/quizzes/text`, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      body: formData
    })
  }
}
