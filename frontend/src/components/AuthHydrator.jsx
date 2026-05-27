/**
 * AuthHydrator.jsx
 * Runs once on app load. If an access token exists in localStorage,
 * it calls GET /auth/me to hydrate the user object into the store.
 * This ensures auth state is correct after page refresh.
 */
import { useEffect } from 'react'
import useAuthStore from '../store/authStore'
import { authService } from '../services/auth.service'

export default function AuthHydrator({ children }) {
    const { accessToken, setUser, clearAuth, setHydrated } = useAuthStore()

    useEffect(() => {
        if (!accessToken) {
            setHydrated()
            return
        }
        // Token exists — fetch fresh user profile
        authService.getMe()
            .then(res => {
                const user = res.data?.user || res.data
                setUser(user)
            })
            .catch(() => {
                // Token invalid / expired and refresh failed → clear state
                clearAuth()
            })
            .finally(() => {
                setHydrated()
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return children
}
