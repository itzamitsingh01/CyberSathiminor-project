import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, PenLine, Download, RefreshCw, Upload } from 'lucide-react'
import { useGuestLimit } from '../hooks/useGuestLimit'

/** Fetch a URL via backend proxy and trigger a real browser download */
async function downloadFile(proxyUrl, filename) {
    try {
        const res = await fetch(proxyUrl)
        if (!res.ok) throw new Error(`Server responded ${res.status}`)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 1000)
    } catch (e) {
        toast.error('Download failed: ' + e.message)
    }
}

const TABS = [
    { id: 'upload', label: '📁 Upload' },
    { id: 'draw', label: '✏️ Draw' },
]

export default function SignatureTool() {
    const nav = useNavigate()
    const { checkAndConsume, GuestModal } = useGuestLimit('signature')
    const [tab, setTab] = useState('upload')
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [threshold, setThreshold] = useState(200)
    const [loading, setLoading] = useState(false)
    const [resultUrl, setResultUrl] = useState(null)

    // Canvas drawing
    const canvasRef = useRef(null)
    const drawingRef = useRef(false)
    const lastPos = useRef(null)

    const onDrop = useCallback((accepted) => {
        if (!accepted[0]) return
        setFile(accepted[0])
        setPreview(URL.createObjectURL(accepted[0]))
        setResultUrl(null)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'image/*': [] }, maxFiles: 1,
    })

    // Canvas helpers
    function getPos(e, canvas) {
        const rect = canvas.getBoundingClientRect()
        const src = e.touches ? e.touches[0] : e
        return { x: src.clientX - rect.left, y: src.clientY - rect.top }
    }

    function startDraw(e) {
        drawingRef.current = true
        lastPos.current = getPos(e, canvasRef.current)
    }

    function draw(e) {
        if (!drawingRef.current) return
        e.preventDefault()
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const pos = getPos(e, canvas)
        ctx.beginPath()
        ctx.moveTo(lastPos.current.x, lastPos.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.strokeStyle = '#1a1035'
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.stroke()
        lastPos.current = pos
    }

    function stopDraw() { drawingRef.current = false }

    function clearCanvas() {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    useEffect(() => {
        if (tab === 'draw' && canvasRef.current) clearCanvas()
    }, [tab])

    async function handleProcess() {
        if (!checkAndConsume()) return
        setLoading(true)
        try {
            const fd = new FormData()
            fd.append('threshold', String(threshold))

            if (tab === 'draw') {
                const canvas = canvasRef.current
                const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
                fd.append('image', blob, 'signature.png')
            } else {
                if (!file) { toast.error('Upload a signature image first'); setLoading(false); return }
                fd.append('image', file)
            }

            const res = await axios.post('/signature/generate', fd)
            setResultUrl(res.data.url)
            toast.success('Background removed!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Processing failed')
        } finally { setLoading(false) }
    }

    return (
        <div className="page">
            <div className="back-header">
                <button className="back-btn" onClick={() => nav('/')}><ArrowLeft size={18} /></button>
                <div>
                    <div className="page-title">Signature Tool</div>
                    <div className="page-sub">Remove background → Transparent PNG</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tab-row">
                {TABS.map((t) => (
                    <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                        onClick={() => { setTab(t.id); setResultUrl(null) }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Upload mode */}
            {tab === 'upload' && (
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: 16 }}>
                    <input {...getInputProps()} />
                    {preview ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <img src={preview} alt="sig"
                                style={{ maxHeight: 110, borderRadius: 8, background: '#fff', padding: 10 }} />
                            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Tap to change</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <Upload size={40} color="#ec4899" style={{ opacity: 0.8 }} />
                            <span style={{ color: '#94a3b8', fontSize: 15 }}>
                                {isDragActive ? 'Drop signature here' : 'Upload signature image'}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Draw mode */}
            {tab === 'draw' && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <canvas
                            ref={canvasRef}
                            width={480}
                            height={180}
                            style={{ width: '100%', height: 180, background: '#fff', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                            onMouseDown={startDraw}
                            onMouseMove={draw}
                            onMouseUp={stopDraw}
                            onMouseLeave={stopDraw}
                            onTouchStart={startDraw}
                            onTouchMove={draw}
                            onTouchEnd={stopDraw}
                        />
                    </div>
                    <button className="btn-secondary" style={{ marginTop: 10 }} onClick={clearCanvas}>
                        <RefreshCw size={15} /> Clear Canvas
                    </button>
                    {/* Direct canvas download — no server needed */}
                    <button className="btn-secondary" style={{ marginTop: 10, marginLeft: 8 }}
                        onClick={() => {
                            const canvas = canvasRef.current
                            const a = document.createElement('a')
                            a.href = canvas.toDataURL('image/png')
                            a.download = 'signature-drawn.png'
                            a.click()
                        }}>
                        <Download size={15} /> Save Drawing
                    </button>
                </div>
            )}

            {/* Threshold slider */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="section-label" style={{ marginBottom: 0 }}>Background sensitivity</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ec4899' }}>{threshold}</span>
                </div>
                <input type="range" min="100" max="255" value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    style={{ accentColor: '#ec4899' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    <span>Keep more ink</span><span>Remove more BG</span>
                </div>
            </div>

            <button className="btn-primary" onClick={handleProcess} disabled={loading}
                style={{ background: 'linear-gradient(135deg,#ec4899,#f43f5e)' }}>
                {loading ? <><span className="spin">◌</span> Processing…</> : <><PenLine size={18} /> Remove Background</>}
            </button>

            {/* Result */}
            {resultUrl && (
                <div style={{ marginTop: 20, animation: 'fadeSlide 0.4s ease both' }}>
                    <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, marginBottom: 10 }}>✅ Background removed</div>
                    {/* Checkerboard to show transparency */}
                    <div style={{
                        background: 'repeating-conic-gradient(#f3f4f6 0% 25%, #e5e7eb 0% 50%) 0 0 / 24px 24px',
                        borderRadius: 14, padding: 16, marginBottom: 14, border: '1px solid var(--border)',
                    }}>
                        <img src={resultUrl} alt="transparent PNG"
                            style={{ maxWidth: '100%', display: 'block', margin: '0 auto', maxHeight: 160 }} />
                    </div>
                    <button
                        className="btn-secondary"
                        style={{ textDecoration: 'none' }}
                        onClick={() => downloadFile(
                            `/signature/download?url=${encodeURIComponent(resultUrl)}&name=signature.png`,
                            'signature.png'
                        )}
                    >
                        <Download size={16} /> Download Transparent PNG
                    </button>
                </div>
            )}
            <GuestModal />
        </div>
    )
}
