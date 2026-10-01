import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from './router'

export const TOKEN_KEY = 'blog_admin_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const detail = err.response?.data?.detail
    if (status === 401 && router.currentRoute.value.name !== 'login') {
      localStorage.removeItem(TOKEN_KEY)
      ElMessage.error(detail || '请先登录')
      router.push('/login')
    } else if (detail) {
      ElMessage.error(typeof detail === 'string' ? detail : JSON.stringify(detail))
    }
    return Promise.reject(err)
  },
)

export default api
