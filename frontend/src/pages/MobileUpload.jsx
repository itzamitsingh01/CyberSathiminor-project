import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios from '../services/api'
import toast, { Toaster } from 'react-hot-toast'
import { Upload, CheckCircle, AlertCircle, Camera, Shield } from 'lucide-react'

export default function MobileUpload() {
    const { sessionId } = useParams()
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [done, setDone] = useState(false)
    const [errorMsg, setErrorMsg] = useState(null)
    const [checkingSession, setCheckingSession] = useState(true)

    useEffect(() => {
        axios.get(`/session/${sessionId}`)
            .then(() => setCheckingSession(false))
            .catch(() => {
                setErrorMsg('Session expired or invalid. Please ask the shop for a new QR code.')
                setCheckingSession(false)
            })
    }, [sessionId])

    const onDrop = useCallback((accepted) => {
        if (!accepted[0]) return
        setFile(accepted[0])
        setErrorMsg(null)
        if (accepted[0].type.startsWith('image/')) {
            setPreview(URL.createObjectURL(accepted[0]))
        } else {
            setPreview(null)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
        accept: { 'image/*': [], 'application/pdf': ['.pdf'] },
        onDropRejected: () => toast.error('File too large or invalid. Max 10MB.')
    })

    async function handleUpload() {
        if (!file) return toast.error('Select a file first')
        setLoading(true)
        setProgress(0)
        setErrorMsg(null)
        try {
            const fd = new FormData()
            fd.append('file', file)
            await axios.post(`/upload/${sessionId}`, fd, {
                onUploadProgress: (e) => {
                    if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
                },
            })
            setProgress(100)
            setDone(true)
        } catch (err) {
            const msg = err.response?.data?.message || 'Upload failed. Session may have expired.'
            setErrorMsg(msg)
            toast.error(msg)
        } finally { setLoading(false) }
    }

    /* ── Shared styles (standalone page, no shared CSS guaranteed) ── */
    const bg = { minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: '"Inter",system-ui,sans-serif' }
    const wrap = { width: '100%', maxWidth: 400 }

    return (
        <div style={bg}>
            <Toaster position="top-center" toastOptions={{ style: { background: '#ffffff', color: '#1f2937', border: '1px solid #e5e7eb', borderRadius: 12 } }} />
            <div style={wrap}>

                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: 20, margin: '0 auto 14px',
                        background: '#4f46e5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                        boxShadow: '0 6px 24px rgba(79,70,229,0.3)',
                    }}><Shield color="#fff" size={32}/></div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1f2937' }}>CyberSathi</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                        Upload your file to the operator
                    </div>
                </div>

                {checkingSession ? (
                    <div style={{ textAlign: 'center', padding: '44px 24px', background: 'rgba(79,70,229,0.05)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: 24 }}>
                        <div className="spin" style={{ display: 'inline-block', fontSize: 32, color: '#4f46e5', marginBottom: 18 }}>◌</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 10 }}>Connecting...</div>
                        <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>Validating your secure session.</div>
                    </div>
                ) : done ? (
                    /* ── Success ─────────────────────────────────── */
                    <div style={{ textAlign: 'center', padding: '44px 24px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 24 }}>
                        <CheckCircle size={60} color="#10b981" style={{ marginBottom: 18 }} />
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginBottom: 10 }}>File Sent! 🎉</div>
                        <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                            The shop operator received your file.<br />
                            You can now close this page.
                        </div>
                    </div>
                ) : errorMsg ? (
                    /* ── Error ───────────────────────────────────── */
                    <div style={{ textAlign: 'center', padding: '44px 24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 24 }}>
                        <AlertCircle size={60} color="#ef4444" style={{ marginBottom: 18 }} />
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', marginBottom: 10 }}>Upload Failed</div>
                        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>{errorMsg}</div>
                        <button onClick={() => setErrorMsg(null)} style={{
                            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                            color: '#ef4444', borderRadius: 12, padding: '12px 24px',
                            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
                        }}>Try Again</button>
                    </div>
                ) : (
                    /* ── Upload form ──────────────────────────────── */
                    <>
                        {/* Dropzone */}
                        <div {...getRootProps()} style={{
                            border: `2px dashed ${file ? 'rgba(79,70,229,0.6)' : 'rgba(79,70,229,0.3)'}`,
                            borderRadius: 20, padding: '44px 20px', textAlign: 'center',
                            cursor: 'pointer', background: isDragActive ? 'rgba(79,70,229,0.1)' : '#ffffff',
                            transition: 'all 0.2s', marginBottom: 20,
                        }}>
                            <input {...getInputProps()} capture="environment" />
                            {preview ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <img src={preview} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 14 }} />
                                    <span style={{ fontWeight: 600, color: '#1f2937', fontSize: 14 }}>{file.name}</span>
                                    <span style={{ fontSize: 12, color: '#6b7280' }}>{Math.round(file.size / 1024)}KB — tap to change</span>
                                </div>
                            ) : file ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <div style={{ fontSize: 40 }}>📄</div>
                                    <span style={{ fontWeight: 600, color: '#1f2937', fontSize: 14 }}>{file.name}</span>
                                    <span style={{ fontSize: 12, color: '#6b7280' }}>{Math.round(file.size / 1024)}KB — tap to change</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                                    <Upload size={48} color={isDragActive ? '#6366f1' : '#4f46e5'} style={{ opacity: 0.85 }} />
                                    <div>
                                        <div style={{ color: '#1f2937', fontSize: 16, fontWeight: 600 }}>
                                            {isDragActive ? 'Drop it here!' : 'Tap to choose a file'}
                                        </div>
                                        <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                                            Image or PDF · max 10MB
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4f46e5', fontSize: 13, fontWeight: 600 }}>
                                        <Camera size={15} /> Camera also supported
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Progress bar */}
                        {loading && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                                    <span>Uploading…</span><span>{progress}%</span>
                                </div>
                                <div style={{ height: 6, borderRadius: 99, background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 99,
                                        background: '#4f46e5',
                                        width: `${progress}%`, transition: 'width 0.3s ease',
                                    }} />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={loading || !file}
                            style={{
                                width: '100%', padding: '16px',
                                background: loading || !file ? '#e5e7eb' : '#4f46e5',
                                border: 'none',
                                borderRadius: 16, color: loading || !file ? '#9ca3af' : '#fff',
                                fontSize: 17, fontWeight: 800, cursor: loading || !file ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: 10, fontFamily: 'inherit',
                                boxShadow: loading || !file ? 'none' : '0 6px 24px rgba(79,70,229,0.3)',
                            }}
                        >
                            {loading ? '⏳ Uploading…' : <><Upload size={20} /> Send to Shop</>}
                        </button>

                        <div style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 14 }}>
                            Session expires in 10 minutes
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
