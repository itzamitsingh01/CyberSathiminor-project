import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
    User, Mail, Lock, Eye, EyeOff, CheckCircle, ArrowRight, 
    Smartphone, Store, MapPin, Users, Check, Sparkles 
} from 'lucide-react'
import toast from 'react-hot-toast'
import AuthLayout from './AuthLayout'
import OtpInput from './OtpInput'
import { authService } from '../../services/auth.service'
import useAuthStore from '../../store/authStore'

/* ── password strength ──────────────────────────────────────── */
function getStrength(pw) {
    if (!pw) return 0
    let score = 0
    if (pw.length >= 6)  score++
    if (pw.length >= 10) score++
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++
    return score   // 0-3
}
const strengthLabel = ['', 'Weak Password', 'Medium Strength', 'Strong Password']
const strengthClass = ['', 'weak', 'medium', 'strong']

/* ── countdown hook ─────────────────────────────────────────── */
function useCountdown(initial = 60) {
    const [secs, setSecs] = useState(initial)
    const ref = useRef(null)
    const start = () => {
        setSecs(initial)
        clearInterval(ref.current)
        ref.current = setInterval(() => setSecs(s => {
            if (s <= 1) { clearInterval(ref.current); return 0 }
            return s - 1
        }), 1000)
    }
    useEffect(() => { start(); return () => clearInterval(ref.current) }, [])
    return { secs, restart: start }
}

const USER_TYPES = [
    { id: 'cafe_owner', label: 'Cyber Café Owner', emoji: '🏪', desc: 'Manage photo layouts & customer documents' },
    { id: 'mp_online', label: 'MP Online Operator', emoji: '💻', desc: 'Process public utility forms and merges' },
    { id: 'print_shop', label: 'Printing Shop', emoji: '🖨️', desc: 'Fast scaling, size reduction & instant prints' },
    { id: 'student', label: 'Student', emoji: '🎓', desc: 'Save resumes, sign forms, & compress homework' },
    { id: 'individual', label: 'Individual User', emoji: '👤', desc: 'General document editing and smart signature generator' }
]

export default function RegisterPage() {
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()

    // Steps: 1 = Details, 2 = Profile/Business Onboarding, 3 = OTP Verification
    const [step, setStep] = useState(1)

    // Onboarding Form
    const [form, setForm] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        userType: 'cafe_owner',
        shopName: '',
        address: '',
        dailyCustomers: ''
    })

    const [showPw, setShowPw] = useState(false)
    const [showConfirmPw, setShowConfirmPw] = useState(false)
    
    // OTP State
    const [otp, setOtp] = useState('')
    const [otpError, setOtpError] = useState(false)

    // Status
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState('')

    // Resend countdown
    const { secs, restart } = useCountdown(60)

    const strength = getStrength(form.password)

    // Form Validators
    function validateStep1() {
        if (!form.name.trim()) return 'Please enter your full name.'
        if (!form.email.trim()) return 'Please enter your email address.'
        if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Invalid email address format.'
        if (!form.mobile.trim()) return 'Please enter your mobile number.'
        if (!/^[0-9]{10}$/.test(form.mobile.trim())) return 'Mobile number must be a valid 10-digit number.'
        if (form.password.length < 6) return 'Password must be at least 6 characters.'
        if (form.password !== form.confirmPassword) return 'Passwords do not match. Please verify.'
        return null
    }

    function handleNextStep() {
        setErr('')
        const error = validateStep1()
        if (error) return setErr(error)
        setStep(2)
    }

    // Step 2 Submission (Post API)
    async function handleRegister(e) {
        e.preventDefault()
        setErr('')
        setLoading(true)

        try {
            await authService.register({
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
                mobile: form.mobile.trim(),
                userType: form.userType,
                shopName: form.shopName.trim(),
                address: form.address.trim(),
                dailyCustomers: form.dailyCustomers
            })
            restart()
            setStep(3)
            toast.success('OTP sent! Check your email inbox.')
        } catch (e) {
            setErr(e.response?.data?.message || 'Registration failed. Please try again.')
        } finally { setLoading(false) }
    }

    // Step 3 OTP Verification
    async function handleVerify(e) {
        e.preventDefault()
        if (otp.length < 6) { setOtpError(true); return setErr('Enter all 6 digits.') }
        setErr('')
        setOtpError(false)
        setLoading(true)

        try {
            const res = await authService.verifyEmail({ email: form.email.trim().toLowerCase(), otp })
            setAuth(res.data.user, res.data.accessToken)
            toast.success('Onboarding complete! Welcome to CyberSathi! 🚀')
            navigate('/dashboard')
        } catch (e) {
            setOtpError(true)
            setErr(e.response?.data?.message || 'Invalid OTP. Please try again.')
        } finally { setLoading(false) }
    }

    async function handleResend() {
        if (secs > 0) return
        try {
            await authService.resendOtp({ email: form.email.trim().toLowerCase() })
            restart()
            setOtp('')
            setOtpError(false)
            setErr('')
            toast.success('New OTP sent!')
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to resend OTP.')
        }
    }

    const steps = ['Account Details', 'Business Profile', 'Verify Email']

    return (
        <AuthLayout
            title={step === 1 ? 'Join CyberSathi 👋' : step === 2 ? 'Tell us about your shop 🏪' : 'Check your inbox 📧'}
            subtitle={step === 1 
                ? 'Join 2,000+ operators raising café productivity.' 
                : step === 2 
                    ? 'Help us customize your dashboard widgets.' 
                    : `We sent a 6-digit confirmation code to ${form.email}`}
        >
            {/* Step Pills */}
            <div className="auth-steps fade-up">
                {steps.map((label, i) => {
                    const n = i + 1
                    const state = n < step ? 'done' : n === step ? 'active' : 'pending'
                    return (
                        <div key={label} className="auth-step">
                            <div className={`auth-step-dot ${state}`}>
                                {state === 'done' ? <CheckCircle size={15} /> : n}
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`auth-step-line ${n < step ? 'done' : ''}`} />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Error banner */}
            {err && (
                <div className="auth-alert error fade-up" role="alert" style={{ marginBottom: '24px' }}>
                    <span style={{ flexShrink: 0 }}>⚠️</span> {err}
                </div>
            )}

            {/* ═══════════ STEP 1: ACCOUNT DETAILS ═══════════ */}
            {step === 1 && (
                <div className="fade-up">
                    {/* Full Name */}
                    <div className="auth-field">
                        <label className="auth-label">Full Name</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon"><User size={16} /></span>
                            <input
                                className="auth-input"
                                placeholder="Ramesh Kumar"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="auth-field">
                        <label className="auth-label">Email Address</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon"><Mail size={16} /></span>
                            <input
                                type="email"
                                className="auth-input"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    {/* Mobile */}
                    <div className="auth-field">
                        <label className="auth-label">Mobile Number</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon"><Smartphone size={16} /></span>
                            <input
                                type="tel"
                                className="auth-input"
                                placeholder="10-digit mobile number"
                                value={form.mobile}
                                onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                                maxLength={10}
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="auth-field">
                        <label className="auth-label">Password</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon"><Lock size={16} /></span>
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="auth-input"
                                placeholder="At least 6 characters"
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                required
                            />
                            <button
                                type="button"
                                className="auth-input-toggle"
                                onClick={() => setShowPw(v => !v)}
                            >
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {/* Password strength indicators */}
                        {form.password && (
                            <div style={{ marginTop: '8px' }}>
                                <div className="pw-strength">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`pw-bar ${i <= strength ? strengthClass[strength] : ''}`} />
                                    ))}
                                </div>
                                <p className="pw-hint" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                                    {strengthLabel[strength]}
                                    {strength < 3 && ' — add capitals & numbers to strengthen'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="auth-field">
                        <label className="auth-label">Confirm Password</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon"><Lock size={16} /></span>
                            <input
                                type={showConfirmPw ? 'text' : 'password'}
                                className="auth-input"
                                placeholder="Repeat your password"
                                value={form.confirmPassword}
                                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                required
                            />
                            <button
                                type="button"
                                className="auth-input-toggle"
                                onClick={() => setShowConfirmPw(v => !v)}
                            >
                                {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="button" className="auth-btn" onClick={handleNextStep}>
                        Continue to Shop Profile <ArrowRight size={16} />
                    </button>

                    <div className="auth-footer" style={{ marginTop: '20px' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                            Sign in
                        </Link>
                    </div>
                </div>
            )}

            {/* ═══════════ STEP 2: BUSINESS ONBOARDING ═══════════ */}
            {step === 2 && (
                <form onSubmit={handleRegister} className="fade-up">
                    
                    {/* User Operator Selection */}
                    <div className="auth-field" style={{ marginBottom: '22px' }}>
                        <span className="auth-label">Select Your Operator Profile</span>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                            {USER_TYPES.map((t) => {
                                const selected = form.userType === t.id
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setForm(f => ({ ...f, userType: t.id }))}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '12px 14px', borderRadius: '12px',
                                            background: selected ? 'rgba(79,70,229,0.06)' : 'var(--input-bg)',
                                            border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                                            cursor: 'pointer', transition: 'all 0.18s ease'
                                        }}
                                    >
                                        <span style={{ fontSize: '20px' }}>{t.emoji}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                                                {t.label}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                                {t.desc}
                                            </div>
                                        </div>
                                        {selected && (
                                            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                                <Check size={11} color="white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Shop Name (Optional) */}
                    <div className="auth-field">
                        <label className="auth-label">Shop / Centre Name <span style={{ opacity: 0.5, fontWeight: 500 }}>(Optional)</span></label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon"><Store size={16} /></span>
                            <input
                                className="auth-input"
                                placeholder="E.g., Verma Computer Centre"
                                value={form.shopName}
                                onChange={e => setForm(f => ({ ...f, shopName: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Address / City */}
                    <div className="auth-field">
                        <label className="auth-label">Shop Address / City</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon"><MapPin size={16} /></span>
                            <input
                                className="auth-input"
                                placeholder="E.g., M.P. Nagar, Bhopal"
                                value={form.address}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    {/* Daily Customers */}
                    <div className="auth-field" style={{ marginBottom: '24px' }}>
                        <label className="auth-label">Average Daily Customers <span style={{ opacity: 0.5, fontWeight: 500 }}>(Optional)</span></label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon"><Users size={16} /></span>
                            <select
                                className="auth-input"
                                value={form.dailyCustomers}
                                onChange={e => setForm(f => ({ ...f, dailyCustomers: e.target.value }))}
                                style={{ appearance: 'none', cursor: 'pointer' }}
                            >
                                <option value="">Select range...</option>
                                <option value="0-10">Under 10 customers</option>
                                <option value="10-30">10 to 30 customers</option>
                                <option value="30-80">30 to 80 customers</option>
                                <option value="80+">More than 80 customers</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setStep(1)}
                            style={{ flex: 1, borderRadius: '12px', padding: '13px 20px', fontWeight: 700 }}
                        >
                            ← Back
                        </button>
                        <button
                            type="submit"
                            className="auth-btn"
                            disabled={loading || !form.address}
                            style={{ flex: 2, margin: 0 }}
                        >
                            {loading ? <><span className="auth-spinner" /> Joining…</> : <><Sparkles size={16} fill="white" /> Register Account</>}
                        </button>
                    </div>
                </form>
            )}

            {/* ═══════════ STEP 3: OTP EMAIL VERIFICATION ═══════════ */}
            {step === 3 && (
                <form onSubmit={handleVerify} className="fade-up">
                    <OtpInput
                        value={otp}
                        onChange={v => { setOtp(v); setOtpError(false); setErr('') }}
                        hasError={otpError}
                    />

                    {/* Countdown resend */}
                    <div className="otp-timer">
                        {secs > 0
                            ? <>Resend verification code in <span>{secs}s</span></>
                            : <button type="button" className="auth-link-btn" onClick={handleResend}>Resend OTP</button>
                        }
                    </div>

                    {/* Spam Notice banner */}
                    <div className="spam-notice">
                        <span className="spam-notice-icon">📂</span>
                        <span>
                            <strong>OTP missing?</strong> Please check your <strong>Spam</strong> or <strong>Junk</strong> folder. Some networks automatically divert verification emails.
                        </span>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading || otp.length < 6}>
                        {loading ? <><span className="auth-spinner" /> Verifying OTP…</> : <>Verify & Complete Onboarding <CheckCircle size={16} /></>}
                    </button>

                    <div className="auth-footer" style={{ marginTop: '20px' }}>
                        <button
                            type="button"
                            className="auth-link-btn"
                            onClick={() => { setStep(2); setErr(''); setOtp('') }}
                        >
                            ← Go back to profile details
                        </button>
                    </div>
                </form>
            )}
        </AuthLayout>
    )
}
