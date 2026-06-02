import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios from '../services/api'
import toast from 'react-hot-toast'
import {
    ArrowLeft, PenLine, Download, RefreshCw, Upload,
    Undo2, Sliders, Eye, EyeOff, Layers, CheckCircle2, X,
} from 'lucide-react'
import { useGuestLimit } from '../hooks/useGuestLimit'

async function downloadFile(proxyUrl, filename) {
    try {
        const res = await fetch(proxyUrl)
        if (!res.ok) throw new Error(`Server responded ${res.status}`)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = filename
        document.body.appendChild(a); a.click()
        setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 1000)
    } catch (e) { toast.error('Download failed: ' + e.message) }
}

const TABS = [
    { id: 'upload', label: '📁 Upload Image' },
    { id: 'draw',   label: '✏️ Draw Signature' },
]

const THRESHOLD_PRESETS = [
    { label: 'Light Signature', value: 220, hint: 'Very light ink / pencil' },
    { label: 'Normal',          value: 180, hint: 'Standard ballpoint pen' },
    { label: 'Dark / Bold',     value: 140, hint: 'Dark gel pen / thick ink' },
]

const PEN_SIZES = [2, 3.5, 5]

export default function SignatureTool() {
    const nav = useNavigate()
    const [searchParams] = useSearchParams()
    const { checkAndConsume, GuestModal } = useGuestLimit('signature')

    // Preloaded file from Recent Files panel
    const preloadUrl  = searchParams.get('fileUrl')  || null
    const preloadId   = searchParams.get('fileId')   || null
    const preloadName = searchParams.get('fileName') || null

    const [tab,        setTab]        = useState('upload')
    const [file,       setFile]       = useState(null)
    const [preview,    setPreview]    = useState(preloadUrl)  // show preloaded image immediately
    const [threshold,  setThreshold]  = useState(180)
    const [loading,    setLoading]    = useState(false)
    const [resultUrl,  setResultUrl]  = useState(null)
    const [showOrig,   setShowOrig]   = useState(false)
    const [penSize,    setPenSize]    = useState(3.5)
    const [penColor,   setPenColor]   = useState('#000000')

    const canvasRef  = useRef(null)
    const drawingRef = useRef(false)
    const lastPos    = useRef(null)
    const historyRef = useRef([]) // for undo: array of ImageData snapshots

    const onDrop = useCallback((accepted) => {
        if (!accepted[0]) return
        setFile(accepted[0])
        setPreview(URL.createObjectURL(accepted[0]))
        setResultUrl(null)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'image/*': [] }, maxFiles: 1,
    })

    // ── Canvas helpers ──────────────────────────────────────────────────────
    function getPos(e, canvas) {
        const rect = canvas.getBoundingClientRect()
        const src = e.touches ? e.touches[0] : e
        return {
            x: (src.clientX - rect.left) * (canvas.width / rect.width),
            y: (src.clientY - rect.top)  * (canvas.height / rect.height),
        }
    }

    function saveSnapshot() {
        const canvas = canvasRef.current
        if (!canvas) return
        historyRef.current.push(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height))
        if (historyRef.current.length > 40) historyRef.current.shift()
    }

    function startDraw(e) {
        saveSnapshot()
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
        ctx.strokeStyle = penColor
        ctx.lineWidth = penSize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
        lastPos.current = pos
    }

    function stopDraw() { drawingRef.current = false }

    function clearCanvas() {
        const canvas = canvasRef.current
        if (!canvas) return
        saveSnapshot()
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    function undoStroke() {
        if (!historyRef.current.length) return
        const canvas = canvasRef.current
        if (!canvas) return
        const snap = historyRef.current.pop()
        canvas.getContext('2d').putImageData(snap, 0, 0)
    }

    useEffect(() => {
        if (tab === 'draw' && canvasRef.current) {
            historyRef.current = []
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = '#fff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
    }, [tab])

    // ── Process ─────────────────────────────────────────────────────────────
    async function handleProcess() {
        if (!checkAndConsume()) return
        setLoading(true)
        try {
            const fd = new FormData()
            fd.append('threshold', String(threshold))

            if (tab === 'draw') {
                const canvas = canvasRef.current
                const blob = await new Promise(res => canvas.toBlob(res, 'image/png'))
                fd.append('image', blob, 'signature.png')
                const res = await axios.post('/signature/generate', fd)
                setResultUrl(res.data.url)
            } else if (preloadUrl && !file) {
                // Use preloaded Cloudinary URL — no re-upload
                const res = await axios.post('/signature/generate-from-url', {
                    url: preloadUrl, threshold,
                })
                setResultUrl(res.data.url)
                if (preloadId) {
                    axios.post(`/files/${preloadId}/history`, {
                        action: 'signature', resultUrl: res.data.url,
                    }).catch(() => {})
                }
            } else {
                if (!file) { toast.error('Upload a signature image first'); setLoading(false); return }
                fd.append('image', file)
                const res = await axios.post('/signature/generate', fd)
                setResultUrl(res.data.url)
            }
            toast.success('Background removed!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Processing failed')
        } finally { setLoading(false) }
    }

    return (
        <div className="page">
            {/* Header */}
            <div className="back-header">
                <button className="back-btn" onClick={() => nav('/dashboard')}><ArrowLeft size={18} /></button>
                <div>
                    <div className="page-title">Signature Tool</div>
                    <div className="page-sub">Remove background → Transparent PNG</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tab-row">
                {TABS.map(t => (
                    <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                        onClick={() => { setTab(t.id); setResultUrl(null) }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Preloaded file banner — only shown on upload tab */}
            {tab === 'upload' && preloadUrl && !file && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                    padding: '10px 14px', borderRadius: 12,
                    background: 'rgba(236,72,153,0.08)', border: '1.5px solid rgba(236,72,153,0.25)',
                }}>
                    <CheckCircle2 size={16} color="#ec4899" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f472b6' }}>File preloaded from Recent Uploads</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {preloadName || preloadUrl}
                        </div>
                    </div>
                    <button onClick={() => nav('/signature', { replace: true })}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── Desktop: two-panel layout ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: resultUrl ? '1fr 1fr' : '1fr',
                gap: 20,
                alignItems: 'start',
            }}>
                {/* Left: input */}
                <div>
                    {/* Upload mode */}
                    {tab === 'upload' && (
                        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: 16 }}>
                            <input {...getInputProps()} />
                            {(preview || preloadUrl) ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <img src={preview || preloadUrl} alt="sig"
                                        style={{ maxHeight: 110, borderRadius: 8, background: '#fff', padding: 10, border: '1px solid var(--border)' }} />
                                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                                        {preloadUrl && !file ? 'Using preloaded file · tap to change' : 'Tap to change'}
                                    </span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <Upload size={40} color="#ec4899" style={{ opacity: 0.8 }} />
                                    <span style={{ color: 'var(--muted)', fontSize: 15 }}>
                                        {isDragActive ? 'Drop signature here' : 'Upload signature image'}
                                    </span>
                                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>JPG, PNG – max 10MB</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Draw mode */}
                    {tab === 'draw' && (
                        <div style={{ marginBottom: 16 }}>
                            {/* Pen controls */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap',
                            }}>
                                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Pen size:</span>
                                {PEN_SIZES.map(s => (
                                    <button key={s}
                                        onClick={() => setPenSize(s)}
                                        style={{
                                            width: 32, height: 32, borderRadius: 10,
                                            border: `1.5px solid ${penSize === s ? '#ec4899' : 'var(--border)'}`,
                                            background: penSize === s ? 'rgba(236,72,153,0.1)' : 'var(--card)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ width: s * 2.5, height: s * 2.5, borderRadius: '50%', background: '#1a1035' }} />
                                    </button>
                                ))}
                                <input
                                    type="color" value={penColor}
                                    onChange={e => setPenColor(e.target.value)}
                                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }}
                                    title="Pen color"
                                />
                            </div>

                            {/* Canvas */}
                            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid var(--border)', marginBottom: 10 }}>
                                <canvas
                                    ref={canvasRef}
                                    width={560} height={200}
                                    style={{ width: '100%', height: 200, background: '#fff', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                                    onMouseDown={startDraw}
                                    onMouseMove={draw}
                                    onMouseUp={stopDraw}
                                    onMouseLeave={stopDraw}
                                    onTouchStart={startDraw}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDraw}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button className="btn-secondary" style={{ flex: 1, padding: '10px' }} onClick={undoStroke}>
                                    <Undo2 size={14} /> Undo
                                </button>
                                <button className="btn-secondary" style={{ flex: 1, padding: '10px' }} onClick={clearCanvas}>
                                    <RefreshCw size={14} /> Clear
                                </button>
                                <button className="btn-secondary" style={{ flex: 1, padding: '10px' }}
                                    onClick={() => {
                                        const canvas = canvasRef.current
                                        const a = document.createElement('a')
                                        a.href = canvas.toDataURL('image/png')
                                        a.download = 'signature-drawn.png'
                                        a.click()
                                    }}>
                                    <Download size={14} /> Save PNG
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Threshold ── */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span className="section-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Sliders size={13} /> Background sensitivity
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#ec4899' }}>{threshold}</span>
                        </div>

                        {/* Presets */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                            {THRESHOLD_PRESETS.map(p => (
                                <button key={p.label}
                                    onClick={() => setThreshold(p.value)}
                                    title={p.hint}
                                    style={{
                                        padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                        border: `1.5px solid ${threshold === p.value ? '#ec4899' : 'var(--border)'}`,
                                        background: threshold === p.value ? 'rgba(236,72,153,0.1)' : 'var(--card)',
                                        color: threshold === p.value ? '#ec4899' : 'var(--muted)',
                                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                    }}
                                >{p.label}</button>
                            ))}
                        </div>

                        <input type="range" min="100" max="255" value={threshold}
                            onChange={e => setThreshold(Number(e.target.value))}
                            style={{ accentColor: '#ec4899' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                            <span>Keep more ink</span><span>Remove more BG</span>
                        </div>
                    </div>

                    <button className="btn-primary" onClick={handleProcess} disabled={loading}
                        style={{ background: 'linear-gradient(135deg,#ec4899,#f43f5e)' }}>
                        {loading
                            ? <><span className="spin">◌</span> Processing…</>
                            : <><PenLine size={18} /> Remove Background</>
                        }
                    </button>
                </div>

                {/* Right: result / before-after */}
                {resultUrl && (
                    <div style={{ animation: 'fadeSlide 0.4s ease both' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginBottom: 12,
                        }}>
                            <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 700 }}>✅ Background removed</div>
                            {preview && (
                                <button
                                    onClick={() => setShowOrig(v => !v)}
                                    style={{
                                        padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                        border: '1px solid var(--border)', background: 'var(--card)',
                                        color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                                    }}
                                >
                                    {showOrig ? <><EyeOff size={12} /> Show Result</> : <><Eye size={12} /> Compare</>}
                                </button>
                            )}
                        </div>

                        {/* Before/after display */}
                        <div style={{
                            background: showOrig ? 'var(--input-bg)' : 'repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 0 0 / 20px 20px',
                            borderRadius: 14, padding: 14, marginBottom: 14,
                            border: '1px solid var(--border)',
                            transition: 'background 0.3s',
                        }}>
                            <img
                                src={showOrig ? preview : resultUrl}
                                alt={showOrig ? 'Original' : 'Transparent PNG'}
                                style={{ maxWidth: '100%', display: 'block', margin: '0 auto', maxHeight: 200, borderRadius: 8 }}
                            />
                        </div>

                        {showOrig && (
                            <div style={{ fontSize: 11, textAlign: 'center', color: 'var(--muted)', marginBottom: 10 }}>
                                Showing original — toggle to see result
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                className="btn-secondary"
                                style={{ flex: 1 }}
                                onClick={() => downloadFile(
                                    `/signature/download?url=${encodeURIComponent(resultUrl)}&name=signature.png`,
                                    'signature.png'
                                )}
                            >
                                <Download size={16} /> Download PNG
                            </button>
                            <button
                                className="btn-secondary"
                                style={{ flex: 'none', padding: '13px 14px' }}
                                onClick={() => {
                                    navigator.clipboard.writeText(resultUrl)
                                        .then(() => toast.success('URL copied!'))
                                        .catch(() => toast.error('Copy failed'))
                                }}
                                title="Copy URL"
                            >
                                <Layers size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <GuestModal />
        </div>
    )
}
