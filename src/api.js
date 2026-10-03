import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from './router'

export const TOKEN_KEY = 'blog_admin_token'

// 与后端 app/core/error_codes.py 的 ErrorCode 对齐的业务码
export const ApiCode = {
  SUCCESS: 20000,
  NO_LOGIN: 40001,
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '', // 生产为空串走同域（nginx 网关反代 /api）；dev 由 .env.development 提供
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => {
    const body = res.data
    // wangEditor 上传等非统一封装的响应原样返回
    if (!body || typeof body !== 'object' || !('code' in body)) return res
    if (body.code === ApiCode.SUCCESS) {
      res.data = body.data // 解包，调用方仍用 res.data 取业务数据
      return res
    }
    if (body.code === ApiCode.NO_LOGIN) {
      localStorage.removeItem(TOKEN_KEY)
      ElMessage.error(body.message || '请先登录')
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
      return Promise.reject(new Error(body.message))
    }
    ElMessage.error(body.message || '操作失败')
    return Promise.reject(new Error(body.message || '操作失败'))
  },
  (err) => {
    const message = err.response?.data?.detail || err.message || '网络错误'
    ElMessage.error(typeof message === 'string' ? message : '网络错误')
    return Promise.reject(err)
  },
)

export default api
