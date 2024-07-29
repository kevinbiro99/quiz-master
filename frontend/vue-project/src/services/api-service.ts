import { environment } from '@/environments/environment'
import fetchWrapper from './fetch-wrapper'
import fetchWrapperFile from './fetch-wrapper-file'

export default (function () {
  'use strict'
  const module: any = {}

  module.getUsers = function (page: number, limit = 10) {
    return fetchWrapper(`/api/users/?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
  }

  module.signup = function (username: any, password: any) {
    return fetchWrapper(`/api/users/signup`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
  }

  module.signin = function (username: any, password: any) {
    return fetchWrapper(`/api/users/signin`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
  }

  module.googleSignin = function () {
    return window.open(`${environment.apiEndpoint}/auth/google`, '_self')
  }

  module.signout = function () {
    return fetchWrapper(`/auth/logout`)
  }

  module.me = function () {
    return fetchWrapper(`/api/users/me`)
  }

  module.getQuizzes = function (userId: string, page: number, limit = 5) {
    return fetchWrapper(`/api/users/${userId}/quizzes?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  }

  module.getQuiz = function (userId: string, quizId: number) {
    return fetchWrapper(`/api/users/${userId}/quizzes/${quizId}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  }

  module.deleteQuiz = function (userId: string, quizId: any) {
    return fetchWrapper(`/api/users/${userId}/quizzes/${quizId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  }

  module.getQuizFile = function (userId: string, quizId: any) {
    return fetchWrapperFile(`/api/users/${userId}/quizzes/${quizId}/video`, {
      method: 'GET'
    })
  }

  module.createQuizFromTxt = function (userId: any, textFile: string | Blob) {
    const formData = new FormData()
    formData.append('textFile', textFile)
    return fetchWrapper(`/api/users/${userId}/quizzes/text`, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      body: formData
    })
  }

  module.createQuizFromAudio = function (userId: any, audioFile: string | Blob) {
    const formData = new FormData()
    formData.append('audioFile', audioFile)
    return fetchWrapper(`/api/users/${userId}/quizzes/audio`, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      body: formData
    })
  }

  module.createQuizFromVideo = function (userId: any, videoFile: string | Blob) {
    const formData = new FormData()
    formData.append('videoFile', videoFile)
    return fetchWrapper(`/api/users/${userId}/quizzes/video`, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      body: formData
    })
  }

  return module
})()
