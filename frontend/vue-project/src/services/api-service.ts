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

  async login(username, password) {
    return await fetchWrapper(`/api/users/register`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
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
  },

  async deleteQuiz(userId, quizId) {
    return await fetchWrapper(`/api/users/${userId}/quizzes/${quizId}`, {
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
