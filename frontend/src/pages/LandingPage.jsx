/**
 * LandingPage.jsx – Premium SaaS landing page
 * Sections: Navbar → Hero → Preview → Tools → How it works → Features → Pricing → Reviews → CTA → Footer
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Shield, Zap, QrCode, FileImage, FileText, Scissors,
    PenLine, Star, CheckCircle, ArrowRight, Play,
    Users, Clock, Download, Cpu, Lock, TrendingUp, Sun, Moon, LogOut, LayoutDashboard,
} from 'lucide-react'
import { useTheme } from '../ThemeContext'
import { useAuth } from '../hooks/useAuth'
import './LandingPage.css'

/* ── Scroll-triggered fade-in ──────────────────────────── */
function useFadeIn() {
    const ref = useRef(null)
    useEffect(() => {
        if (!ref.current) return
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { entry.target.style.opacity = 1; entry.target.style.transform = 'translateY(0)'; obs.disconnect() } },
            { threshold: 0.15 }
        )
        obs.observe(ref.current)
        return () => obs.disconnect()
    }, [])
    return { ref, style: { opacity: 0, transform: 'translateY(28px)', transition: 'opacity 0.6s ease, transform 0.6s ease' } }
}

/* ── Data ─────────────────────────────────────────────── */
const TOOLS = [
    { emoji: '📸', name: 'Passport Photo',    desc: 'A4 sheet · 35×45mm · print-ready',    color: 'rgba(79,70,229,0.18)',  path: '/passport' },
    { emoji: '📦', name: 'Image Compressor',  desc: 'Reduce size without visible loss',       color: 'rgba(245,158,11,0.18)', path: '/compress' },
    { emoji: '📄', name: 'PDF Tools',         desc: 'Merge, compress & convert to PDF',       color: 'rgba(16,185,129,0.18)', path: '/pdf' },
    { emoji: '✍️', name: 'Signature Creator', desc: 'Draw or type your signature',             color: 'rgba(236,72,153,0.18)', path: '/signature' },
    { emoji: '🤖', name: 'Remove Background', desc: 'AI-powered background removal',          color: 'rgba(6,182,212,0.18)',  path: '/compress' },
    { emoji: '📱', name: 'QR Upload Session', desc: 'Customers scan & send files instantly',  color: 'rgba(168,85,247,0.18)', path: '/qr-session' },
]

const STEPS = [
    { n: '1', title: 'Choose a Tool', desc: 'Pick from passport photos, PDF tools, compression, signatures and more.' },
    { n: '2', title: 'Upload & Process', desc: 'Drop your file in. Our cloud engine processes it in seconds.' },
    { n: '3', title: 'Download or Print', desc: 'Get your result instantly. Print directly from the browser — no extra steps.' },
]

const FEATURES = [
    { icon: '⚡', bg: 'rgba(245,158,11,0.15)', title: 'Instant Processing',      desc: 'Cloud-powered engine delivers results in under 3 seconds for most operations.' },
    { icon: '📱', bg: 'rgba(79,70,229,0.15)',   title: 'QR File Transfer',        desc: 'Customers scan a QR code from their phone and files appear on your dashboard instantly.' },
    { icon: '🖨️', bg: 'rgba(16,185,129,0.15)',  title: 'Direct Print',            desc: 'Skip the download step. Processed files open in a print-ready layout with one click.' },
    { icon: '🔒', bg: 'rgba(239,68,68,0.15)',   title: 'Auto Cleanup',            desc: 'All uploaded files are automatically deleted from our servers after your session ends.' },
    { icon: '🌐', bg: 'rgba(6,182,212,0.15)',   title: 'Works on Any Device',     desc: 'Desktop, phone, tablet — the app is fully responsive and mobile-first.' },
    { icon: '📊', bg: 'rgba(168,85,247,0.15)',  title: 'Usage Analytics',         desc: 'Track how many jobs you\'ve run this month and stay on top of your shop productivity.' },
]

const REVIEWS = [
    { stars: 5, text: '"My passport photo workflow went from 5 minutes to under 30 seconds. CyberSathi is a game changer for our shop."', name: 'Ramesh Kumar', role: 'Cyber Café Owner, Bhopal', avatar: 'RK', color: '#4f46e5' },
    { stars: 5, text: '"The QR upload system is brilliant. Customers just scan and their files appear. No more USB drives or WhatsApp transfers!"', name: 'Priya Sharma', role: 'Digital Services, Indore', avatar: 'PS', color: '#10b981' },
    { stars: 5, text: '"We process 50+ PDF jobs a day. This tool saves us at least 2 hours every single day. Worth every rupee."', name: 'Anil Verma', role: 'Print Shop Owner, Jabalpur', avatar: 'AV', color: '#f59e0b' },
    { stars: 5, text: '"Finally a tool built for Indian cyber cafés. Passport photo layouts are perfect and the print button works every time."', name: 'Sunita Patel', role: 'Computer Centre, Gwalior', avatar: 'SP', color: '#ec4899' },
    { stars: 5, text: '"Background removal used to take us 10 minutes in Photoshop. Now it\'s done in 2 seconds. Our customers love it."', name: 'Mohit Singh', role: 'Digital Studio, Ujjain', avatar: 'MS', color: '#06b6d4' },
    { stars: 5, text: '"The PDF merge tool is exactly what we needed. No ads, no watermarks, just clean output every time."', name: 'Deepa Joshi', role: 'Stationery & Print, Raipur', avatar: 'DJ', color: '#8b5cf6' },
]

const FREE_PLAN_FEATURES = [
    '✅ 20 uses per tool / month',
    '✅ All 6 tools included',
    '✅ QR upload sessions (5/mo)',
    '✅ Cloud file processing',
    '❌ Priority processing',
    '❌ Unlimited sessions',
]

const PREMIUM_FEATURES = [
    '✅ Unlimited tool usage',
    '✅ All 6 tools included',
    '✅ Unlimited QR sessions',
    '✅ Priority cloud processing',
    '✅ Usage analytics dashboard',
    '✅ Dedicated support',
]

/* ═══════════════════════════════════════════════════════ */
export default function LandingPage() {
    const navigate = useNavigate()
    const { theme, toggleTheme } = useTheme()
    const { isLoggedIn, user, clearAuth } = useAuth()
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 24)
        window.addEventListener('scroll', handler, { passive: true })
        return () => window.removeEventListener('scroll', handler)
    }, [])

    const feat1 = useFadeIn()
    const feat2 = useFadeIn()
    const feat3 = useFadeIn()
    const feat4 = useFadeIn()
    const feat5 = useFadeIn()

    return (
        <div className="lp">

            {/* ══════════ NAVBAR ══════════ */}
            <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
                <Link to="/" className="lp-nav-logo">
                    <div className="lp-nav-logo-icon"><Shield size={18} color="#fff" /></div>
                    <span className="lp-nav-logo-text">CyberSathi</span>
                </Link>

                <ul className="lp-nav-links">
                    <li><a href="#tools">Tools</a></li>
                    <li><a href="#how">How it works</a></li>
                    <li><a href="#pricing">Pricing</a></li>
                </ul>

                <div className="lp-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={toggleTheme}
                        style={{
                            padding: '8px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'transparent',
                            color: 'rgba(255,255,255,0.85)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#c4b5fd" />}
                    </button>

                    {isLoggedIn ? (
                        <>
                            <Link to="/dashboard" className="lp-btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <LayoutDashboard size={14} /> Dashboard
                            </Link>
                            <button
                                onClick={() => { clearAuth(); navigate('/') }}
                                className="lp-btn-cta"
                                style={{ cursor: 'pointer' }}
                            >
                                <LogOut size={14} /> Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="lp-btn-ghost">Sign in</Link>
                            <Link to="/register" className="lp-btn-cta">Get Started <ArrowRight size={14} /></Link>
                        </>
                    )}
                </div>
            </nav>

            {/* ══════════ HERO ══════════ */}
            <section className="lp-hero">
                <div className="lp-hero-bg" />
                <div className="lp-hero-grid" />
                <div className="lp-hero-inner">

                    <div className="lp-hero-badge">
                        <span className="lp-hero-badge-dot" />
                        Built for Indian Cyber Cafés
                    </div>

                    <h1 className="lp-hero-h1">
                        Your complete<br />
                        <span className="lp-hero-grad">cyber café toolkit</span>
                    </h1>

                    <p className="lp-hero-sub">
                        Passport photos, PDF tools, background removal, QR file transfer and more —
                        all in one blazing-fast app designed for real operators.
                    </p>

                    <div className="lp-hero-actions">
                        <Link to="/dashboard" className="lp-hero-btn-primary">
                            <Zap size={18} /> Start Processing Free
                        </Link>
                        <Link to="/dashboard" className="lp-hero-btn-secondary">
                            <Play size={16} /> Continue as Guest
                        </Link>
                    </div>

                    <div className="lp-hero-trust">
                        <span className="lp-hero-trust-item"><CheckCircle size={14} color="#4ade80" /> No credit card required</span>
                        <span className="lp-hero-trust-item"><Users size={14} color="#a5b4fc" /> 2,000+ café operators</span>
                        <span className="lp-hero-trust-item"><Clock size={14} color="#67e8f9" /> Processes in seconds</span>
                    </div>

                    {/* ── App Preview Window ── */}
                    <div className="lp-preview-wrap lp-float">
                        <div className="lp-preview-window">
                            <div className="lp-preview-bar">
                                <div className="lp-preview-dot" style={{ background: '#ff5f57' }} />
                                <div className="lp-preview-dot" style={{ background: '#ffbd2e' }} />
                                <div className="lp-preview-dot" style={{ background: '#28c840' }} />
                                <div className="lp-preview-url">cybersathi.app/dashboard</div>
                            </div>
                            <div className="lp-preview-body">
                                {TOOLS.map(t => (
                                    <div key={t.name} className="lp-preview-card">
                                        <div className="lp-preview-card-icon">{t.emoji}</div>
                                        <div className="lp-preview-card-name">{t.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════ TOOLS ══════════ */}
            <div id="tools" className="lp-section-dark">
                <section className="lp-section" {...feat1}>
                    <p className="lp-section-label">Tools</p>
                    <h2 className="lp-section-h2">Everything your shop needs</h2>
                    <p className="lp-section-sub">Six professional tools, zero bloat. Designed for speed and simplicity.</p>

                    <div className="lp-tools-grid">
                        {TOOLS.map(t => (
                            <div
                                key={t.name}
                                className="lp-tool-card"
                                style={{ '--tool-color': t.color }}
                                onClick={() => navigate('/dashboard')}
                            >
                                <div className="lp-tool-icon" style={{ background: t.color }}>{t.emoji}</div>
                                <div className="lp-tool-name">{t.name}</div>
                                <div className="lp-tool-desc">{t.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ══════════ HOW IT WORKS ══════════ */}
            <section id="how" className="lp-section" {...feat2}>
                <p className="lp-section-label">How it works</p>
                <h2 className="lp-section-h2">Ready in 3 steps</h2>
                <p className="lp-section-sub">No training needed. If you can click a button, you can use CyberSathi.</p>

                <div className="lp-steps">
                    {STEPS.map(s => (
                        <div key={s.n} className="lp-step">
                            <div className="lp-step-num">{s.n}</div>
                            <div className="lp-step-title">{s.title}</div>
                            <div className="lp-step-desc">{s.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════ FEATURES ══════════ */}
            <div className="lp-section-dark">
                <section className="lp-section" {...feat3}>
                    <p className="lp-section-label">Features</p>
                    <h2 className="lp-section-h2">Built for real workflow speed</h2>
                    <p className="lp-section-sub">Every feature was designed based on what actual cyber café operators need daily.</p>

                    <div className="lp-features-grid">
                        {FEATURES.map(f => (
                            <div key={f.title} className="lp-feature-card">
                                <div className="lp-feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                                <div className="lp-feature-title">{f.title}</div>
                                <div className="lp-feature-desc">{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ══════════ PRICING ══════════ */}
            <section id="pricing" className="lp-section" {...feat4}>
                <p className="lp-section-label">Pricing</p>
                <h2 className="lp-section-h2">Simple, honest pricing</h2>
                <p className="lp-section-sub">Start free. Upgrade when you need more. No hidden charges, ever.</p>

                <div className="lp-pricing-grid">
                    {/* Free */}
                    <div className="lp-plan">
                        <div className="lp-plan-name">Free</div>
                        <div className="lp-plan-price">₹0</div>
                        <div className="lp-plan-period">Forever free</div>
                        <ul className="lp-plan-features">
                            {FREE_PLAN_FEATURES.map(f => (
                                <li key={f}><span>{f.slice(0,2)}</span><span>{f.slice(2)}</span></li>
                            ))}
                        </ul>
                        <Link to="/register" className="lp-plan-btn outline">Get Started Free</Link>
                    </div>

                    {/* Premium */}
                    <div className="lp-plan popular">
                        <div className="lp-plan-badge">⭐ Most Popular</div>
                        <div className="lp-plan-name">Premium</div>
                        <div className="lp-plan-price"><sup>₹</sup>199</div>
                        <div className="lp-plan-period">per month · cancel anytime</div>
                        <ul className="lp-plan-features">
                            {PREMIUM_FEATURES.map(f => (
                                <li key={f}><span>{f.slice(0,2)}</span><span>{f.slice(2)}</span></li>
                            ))}
                        </ul>
                        <Link to="/register" className="lp-plan-btn filled">Start Premium Trial</Link>
                    </div>
                </div>
            </section>

            {/* ══════════ TESTIMONIALS ══════════ */}
            <div className="lp-section-dark">
                <section className="lp-section" {...feat5}>
                    <p className="lp-section-label">Testimonials</p>
                    <h2 className="lp-section-h2">Loved by café operators across India</h2>
                    <p className="lp-section-sub">Real reviews from shop owners who use CyberSathi every day.</p>

                    <div className="lp-reviews-grid">
                        {REVIEWS.map(r => (
                            <div key={r.name} className="lp-review">
                                <div className="lp-review-stars">{'★'.repeat(r.stars)}</div>
                                <div className="lp-review-text">{r.text}</div>
                                <div className="lp-review-author">
                                    <div className="lp-review-avatar" style={{ background: r.color }}>{r.avatar}</div>
                                    <div>
                                        <div className="lp-review-name">{r.name}</div>
                                        <div className="lp-review-role">{r.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ══════════ FINAL CTA ══════════ */}
            <section className="lp-cta-section">
                <div className="lp-cta-bg" />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 className="lp-cta-h2">
                        Ready to upgrade your<br />
                        <span className="lp-hero-grad">cyber café workflow?</span>
                    </h2>
                    <p className="lp-cta-sub">Join 2,000+ operators. Start free in 30 seconds.</p>
                    <div className="lp-cta-actions">
                        <Link to="/register" className="lp-hero-btn-primary">
                            <Zap size={18} /> Create Free Account
                        </Link>
                        <Link to="/dashboard" className="lp-hero-btn-secondary">
                            Continue as Guest
                        </Link>
                    </div>
                </div>
            </section>

            {/* ══════════ FOOTER ══════════ */}
            <footer className="lp-footer">
                <div className="lp-footer-left">
                    <div className="lp-nav-logo-icon" style={{ width: 30, height: 30, borderRadius: 8 }}>
                        <Shield size={15} color="#fff" />
                    </div>
                    <span className="lp-footer-copy">© {new Date().getFullYear()} CyberSathi · All rights reserved</span>
                </div>
                <div className="lp-footer-links">
                    <a href="#tools">Tools</a>
                    <a href="#pricing">Pricing</a>
                    <Link to="/login">Sign in</Link>
                    <Link to="/register">Register</Link>
                    <Link to="/help">Help</Link>
                </div>
            </footer>
        </div>
    )
}
