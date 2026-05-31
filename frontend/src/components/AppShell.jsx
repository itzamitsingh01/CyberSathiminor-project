/**
 * AppShell.jsx — Premium SaaS dashboard layout
 * 
 * Acts as a LAYOUT ROUTE (no path). All child pages render via <Outlet />.
 * No nested <Routes> here — that was the source of the routing bug.
 * 
 * Features:
 *  - Persistent sidebar (desktop) with active link states
 *  - Mobile drawer with backdrop
 *  - Top header bar with theme toggle, language picker, user avatar
 *  - Collapsible sidebar on desktop
 */
import { useState } from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Camera, FileArchive, FileText, PenLine, QrCode,
    HelpCircle, Info, CreditCard, Menu, X, Sun, Moon,
    LogOut, LogIn, Shield, Sparkles, ChevronLeft, ChevronRight,
    Bell, Search
} from 'lucide-react'
import { useAuth }     from '../hooks/useAuth'
import { useLanguage } from '../LanguageContext'
import { useTheme }    from '../ThemeContext'
import { authService } from '../services/auth.service'

// ─── Navigation config ────────────────────────────────────────
const NAV_SECTIONS = [
    {
        label: 'WORKSPACE',
        items: [
            { path: '/dashboard', label: 'Dashboard',         icon: LayoutDashboard },
        ]
    },
    {
        label: 'TOOLS',
        items: [
            { path: '/passport',  label: 'Passport Photo',    icon: Camera,      badge: 'HOT' },
            { path: '/compress',  label: 'File Compressor',   icon: FileArchive               },
            { path: '/pdf',       label: 'PDF Tools',         icon: FileText,    badge: '3-IN-1' },
            { path: '/signature', label: 'Signature Creator', icon: PenLine                   },
            { path: '/qr-session',label: 'QR Upload Session', icon: QrCode,      badge: 'LIVE' },
        ]
    },
    {
        label: 'ACCOUNT',
        items: [
            { path: '/pricing',   label: 'Subscription',      icon: CreditCard               },
            { path: '/about',     label: 'About',             icon: Info                     },
            { path: '/help',      label: 'Help & Support',    icon: HelpCircle               },
        ]
    }
]

const BADGE_COLORS = {
    HOT:    { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
    'LIVE': { bg: 'rgba(16,185,129,0.15)',  text: '#34d399' },
    '3-IN-1': { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
}

export default function AppShell() {
    const location  = useLocation()
    const navigate  = useNavigate()
    const { user, isLoggedIn, isPremium, clearAuth } = useAuth()
    const { lang, setLang, t } = useLanguage()
    const { theme, toggleTheme } = useTheme()

    const [mobileOpen,   setMobileOpen]   = useState(false)
    const [sidebarOpen,  setSidebarOpen]  = useState(true)   // desktop collapse

    const handleLogout = async () => {
        try { await authService.logout() } catch {}
        clearAuth()
        navigate('/')
    }

    const isActive = (path) => location.pathname === path

    // ── Sidebar inner content ──────────────────────────────────
    const SidebarInner = ({ collapsed = false }) => (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--sidebar-border)',
            transition: 'width 0.25s ease',
            overflow: 'hidden',
        }}>
            {/* Logo */}
            <div style={{
                padding: collapsed ? '20px 14px' : '20px 20px',
                display: 'flex', alignItems: 'center', gap: '12px',
                borderBottom: '1px solid var(--sidebar-border)',
                minHeight: '64px',
                justifyContent: collapsed ? 'center' : 'flex-start',
            }}>
                <div style={{
                    width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(79,70,229,0.35)'
                }}>
                    <Shield size={16} color="white" />
                </div>
                {!collapsed && (
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--sidebar-text)', letterSpacing: '-0.3px' }}>
                            CyberSathi
                        </div>
                        <div style={{ fontSize: '9px', color: '#818cf8', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                            Café Partner
                        </div>
                    </div>
                )}
            </div>

            {/* Plan Pill */}
            {!collapsed && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--sidebar-border)' }}>
                    <div style={{
                        background: isPremium ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                        border: `1px solid ${isPremium ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.2)'}`,
                        borderRadius: '10px', padding: '10px 12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div>
                            <div style={{ fontSize: '10px', color: 'var(--sidebar-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                Plan
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {isPremium ? (
                                    <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Sparkles size={11} fill="#fbbf24" /> Premium
                                    </span>
                                ) : isLoggedIn ? (
                                    <span style={{ color: '#a5b4fc' }}>Free Tier</span>
                                ) : (
                                    <span style={{ color: 'var(--sidebar-muted)' }}>Guest Mode</span>
                                )}
                            </div>
                        </div>
                        <Link
                            to="/pricing"
                            style={{
                                fontSize: '11px', fontWeight: 700, color: '#fff',
                                background: isPremium ? 'rgba(245,158,11,0.3)' : '#4f46e5',
                                padding: '5px 12px', borderRadius: '7px',
                                textDecoration: 'none', transition: 'opacity 0.15s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {isPremium ? 'Manage' : 'Upgrade ✨'}
                        </Link>
                    </div>
                </div>
            )}

            {/* Navigation sections */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '12px 8px' : '12px 10px' }}>
                {NAV_SECTIONS.map(section => (
                    <div key={section.label} style={{ marginBottom: '4px' }}>
                        {!collapsed && (
                            <div style={{
                                fontSize: '10px', fontWeight: 700, color: 'var(--sidebar-muted)',
                                letterSpacing: '1.2px', padding: '10px 10px 6px',
                                textTransform: 'uppercase'
                            }}>
                                {section.label}
                            </div>
                        )}
                        {section.items.map(item => {
                            const active = isActive(item.path)
                            const Icon   = item.icon
                            const bc     = item.badge ? BADGE_COLORS[item.badge] : null
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileOpen(false)}
                                    title={collapsed ? item.label : undefined}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: collapsed ? 'center' : 'space-between',
                                        gap: '10px',
                                        padding: collapsed ? '10px' : '9px 10px',
                                        borderRadius: '10px', marginBottom: '2px',
                                        textDecoration: 'none',
                                        transition: 'all 0.15s ease',
                                        background: active
                                            ? 'linear-gradient(135deg, rgba(79,70,229,0.85), rgba(99,102,241,0.75))'
                                            : 'transparent',
                                        boxShadow: active ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
                                    }}
                                    onMouseEnter={e => {
                                        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                                    }}
                                    onMouseLeave={e => {
                                        if (!active) e.currentTarget.style.background = 'transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Icon
                                            size={17}
                                            color={active ? '#fff' : 'var(--sidebar-muted)'}
                                            style={{ flexShrink: 0 }}
                                        />
                                        {!collapsed && (
                                            <span style={{
                                                fontSize: '13.5px', fontWeight: active ? 700 : 500,
                                                color: active ? '#fff' : 'var(--sidebar-muted)',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {item.label}
                                            </span>
                                        )}
                                    </div>
                                    {!collapsed && bc && (
                                        <span style={{
                                            fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px',
                                            padding: '2px 7px', borderRadius: '5px',
                                            background: bc.bg, color: bc.text,
                                            flexShrink: 0
                                        }}>
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                ))}
            </nav>

            {/* Bottom: User & Logout */}
            <div style={{
                padding: collapsed ? '12px 8px' : '12px 10px',
                borderTop: '1px solid var(--sidebar-border)'
            }}>
                {isLoggedIn ? (
                    <div>
                        {!collapsed && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 10px', marginBottom: '6px'
                            }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 800, fontSize: '13px'
                                }}>
                                    {(user?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--sidebar-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user?.name || 'User'}
                                    </div>
                                    <div style={{ fontSize: '10.5px', color: 'var(--sidebar-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user?.email || ''}
                                    </div>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                gap: '8px', padding: collapsed ? '10px' : '8px 10px',
                                borderRadius: '10px', border: 'none', cursor: 'pointer',
                                background: 'rgba(239,68,68,0.08)',
                                color: '#f87171', fontSize: '13px', fontWeight: 600,
                                fontFamily: 'inherit', transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        >
                            <LogOut size={15} />
                            {!collapsed && 'Sign Out'}
                        </button>
                    </div>
                ) : (
                    <Link
                        to="/login"
                        style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: '8px', padding: collapsed ? '10px' : '9px 12px',
                            borderRadius: '10px', textDecoration: 'none',
                            background: '#4f46e5', color: '#fff',
                            fontSize: '13px', fontWeight: 700,
                            transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                        onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
                    >
                        <LogIn size={15} />
                        {!collapsed && 'Sign In'}
                    </Link>
                )}
            </div>
        </div>
    )

    // ── Page title from location ──────────────────────────────
    const pageTitle = (() => {
        const all = NAV_SECTIONS.flatMap(s => s.items)
        const found = all.find(i => i.path === location.pathname)
        return found ? found.label : 'CyberSathi'
    })()

    // ── Render ────────────────────────────────────────────────
    return (
        <div style={{
            display: 'flex', minHeight: '100vh',
            background: 'var(--bg)', color: 'var(--text)',
            transition: 'background 0.2s, color 0.2s'
        }}>
            {/* ── DESKTOP SIDEBAR ── */}
            <aside style={{
                display: 'none',
                width: sidebarOpen ? '240px' : '64px',
                height: '100vh', position: 'sticky', top: 0,
                flexShrink: 0, transition: 'width 0.25s ease',
                zIndex: 50,
            }} className="md-flex">
                <SidebarInner collapsed={!sidebarOpen} />
            </aside>

            {/* ── MOBILE DRAWER OVERLAY ── */}
            {mobileOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 999,
                        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setMobileOpen(false)}
                >
                    <div
                        style={{ width: '240px', height: '100%' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <SidebarInner collapsed={false} />
                    </div>
                </div>
            )}

            {/* ── MAIN CONTENT AREA ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

                {/* ── TOP HEADER ── */}
                <header style={{
                    height: '60px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '0 20px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--card)', position: 'sticky', top: 0, zIndex: 90,
                    transition: 'background 0.2s, border-color 0.2s',
                }}>
                    {/* Left: hamburger + collapse + title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            style={{
                                padding: '7px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: 'transparent', color: 'var(--muted)',
                                display: 'flex', alignItems: 'center'
                            }}
                            className="md-hidden"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Desktop sidebar collapse toggle */}
                        <button
                            onClick={() => setSidebarOpen(v => !v)}
                            style={{
                                padding: '7px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: 'transparent', color: 'var(--muted)',
                                display: 'flex', alignItems: 'center', transition: 'background 0.15s'
                            }}
                            className="md-flex hidden"
                            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                        </button>

                        <span style={{
                            fontSize: '16px', fontWeight: 800, color: 'var(--text)',
                            letterSpacing: '-0.3px', whiteSpace: 'nowrap'
                        }}>
                            {pageTitle}
                        </span>
                    </div>

                    {/* Right: controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Language toggle */}
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            background: 'var(--input-bg)', borderRadius: '8px',
                            border: '1px solid var(--border)', padding: '3px', gap: '2px'
                        }}>
                            {['en', 'hi'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    style={{
                                        padding: '4px 10px', borderRadius: '6px', border: 'none',
                                        cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                                        fontFamily: 'inherit', transition: 'all 0.15s',
                                        background: lang === l ? 'var(--card)' : 'transparent',
                                        color: lang === l ? 'var(--text)' : 'var(--muted)',
                                        boxShadow: lang === l ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    {l === 'en' ? 'EN' : 'हि'}
                                </button>
                            ))}
                        </div>

                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            style={{
                                padding: '7px', borderRadius: '8px', cursor: 'pointer',
                                border: '1px solid var(--border)', background: 'var(--card)',
                                color: 'var(--text)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', transition: 'all 0.15s'
                            }}
                            aria-label="Toggle Theme"
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--card)'}
                        >
                            {theme === 'dark'
                                ? <Sun size={16} color="#fbbf24" />
                                : <Moon size={16} color="#6366f1" />
                            }
                        </button>

                        {/* User badge */}
                        {isLoggedIn ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 800, fontSize: '13px',
                                    boxShadow: '0 2px 8px rgba(79,70,229,0.3)'
                                }}>
                                    {(user?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span style={{
                                    fontSize: '13px', fontWeight: 700, color: 'var(--text)',
                                    display: 'none'  // hidden on smallest screens
                                }} className="lg-inline">
                                    {user?.name?.split(' ')[0]}
                                </span>
                            </div>
                        ) : (
                            <Link
                                to="/register"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    padding: '6px 14px', borderRadius: '8px', textDecoration: 'none',
                                    background: '#4f46e5', color: '#fff',
                                    fontSize: '12px', fontWeight: 700,
                                    boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                                    transition: 'background 0.15s', whiteSpace: 'nowrap'
                                }}
                            >
                                <Sparkles size={12} fill="white" /> Join Free
                            </Link>
                        )}
                    </div>
                </header>

                {/* ── PAGE CONTENT (rendered via Outlet) ── */}
                <main style={{
                    flex: 1, overflowY: 'auto',
                    background: 'var(--bg)',
                    transition: 'background 0.2s'
                }}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
