/**
 * useAuth.js – Auth state helpers
 */
import useAuthStore from '../store/authStore'

export function useAuth() {
    const { user, accessToken, setAuth, clearAuth } = useAuthStore()

    const isLoggedIn = !!accessToken
    const isPremium  = user?.subscription?.plan === 'premium'
    const isAdmin    = user?.role === 'admin'

    return { user, accessToken, isLoggedIn, isPremium, isAdmin, setAuth, clearAuth }
}
