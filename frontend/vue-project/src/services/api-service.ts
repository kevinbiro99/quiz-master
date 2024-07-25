import { environment } from '@/environments/environment'
import fetchWrapper from './fetch-wrapper'

export default {
  getUsers(page: number, limit = 10) {
    return fetchWrapper(`/api/users/?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
  },

  signup(username: any, password: any) {
    return fetchWrapper(`/api/users/signup`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
  },

  signin(username: any, password: any) {
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

  getQuizzes(userId: string, page: number, limit = 5) {
    return fetchWrapper(`/api/users/${userId}/quizzes?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  },

  getQuiz(userId: string, quizId: number) {
    return fetchWrapper(`/api/users/${userId}/quizzes/${quizId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  },

  deleteQuiz(userId: string, quizId: any) {
    return fetchWrapper(`/api/users/${userId}/quizzes/${quizId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  },

  async createQuizFromTxt(userId: any, textFile: string | Blob) {
    const formData = new FormData()
    formData.append('textFile', textFile)
    return await fetchWrapper(`/api/users/${userId}/quizzes/text`, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      body: formData
    })
  },

  async createQuizFromAudio(userId: any, audioFile: string | Blob) {
    const formData = new FormData()
    formData.append('audioFile', audioFile)
    return await fetchWrapper(`/api/users/${userId}/quizzes/audio`, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      body: formData
    })
  },

  async createQuizFromVideo(userId: any, videoFile: string | Blob) {
    const formData = new FormData()
    formData.append('videoFile', videoFile)
    return await fetchWrapper(`/api/users/${userId}/quizzes/video`, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      body: formData
    })
  }
}
