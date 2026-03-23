import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Evitar múltiplos redirects se já estivermos no login
      if (!window.location.pathname.includes('/login')) {
        toast.error('Sessão expirada. Faça login novamente.')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
