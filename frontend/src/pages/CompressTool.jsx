import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, FileArchive, Download, Upload, CheckCircle2, X } from 'lucide-react'
import { useGuestLimit } from '../hooks/useGuestLimit'

export default function CompressTool() {
    const nav = useNavigate()
    const [searchParams] = useSearchParams()
    const { checkAndConsume, GuestModal } = useGuestLimit('compress')

    // Preloaded file from Recent Files panel
    const preloadUrl  = searchParams.get('fileUrl')  || null
    const preloadId   = searchParams.get('fileId')   || null
    const preloadName = searchParams.get('fileName') || null

    const [file, setFile]     = useState(null)
    const [targetKB, setTargetKB] = useState('100')
    const [loading, setLoading]   = useState(false)
    const [result, setResult]     = useState(null) // { url, originalSizeKB, finalSizeKB }

    const onDrop = useCallback((accepted) => {
        if (!accepted[0]) return
        setFile(accepted[0])
        setResult(null)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 })

    async function handleCompress() {
        if (!checkAndConsume()) return
        if (!preloadUrl && !file) return toast.error('Please select a file first')
        setLoading(true)
        try {
            let res
            if (preloadUrl && !file) {
                // Use preloaded Cloudinary URL — no re-upload
                res = await axios.post('/compress/from-url', {
                    url: preloadUrl, targetKB, originalName: preloadName || 'file',
                })
                if (preloadId) {
                    axios.post(`/files/${preloadId}/history`, {
                        action: 'compress', resultUrl: res.data.url,
                    }).catch(() => {})
                }
            } else {
                const fd = new FormData()
                fd.append('file', file)
                fd.append('targetKB', targetKB)
                res = await axios.post('/compress', fd)
            }
            setResult(res.data)
            toast.success(`Compressed to ${res.data.finalSizeKB}KB!`)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Compression failed')
        } finally { setLoading(false) }
    }

    const reductionPct = result
        ? Math.round(((result.originalSizeKB - result.finalSizeKB) / result.originalSizeKB) * 100)
        : 0

    return (
        <div className="page">
            <div className="back-header">
                <button className="back-btn" onClick={() => nav('/dashboard')}><ArrowLeft size={18} /></button>
                <div>
                    <div className="page-title">File Size Reducer</div>
                    <div className="page-sub">Compress to your exact KB target</div>
                </div>
            </div>

            {/* Preloaded file banner */}
            {preloadUrl && !file && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                    padding: '10px 14px', borderRadius: 12,
                    background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.3)',
                }}>
                    <CheckCircle2 size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>File preloaded from Recent Uploads</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {preloadName || preloadUrl}
                        </div>
                    </div>
                    <button onClick={() => nav('/compress', { replace: true })}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Dropzone */}
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: 16 }}>
                <input {...getInputProps()} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <Upload size={44} color="var(--accent)" style={{ opacity: 0.85 }} />
                    {file ? (
                        <>
                            <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{file.name}</span>
                            <span className="badge badge-amber">{Math.round(file.size / 1024)} KB original</span>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Tap to change</span>
                        </>
                    ) : preloadUrl ? (
                        <>
                            <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>Using preloaded file</span>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Tap to upload a different file instead</span>
                        </>
                    ) : (
                        <>
                            <span style={{ color: 'var(--muted)', fontSize: 15 }}>
                                {isDragActive ? 'Drop file here' : 'Tap to upload image or PDF'}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>JPG, PNG, PDF – max 10MB</span>
                        </>
                    )}
                </div>
            </div>

            {/* Target selector */}
            <div style={{ marginBottom: 20 }}>
                <span className="section-label">Target file size</span>
                <div style={{ display: 'flex', gap: 10 }}>
                    {['20', '50', '100'].map((kb) => (
                        <button
                            key={kb}
                            className={`option-pill ${targetKB === kb ? 'selected' : ''}`}
                            onClick={() => setTargetKB(kb)}
                            style={targetKB === kb ? {
                                borderColor: 'var(--accent)', background: 'rgba(245,158,11,0.15)', color: 'var(--accent)'
                            } : {}}
                        >
                            <div style={{ fontSize: 16, fontWeight: 800 }}>{kb}</div>
                            <div style={{ fontSize: 11, opacity: 0.7 }}>KB</div>
                        </button>
                    ))}
                </div>
            </div>

            <button
                className="btn-primary"
                onClick={handleCompress}
                disabled={loading}
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--danger))' }}
            >
                {loading
                    ? <><span className="spin">◌</span> Compressing…</>
                    : <><FileArchive size={18} /> Compress File</>
                }
            </button>

            {/* Result */}
            {result && (
                <div className="result-success" style={{ animation: 'fadeSlide 0.4s ease both' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14 }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>BEFORE</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)' }}>
                                {result.originalSizeKB}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 2 }}>KB</span>
                            </div>
                        </div>
                        <div style={{ color: 'var(--text)', fontSize: 24, padding: '0 12px' }}>→</div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>AFTER</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>
                                {result.finalSizeKB}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 2 }}>KB</span>
                            </div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>SAVED</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24' }}>
                                {reductionPct}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 1 }}>%</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <div className="progress-wrap">
                            <div className="progress-bar"
                                style={{ width: `${100 - Math.min(reductionPct, 100)}%`, background: 'linear-gradient(90deg,#34d399,#10b981)' }} />
                        </div>
                    </div>

                    <a
                        href={result.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                        style={{ textDecoration: 'none' }}
                    >
                        <Download size={16} /> Download Compressed File
                    </a>
                </div>
            )}
            <GuestModal />
        </div>
    )
}
