import { environment } from '../environments/environment'

const API_URL = environment.apiEndpoint

const fetchWrapperFile = (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include'
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options
  }

  return fetch(`${API_URL}${url}`, mergedOptions).then((response) => {
    return response.blob().then((blob) => {
      return blob
    })
  })
}

export default fetchWrapperFile
