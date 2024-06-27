import { environment } from '../environments/environment'

const API_URL = environment.apiEndpoint

const fetchWrapper = (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options
  }

  return fetch(`${API_URL}${url}`, mergedOptions).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    return response.json()
  })
}

export default fetchWrapper
