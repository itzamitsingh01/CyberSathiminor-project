import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Shield, Zap, CheckCircle, Clock, User, Sparkles } from 'lucide-react'
import useGuestStore from '../store/guestStore'

const LIMITS_CONFIG = {
    guest: { label: 'Guest Mode', removeBg: 2, passport: 3, compress: 3, pdf: 3, signature: 3, qrSessions: 1 },
    free:  { label: 'Free Account', removeBg: 10, passport: 20, compress: 20, pdf: 20, signature: 20, qrSessions: 5 },
    premium: { label: 'Premium Member', removeBg: 200, passport: 'Unlimited', compress: 'Unlimited', pdf: 'Unlimited', signature: 'Unlimited', qrSessions: 'Unlimited' }
}

export default function SubscriptionPage() {
    const { user, isLoggedIn, isPremium } = useAuth()
    const { usage: guestUsage } = useGuestStore()
    const navigate = useNavigate()

    const tier = isPremium ? 'premium' : (isLoggedIn ? 'free' : 'guest')
    const config = LIMITS_CONFIG[tier]

    // Calculate dynamic usage
    const getUsageData = () => {
        const stats = [
            { key: 'passport', name: 'Passport Generator', current: 0, limit: config.passport },
            { key: 'compress', name: 'File Compressor', current: 0, limit: config.compress },
            { key: 'pdf', name: 'PDF Tools', current: 0, limit: config.pdf },
            { key: 'signature', name: 'Signature Creator', current: 0, limit: config.signature },
            { key: 'removeBg', name: 'AI BG Removal', current: 0, limit: config.removeBg },
            { key: 'qrSessions', name: 'QR Live Sessions', current: 0, limit: config.qrSessions },
        ]

        return stats.map(item => {
            let current = 0
            if (isLoggedIn) {
                current = user?.usage?.[item.key] || 0
            } else {
                current = guestUsage[item.key] || 0
            }

            const pct = typeof item.limit === 'number'
                ? Math.min(100, Math.round((current / item.limit) * 100))
                : 0

            return { ...item, current, pct }
        })
    }

    const usageStats = getUsageData()

    return (
        <div className="page" style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeSlide 0.5s ease both' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <span className="badge badge-amber" style={{ marginBottom: '12px' }}>
                    <Sparkles size={13} /> MY SUBSCRIPTION
                </span>
                <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text)', marginBottom: '8px' }}>
                    Plans & Usage Dashboard
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '15px' }}>
                    Track your cyber café productivity, remaining quota, and premium options.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'start' }} className="md-grid-2">
                {/* ── CARD 1: CURRENT STATUS & USAGE METER ── */}
                <div className="card" style={{ padding: '24px', background: 'var(--card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Current Plan</div>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: isPremium ? 'var(--accent)' : 'var(--primary)' }}>
                                {config.label}
                            </div>
                        </div>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: isPremium ? 'rgba(245,158,11,0.1)' : 'rgba(79,70,229,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {isPremium ? <Zap size={24} color="var(--accent)" fill="var(--accent)" /> : <User size={24} color="var(--primary)" />}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
                            Monthly Usage Quota
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {usageStats.map((item) => (
                                <div key={item.key}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                                        <span style={{ color: 'var(--text)' }}>{item.name}</span>
                                        <span style={{ color: 'var(--muted)' }}>
                                            {item.current} / {item.limit} {typeof item.limit === 'number' ? 'uses' : ''}
                                        </span>
                                    </div>
                                    <div className="progress-wrap" style={{ height: '8px' }}>
                                        <div
                                            className="progress-bar"
                                            style={{
                                                width: `${typeof item.limit === 'number' ? item.pct : 100}%`,
                                                background: typeof item.limit === 'number' && item.pct > 80
                                                    ? 'linear-gradient(90deg, #ef4444, #f43f5e)'
                                                    : 'linear-gradient(90deg, var(--primary), #8b5cf6)'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── CARD 2: PREMIUM UPGRADE INTERFACE ── */}
                <div className="card" style={{
                    padding: '28px',
                    background: 'var(--card)',
                    border: '2px solid var(--primary)',
                    boxShadow: '0 8px 30px var(--primary-glow)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Glow element */}
                    <div style={{
                        position: 'absolute', top: '-100px', right: '-100px',
                        width: '200px', height: '200px', borderRadius: '50%',
                        background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.15,
                        pointerEvents: 'none'
                    }} />

                    <div className="badge badge-green" style={{ marginBottom: '16px', alignSelf: 'flex-start' }}>
                        ⭐ PREMIUM SAAS POWER
                    </div>

                    <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text)', marginBottom: '8px' }}>
                        CyberSathi Premium
                    </h2>
                    <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
                        Supercharge your internet café operations, unlock unlimited processing, remove background constraints, and maximize shop speed.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px' }}>
                        <span style={{ fontSize: '38px', fontWeight: 900, color: 'var(--text)' }}>₹199</span>
                        <span style={{ fontSize: '15px', color: 'var(--muted)', fontWeight: 600 }}>/ month</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>
                            <CheckCircle size={16} color="var(--success)" fill="var(--success-glow)" />
                            <span>Unlimited Passport sheet generation</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>
                            <CheckCircle size={16} color="var(--success)" fill="var(--success-glow)" />
                            <span>Unlimited PDF conversions & compression</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>
                            <CheckCircle size={16} color="var(--success)" fill="var(--success-glow)" />
                            <span>Unlimited high-resolution background removal</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>
                            <CheckCircle size={16} color="var(--success)" fill="var(--success-glow)" />
                            <span>Unlimited simultaneous QR transfer sessions</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>
                            <CheckCircle size={16} color="var(--success)" fill="var(--success-glow)" />
                            <span>Priority processing servers (instant results)</span>
                        </li>
                    </ul>

                    {isPremium ? (
                        <div className="result-success" style={{ margin: 0, textAlign: 'center', fontWeight: 700 }}>
                            🎉 You are already a Premium Member!
                        </div>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={() => {
                                if (!isLoggedIn) {
                                    navigate('/register')
                                } else {
                                    // Mock subscription gateway
                                    alert('Subscribed to CyberSathi Premium successfully!')
                                    window.location.reload()
                                }
                            }}
                        >
                            <Zap size={18} fill="white" />
                            {isLoggedIn ? 'Upgrade Now (₹199/mo)' : 'Sign up to Upgrade'}
                        </button>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', color: 'var(--muted)' }}>
                        Secure checkout · Cancel anytime instantly in 1-click · 24/7 dedicated support
                    </div>
                </div>
            </div>
        </div>
    )
}
