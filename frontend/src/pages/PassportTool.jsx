import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Camera, Download, Image, Printer, Scissors, Eraser, X } from 'lucide-react'
import { useGuestLimit } from '../hooks/useGuestLimit'

const PRESETS = [
    { n: 6, label: '6', hint: '2×3' },
    { n: 8, label: '8', hint: '2×4' },
    { n: 12, label: '12', hint: '3×4' },
    { n: 20, label: '20', hint: '4×5' },
    { n: 30, label: '30', hint: '5×6 (max)' },
]

const MAX = 30

export default function PassportTool() {
    const nav = useNavigate()
    const { checkAndConsume, remainingUses, GuestModal } = useGuestLimit('passport')
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [count, setCount] = useState(8)
    const [removeBg, setRemoveBg] = useState(false)
    const [loading, setLoading] = useState(false)
    const [resultUrl, setResultUrl] = useState(null)
    const [showPrintModal, setShowPrintModal] = useState(false)

    function triggerPrintDirectly() {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        
        iframe.contentDocument.write(`
            <html>
                <head>
                    <title>A4 Print Layout</title>
                    <style>
                        @page { size: A4 portrait; margin: 0; }
                        body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; }
                        img { max-width: 100%; max-height: 100%; object-fit: contain; }
                    </style>
                </head>
                <body>
                    <img src="${resultUrl}" onload="window.focus(); window.print();" />
                </body>
            </html>
        `);
        
        iframe.contentWindow.onload = () => {
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 10000);
        };
    }

    const onDrop = useCallback((accepted) => {
        if (!accepted[0]) return
        setFile(accepted[0])
        setPreview(URL.createObjectURL(accepted[0]))
        setResultUrl(null)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'image/*': [] }, maxFiles: 1,
    })

    function handleCountInput(val) {
        const n = parseInt(val, 10)
        if (isNaN(n)) { setCount(''); return }
        setCount(Math.min(MAX, Math.max(1, n)))
    }

    async function handleGenerate() {
        if (!checkAndConsume()) return   // guest limit check
        const n = parseInt(count, 10)
        if (!file) return toast.error('Please upload a photo first')
        if (!n || n < 1) return toast.error('Enter a valid photo count (1–30)')
        setLoading(true)
        try {
            const fd = new FormData()
            fd.append('image', file)
            fd.append('count', n)
            fd.append('removeBg', String(removeBg))
            const res = await axios.post('/passport/generate', fd)
            setResultUrl(res.data.url)
            toast.success(`${n}-photo A4 sheet ready!`)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Generation failed')
        } finally { setLoading(false) }
    }

    return (
        <div className="page">
            {/* Header */}
            <div className="back-header">
                <button className="back-btn" onClick={() => nav('/')}><ArrowLeft size={18} /></button>
                <div>
                    <div className="page-title">Passport Photo</div>
                    <div className="page-sub">Standard A4 sheet · 35×45 mm · cutting guides included</div>
                </div>
            </div>

            {/* Dropzone */}
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: 16 }}>
                <input {...getInputProps()} />
                {preview ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <img src={preview} alt="preview"
                            style={{ width: 90, height: 116, objectFit: 'cover', borderRadius: 8, border: '2px solid rgba(99,102,241,0.4)' }} />
                        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Tap to change photo</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <Image size={44} color="#6366f1" style={{ opacity: 0.8 }} />
                        <p style={{ color: '#94a3b8', fontSize: 15 }}>
                            {isDragActive ? 'Drop photo here' : 'Tap to upload a photo'}
                        </p>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>JPG, PNG – max 10MB</span>
                    </div>
                )}
            </div>

            {/* Count selector */}
            <div style={{ marginBottom: 20 }}>
                <span className="section-label">Number of photos on sheet</span>

                {/* Quick presets */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {PRESETS.map(({ n, label, hint }) => (
                        <button key={n}
                            className={`option-pill ${count === n ? 'selected' : ''}`}
                            onClick={() => setCount(n)}>
                            <div style={{ fontSize: 15, fontWeight: 800 }}>{label}</div>
                            <div style={{ fontSize: 10, opacity: 0.6 }}>{hint}</div>
                        </button>
                    ))}
                </div>

                {/* Custom input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>Custom count:</span>
                    <input
                        type="number"
                        min={1}
                        max={MAX}
                        value={count}
                        onChange={(e) => handleCountInput(e.target.value)}
                        style={{
                            width: 72,
                            padding: '8px 10px',
                            borderRadius: 10,
                            border: '1.5px solid var(--border)',
                            background: 'var(--input-bg)',
                            color: 'var(--text)',
                            fontSize: 15,
                            fontWeight: 700,
                            outline: 'none',
                            textAlign: 'center',
                        }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>max 30 per A4</span>
                </div>
            </div>

            {/* Info badge */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.18)',
                fontSize: 12, color: 'var(--muted)',
            }}>
                <Scissors size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
                Sheet: A4 (210×297 mm) · Photo: 35×45 mm · 300 DPI · Grey cutting guides printed on sheet
            </div>

            {/* Background removal toggle */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 12, marginBottom: 16,
                background: removeBg ? 'rgba(79,70,229,0.12)' : 'var(--card)',
                border: `1.5px solid ${removeBg ? 'var(--primary)' : 'var(--border)'}`,
                transition: 'all 0.2s ease', cursor: 'pointer',
            }} onClick={() => setRemoveBg(v => !v)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Eraser size={16} color={removeBg ? '#4f46e5' : 'var(--muted)'} />
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: removeBg ? 'var(--primary)' : 'var(--text)' }}>
                            Remove Background → White
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                            {removeBg ? 'Uses remove.bg API credit per generation' : 'Background kept as-is'}
                        </div>
                    </div>
                </div>
                {/* Toggle pill */}
                <div style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: removeBg ? 'var(--primary)' : 'var(--border)',
                    position: 'relative', transition: 'background 0.2s',
                    flexShrink: 0,
                }}>
                    <div style={{
                        position: 'absolute', top: 3,
                        left: removeBg ? 20 : 3,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#fff', transition: 'left 0.2s',
                    }} />
                </div>
            </div>

            <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
                {loading ? <><span className="spin">◌</span> Generating…</> : <><Camera size={18} /> Generate {count || '?'} Photos on A4</>}
            </button>

            {/* Result */}
            {resultUrl && (
                <div className="result-success" style={{ animation: 'fadeSlide 0.4s ease both' }}>
                    <div style={{ color: '#34d399', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                        ✅ {count} passport photos on A4 — ready to print &amp; cut
                    </div>
                    <img src={resultUrl} alt="sheet" style={{
                        width: '100%', borderRadius: 12, border: '1px solid var(--border)',
                        marginBottom: 14, background: '#fff',
                    }} />
                    <div style={{ display: 'flex', gap: 10 }}>
                        <a href={resultUrl} download={`passport-${count}-photos-A4.png`} className="btn-secondary"
                            style={{ textDecoration: 'none', flex: 1 }}>
                            <Download size={16} /> Download
                        </a>
                        <button className="btn-secondary" style={{ flex: 1 }}
                            onClick={() => setShowPrintModal(true)}>
                            <Printer size={16} /> Print Preview
                        </button>
                    </div>
                </div>
            )
            }
            <GuestModal />

            {/* Print Preview Modal */}
            {showPrintModal && (
                <div className="glm-overlay" onClick={() => setShowPrintModal(false)}>
                    <div className="glm-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                        <button className="glm-close" onClick={() => setShowPrintModal(false)} aria-label="Close">
                            <X size={18} />
                        </button>
                        
                        <div className="badge badge-amber" style={{ marginBottom: '12px' }}>
                            <Printer size={13} /> A4 PRINT PREVIEW
                        </div>

                        <h2 className="glm-title" style={{ fontSize: '20px', margin: '4px 0 12px 0' }}>A4 Layout Preview</h2>
                        
                        {/* Printable sheet image preview */}
                        <div style={{ 
                            background: 'var(--input-bg)', border: '1px dashed var(--border)', 
                            borderRadius: '12px', padding: '16px', display: 'flex', 
                            justifyContent: 'center', marginBottom: '16px' 
                        }}>
                            <img src={resultUrl} alt="A4 Sheet preview" style={{ 
                                maxHeight: '360px', maxWidth: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                                border: '1px solid var(--border)', borderRadius: '4px', background: 'white' 
                            }} />
                        </div>

                        {/* Print Instructions */}
                        <div className="spam-notice" style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.18)', marginBottom: '20px', padding: '12px', borderRadius: '8px', display: 'flex', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>💡</span>
                            <span style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'left' }}>
                                <strong>Printer Settings Tip:</strong> For perfect 35x45mm sizing, set layout to <strong>Portrait</strong>, paper size to <strong>A4</strong>, and margins to <strong>None</strong> (or Borderless) in the print dialog.
                            </span>
                        </div>

                        {/* CTA actions */}
                        <div className="glm-actions">
                            <button className="glm-btn glm-btn-primary" onClick={triggerPrintDirectly}>
                                <Printer size={17} /> Trigger Print
                            </button>
                            <button className="glm-btn glm-btn-secondary" onClick={() => setShowPrintModal(false)}>
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}
