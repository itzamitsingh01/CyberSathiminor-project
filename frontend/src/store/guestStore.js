/**
 * guestStore.js – Tracks per-tool usage for unauthenticated guests.
 * Persisted in localStorage under key "cs_guest".
 */
import { create } from 'zustand'

const STORAGE_KEY = 'cs_guest'

// How many uses a guest gets per tool before seeing the login prompt
export const GUEST_LIMITS = {
    passport:  3,
    compress:  3,
    pdf:       3,
    signature: 3,
    removeBg:  2,
    qrSession: 1,
}

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : {}
    } catch { return {} }
}

function save(usage) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(usage)) } catch {}
}

const useGuestStore = create((set, get) => ({
    usage: load(),   // { passport: 2, compress: 1, … }

    // Returns true if guest is still under the limit for this tool
    canUse: (tool) => {
        const { usage } = get()
        const count = usage[tool] ?? 0
        return count < (GUEST_LIMITS[tool] ?? 3)
    },

    // Call AFTER a successful tool use
    consume: (tool) => {
        const usage = { ...get().usage, [tool]: (get().usage[tool] ?? 0) + 1 }
        save(usage)
        set({ usage })
    },

    // Remaining uses for a tool
    remaining: (tool) => {
        const count = get().usage[tool] ?? 0
        return Math.max(0, (GUEST_LIMITS[tool] ?? 3) - count)
    },

    reset: () => {
        localStorage.removeItem(STORAGE_KEY)
        set({ usage: {} })
    },
}))

export default useGuestStore
