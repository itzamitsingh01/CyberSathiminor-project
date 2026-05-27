/**
 * api.js – Axios instance with JWT interceptor + auto-refresh
 */
import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.MODE === 'production'
        ? 'https://cybersathi-0wqe.onrender.com/api'
        : 'http://localhost:5000/api',
    withCredentials: true,   // send httpOnly refresh cookie
})

// Attach access token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('cs_access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Auto-refresh on 401
let isRefreshing = false
let queue = []

const processQueue = (error, token = null) => {
    queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
    queue = []
}

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config
        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    queue.push({ resolve, reject })
                })
                    .then((token) => {
                        original.headers.Authorization = `Bearer ${token}`
                        return api(original)
                    })
                    .catch(Promise.reject.bind(Promise))
            }
            original._retry = true
            isRefreshing = true
            try {
                const { data } = await api.post('/auth/refresh')
                localStorage.setItem('cs_access_token', data.accessToken)
                api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
                processQueue(null, data.accessToken)
                original.headers.Authorization = `Bearer ${data.accessToken}`
                return api(original)
            } catch (err) {
                processQueue(err, null)
                localStorage.removeItem('cs_access_token')
                window.location.href = '/login'
                return Promise.reject(err)
            } finally {
                isRefreshing = false
            }
        }
        return Promise.reject(error)
    }
)

export default api
