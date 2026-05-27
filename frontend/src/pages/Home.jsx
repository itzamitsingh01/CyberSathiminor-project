import { useNavigate } from 'react-router-dom'
import { 
    Camera, FileArchive, FileText, PenLine, QrCode, Zap, Shield, Clock, 
    TrendingUp, FileUp, Sparkles, CheckCircle, ArrowRight
} from 'lucide-react'
import { useLanguage } from '../LanguageContext'
import { useAuth } from '../hooks/useAuth'
import useGuestStore from '../store/guestStore'

export default function Home() {
    const nav = useNavigate()
    const { t } = useLanguage()
    const { user, isLoggedIn, isPremium } = useAuth()
    const { usage: guestUsage } = useGuestStore()

    const tools = [
        {
            icon: Camera,
            title: t.tool_passport || 'Passport Photo',
            desc: t.tool_passport_desc || 'A4 sheet · 35×45 mm · Cutting guides included',
            path: '/passport',
            gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            glow: 'rgba(79,70,229,0.2)',
            badge: 'POPULAR',
            badgeColor: '#6366f1',
        },
        {
            icon: FileArchive,
            title: t.tool_compress || 'File Size Reducer',
            desc: t.tool_compress_desc || 'Compress image/PDF to your exact KB targets',
            path: '/compress',
            gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            glow: 'rgba(245,158,11,0.2)',
            badge: 'INSTANT',
            badgeColor: '#fbbf24',
        },
        {
            icon: FileText,
            title: t.tool_pdf || 'PDF Tools',
            desc: t.tool_pdf_desc || 'Merge multiple PDFs, convert JPG to PDF, or compress files',
            path: '/pdf',
            gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
            glow: 'rgba(16,185,129,0.2)',
            badge: '3-IN-1',
            badgeColor: '#34d399',
        },
        {
            icon: PenLine,
            title: t.tool_signature || 'Signature Tool',
            desc: t.tool_signature_desc || 'Draw signature or upload & remove background to transparent PNG',
            path: '/signature',
            gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
            glow: 'rgba(236,72,153,0.2)',
            badge: 'AI-POWER',
            badgeColor: '#f472b6',
        },
        {
            icon: QrCode,
            title: t.tool_qr || 'QR File Transfer',
            desc: t.tool_qr_desc || 'Customers scan a QR and upload files from phone directly to shop PC',
            path: '/qr-session',
            gradient: 'linear-gradient(135deg, #0ea5e9, #4f46e5)',
            glow: 'rgba(14,165,233,0.2)',
            badge: 'LIVE WORKFLOW',
            badgeColor: '#38bdf8',
        },
    ]

    // Gather metrics data
    const getMetrics = () => {
        let totalUses = 0
        if (isLoggedIn) {
            totalUses = Object.values(user?.usage || {}).reduce((acc, curr) => typeof curr === 'number' ? acc + curr : acc, 0)
        } else {
            totalUses = Object.values(guestUsage).reduce((acc, curr) => acc + curr, 0)
        }

        return [
            {
                label: 'Tool Operations',
                val: totalUses,
                sub: isLoggedIn ? 'Completed this month' : 'Guest mode trial uses',
                icon: Zap,
                color: 'text-indigo-500 bg-indigo-500/10'
            },
            {
                label: 'Active QR Sessions',
                val: isLoggedIn ? (user?.usage?.qrSessions || 0) : 0,
                sub: 'Simultaneous uploads',
                icon: QrCode,
                color: 'text-sky-500 bg-sky-500/10'
            },
            {
                label: 'Current Account Level',
                val: isPremium ? 'Premium' : (isLoggedIn ? 'Free Tier' : 'Guest'),
                sub: isPremium ? 'Unlimited access active' : 'Usage limits apply',
                icon: Shield,
                color: 'text-amber-500 bg-amber-500/10'
            }
        ]
    }

    const metrics = getMetrics()

    // Mock recent activity feed
    const recentActivities = [
        { title: 'Passport Photo Sheet Generated', desc: '8-photo layout · Cutting guides', time: '2 mins ago', icon: Camera, color: 'text-indigo-400' },
        { title: 'Document PDF Compressed', desc: '4.8MB → 210KB (95% savings)', time: '10 mins ago', icon: FileArchive, color: 'text-amber-400' },
        { title: 'Signature BG Removed', desc: 'Transparent PNG generated', time: '1 hour ago', icon: PenLine, color: 'text-pink-400' }
    ]

    return (
        <div className="page" style={{ animation: 'fadeSlide 0.5s ease both' }}>
            
            {/* ── WELCOME HERO ROW ── */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' }}>
                    Welcome back, {isLoggedIn ? user?.name?.split(' ')[0] : 'Guest Partner'}!
                </h1>
                <p style={{ color: 'var(--muted)', marginTop: '4px', fontSize: '15px' }}>
                    CyberSathi is active and powering your shop. Select a utility to begin processing.
                </p>
            </div>

            {/* ── METRICS DASHBOARD CARDS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {metrics.map((m, i) => {
                    const Icon = m.icon
                    return (
                        <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.color.split(' ')[1]}`}>
                                <Icon size={22} className={m.color.split(' ')[0]} />
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>{m.label}</div>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>{m.val}</div>
                                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{m.sub}</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }} className="md-grid-3">
                {/* ── GRID OF SAAS TOOLS ── */}
                <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>
                            Café Utility Toolkit
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>5 tools loaded</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="sm-grid-2">
                        {tools.map((tool) => {
                            const Icon = tool.icon
                            return (
                                <div
                                    key={tool.path}
                                    onClick={() => nav(tool.path)}
                                    className="card"
                                    style={{
                                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                        padding: '20px', cursor: 'pointer', textAlign: 'left',
                                        transition: 'all 0.2s ease',
                                        border: '1px solid var(--border)',
                                        background: 'var(--card)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-3px)'
                                        e.currentTarget.style.boxShadow = `0 12px 24px ${tool.glow}`
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                                    }}
                                >
                                    <div>
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '12px',
                                            background: tool.gradient,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: `0 4px 12px ${tool.glow}`,
                                            marginBottom: '16px'
                                        }}>
                                            <Icon size={20} color="white" />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)' }}>{tool.title}</span>
                                            <span style={{
                                                fontSize: '8.5px', fontWeight: 800, letterSpacing: '0.04em',
                                                color: tool.badgeColor, background: `${tool.glow}`,
                                                padding: '2px 5px', borderRadius: '4px',
                                            }}>
                                                {tool.badge}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: '1.4' }}>{tool.desc}</p>
                                    </div>
                                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                                        Open Utility <ArrowRight size={13} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ── RECENT SHOP ACTIVITY FEED ── */}
                <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)', marginBottom: '18px' }}>
                        Live Activity Log
                    </h3>
                    <div className="card" style={{ padding: '20px', background: 'var(--card)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {recentActivities.map((act, idx) => {
                            const ActIcon = act.icon
                            return (
                                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                    <div className="mt-0.5">
                                        <ActIcon size={16} className={act.color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {act.title}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                                            {act.desc}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '10px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                        {act.time}
                                    </span>
                                </div>
                            )
                        })}

                        {/* Customer QR Quick Session CTA */}
                        <div style={{
                            marginTop: '12px', padding: '14px', borderRadius: '12px',
                            background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)',
                            textAlign: 'center'
                        }}>
                            <Clock size={16} color="var(--primary)" style={{ margin: '0 auto 6px' }} />
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>
                                Customer Waiting?
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '4px 0 10px 0' }}>
                                Start a QR file upload session to transfer files from their phone.
                            </p>
                            <button
                                onClick={() => nav('/qr-session')}
                                className="btn-primary"
                                style={{
                                    padding: '8px 14px', fontSize: '12px', borderRadius: '8px',
                                    background: 'linear-gradient(135deg,#0ea5e9,#4f46e5)',
                                    boxShadow: 'none'
                                }}
                            >
                                <QrCode size={13} /> Open Session
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '48px', fontSize: '12px' }}>
                CyberSathi SaaS © {new Date().getFullYear()} · Elevating Internet Café Operations
            </p>
        </div>
    )
}
