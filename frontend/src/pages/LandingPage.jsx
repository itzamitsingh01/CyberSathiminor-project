/**
 * LandingPage.jsx
 *
 * Theme strategy:
 * - The page root has className="lp" (no --lp-* class)
 * - All sections use global --bg/--card/--text/--muted tokens via CSS
 * - Navbar: uses .lp-nav-hero (dark-glass) when NOT scrolled (hero is always dark)
 *           uses .lp-nav + .scrolled (theme-adaptive) when scrolled
 * - Hero + CTA: always dark (intentional brand design)
 * - ThemeContext toggles .dark on <html> — CSS vars switch globally
 */
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Shield, Zap, QrCode, Play, CheckCircle,
    ArrowRight, Users, Clock, Sun, Moon,
    LogOut, LayoutDashboard, Sparkles, ChevronRight,
} from 'lucide-react'
import { useTheme } from '../ThemeContext'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/auth.service'
import './LandingPage.css'

/* ── Scroll-triggered fade-in ──────────────────────────── */
function useFadeIn() {
    const ref = useRef(null)
    useEffect(() => {
        if (!ref.current) return
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('lp-visible')
                    obs.disconnect()
                }
            },
            { threshold: 0.08 }
        )
        obs.observe(ref.current)
        return () => obs.disconnect()
    }, [])
    return { ref, className: 'lp-fade-trigger' }
}

/* ── Animated counter ──────────────────────────────────── */
function AnimCounter({ to, suffix = '', duration = 1600 }) {
    const [val, setVal] = useState(0)
    const ref = useRef(null)
    const started = useRef(false)
    useEffect(() => {
        const obs = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting || started.current) return
            started.current = true
            const start = Date.now()
            const tick = () => {
                const elapsed = Date.now() - start
                const prog = Math.min(elapsed / duration, 1)
                const eased = 1 - Math.pow(1 - prog, 3)
                setVal(Math.round(to * eased))
                if (prog < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
        }, { threshold: 0.5 })
        if (ref.current) obs.observe(ref.current)
        return () => obs.disconnect()
    }, [to, duration])
    return <span ref={ref}>{val.toLocaleString('en-IN')}{suffix}</span>
}

/* ── Data ─────────────────────────────────────────────── */
const TOOLS = [
    { emoji: '📸', name: 'Passport Photo',    desc: 'A4 sheet · 35×45mm · print-ready',     color: '#4f46e5', path: '/passport' },
    { emoji: '📦', name: 'Image Compressor',  desc: 'Reduce size without visible loss',       color: '#f59e0b', path: '/compress' },
    { emoji: '📄', name: 'PDF Tools',         desc: 'Merge, compress & convert to PDF',       color: '#10b981', path: '/pdf' },
    { emoji: '✍️', name: 'Signature Creator', desc: 'Draw or upload → transparent PNG',       color: '#ec4899', path: '/signature' },
    { emoji: '🤖', name: 'Remove Background', desc: 'AI-powered instant BG removal',          color: '#06b6d4', path: '/compress' },
    { emoji: '📱', name: 'QR Upload Session', desc: 'Customers scan & send files instantly',  color: '#8b5cf6', path: '/qr-session' },
]

const STATS = [
    { value: 2000,  suffix: '+', label: 'Café Operators' },
    { value: 50000, suffix: '+', label: 'Files Processed' },
    { value: 3,     suffix: 's', label: 'Avg. Processing Time' },
    { value: 100,   suffix: '%', label: 'Privacy — Auto Cleanup' },
]

const STEPS = [
    { n: '1', title: 'Choose a Tool',      desc: 'Pick from passport photos, PDF tools, compression, signatures and more.' },
    { n: '2', title: 'Upload & Process',   desc: 'Drop your file in. Our cloud engine processes it in seconds.' },
    { n: '3', title: 'Download or Print',  desc: 'Get your result instantly. Print directly from the browser — no extra steps.' },
]

const FEATURES = [
    { icon: '⚡', color: '#f59e0b', title: 'Instant Processing',  desc: 'Cloud-powered engine delivers results in under 3 seconds for most operations.' },
    { icon: '📱', color: '#4f46e5', title: 'QR File Transfer',    desc: 'Customers scan a QR code from their phone and files appear on your dashboard instantly.' },
    { icon: '🖨️', color: '#10b981', title: 'Direct Print',        desc: 'Skip the download step. Processed files open in a print-ready layout with one click.' },
    { icon: '🔒', color: '#ef4444', title: 'Auto Cleanup',        desc: 'All uploaded files are automatically deleted from our servers after your session ends.' },
    { icon: '🌐', color: '#06b6d4', title: 'Works on Any Device', desc: 'Desktop, phone, tablet — the app is fully responsive and mobile-first.' },
    { icon: '📊', color: '#8b5cf6', title: 'Usage Analytics',     desc: "Track how many jobs you've run this month and stay on top of your shop productivity." },
]

const REVIEWS = [
    { stars: 5, text: '"My passport photo workflow went from 5 minutes to under 30 seconds. CyberSathi is a game changer."', name: 'Ramesh Kumar',  role: 'Cyber Café Owner, Bhopal',     avatar: 'RK', color: '#4f46e5' },
    { stars: 5, text: '"The QR upload system is brilliant. Customers just scan and their files appear. No more USB drives!"', name: 'Priya Sharma', role: 'Digital Services, Indore',      avatar: 'PS', color: '#10b981' },
    { stars: 5, text: '"We process 50+ PDF jobs a day. This tool saves us at least 2 hours every single day."',              name: 'Anil Verma',   role: 'Print Shop Owner, Jabalpur',    avatar: 'AV', color: '#f59e0b' },
    { stars: 5, text: '"Finally a tool built for Indian cyber cafés. Passport photo layouts are perfect every time."',        name: 'Sunita Patel', role: 'Computer Centre, Gwalior',      avatar: 'SP', color: '#ec4899' },
    { stars: 5, text: '"Background removal used to take 10 minutes in Photoshop. Now it\'s done in 2 seconds."',             name: 'Mohit Singh',  role: 'Digital Studio, Ujjain',        avatar: 'MS', color: '#06b6d4' },
    { stars: 5, text: '"The PDF merge tool is exactly what we needed. No ads, no watermarks, just clean output."',           name: 'Deepa Joshi',  role: 'Stationery & Print, Raipur',    avatar: 'DJ', color: '#8b5cf6' },
]

const FREE_FEATURES    = ['20 uses per tool / month', 'All 6 tools included', 'QR upload sessions (5/mo)', 'Cloud file processing']
const PREMIUM_FEATURES = ['Unlimited tool usage', 'All 6 tools included', 'Unlimited QR sessions', 'Priority cloud processing', 'Usage analytics dashboard', 'Dedicated support']

/* ═══════════════════════════════════════════════════════ */
export default function LandingPage() {
    const navigate = useNavigate()
    const { theme, toggleTheme } = useTheme()
    const { isLoggedIn, clearAuth } = useAuth()

    // scrollY tracking for navbar
    const [scrolled, setScrolled]       = useState(false)
    const [billingAnnual, setBillingAnnual] = useState(false)

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 48)
        handler() // run once on mount
        window.addEventListener('scroll', handler, { passive: true })
        return () => window.removeEventListener('scroll', handler)
    }, [])

    const fadeTools   = useFadeIn()
    const fadeSteps   = useFadeIn()
    const fadeFeats   = useFadeIn()
    const fadePricing = useFadeIn()
    const fadeRevs    = useFadeIn()
    const fadeCta     = useFadeIn()

    const isDark = theme === 'dark'

    return (
        <div className="lp">

            {/* ══ NAVBAR ══
                Always uses lp-nav-hero class (dark-glass) until scrolled.
                When scrolled, .scrolled triggers var(--nav-bg) which adapts to theme. */}
            <nav className={`lp-nav ${!scrolled ? 'lp-nav-hero' : 'scrolled'}`}>
                <Link to="/" className="lp-nav-logo">
                    <div className="lp-nav-logo-icon"><Shield size={18} color="#fff" /></div>
                    <span className="lp-nav-logo-text">CyberSathi</span>
                </Link>

                <ul className="lp-nav-links">
                    <li><a href="#tools">Tools</a></li>
                    <li><a href="#how">How it works</a></li>
                    <li><a href="#features">Features</a></li>
                    <li><a href="#pricing">Pricing</a></li>
                </ul>

                <div className="lp-nav-actions">
                    <button onClick={toggleTheme} className="lp-theme-btn" aria-label="Toggle Theme">
                        {isDark ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} />}
                    </button>

                    {isLoggedIn ? (
                        <>
                            <Link to="/dashboard" className="lp-btn-ghost">
                                <LayoutDashboard size={13} /> Dashboard
                            </Link>
                            <button
                                onClick={async () => {
                                    try { await authService.logout() } catch {}
                                    clearAuth()
                                    navigate('/')
                                }}
                                className="lp-btn-cta"
                                style={{ cursor: 'pointer' }}
                            >
                                <LogOut size={13} /> Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="lp-btn-ghost">Sign in</Link>
                            <Link to="/register" className="lp-btn-cta">
                                Get Started <ArrowRight size={13} />
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* ══ HERO — always dark ══ */}
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
                            <Zap size={17} /> Start Processing Free
                        </Link>
                        <Link to="/dashboard" className="lp-hero-btn-secondary">
                            <Play size={15} /> Continue as Guest
                        </Link>
                    </div>

                    <div className="lp-hero-trust">
                        <span className="lp-hero-trust-item"><CheckCircle size={13} color="#4ade80" /> No credit card required</span>
                        <span className="lp-hero-trust-item"><Users size={13} color="#a5b4fc" /> 2,000+ café operators</span>
                        <span className="lp-hero-trust-item"><Clock size={13} color="#67e8f9" /> Processes in seconds</span>
                    </div>

                    {/* App Preview Window */}
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
                                    <div key={t.name} className="lp-preview-card" onClick={() => navigate('/dashboard')}>
                                        <div className="lp-preview-card-icon" style={{ background: `${t.color}22` }}>{t.emoji}</div>
                                        <div className="lp-preview-card-name">{t.name}</div>
                                        <ChevronRight size={11} className="lp-preview-card-arrow" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══ STATS STRIP — theme-adaptive ══ */}
            <div className="lp-stats-strip">
                {STATS.map(s => (
                    <div key={s.label} className="lp-stat-item">
                        <div className="lp-stat-value">
                            <AnimCounter to={s.value} suffix={s.suffix} />
                        </div>
                        <div className="lp-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ══ TOOLS ══ */}
            <div id="tools" className="lp-section-alt">
                <section className="lp-section" {...fadeTools}>
                    <p className="lp-section-label">Tools</p>
                    <h2 className="lp-section-h2">Everything your shop needs</h2>
                    <p className="lp-section-sub">Six professional tools, zero bloat. Designed for speed and simplicity.</p>
                    <div className="lp-tools-grid">
                        {TOOLS.map(t => (
                            <div
                                key={t.name}
                                className="lp-tool-card"
                                style={{ '--tool-accent': t.color }}
                                onClick={() => navigate('/dashboard')}
                            >
                                <div className="lp-tool-icon" style={{ background: `${t.color}18` }}>{t.emoji}</div>
                                <div className="lp-tool-name">{t.name}</div>
                                <div className="lp-tool-desc">{t.desc}</div>
                                <div className="lp-tool-arrow"><ArrowRight size={13} /></div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ══ HOW IT WORKS ══ */}
            <section id="how" className="lp-section" {...fadeSteps}>
                <p className="lp-section-label">How it works</p>
                <h2 className="lp-section-h2">Ready in 3 steps</h2>
                <p className="lp-section-sub">No training needed. If you can click a button, you can use CyberSathi.</p>
                <div className="lp-steps">
                    {STEPS.map((s, i) => (
                        <div key={s.n} className="lp-step">
                            <div className="lp-step-num">{s.n}</div>
                            {i < STEPS.length - 1 && <div className="lp-step-connector" />}
                            <div className="lp-step-title">{s.title}</div>
                            <div className="lp-step-desc">{s.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ FEATURES ══ */}
            <div id="features" className="lp-section-alt">
                <section className="lp-section" {...fadeFeats}>
                    <p className="lp-section-label">Features</p>
                    <h2 className="lp-section-h2">Built for real workflow speed</h2>
                    <p className="lp-section-sub">Every feature was designed based on what actual cyber café operators need daily.</p>
                    <div className="lp-features-grid">
                        {FEATURES.map(f => (
                            <div key={f.title} className="lp-feature-card">
                                <div className="lp-feature-icon" style={{ background: `${f.color}18` }}>{f.icon}</div>
                                <div className="lp-feature-title">{f.title}</div>
                                <div className="lp-feature-desc">{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ══ PRICING ══ */}
            <section id="pricing" className="lp-section" {...fadePricing}>
                <p className="lp-section-label">Pricing</p>
                <h2 className="lp-section-h2">Simple, honest pricing</h2>
                <p className="lp-section-sub">Start free. Upgrade when you need more. No hidden charges, ever.</p>

                <div className="lp-billing-toggle">
                    <span className={!billingAnnual ? 'active' : ''}>Monthly</span>
                    <button className="lp-toggle-pill" onClick={() => setBillingAnnual(v => !v)}>
                        <div className={`lp-toggle-thumb ${billingAnnual ? 'on' : ''}`} />
                    </button>
                    <span className={billingAnnual ? 'active' : ''}>
                        Annual <span className="lp-save-badge">Save 33%</span>
                    </span>
                </div>

                <div className="lp-pricing-grid">
                    <div className="lp-plan">
                        <div className="lp-plan-name">Free</div>
                        <div className="lp-plan-price">₹0</div>
                        <div className="lp-plan-period">Forever free</div>
                        <ul className="lp-plan-features">
                            {FREE_FEATURES.map(f => (
                                <li key={f}><CheckCircle size={14} color="#10b981" /><span>{f}</span></li>
                            ))}
                        </ul>
                        <Link to="/register" className="lp-plan-btn outline">Get Started Free</Link>
                    </div>

                    <div className="lp-plan popular">
                        <div className="lp-plan-badge"><Sparkles size={10} /> Most Popular</div>
                        <div className="lp-plan-name">Premium</div>
                        <div className="lp-plan-price"><sup>₹</sup>{billingAnnual ? '133' : '199'}</div>
                        <div className="lp-plan-period">
                            {billingAnnual ? 'per month · billed ₹1,599/year' : 'per month · cancel anytime'}
                        </div>
                        <ul className="lp-plan-features">
                            {PREMIUM_FEATURES.map(f => (
                                <li key={f}><CheckCircle size={14} color="#6366f1" /><span>{f}</span></li>
                            ))}
                        </ul>
                        <Link to="/register" className="lp-plan-btn filled">Start Premium Trial</Link>
                    </div>
                </div>
            </section>

            {/* ══ TESTIMONIALS ══ */}
            <div className="lp-section-alt">
                <section className="lp-section" {...fadeRevs}>
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

            {/* ══ CTA — always dark ══ */}
            <section className="lp-cta-section" {...fadeCta}>
                <div className="lp-cta-bg" />
                <h2 className="lp-cta-h2">
                    Ready to upgrade your<br />
                    <span className="lp-hero-grad">cyber café workflow?</span>
                </h2>
                <p className="lp-cta-sub">Join 2,000+ operators. Start free in 30 seconds.</p>
                <div className="lp-cta-actions">
                    <Link to="/register" className="lp-hero-btn-primary">
                        <Zap size={17} /> Create Free Account
                    </Link>
                    <Link to="/dashboard" className="lp-hero-btn-secondary">
                        Continue as Guest
                    </Link>
                </div>
            </section>

            {/* ══ FOOTER — theme-adaptive ══ */}
            <footer className="lp-footer">
                <div className="lp-footer-left">
                    <div className="lp-nav-logo-icon" style={{ width: 30, height: 30, borderRadius: 8 }}>
                        <Shield size={14} color="#fff" />
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
