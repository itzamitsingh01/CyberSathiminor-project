import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from '../services/api'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import {
    ArrowLeft, QrCode, FileText, Clock, Wifi, WifiOff,
    Download, Pause, Play, StopCircle, Printer, Copy,
    CheckCircle2, ExternalLink, Camera, FileArchive, PenLine,
} from 'lucide-react'
import { useLanguage } from '../LanguageContext'
import useAuthStore from '../store/authStore'

/* ── Print a single image URL in a hidden iframe ── */
function printFileUrl(url, filename) {
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
    document.body.appendChild(iframe)
    iframe.contentDocument.write(`
        <html>
          <head>
            <title>${filename || 'Print'}</title>
            <style>
              @page { size: auto; margin: 8mm; }
              body { margin:0; display:flex; align-items:center; justify-content:center; min-height:100vh; background:#fff; }
              img { max-width:100%; max-height:100%; object-fit:contain; }
            </style>
          </head>
          <body><img src="${url}" onload="window.focus();window.print();" /></body>
        </html>`)
    setTimeout(() => document.body.removeChild(iframe), 15000)
}

/* ── Tool action buttons shown on each file card ── */
function FileToolActions({ file, nav }) {
    const isImg = file.mimetype?.startsWith('image/')

    function openTool(path) {
        const params = new URLSearchParams({
            fileId:   file._id || '',
            fileUrl:  file.url,
            fileName: file.originalname,
        })
        nav(`${path}?${params.toString()}`)
    }

    const toolBtns = [
        isImg && { label: 'Passport', color: '#6366f1', path: '/passport' },
        { label: 'Compress',  color: '#f59e0b', path: '/compress' },
        { label: 'PDF',       color: '#10b981', path: '/pdf' },
        isImg && { label: 'Signature', color: '#ec4899', path: '/signature' },
    ].filter(Boolean)

    return (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
            {toolBtns.map(btn => (
                <button
                    key={btn.path}
                    onClick={() => openTool(btn.path)}
                    style={{
                        padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                        background: btn.color + '18', border: `1px solid ${btn.color}44`,
                        color: btn.color, cursor: 'pointer', transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = btn.color + '33'}
                    onMouseLeave={e => e.currentTarget.style.background = btn.color + '18'}
                >
                    {btn.label}
                </button>
            ))}
        </div>
    )
}

/* ── Copy text to clipboard ── */
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => toast.success('Link copied!')).catch(() => toast.error('Copy failed'))
}

export default function QrSession() {
    const nav = useNavigate()
    const [searchParams] = useSearchParams()
    const { t } = useLanguage()
    const { accessToken } = useAuthStore()

    // Read toolType from URL query (?tool=passport) — default 'passport'
    const defaultTool = searchParams.get('tool') || 'passport'

    const [session,   setSession]   = useState(null)
    const [loading,   setLoading]   = useState(false)
    const [files,     setFiles]     = useState([])
    const [timeLeft,  setTimeLeft]  = useState(600)
    const [connected, setConnected] = useState(false)
    const [isPaused,  setIsPaused]  = useState(false)
    const [hoveredFile, setHoveredFile] = useState(null)

    const socketRef   = useRef(null)
    const timerRef    = useRef(null)
    const isPausedRef = useRef(false)

    useEffect(() => { isPausedRef.current = isPaused }, [isPaused])

    // ── Countdown ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!session) return
        timerRef.current = setInterval(() => {
            if (isPausedRef.current) return
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timerRef.current); handleEnd(); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timerRef.current)
    }, [session])

    function connectSocket(sessionId) {
        const socketUrl = import.meta.env.MODE === 'production'
            ? 'https://cybersathi-0wqe.onrender.com'
            : window.location.origin.includes('5173') ? 'http://localhost:5000' : window.location.origin

        const socket = io(socketUrl)
        socket.on('connect', () => {
            setConnected(true)
            // Pass access token so server can verify ownership (M-4 fix)
            socket.emit('join-session', { sessionId, token: accessToken })
            axios.get(`/session/${sessionId}`).catch(() => {
                toast.error('Session expired or lost. Please generate a new QR.')
                handleEnd()
            })
        })
        socket.on('session-error', (data) => {
            toast.error(data?.message || 'Session error')
        })
        socket.on('disconnect', () => setConnected(false))
        socket.on('file-uploaded', (data) => {
            setFiles(prev => [data.file, ...prev])
            toast.success(`📁 ${data.file.originalname} received!`)
        })
        socketRef.current = socket
    }

    async function handleCreate() {
        setLoading(true)
        try {
            const frontendUrl = window.location.origin
            const res = await axios.post('/session/create', { toolType: defaultTool, frontendUrl })
            const s = res.data.session
            setSession(s)
            setFiles([])
            setTimeLeft(600)
            setIsPaused(false)
            connectSocket(s.sessionId)
            toast.success('QR session ready! Share it with your customer.')
        } catch { toast.error('Failed to create session') }
        finally { setLoading(false) }
    }

    function handleEnd() {
        socketRef.current?.disconnect()
        clearInterval(timerRef.current)
        setSession(null)
        setFiles([])
        setConnected(false)
        setIsPaused(false)
    }

    const mm   = String(Math.floor(timeLeft / 60)).padStart(2, '0')
    const ss   = String(timeLeft % 60).padStart(2, '0')
    const danger = timeLeft < 60
    const timerColor = isPaused ? '#f59e0b' : danger ? '#ef4444' : '#10b981'

    return (
        <div className="page" style={{ maxWidth: 640, margin: '0 auto' }}>

            {/* Header */}
            <div className="back-header">
                <button className="back-btn" onClick={() => { handleEnd(); nav('/dashboard') }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <div className="page-title">QR Upload Session</div>
                    <div className="page-sub">
                        {session ? 'Session active — waiting for uploads' : 'Generate a QR code for customers to upload files'}
                    </div>
                </div>
            </div>

            {!session ? (
                /* ── Create session — NO tool selection step ──────────────── */
                <div style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 20, padding: 32, textAlign: 'center',
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: 24,
                        background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))',
                        border: '2px solid rgba(99,102,241,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}>
                        <QrCode size={38} color="#6366f1" />
                    </div>

                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
                        Ready to receive files
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 28px' }}>
                        Click generate to create a QR code. Your customer scans it and uploads a file instantly — no app needed.
                    </div>

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                        {['📸 Passport', '📄 PDF', '📦 Images', '✍️ Signature'].map(tag => (
                            <span key={tag} style={{
                                padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                                background: 'var(--input-bg)', color: 'var(--muted)',
                                border: '1px solid var(--border)',
                            }}>{tag}</span>
                        ))}
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleCreate}
                        disabled={loading}
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', maxWidth: 300, margin: '0 auto' }}
                    >
                        {loading
                            ? <><span className="spin">◌</span> Creating…</>
                            : <><QrCode size={18} /> Generate QR Code</>
                        }
                    </button>
                </div>
            ) : (
                /* ── Active session ──────────────────────────────────────── */
                <>
                    {/* ── Status bar ── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderRadius: 14, marginBottom: 18,
                        background: isPaused ? 'rgba(245,158,11,0.08)' : danger ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                        border: `1px solid ${isPaused ? 'rgba(245,158,11,0.25)' : danger ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {connected
                                ? <Wifi size={15} color="#10b981" />
                                : <WifiOff size={15} color="#ef4444" />}
                            <span style={{ fontSize: 13, fontWeight: 700, color: connected ? '#10b981' : '#ef4444' }}>
                                {connected ? 'Live' : 'Reconnecting…'}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                                · {files.length} file{files.length !== 1 ? 's' : ''} received
                            </span>
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            color: timerColor, fontFamily: 'monospace',
                            fontWeight: 800, fontSize: 18,
                        }}>
                            <Clock size={14} />
                            {mm}:{ss}
                            {isPaused && <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 4 }}>(paused)</span>}
                        </div>
                    </div>

                    {/* ── QR Code display ── */}
                    <div style={{
                        background: 'var(--card)', border: '1px solid var(--border)',
                        borderRadius: 20, padding: 24, marginBottom: 16, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 14 }}>
                            Show this QR to your customer
                        </div>
                        <div style={{
                            display: 'inline-block', padding: 16,
                            background: '#fff', borderRadius: 18,
                            border: '3px solid rgba(99,102,241,0.15)',
                            boxShadow: '0 12px 48px rgba(0,0,0,0.1)',
                        }}>
                            <img src={session.qrDataUrl} alt="QR Code" style={{ width: 220, height: 220, display: 'block' }} />
                        </div>

                        <div style={{
                            marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                            <span style={{
                                fontSize: 11, color: 'var(--muted)',
                                maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{session.uploadUrl}</span>
                            <button
                                onClick={() => copyText(session.uploadUrl)}
                                style={{
                                    padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                    color: '#6366f1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                    flexShrink: 0,
                                }}
                            >
                                <Copy size={12} /> Copy
                            </button>
                        </div>
                    </div>

                    {/* ── Controls ── */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                        <button
                            className="btn-secondary"
                            style={{
                                flex: 1, padding: '11px',
                                color: isPaused ? '#10b981' : '#f59e0b',
                                borderColor: isPaused ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
                            }}
                            onClick={() => setIsPaused(v => !v)}
                        >
                            {isPaused ? <><Play size={16} /> Resume</> : <><Pause size={16} /> Pause Timer</>}
                        </button>
                        <button className="btn-danger" style={{ flex: 1, padding: '11px' }} onClick={handleEnd}>
                            <StopCircle size={16} /> End Session
                        </button>
                    </div>

                    <div className="divider" />

                    {/* ── Received files list ── */}
                    <div style={{ marginBottom: 8 }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: 12,
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                                Received Files
                            </div>
                            {files.length > 0 && (
                                <span style={{
                                    padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                                    background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                }}>
                                    <CheckCircle2 size={11} style={{ display: 'inline', marginRight: 4 }} />
                                    {files.length} file{files.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {files.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '44px 20px',
                                color: 'var(--muted)', fontSize: 14, borderRadius: 16,
                                background: 'var(--input-bg)', border: '1.5px dashed var(--border)',
                            }}>
                                <QrCode size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
                                <div>Waiting for customer uploads…</div>
                                <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>Files will appear here in real-time</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {files.map((f, i) => {
                                    const isImg = f.mimetype?.startsWith('image/')
                                    const isHovered = hoveredFile === i
                                    return (
                                        <div
                                            key={i}
                                            className="file-item"
                                            style={{
                                                position: 'relative',
                                                cursor: 'default',
                                                transition: 'all 0.2s',
                                                borderColor: isHovered ? 'rgba(99,102,241,0.35)' : undefined,
                                                background: isHovered ? 'rgba(99,102,241,0.04)' : undefined,
                                            }}
                                            onMouseEnter={() => setHoveredFile(i)}
                                            onMouseLeave={() => setHoveredFile(null)}
                                        >
                                            {/* Thumbnail */}
                                            {isImg
                                                ? <img src={f.url} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                                                : <div style={{
                                                    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                                                    background: 'rgba(99,102,241,0.1)', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <FileText size={20} color="var(--primary)" />
                                                </div>
                                            }

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: 13, fontWeight: 600, color: 'var(--text)',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                }}>
                                                    {f.originalname}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                                    {Math.round(f.size / 1024)} KB · {new Date(f.uploadedAt).toLocaleTimeString()}
                                                </div>

                                                {/* ── Tool action buttons ── */}
                                                <FileToolActions file={f} nav={nav} />
                                            </div>

                                            {/* ── Utility buttons (Download, Print, Open) ── */}
                                            <div style={{
                                                display: 'flex', gap: 5, flexShrink: 0,
                                                flexDirection: 'column',
                                                opacity: isHovered ? 1 : 0.4,
                                                transition: 'opacity 0.18s',
                                            }}>
                                                {/* Download */}
                                                <a
                                                    href={f.url}
                                                    download={f.originalname}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Download"
                                                    style={{
                                                        width: 30, height: 30, borderRadius: 9,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                                                        border: '1px solid rgba(99,102,241,0.2)',
                                                        textDecoration: 'none', transition: 'all 0.15s',
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <Download size={13} />
                                                </a>

                                                {/* Print */}
                                                {isImg && (
                                                    <button
                                                        title="Print"
                                                        onClick={() => printFileUrl(f.url, f.originalname)}
                                                        style={{
                                                            width: 30, height: 30, borderRadius: 9,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                                            border: '1px solid rgba(16,185,129,0.2)',
                                                            cursor: 'pointer', transition: 'all 0.15s',
                                                        }}
                                                    >
                                                        <Printer size={13} />
                                                    </button>
                                                )}

                                                {/* Open */}
                                                <a
                                                    href={f.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Open in new tab"
                                                    style={{
                                                        width: 30, height: 30, borderRadius: 9,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: 'var(--input-bg)', color: 'var(--muted)',
                                                        border: '1px solid var(--border)',
                                                        textDecoration: 'none', transition: 'all 0.15s',
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
