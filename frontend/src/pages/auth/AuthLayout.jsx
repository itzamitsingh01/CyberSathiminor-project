/**
 * AuthLayout.jsx – Shared split-screen layout for all auth pages
 * Left: Branding panel (desktop only) | Right: Form panel
 */
import { Shield, Zap, QrCode, FileImage, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../ThemeContext'
import './auth.css'

const features = [
    { icon: FileImage, text: 'Passport photos in seconds' },
    { icon: QrCode,    text: 'QR-based mobile file upload' },
    { icon: Zap,       text: 'PDF merge, compress & convert' },
]

export default function AuthLayout({ children, title, subtitle }) {
    const { theme, toggleTheme } = useTheme()

    return (
        <div className="auth-shell">
            {/* ── Left Brand Panel ── */}
            <div className="auth-brand">
                <div className="auth-brand-inner">
                    <div className="auth-logo">
                        <div className="auth-logo-icon">
                            <Shield size={28} color="#fff" />
                        </div>
                        <span className="auth-logo-text">CyberSathi</span>
                    </div>

                    <h1 className="auth-brand-headline">
                        Your complete<br />
                        <span className="auth-brand-accent">cyber café toolkit</span>
                    </h1>
                    <p className="auth-brand-sub">
                        Built for operators who value speed,<br />
                        quality, and simplicity.
                    </p>

                    <div className="auth-features">
                        {features.map(({ icon: Icon, text }) => (
                            <div key={text} className="auth-feature-item">
                                <div className="auth-feature-icon">
                                    <Icon size={16} color="#a5b4fc" />
                                </div>
                                <span>{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Decorative blobs */}
                    <div className="auth-blob auth-blob-1" />
                    <div className="auth-blob auth-blob-2" />
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="auth-form-panel" style={{ position: 'relative' }}>
                <button
                    onClick={toggleTheme}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        right: '24px',
                        padding: '10px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'var(--card)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        zIndex: 10,
                    }}
                    aria-label="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
                </button>
                <div className="auth-form-wrap">
                    {/* Mobile-only logo */}
                    <div className="auth-mobile-logo">
                        <div className="auth-logo-icon" style={{ width: 40, height: 40, borderRadius: 12 }}>
                            <Shield size={20} color="#fff" />
                        </div>
                        <span className="auth-logo-text" style={{ fontSize: 20, color: 'var(--text)' }}>CyberSathi</span>
                    </div>

                    <div className="auth-form-header">
                        <h2 className="auth-form-title">{title}</h2>
                        {subtitle && <p className="auth-form-subtitle">{subtitle}</p>}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    )
}
