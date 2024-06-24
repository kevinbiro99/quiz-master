import { environment } from '../environments/environment'

// const API_URL = process.env.VUE_APP_API_URL;
const API_URL = environment.apiEndpoint

export default {
  async getUsers() {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return response.json()
  },

  async login(username, password) {
    const response = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return response.json()
  },

  async getQuizzes(userId) {
    const response = await fetch(`${API_URL}/api/users/${userId}/quizzes`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return response.json()
  },

  async getQuiz(userId, quizId) {
    const response = await fetch(`${API_URL}/api/users/${userId}/quizzes/${quizId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return response.json()
  }
}
