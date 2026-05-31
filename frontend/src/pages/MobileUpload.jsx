import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios from '../services/api'
import toast, { Toaster } from 'react-hot-toast'
import { Upload, CheckCircle, AlertCircle, Camera, Shield, Lock } from 'lucide-react'
import { useTheme } from '../ThemeContext'

export default function MobileUpload() {
    const { sessionId } = useParams()
    const { theme } = useTheme()
    const [file,            setFile]            = useState(null)
    const [preview,         setPreview]         = useState(null)
    const [loading,         setLoading]         = useState(false)
    const [progress,        setProgress]        = useState(0)
    const [done,            setDone]            = useState(false)
    const [errorMsg,        setErrorMsg]        = useState(null)
    const [checkingSession, setCheckingSession] = useState(true)

    // Use app ThemeContext — respects stored user preference and updates reactively (M-6 fix)
    const prefersDark = theme === 'dark'

    const colors = prefersDark ? {
        bg:        '#0a0a1a',
        card:      '#111827',
        border:    '#1f2937',
        text:      '#f9fafb',
        muted:     '#9ca3af',
        inputBg:   '#1f2937',
        toastBg:   '#1f2937',
        toastText: '#f9fafb',
    } : {
        bg:        '#f3f6fd',
        card:      '#ffffff',
        border:    '#e2e8f0',
        text:      '#0f172a',
        muted:     '#64748b',
        inputBg:   '#f8fafc',
        toastBg:   '#ffffff',
        toastText: '#0f172a',
    }

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
        setPreview(accepted[0].type.startsWith('image/') ? URL.createObjectURL(accepted[0]) : null)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
        accept: { 'image/*': [], 'application/pdf': ['.pdf'] },
        onDropRejected: () => toast.error('File too large or invalid. Max 10MB.'),
    })

    async function handleUpload() {
        if (!file) return toast.error('Select a file first')
        setLoading(true); setProgress(0); setErrorMsg(null)
        try {
            const fd = new FormData()
            fd.append('file', file)
            await axios.post(`/upload/${sessionId}`, fd, {
                onUploadProgress: e => { if (e.total) setProgress(Math.round(e.loaded / e.total * 100)) },
            })
            setProgress(100); setDone(true)
        } catch (err) {
            const msg = err.response?.data?.message || 'Upload failed. Session may have expired.'
            setErrorMsg(msg); toast.error(msg)
        } finally { setLoading(false) }
    }

    return (
        <div style={{
            minHeight: '100vh', background: colors.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, fontFamily: '"Inter",system-ui,sans-serif',
        }}>
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: colors.toastBg, color: colors.toastText,
                    border: `1px solid ${colors.border}`, borderRadius: 12,
                },
            }} />

            <div style={{ width: '100%', maxWidth: 400 }}>

                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 20, margin: '0 auto 14px',
                        background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 28px rgba(79,70,229,0.35)',
                    }}>
                        <Shield color="#fff" size={32} />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: colors.text }}>CyberSathi</div>
                    <div style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                        Secure file upload to operator
                    </div>
                </div>

                {checkingSession ? (
                    <div style={{
                        textAlign: 'center', padding: '48px 24px',
                        background: colors.card, border: `1px solid ${colors.border}`,
                        borderRadius: 24,
                    }}>
                        <div className="spin" style={{ display: 'inline-block', fontSize: 32, color: '#4f46e5', marginBottom: 18 }}>◌</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 8 }}>Connecting…</div>
                        <div style={{ fontSize: 14, color: colors.muted }}>Validating your secure session.</div>
                    </div>

                ) : done ? (
                    <div style={{
                        textAlign: 'center', padding: '48px 24px',
                        background: colors.card, border: `1px solid rgba(16,185,129,0.3)`,
                        borderRadius: 24, boxShadow: '0 4px 20px rgba(16,185,129,0.08)',
                    }}>
                        <CheckCircle size={64} color="#10b981" style={{ marginBottom: 18 }} />
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginBottom: 10 }}>File Sent! 🎉</div>
                        <div style={{ fontSize: 14, color: colors.muted, lineHeight: 1.65 }}>
                            The shop operator received your file.<br />You can now close this page.
                        </div>
                    </div>

                ) : errorMsg ? (
                    <div style={{
                        textAlign: 'center', padding: '48px 24px',
                        background: colors.card, border: `1px solid rgba(239,68,68,0.3)`,
                        borderRadius: 24,
                    }}>
                        <AlertCircle size={64} color="#ef4444" style={{ marginBottom: 18 }} />
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', marginBottom: 10 }}>Upload Failed</div>
                        <div style={{ fontSize: 14, color: colors.muted, marginBottom: 24, lineHeight: 1.65 }}>{errorMsg}</div>
                        <button onClick={() => setErrorMsg(null)} style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                            color: '#ef4444', borderRadius: 12, padding: '12px 24px',
                            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
                        }}>Try Again</button>
                    </div>

                ) : (
                    <div style={{
                        background: colors.card, border: `1px solid ${colors.border}`,
                        borderRadius: 24, padding: 24,
                        boxShadow: prefersDark ? 'none' : '0 4px 20px rgba(0,0,0,0.06)',
                    }}>
                        {/* Dropzone */}
                        <div {...getRootProps()} style={{
                            border: `2px dashed ${file ? 'rgba(79,70,229,0.6)' : 'rgba(79,70,229,0.3)'}`,
                            borderRadius: 18, padding: '40px 20px', textAlign: 'center',
                            cursor: 'pointer',
                            background: isDragActive ? 'rgba(79,70,229,0.1)' : colors.inputBg,
                            transition: 'all 0.2s', marginBottom: 20,
                        }}>
                            <input {...getInputProps()} capture="environment" />
                            {preview ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <img src={preview} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 14 }} />
                                    <span style={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>{file.name}</span>
                                    <span style={{ fontSize: 12, color: colors.muted }}>{Math.round(file.size / 1024)} KB — tap to change</span>
                                </div>
                            ) : file ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                    <div style={{ fontSize: 44 }}>📄</div>
                                    <span style={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>{file.name}</span>
                                    <span style={{ fontSize: 12, color: colors.muted }}>{Math.round(file.size / 1024)} KB — tap to change</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                                    <Upload size={48} color={isDragActive ? '#7c3aed' : '#4f46e5'} style={{ opacity: 0.85 }} />
                                    <div>
                                        <div style={{ color: colors.text, fontSize: 16, fontWeight: 600 }}>
                                            {isDragActive ? 'Drop it here!' : 'Tap to choose a file'}
                                        </div>
                                        <div style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                                    <span>Uploading…</span><span>{progress}%</span>
                                </div>
                                <div style={{ height: 6, borderRadius: 99, background: colors.border, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 99,
                                        background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
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
                                background: loading || !file
                                    ? colors.border
                                    : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                                border: 'none', borderRadius: 16,
                                color: loading || !file ? colors.muted : '#fff',
                                fontSize: 17, fontWeight: 800,
                                cursor: loading || !file ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                fontFamily: 'inherit',
                                boxShadow: loading || !file ? 'none' : '0 6px 24px rgba(79,70,229,0.35)',
                            }}
                        >
                            {loading ? '⏳ Uploading…' : <><Upload size={20} /> Send to Shop</>}
                        </button>

                        <div style={{
                            textAlign: 'center', fontSize: 11, color: colors.muted,
                            marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        }}>
                            <Lock size={10} /> Session expires in 10 minutes · Files auto-deleted after session
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
