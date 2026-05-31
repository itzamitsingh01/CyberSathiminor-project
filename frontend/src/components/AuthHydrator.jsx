/**
 * AuthHydrator.jsx
 * Runs once on app load. If an access token exists in localStorage,
 * it calls GET /auth/me to hydrate the user object into the store.
 * This ensures auth state is correct after page refresh.
 *
 * Also listens for the 'auth:session-expired' event dispatched by api.js
 * when a refresh token fails — shows a modal instead of hard redirecting.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, AlertTriangle } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { authService } from '../services/auth.service'

export default function AuthHydrator({ children }) {
    const { accessToken, setUser, clearAuth, setHydrated } = useAuthStore()
    const navigate = useNavigate()
    const [showExpiredModal, setShowExpiredModal] = useState(false)

    // Hydrate auth state on mount
    useEffect(() => {
        if (!accessToken) {
            setHydrated()
            return
        }
        // Token exists — fetch fresh user profile to validate
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

    // Listen for session expiry events from api.js interceptor
    useEffect(() => {
        const handleExpiry = () => {
            clearAuth()
            setShowExpiredModal(true)
        }
        window.addEventListener('auth:session-expired', handleExpiry)
        return () => window.removeEventListener('auth:session-expired', handleExpiry)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <>
            {children}

            {/* Session Expired Modal */}
            {showExpiredModal && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '24px',
                    }}
                >
                    <div style={{
                        background: 'var(--card)', border: '1px solid var(--border)',
                        borderRadius: '20px', padding: '32px', maxWidth: '380px', width: '100%',
                        boxShadow: '0 24px 60px rgba(0,0,0,0.3)', textAlign: 'center',
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <AlertTriangle size={24} color="#f59e0b" />
                        </div>

                        <h2 style={{
                            fontSize: '18px', fontWeight: 800, color: 'var(--text)',
                            margin: '0 0 8px',
                        }}>
                            Session Expired
                        </h2>
                        <p style={{
                            fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5,
                            margin: '0 0 24px',
                        }}>
                            Your session has expired for security reasons.
                            Please sign in again to continue — your work is safe.
                        </p>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    setShowExpiredModal(false)
                                    navigate('/login')
                                }}
                                style={{
                                    flex: 1, padding: '11px 16px', borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                    color: '#fff', border: 'none', cursor: 'pointer',
                                    fontSize: '14px', fontWeight: 700, fontFamily: 'inherit',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}
                            >
                                <LogIn size={16} /> Sign In Again
                            </button>
                            <button
                                onClick={() => {
                                    setShowExpiredModal(false)
                                    navigate('/')
                                }}
                                style={{
                                    flex: 1, padding: '11px 16px', borderRadius: '10px',
                                    background: 'var(--input-bg)', color: 'var(--text)',
                                    border: '1px solid var(--border)', cursor: 'pointer',
                                    fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
                                }}
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
