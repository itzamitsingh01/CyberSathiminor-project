/**
 * LoginPage.jsx – Email + Password login with "needs verification" redirect flow
 */
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthLayout from './AuthLayout'
import { authService } from '../../services/auth.service'
import useAuthStore from '../../store/authStore'

export default function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { setAuth } = useAuthStore()
    const from = location.state?.from?.pathname || '/dashboard'

    const [form, setForm] = useState({ email: '', password: '' })
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState('')
    const [needsVerify, setNeedsVerify] = useState(false)
    const [verifyEmail, setVerifyEmail] = useState('')
    const [rememberMe, setRememberMe] = useState(false)

    async function handleLogin(e) {
        e.preventDefault()
        setErr('')
        setNeedsVerify(false)
        if (!form.email || !form.password) return setErr('Please fill in all fields.')
        setLoading(true)
        try {
            const res = await authService.login({ email: form.email.trim(), password: form.password })
            setAuth(res.data.user, res.data.accessToken)
            toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}! 👋`)
            navigate(from, { replace: true })
        } catch (e) {
            const data = e.response?.data
            if (data?.needsVerification) {
                setNeedsVerify(true)
                setVerifyEmail(data.email)
            } else {
                setErr(data?.message || 'Login failed. Please try again.')
            }
        } finally { setLoading(false) }
    }

    async function handleResendFromLogin() {
        try {
            await authService.resendOtp({ email: verifyEmail })
            toast.success('Verification OTP sent!')
            navigate('/register', { state: { email: verifyEmail, goToStep2: true } })
        } catch {
            toast.error('Failed to resend OTP.')
        }
    }

    return (
        <AuthLayout
            title="Welcome back 👋"
            subtitle="Sign in to your CyberSathi account to continue."
        >
            {/* Error */}
            {err && (
                <div className="auth-alert error fade-up" role="alert">
                    <span>⚠️</span> {err}
                </div>
            )}

            {/* Needs verification banner */}
            {needsVerify && (
                <div className="auth-alert info fade-up" role="alert">
                    <span>📧</span>
                    <span>
                        Your email is not verified yet.{' '}
                        <button className="auth-link-btn" style={{ fontSize: 13.5, color: '#92400e', textDecoration: 'underline' }} onClick={handleResendFromLogin}>
                            Resend verification OTP
                        </button>
                    </span>
                </div>
            )}

            <form onSubmit={handleLogin} className="fade-up" noValidate>
                {/* Email */}
                <div className="auth-field">
                    <label className="auth-label" htmlFor="login-email">Email Address</label>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon"><Mail size={16} /></span>
                        <input
                            id="login-email"
                            type="email"
                            className="auth-input"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            autoComplete="email"
                            required
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="auth-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label className="auth-label" style={{ margin: 0 }} htmlFor="login-pw">Password</label>
                        <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                            Forgot password?
                        </Link>
                    </div>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon"><Lock size={16} /></span>
                        <input
                            id="login-pw"
                            type={showPw ? 'text' : 'password'}
                            className="auth-input"
                            placeholder="Your password"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            className="auth-input-toggle"
                            onClick={() => setShowPw(v => !v)}
                            aria-label="Toggle password"
                        >
                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* Remember me row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, userSelect: 'none', color: 'var(--text)', opacity: 0.85 }}>
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            style={{ 
                                accentColor: 'var(--primary)', width: 15, height: 15, 
                                borderRadius: 4, cursor: 'pointer' 
                            }}
                        />
                        <span>Remember me</span>
                    </label>
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? <><span className="auth-spinner" /> Signing in…</> : <><LogIn size={16} /> Sign In</>}
                </button>

                <div className="auth-divider">or</div>

                <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => navigate('/dashboard')}
                    style={{ borderRadius: '12px', padding: '13px 20px', fontWeight: 700, width: '100%' }}
                >
                    Continue as Guest
                </button>

                <div className="auth-footer" style={{ marginTop: '20px' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                        Create one free
                    </Link>
                </div>
            </form>
        </AuthLayout>
    )
}
