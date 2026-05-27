/**
 * authStore.js – Zustand global auth state with user persistence
 */
import { create } from 'zustand'

function saveUser(user) {
    try {
        if (user) localStorage.setItem('cs_user', JSON.stringify(user))
        else localStorage.removeItem('cs_user')
    } catch {}
}

function loadUser() {
    try {
        const raw = localStorage.getItem('cs_user')
        return raw ? JSON.parse(raw) : null
    } catch { return null }
}

const useAuthStore = create((set) => ({
    user: loadUser(),
    accessToken: localStorage.getItem('cs_access_token') || null,
    isHydrated: false,

    setAuth: (user, accessToken) => {
        localStorage.setItem('cs_access_token', accessToken)
        saveUser(user)
        set({ user, accessToken })
    },

    setUser: (user) => {
        saveUser(user)
        set({ user })
    },

    clearAuth: () => {
        localStorage.removeItem('cs_access_token')
        localStorage.removeItem('cs_user')
        set({ user: null, accessToken: null })
    },

    setHydrated: () => set({ isHydrated: true }),
}))

export default useAuthStore
