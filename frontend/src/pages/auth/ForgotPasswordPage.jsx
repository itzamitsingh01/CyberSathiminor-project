/**
 * ForgotPasswordPage.jsx
 * Step 1 → Enter email → OTP sent
 * Step 2 → Enter 6-digit OTP
 * Step 3 → Enter new password
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import AuthLayout from './AuthLayout'
import OtpInput from './OtpInput'
import { authService } from '../../services/auth.service'

function useCountdown(initial = 60) {
    const [secs, setSecs] = useState(0)
    const ref = useRef(null)
    const start = () => {
        setSecs(initial)
        clearInterval(ref.current)
        ref.current = setInterval(() => setSecs(s => {
            if (s <= 1) { clearInterval(ref.current); return 0 }
            return s - 1
        }), 1000)
    }
    useEffect(() => () => clearInterval(ref.current), [])
    return { secs, start }
}

export default function ForgotPasswordPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [email, setEmail]       = useState('')
    const [otp, setOtp]           = useState('')
    const [otpError, setOtpError] = useState(false)
    const [newPw, setNewPw]       = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [showPw, setShowPw]     = useState(false)
    const [loading, setLoading]   = useState(false)
    const [err, setErr]           = useState('')
    const { secs, start }         = useCountdown(60)

    /* ── Step 1: Send OTP ── */
    async function handleSendOtp(e) {
        e.preventDefault()
        setErr('')
        if (!email.trim()) return setErr('Please enter your email address.')
        setLoading(true)
        try {
            await authService.forgotPassword({ email: email.trim() })
            start()
            setStep(2)
            toast.success('OTP sent! Check your inbox.')
        } catch (e) {
            setErr(e.response?.data?.message || 'Failed to send OTP.')
        } finally { setLoading(false) }
    }

    /* ── Resend OTP ── */
    async function handleResend() {
        if (secs > 0) return
        try {
            await authService.forgotPassword({ email })
            start()
            setOtp('')
            setOtpError(false)
            setErr('')
            toast.success('New OTP sent!')
        } catch {
            toast.error('Failed to resend OTP.')
        }
    }

    /* ── Step 2: Verify OTP ── */
    function handleVerifyOtp(e) {
        e.preventDefault()
        if (otp.length < 6) { setOtpError(true); return setErr('Enter all 6 digits.') }
        setOtpError(false); setErr('')
        setStep(3)
    }

    /* ── Step 3: Reset password ── */
    async function handleReset(e) {
        e.preventDefault()
        setErr('')
        if (newPw.length < 6) return setErr('Password must be at least 6 characters.')
        if (newPw !== confirmPw) return setErr('Passwords do not match.')
        setLoading(true)
        try {
            await authService.resetPassword({ email, otp, newPassword: newPw })
            toast.success('Password reset! Please sign in.')
            navigate('/login')
        } catch (e) {
            setErr(e.response?.data?.message || 'Reset failed. Please try again.')
        } finally { setLoading(false) }
    }

    const titles  = ['Reset password', 'Enter OTP', 'New password']
    const subs    = [
        'Enter your account email and we\'ll send a reset code.',
        `We sent a 6-digit code to ${email}`,
        'Choose a strong new password for your account.',
    ]

    return (
        <AuthLayout title={titles[step - 1]} subtitle={subs[step - 1]}>

            {/* Step indicator */}
            <div className="auth-steps fade-up">
                {['Email', 'OTP', 'Password'].map((label, i) => {
                    const n = i + 1
                    const state = n < step ? 'done' : n === step ? 'active' : 'pending'
                    return (
                        <div key={label} className="auth-step">
                            <div className={`auth-step-dot ${state}`}>
                                {state === 'done' ? <CheckCircle size={15} /> : n}
                            </div>
                            {i < 2 && <div className={`auth-step-line ${n < step ? 'done' : ''}`} />}
                        </div>
                    )
                })}
            </div>

            {/* Error */}
            {err && (
                <div className="auth-alert error fade-up" role="alert">
                    <span>⚠️</span> {err}
                </div>
            )}

            {/* ═══════ STEP 1: Email ═══════ */}
            {step === 1 && (
                <form onSubmit={handleSendOtp} className="fade-up" noValidate>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="fp-email">Email Address</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon"><Mail size={16} /></span>
                            <input
                                id="fp-email"
                                type="email"
                                className="auth-input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? <><span className="auth-spinner" /> Sending OTP…</> : <>Send Reset Code <ArrowRight size={16} /></>}
                    </button>

                    <div className="auth-footer">
                        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                            ← Back to login
                        </Link>
                    </div>
                </form>
            )}

            {/* ═══════ STEP 2: OTP ═══════ */}
            {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="fade-up" noValidate>
                    <OtpInput
                        value={otp}
                        onChange={v => { setOtp(v); setOtpError(false); setErr('') }}
                        hasError={otpError}
                    />

                    {/* Timer */}
                    <div className="otp-timer">
                        {secs > 0
                            ? <>Resend code in <span>{secs}s</span></>
                            : <button type="button" className="auth-link-btn" onClick={handleResend}>Resend OTP</button>
                        }
                    </div>

                    {/* ⚠️ Spam folder notice */}
                    <div className="spam-notice">
                        <span className="spam-notice-icon">📂</span>
                        <span>
                            <strong>Can't find the email?</strong> Check your{' '}
                            <strong>Spam</strong> or <strong>Junk</strong> folder —
                            email providers often filter OTP emails automatically.
                        </span>
                    </div>

                    <button type="submit" className="auth-btn" disabled={otp.length < 6}>
                        Continue <ArrowRight size={16} />
                    </button>

                    <div className="auth-footer">
                        <button type="button" className="auth-link-btn" onClick={() => { setStep(1); setErr(''); setOtp('') }}>
                            ← Back
                        </button>
                    </div>
                </form>
            )}

            {/* ═══════ STEP 3: New Password ═══════ */}
            {step === 3 && (
                <form onSubmit={handleReset} className="fade-up" noValidate>
                    {/* New Password */}
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="fp-newpw">New Password</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon"><Lock size={16} /></span>
                            <input
                                id="fp-newpw"
                                type={showPw ? 'text' : 'password'}
                                className="auth-input"
                                placeholder="Minimum 6 characters"
                                value={newPw}
                                onChange={e => setNewPw(e.target.value)}
                                autoComplete="new-password"
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

                    {/* Confirm Password */}
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="fp-confirmpw">Confirm Password</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon"><KeyRound size={16} /></span>
                            <input
                                id="fp-confirmpw"
                                type={showPw ? 'text' : 'password'}
                                className="auth-input"
                                placeholder="Repeat new password"
                                value={confirmPw}
                                onChange={e => setConfirmPw(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                        {/* Match indicator */}
                        {confirmPw && (
                            <p className="pw-hint" style={{ color: newPw === confirmPw ? '#10b981' : '#ef4444' }}>
                                {newPw === confirmPw ? '✓ Passwords match' : '✗ Passwords do not match'}
                            </p>
                        )}
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading || newPw.length < 6 || newPw !== confirmPw}>
                        {loading
                            ? <><span className="auth-spinner" /> Resetting…</>
                            : <><CheckCircle size={16} /> Reset Password</>}
                    </button>
                </form>
            )}
        </AuthLayout>
    )
}
