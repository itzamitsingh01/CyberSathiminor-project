import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import { ArrowLeft, QrCode, FileText, Clock, Wifi, WifiOff, Download, Pause, Play, StopCircle } from 'lucide-react'
import { useLanguage } from '../LanguageContext'

export default function QrSession() {
    const nav = useNavigate()
    const { t } = useLanguage()
    const [toolType, setToolType] = useState('passport')
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState([])
    const [timeLeft, setTimeLeft] = useState(600)
    const [connected, setConnected] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    
    const socketRef = useRef(null)
    const timerRef = useRef(null)
    const isPausedRef = useRef(false)

    useEffect(() => {
        isPausedRef.current = isPaused
    }, [isPaused])

    const TOOL_TYPES = [
        { id: 'passport', label: `📸 ${t.tool_passport}`, color: '#4f46e5' },
        { id: 'compress', label: `📦 ${t.tool_compress}`, color: '#f59e0b' },
        { id: 'pdf', label: `📄 ${t.tool_pdf}`, color: '#10b981' },
        { id: 'signature', label: `✍️ ${t.tool_signature}`, color: '#ec4899' },
    ]

    // Countdown
    useEffect(() => {
        if (!session) return
        timerRef.current = setInterval(() => {
            if (isPausedRef.current) return; // Skip decrement if paused
            
            setTimeLeft((t) => {
                if (t <= 1) { clearInterval(timerRef.current); handleEnd(); return 0 }
                return t - 1
            })
        }, 1000)
        return () => clearInterval(timerRef.current)
    }, [session])

    function connectSocket(sessionId) {
        // Use production URL if not localhost
        const socketUrl = import.meta.env.MODE === 'production' 
            ? 'https://cybersathi-0wqe.onrender.com' 
            : window.location.origin.includes('5173') ? 'http://localhost:5000' : window.location.origin;

        const socket = io(socketUrl)
        socket.on('connect', () => { 
            setConnected(true); 
            socket.emit('join-session', sessionId) 
            // If backend restarted, session might be gone from memory
            axios.get(`/session/${sessionId}`).catch(() => {
                toast.error('Session expired or lost. Please generate a new QR.')
                handleEnd()
            })
        })
        socket.on('disconnect', () => setConnected(false))
        socket.on('file-uploaded', (data) => {
            setFiles((prev) => [data.file, ...prev])
            toast.success(`📁 ${data.file.originalname} received!`)
        })
        socketRef.current = socket
    }

    async function handleCreate() {
        setLoading(true)
        try {
            const frontendUrl = window.location.origin;
            const res = await axios.post('/session/create', { toolType, frontendUrl })
            const s = res.data.session
            setSession(s)
            setFiles([])
            setTimeLeft(600)
            setIsPaused(false)
            connectSocket(s.sessionId)
            toast.success('Session created! Share the QR code.')
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

    const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
    const ss = String(timeLeft % 60).padStart(2, '0')
    const danger = timeLeft < 60

    return (
        <div className="page">
            <div className="back-header">
                <button className="back-btn" onClick={() => { handleEnd(); nav('/') }}><ArrowLeft size={18} /></button>
                <div>
                    <div className="page-title">{t.qr_title}</div>
                    <div className="page-sub">{t.qr_sub}</div>
                </div>
            </div>

            {!session ? (
                /* ── Session creation ─────────────────────────── */
                <>
                    <span className="section-label" style={{ display: 'block', marginBottom: 12 }}>
                        Select the service type
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                        {TOOL_TYPES.map((tool) => (
                            <button key={tool.id} onClick={() => setToolType(tool.id)}
                                style={{
                                    padding: '16px 12px', borderRadius: 14, border: '1.5px solid',
                                    borderColor: toolType === tool.id ? tool.color : 'var(--border)',
                                    background: toolType === tool.id ? `${tool.color}15` : 'rgba(0,0,0,0.02)',
                                    color: toolType === tool.id ? tool.color : 'var(--muted)',
                                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                                    transition: 'all 0.18s', fontFamily: 'inherit',
                                }}>
                                {tool.label}
                            </button>
                        ))}
                    </div>

                    <button className="btn-primary" onClick={handleCreate} disabled={loading}
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                        {loading ? <><span className="spin">◌</span> Creating…</> : <><QrCode size={18} /> {t.qr_generate}</>}
                    </button>
                </>
            ) : (
                /* ── Active session ───────────────────────────── */
                <>
                    {/* Status bar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 12, marginBottom: 20,
                        background: isPaused ? 'rgba(245,158,11,0.08)' : (danger ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)'),
                        border: `1px solid ${isPaused ? 'rgba(245,158,11,0.25)' : (danger ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)')}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {connected
                                ? <Wifi size={15} color="#10b981" />
                                : <WifiOff size={15} color="#ef4444" />}
                            <span style={{ fontSize: 13, fontWeight: 600, color: connected ? '#10b981' : '#ef4444' }}>
                                {connected ? 'Live' : 'Connecting…'}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>· {files.length} file{files.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isPaused ? '#f59e0b' : (danger ? '#ef4444' : 'var(--muted)'), fontFamily: 'monospace', fontWeight: 700, fontSize: 15 }}>
                            <Clock size={14} />{mm}:{ss} {isPaused && '(Paused)'}
                        </div>
                    </div>

                    {/* QR */}
                    <div style={{ textAlign: 'center', marginBottom: 22 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 12 }}>
                            {t.qr_show}
                        </div>
                        <div style={{ display: 'inline-block', padding: 14, background: '#fff', borderRadius: 18, border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                            <img src={session.qrDataUrl} alt="QR" style={{ width: 200, height: 200, display: 'block' }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, wordBreak: 'break-all' }}>
                            {session.uploadUrl}
                        </div>
                    </div>

                    <div className="divider" />

                    {/* Controls */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                        <button 
                            className="btn-secondary" 
                            style={{ flex: 1, padding: '10px', color: isPaused ? '#10b981' : '#f59e0b', borderColor: isPaused ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)' }}
                            onClick={() => setIsPaused(!isPaused)}>
                            {isPaused ? <><Play size={16}/> {t.qr_resume}</> : <><Pause size={16}/> {t.qr_pause}</>}
                        </button>
                        <button 
                            className="btn-danger" 
                            style={{ flex: 1, padding: '10px' }}
                            onClick={handleEnd}>
                            <StopCircle size={16} /> {t.qr_stop}
                        </button>
                    </div>

                    {/* Files */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 10 }}>
                            Received Files <span style={{ color: 'var(--muted)' }}>({files.length})</span>
                        </div>
                        {files.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '32px 20px',
                                color: 'var(--muted)', fontSize: 14, borderRadius: 14,
                                background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--border)',
                            }}>
                                Waiting for uploads…
                            </div>
                        ) : (
                            files.map((f, i) => {
                                const isImg = f.mimetype?.startsWith('image/')
                                return (
                                    <div key={i} className="file-item">
                                        {isImg
                                            ? <img src={f.url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                                            : <FileText size={22} color="var(--primary)" />
                                        }
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {f.originalname}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                                                {Math.round(f.size / 1024)}KB · {new Date(f.uploadedAt).toLocaleTimeString()}
                                            </div>
                                        </div>
                                        <a href={f.url} download={f.originalname} target="_blank" rel="noreferrer"
                                            style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                                            <Download size={15} />
                                        </a>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
