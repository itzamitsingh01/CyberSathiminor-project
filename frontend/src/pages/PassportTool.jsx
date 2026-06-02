import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios from '../services/api'
import toast from 'react-hot-toast'
import {
    ArrowLeft, Camera, Download, Image, Printer, Scissors,
    Eraser, X, User, Calendar, AlignVerticalJustifyCenter,
    CropIcon, MoveVertical, CheckCircle2, Link,
} from 'lucide-react'
import { useGuestLimit } from '../hooks/useGuestLimit'

const PRESETS = [
    { n: 4,  label: '4',  hint: '2×2' },
    { n: 6,  label: '6',  hint: '2×3' },
    { n: 8,  label: '8',  hint: '2×4' },
    { n: 12, label: '12', hint: '3×4' },
    { n: 16, label: '16', hint: '4×4' },
    { n: 20, label: '20', hint: '4×5' },
]

const CROP_POSITIONS = [
    { id: 'top',    label: 'Top',    hint: 'Forehead focus' },
    { id: 'center', label: 'Center', hint: 'Best for faces' },
    { id: 'bottom', label: 'Bottom', hint: 'Chin focus' },
]

const DATE_FORMATS = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']

const MAX = 30

/* ── Toggle Switch ── */
function Toggle({ on, onChange, label, sub, icon: Icon, color = '#4f46e5' }) {
    return (
        <div
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 14, marginBottom: 12,
                background: on ? `${color}12` : 'var(--card)',
                border: `1.5px solid ${on ? color : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all 0.2s',
            }}
            onClick={() => onChange(!on)}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon size={16} color={on ? color : 'var(--muted)'} />
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: on ? color : 'var(--text)' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>
                </div>
            </div>
            <div style={{
                width: 42, height: 24, borderRadius: 99,
                background: on ? color : 'var(--border)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
                <div style={{
                    position: 'absolute', top: 4,
                    left: on ? 22 : 4,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                }} />
            </div>
        </div>
    )
}

export default function PassportTool() {
    const nav = useNavigate()
    const [searchParams] = useSearchParams()
    const { checkAndConsume, GuestModal } = useGuestLimit('passport')

    // Preloaded file from Recent Files panel
    const preloadUrl  = searchParams.get('fileUrl')  || null
    const preloadId   = searchParams.get('fileId')   || null
    const preloadName = searchParams.get('fileName') || null

    const [file,     setFile]     = useState(null)
    const [preview,  setPreview]  = useState(preloadUrl)   // show preloaded image immediately
    const [count,    setCount]    = useState(8)
    const [removeBg, setRemoveBg] = useState(false)
    const [loading,  setLoading]  = useState(false)
    const [resultUrl, setResultUrl] = useState(null)
    const [showPrintModal, setShowPrintModal] = useState(false)

    // New fields
    const [cropPosition,  setCropPosition]  = useState('center')
    const [personName,    setPersonName]    = useState('')
    const [showDate,      setShowDate]      = useState(false)
    const [stampDate,     setStampDate]     = useState('')
    const [dateFormat,    setDateFormat]    = useState('DD-MM-YYYY')

    // Revoke object URLs to prevent memory leaks (P-5 fix)
    useEffect(() => {
        return () => { if (preview) URL.revokeObjectURL(preview) }
    }, [preview])

    function triggerPrintDirectly() {
        if (!resultUrl) return
        const iframe = document.createElement('iframe')
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
        document.body.appendChild(iframe)
        iframe.contentDocument.write(`
            <html>
              <head>
                <title>A4 Print Layout</title>
                <style>
                  @page { size: A4 portrait; margin: 0; }
                  body { margin:0; padding:0; display:flex; align-items:center; justify-content:center; min-height:100vh; background:white; }
                  img { max-width:100%; max-height:100%; object-fit:contain; }
                </style>
              </head>
              <body><img src="${resultUrl}" onload="window.focus();window.print();" /></body>
            </html>`)
        setTimeout(() => document.body.removeChild(iframe), 10000)
    }

    const onDrop = useCallback((accepted) => {
        if (!accepted[0]) return
        setPreview(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(accepted[0]) })
        setFile(accepted[0])
        setResultUrl(null)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'image/*': [] }, maxFiles: 1,
    })

    async function handleGenerate() {
        if (!checkAndConsume()) return
        const n = parseInt(count, 10)
        if (!preloadUrl && !file) return toast.error('Please upload a photo first')
        if (!n || n < 1) return toast.error('Enter a valid photo count (1–30)')
        setLoading(true)
        try {
            let res
            if (preloadUrl) {
                // Use preloaded Cloudinary URL — no re-upload
                res = await axios.post('/passport/generate-from-url', {
                    url: preloadUrl, count: n, removeBg: String(removeBg),
                    cropPosition, personName: personName.trim(),
                    showDate: String(showDate), stampDate, dateFormat,
                })
                // Track processing history if we have a file ID
                if (preloadId) {
                    axios.post(`/files/${preloadId}/history`, {
                        action: 'passport', resultUrl: res.data.url,
                    }).catch(() => {})
                }
            } else {
                // Standard FormData upload
                const fd = new FormData()
                fd.append('image', file)
                fd.append('count', n)
                fd.append('removeBg', String(removeBg))
                fd.append('cropPosition', cropPosition)
                fd.append('personName', personName.trim())
                fd.append('showDate', String(showDate))
                fd.append('stampDate', stampDate)
                fd.append('dateFormat', dateFormat)
                res = await axios.post('/passport/generate', fd)
            }
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
                <button className="back-btn" onClick={() => nav('/dashboard')}><ArrowLeft size={18} /></button>
                <div>
                    <div className="page-title">Passport Photo</div>
                    <div className="page-sub">Standard A4 sheet · 35×45 mm · cutting guides included</div>
                </div>
            </div>

            {/* Preloaded file banner */}
            {preloadUrl && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                    padding: '10px 14px', borderRadius: 12,
                    background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.25)',
                }}>
                    <CheckCircle2 size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8' }}>File preloaded from Recent Uploads</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preloadName || preloadUrl}</div>
                    </div>
                    <button onClick={() => { searchParams.delete('fileUrl'); nav('/passport', { replace: true }) }}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Dropzone */}
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: 20 }}>
                <input {...getInputProps()} />
                {(preview || preloadUrl) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <img src={preview || preloadUrl} alt="preview"
                            style={{ width: 90, height: 116, objectFit: 'cover', borderRadius: 10, border: '2px solid rgba(99,102,241,0.4)' }} />
                        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{preloadUrl && !file ? 'Using preloaded file · tap to change' : 'Tap to change photo'}</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <Image size={44} color="#6366f1" style={{ opacity: 0.8 }} />
                        <p style={{ color: 'var(--muted)', fontSize: 15 }}>
                            {isDragActive ? 'Drop photo here' : 'Tap to upload a photo'}
                        </p>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>JPG, PNG – max 10MB</span>
                    </div>
                )}
            </div>

            {/* ── Count presets ── */}
            <div style={{ marginBottom: 20 }}>
                <span className="section-label">Number of photos on sheet</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {PRESETS.map(({ n, label, hint }) => (
                        <button key={n}
                            className={`option-pill ${count === n ? 'selected' : ''}`}
                            onClick={() => setCount(n)}
                        >
                            <div style={{ fontSize: 15, fontWeight: 800 }}>{label}</div>
                            <div style={{ fontSize: 10, opacity: 0.6 }}>{hint}</div>
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Custom:</span>
                    <input
                        type="number" min={1} max={MAX} value={count}
                        onChange={e => {
                            const v = parseInt(e.target.value, 10)
                            setCount(isNaN(v) ? '' : Math.min(MAX, Math.max(1, v)))
                        }}
                        style={{
                            width: 72, padding: '8px 10px', borderRadius: 10,
                            border: '1.5px solid var(--border)', background: 'var(--input-bg)',
                            color: 'var(--text)', fontSize: 15, fontWeight: 700,
                            outline: 'none', textAlign: 'center',
                        }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>max 30 per A4</span>
                </div>
            </div>

            {/* ── Face crop position ── */}
            <div style={{ marginBottom: 20 }}>
                <span className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <MoveVertical size={13} /> Face crop position
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                    {CROP_POSITIONS.map(pos => (
                        <button key={pos.id}
                            onClick={() => setCropPosition(pos.id)}
                            style={{
                                flex: 1, padding: '12px 8px', borderRadius: 12,
                                border: `1.5px solid ${cropPosition === pos.id ? '#6366f1' : 'var(--border)'}`,
                                background: cropPosition === pos.id ? 'rgba(99,102,241,0.12)' : 'var(--card)',
                                color: cropPosition === pos.id ? '#818cf8' : 'var(--muted)',
                                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
                            }}
                        >
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{pos.label}</div>
                            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{pos.hint}</div>
                        </button>
                    ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                    "Center" is recommended for most standard passport photos
                </div>
            </div>

            {/* ── Info badge ── */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.18)',
                fontSize: 12, color: 'var(--muted)',
            }}>
                <Scissors size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
                Sheet: A4 (210×297 mm) · Photo: 35×45 mm · 300 DPI · Grey cutting guides on sheet
            </div>

            {/* ── Remove Background toggle ── */}
            <Toggle
                on={removeBg} onChange={setRemoveBg}
                label="Remove Background → White"
                sub={removeBg ? 'Uses remove.bg API credit per generation' : 'Background kept as-is'}
                icon={Eraser} color="#4f46e5"
            />

            {/* ── Name Stamp ── */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <User size={13} color="var(--muted)" />
                    <span className="section-label" style={{ marginBottom: 0 }}>Name stamp (printed below each photo)</span>
                </div>
                <input
                    type="text"
                    placeholder="e.g. Rahul Kumar (leave blank to skip)"
                    value={personName}
                    onChange={e => setPersonName(e.target.value)}
                    className="input"
                    maxLength={40}
                />
                {personName.trim() && (
                    <div style={{
                        marginTop: 6, fontSize: 11, color: 'var(--muted)',
                        padding: '4px 10px', background: 'rgba(99,102,241,0.06)',
                        borderRadius: 6, display: 'inline-block',
                    }}>
                        Preview: <strong style={{ color: 'var(--text)' }}>{personName.trim()}</strong>
                    </div>
                )}
            </div>

            {/* ── Date Stamp toggle + controls ── */}
            <Toggle
                on={showDate} onChange={setShowDate}
                label="Date Stamp (printed below name)"
                sub={showDate ? 'Date will appear on each photo' : 'No date on photos'}
                icon={Calendar} color="#10b981"
            />

            {showDate && (
                <div style={{
                    padding: '16px', borderRadius: 14, marginBottom: 16,
                    background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                }}>
                    <div style={{ marginBottom: 12 }}>
                        <span className="section-label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Calendar size={12} /> Custom date (leave blank for today)
                        </span>
                        <input
                            type="date"
                            value={stampDate}
                            onChange={e => setStampDate(e.target.value)}
                            className="input"
                            style={{ maxWidth: 200 }}
                        />
                    </div>

                    <div>
                        <span className="section-label" style={{ marginBottom: 8 }}>Date format</span>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {DATE_FORMATS.map(fmt => (
                                <button key={fmt}
                                    onClick={() => setDateFormat(fmt)}
                                    style={{
                                        padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                                        border: `1.5px solid ${dateFormat === fmt ? '#10b981' : 'var(--border)'}`,
                                        background: dateFormat === fmt ? 'rgba(16,185,129,0.12)' : 'var(--card)',
                                        color: dateFormat === fmt ? '#10b981' : 'var(--muted)',
                                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                    }}
                                >
                                    {fmt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Live date preview */}
                    {(() => {
                        let d = stampDate ? new Date(stampDate) : new Date()
                        const dd = String(d.getDate()).padStart(2, '0')
                        const mm2 = String(d.getMonth() + 1).padStart(2, '0')
                        const yyyy = d.getFullYear()
                        const preview = dateFormat === 'DD/MM/YYYY' ? `${dd}/${mm2}/${yyyy}`
                            : dateFormat === 'YYYY-MM-DD' ? `${yyyy}-${mm2}-${dd}`
                            : `${dd}-${mm2}-${yyyy}`
                        return (
                            <div style={{ marginTop: 10, fontSize: 12, color: '#10b981', fontWeight: 700 }}>
                                Will print: <code style={{ background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 4 }}>{preview}</code>
                            </div>
                        )
                    })()}
                </div>
            )}

            {/* ── Generate button ── */}
            <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
                {loading
                    ? <><span className="spin">◌</span> Generating…</>
                    : <><Camera size={18} /> Generate {count || '?'} Photos on A4</>
                }
            </button>

            {/* ── Result ── */}
            {resultUrl && (
                <div className="result-success" style={{ animation: 'fadeSlide 0.4s ease both' }}>
                    <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                        ✅ {count} passport photos on A4 — ready to print & cut
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
            )}

            <GuestModal />

            {/* Print Modal */}
            {showPrintModal && (
                <div className="glm-overlay" onClick={() => setShowPrintModal(false)}>
                    <div className="glm-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
                        <button className="glm-close" onClick={() => setShowPrintModal(false)} aria-label="Close">
                            <X size={18} />
                        </button>
                        <div className="badge badge-amber" style={{ marginBottom: 12 }}>
                            <Printer size={13} /> A4 PRINT PREVIEW
                        </div>
                        <h2 className="glm-title" style={{ fontSize: 20, margin: '4px 0 12px' }}>A4 Layout Preview</h2>

                        <div style={{
                            background: 'var(--input-bg)', border: '1px dashed var(--border)',
                            borderRadius: 12, padding: 16, display: 'flex',
                            justifyContent: 'center', marginBottom: 16,
                        }}>
                            <img src={resultUrl} alt="A4 Sheet preview" style={{
                                maxHeight: 360, maxWidth: '100%',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                border: '1px solid var(--border)', borderRadius: 4, background: 'white',
                            }} />
                        </div>

                        <div style={{
                            background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.18)',
                            borderRadius: 8, padding: '12px 14px', marginBottom: 20,
                            display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)',
                        }}>
                            <span style={{ fontSize: 16 }}>💡</span>
                            <span>
                                <strong>Printer tip:</strong> Set paper to <strong>A4</strong>, layout to <strong>Portrait</strong>, margins to <strong>None/Borderless</strong> for correct 35×45mm sizing.
                            </span>
                        </div>

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
        </div>
    )
}
