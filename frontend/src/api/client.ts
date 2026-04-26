import axios, { AxiosInstance, AxiosError } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor
client.interceptors.response.use(
  response => response,
  error => {
    const axiosError = error as AxiosError
    if (axiosError.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized')
    }
    return Promise.reject(error)
  }
)

export default client
