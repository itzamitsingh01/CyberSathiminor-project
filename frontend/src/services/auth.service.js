/**
 * auth.service.js – Frontend auth API calls
 */
import api from './api'

export const authService = {
    register: (data) => api.post('/auth/register', data),
    verifyEmail: (data) => api.post('/auth/verify-email', data),
    resendOtp: (data) => api.post('/auth/resend-otp', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    getMe: () => api.get('/auth/me'),
}
