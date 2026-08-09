/**
 * BgRemoverTool.jsx — AI Background Remover
 * Uses @imgly/background-removal (runs in browser via WebAssembly ML model)
 * No API key needed, completely FREE, works offline after first load.
 */
import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { ArrowLeft, Wand2, Download, Upload, RefreshCw, ImageIcon } from 'lucide-react'

// Background color options
const BG_OPTIONS = [
    { label: 'Transparent', value: 'transparent', color: 'transparent', border: true },
    { label: 'White',       value: '#ffffff',     color: '#ffffff',     border: true },
    { label: 'Sky Blue',    value: '#1e90ff',     color: '#1e90ff'    },
    { label: 'Red',         value: '#e53e3e',     color: '#e53e3e'    },
    { label: 'Green',       value: '#38a169',     color: '#38a169'    },
    { label: 'Black',       value: '#1a1a1a',     color: '#1a1a1a'    },
    { label: 'Gray',        value: '#718096',     color: '#718096'    },
    { label: 'Navy',        value: '#1a365d',     color: '#1a365d'    },
]

export default function BgRemoverTool() {
    const nav = useNavigate()

    const [file,       setFile]       = useState(null)
    const [preview,    setPreview]    = useState(null)   // original preview URL
    const [resultBlob, setResultBlob] = useState(null)   // removed-bg blob
    const [resultUrl,  setResultUrl]  = useState(null)   // object URL for display
    const [bgColor,    setBgColor]    = useState('transparent')
    const [loading,    setLoading]    = useState(false)
    const [step,       setStep]       = useState('idle') // idle | removed | composed

    const canvasRef = useRef(null)

    // ── Dropzone ──────────────────────────────────────────────────────
    const onDrop = useCallback((accepted) => {
        const f = accepted[0]
        if (!f) return
        if (!f.type.startsWith('image/')) {
            toast.error('Please upload an image file (JPG, PNG, WebP)')
            return
        }
        if (f.size > 10 * 1024 * 1024) {
            toast.error('File too large. Max size is 10MB.')
            return
        }
        setFile(f)
        setPreview(URL.createObjectURL(f))
        setResultBlob(null)
        setResultUrl(null)
        setStep('idle')
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    })

    // ── Remove Background ─────────────────────────────────────────────
    async function handleRemove() {
        if (!file) return toast.error('Please upload an image first')
        setLoading(true)
        const toastId = toast.loading('🤖 AI removing background… first time ~30s (downloading model)')
        try {
            const { removeBackground } = await import('@imgly/background-removal')

            // No publicPath — library auto-loads model from its CDN
            const blob = await removeBackground(file, {
                output: { format: 'image/png', quality: 0.9 },
                progress: (key, current, total) => {
                    if (total > 0) {
                        const pct = Math.round((current / total) * 100)
                        console.log(`[BgRemover] ${key}: ${pct}%`)
                    }
                },
            })

            setResultBlob(blob)
            const url = URL.createObjectURL(blob)
            setResultUrl(url)
            setStep('removed')
            toast.dismiss(toastId)
            toast.success('✅ Background removed!')
        } catch (err) {
            toast.dismiss(toastId)
            console.error('BG removal error:', err)
            toast.error('Failed — check internet connection and try again')
        } finally {
            setLoading(false)
        }
    }

    // ── Apply Background Color & Download ────────────────────────────
    async function handleDownload() {
        if (!resultBlob) return

        if (bgColor === 'transparent') {
            // Direct download of transparent PNG
            const a = document.createElement('a')
            a.href = resultUrl
            a.download = `bg-removed-${file.name.replace(/\.[^.]+$/, '')}.png`
            a.click()
            return
        }

        // Compose onto colored canvas
        const img = new Image()
        img.src = resultUrl
        img.onload = () => {
            const canvas = canvasRef.current
            canvas.width  = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = bgColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob)
                const a   = document.createElement('a')
                a.href     = url
                a.download = `bg-${bgColor.replace('#','')}-${file.name.replace(/\.[^.]+$/, '')}.png`
                a.click()
                URL.revokeObjectURL(url)
            }, 'image/png')
        }
        toast.success('Downloaded!')
    }

    // ── Reset ─────────────────────────────────────────────────────────
    function handleReset() {
        setFile(null); setPreview(null)
        setResultBlob(null); setResultUrl(null)
        setStep('idle')
    }

    // ── checkerboard style for transparent preview ────────────────────
    const checkerStyle = {
        backgroundImage: `
            linear-gradient(45deg, #ccc 25%, transparent 25%),
            linear-gradient(-45deg, #ccc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #ccc 75%),
            linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
    }

    return (
        <div className="page">
            {/* Hidden canvas for compositing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Header */}
            <div className="back-header">
                <button className="back-btn" onClick={() => nav('/dashboard')}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <div className="page-title">AI Background Remover</div>
                    <div className="page-sub">Remove any background instantly · 100% free · No API key</div>
                </div>
            </div>

            {/* AI badge */}
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(59,130,246,0.15))',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: 20, padding: '5px 14px', marginBottom: 16,
                fontSize: 12, fontWeight: 700, color: '#a78bfa',
            }}>
                <Wand2 size={14} /> Powered by ML model · runs in your browser
            </div>

            {step === 'idle' && (
                <>
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`dropzone ${isDragActive ? 'active' : ''}`}
                        style={{ marginBottom: 16 }}
                    >
                        <input {...getInputProps()} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            {preview ? (
                                <>
                                    <img
                                        src={preview}
                                        alt="preview"
                                        style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 10, objectFit: 'contain' }}
                                    />
                                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                                        {file.name} · {Math.round(file.size / 1024)} KB · Tap to change
                                    </span>
                                </>
                            ) : (
                                <>
                                    <ImageIcon size={44} color="var(--accent)" style={{ opacity: 0.85 }} />
                                    <span style={{ color: 'var(--muted)', fontSize: 15 }}>
                                        {isDragActive ? 'Drop image here' : 'Tap or drag image here'}
                                    </span>
                                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                                        JPG, PNG, WebP · Max 10MB
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleRemove}
                        disabled={loading || !file}
                        style={{
                            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                            boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                        }}
                    >
                        {loading
                            ? <><span className="spin">◌</span> AI Working…</>
                            : <><Wand2 size={18} /> Remove Background</>
                        }
                    </button>
                </>
            )}

            {/* Result */}
            {step === 'removed' && resultUrl && (
                <div style={{ animation: 'fadeSlide 0.4s ease both' }}>

                    {/* Before / After */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: 14, marginBottom: 20,
                    }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textAlign: 'center' }}>ORIGINAL</div>
                            <img
                                src={preview}
                                alt="original"
                                style={{ width: '100%', borderRadius: 10, objectFit: 'contain', maxHeight: 200 }}
                            />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 6, textAlign: 'center' }}>BACKGROUND REMOVED ✨</div>
                            <div style={{ borderRadius: 10, overflow: 'hidden', maxHeight: 200, ...checkerStyle }}>
                                <img
                                    src={resultUrl}
                                    alt="result"
                                    style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Background color selector */}
                    <div style={{ marginBottom: 18 }}>
                        <div className="section-label" style={{ marginBottom: 10 }}>
                            Choose background color for download
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {BG_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setBgColor(opt.value)}
                                    title={opt.label}
                                    style={{
                                        width: 36, height: 36, borderRadius: 8,
                                        background: opt.color === 'transparent'
                                            ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 10px 10px'
                                            : opt.color,
                                        border: bgColor === opt.value
                                            ? '3px solid #7c3aed'
                                            : opt.border ? '2px solid var(--border)' : '2px solid transparent',
                                        cursor: 'pointer',
                                        transition: 'transform 0.15s',
                                        transform: bgColor === opt.value ? 'scale(1.2)' : 'scale(1)',
                                        boxShadow: bgColor === opt.value ? '0 0 0 2px rgba(124,58,237,0.3)' : 'none',
                                    }}
                                />
                            ))}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                            Selected: <strong style={{ color: 'var(--text)' }}>
                                {BG_OPTIONS.find(o => o.value === bgColor)?.label}
                            </strong>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                            className="btn-primary"
                            onClick={handleDownload}
                            style={{
                                flex: 1,
                                background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                                boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                            }}
                        >
                            <Download size={18} /> Download PNG
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={handleReset}
                            style={{ flex: '0 0 auto' }}
                        >
                            <RefreshCw size={16} /> New Image
                        </button>
                    </div>

                    {/* Tips */}
                    <div style={{
                        marginTop: 16, padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(124,58,237,0.06)',
                        border: '1px solid rgba(124,58,237,0.15)',
                        fontSize: 12, color: 'var(--muted)', lineHeight: 1.5,
                    }}>
                        💡 <strong>Tip:</strong> For passport photos, select <strong>White</strong> or <strong>Sky Blue</strong> background.
                        For transparent PNG (logo/signature use), keep <strong>Transparent</strong>.
                    </div>
                </div>
            )}
        </div>
    )
}
