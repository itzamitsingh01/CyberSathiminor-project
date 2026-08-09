/**
 * OcrTool.jsx — Smart OCR (Optical Character Recognition)
 * Uses Tesseract.js — 100% browser-based, no API key, supports English + Hindi
 */
import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import {
    ArrowLeft, ScanText, Copy, Download, RefreshCw,
    ImageIcon, CheckCheck, Languages, FileText, Loader2
} from 'lucide-react'

const LANGUAGES = [
    { code: 'eng',      label: '🇬🇧 English' },
    { code: 'hin',      label: '🇮🇳 Hindi' },
    { code: 'eng+hin',  label: '🌐 English + Hindi' },
]

export default function OcrTool() {
    const nav = useNavigate()

    const [file,      setFile]      = useState(null)
    const [preview,   setPreview]   = useState(null)
    const [lang,      setLang]      = useState('eng+hin')
    const [result,    setResult]    = useState(null)   // { text, confidence }
    const [loading,   setLoading]   = useState(false)
    const [progress,  setProgress]  = useState(0)
    const [copied,    setCopied]    = useState(false)
    const textRef = useRef(null)

    // ── Dropzone ──────────────────────────────────────────────────────
    const onDrop = useCallback((accepted) => {
        const f = accepted[0]
        if (!f) return
        if (!f.type.startsWith('image/')) {
            toast.error('Please upload an image file (JPG, PNG, WebP, BMP)')
            return
        }
        if (f.size > 15 * 1024 * 1024) {
            toast.error('Image too large. Max 15MB.')
            return
        }
        setFile(f)
        setPreview(URL.createObjectURL(f))
        setResult(null)
        setProgress(0)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, maxFiles: 1,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'] },
    })

    // ── Run OCR ───────────────────────────────────────────────────────
    async function handleOcr() {
        if (!file) return toast.error('Please upload an image first')
        setLoading(true)
        setProgress(0)
        setResult(null)
        const toastId = toast.loading('🔍 Scanning text… please wait')
        try {
            const { createWorker } = await import('tesseract.js')

            const worker = await createWorker(lang, 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100))
                    }
                },
            })

            const { data } = await worker.recognize(file)
            await worker.terminate()

            const text = data.text.trim()
            if (!text) {
                toast.dismiss(toastId)
                toast.error('No text found in this image. Try a clearer image.')
                setLoading(false)
                return
            }

            setResult({
                text,
                confidence: Math.round(data.confidence),
                wordCount: text.split(/\s+/).filter(Boolean).length,
                charCount: text.length,
            })
            setProgress(100)
            toast.dismiss(toastId)
            toast.success(`✅ ${text.split(/\s+/).filter(Boolean).length} words extracted!`)
        } catch (err) {
            toast.dismiss(toastId)
            console.error('OCR error:', err)
            toast.error('OCR failed — try a clearer, higher resolution image')
        } finally {
            setLoading(false)
        }
    }

    // ── Copy to clipboard ─────────────────────────────────────────────
    async function handleCopy() {
        if (!result?.text) return
        await navigator.clipboard.writeText(result.text)
        setCopied(true)
        toast.success('Text copied!')
        setTimeout(() => setCopied(false), 2000)
    }

    // ── Download as .txt ──────────────────────────────────────────────
    function handleDownload() {
        if (!result?.text) return
        const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `ocr-${file.name.replace(/\.[^.]+$/, '')}.txt`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Downloaded as .txt!')
    }

    // ── Reset ─────────────────────────────────────────────────────────
    function handleReset() {
        setFile(null); setPreview(null)
        setResult(null); setProgress(0)
    }

    // ── Confidence color ──────────────────────────────────────────────
    const confColor = result
        ? result.confidence >= 80 ? '#22c55e'
        : result.confidence >= 50 ? '#f59e0b'
        : '#ef4444'
        : '#94a3b8'

    return (
        <div className="page">

            {/* Header */}
            <div className="back-header">
                <button className="back-btn" onClick={() => nav('/dashboard')}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <div className="page-title">Smart OCR</div>
                    <div className="page-sub">Extract text from any image · English &amp; Hindi · 100% free</div>
                </div>
            </div>

            {/* Badge */}
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(6,182,212,0.12))',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 20, padding: '5px 14px', marginBottom: 16,
                fontSize: 12, fontWeight: 700, color: '#34d399',
            }}>
                <ScanText size={14} /> Powered by Tesseract.js · Runs in browser · No API key
            </div>

            {/* Language selector */}
            <div style={{ marginBottom: 16 }}>
                <div className="section-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Languages size={14} /> Select Language
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {LANGUAGES.map((l) => (
                        <button
                            key={l.code}
                            onClick={() => setLang(l.code)}
                            className="option-pill"
                            style={{
                                borderColor: lang === l.code ? 'var(--success, #22c55e)' : 'var(--border)',
                                background: lang === l.code ? 'rgba(34,197,94,0.12)' : 'var(--card)',
                                color: lang === l.code ? '#22c55e' : 'var(--text)',
                                fontWeight: lang === l.code ? 700 : 500,
                                fontSize: 13, padding: '7px 16px',
                            }}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>

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
                                alt="uploaded"
                                style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 10, objectFit: 'contain' }}
                            />
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                                {file.name} · {Math.round(file.size / 1024)} KB · Tap to change
                            </span>
                        </>
                    ) : (
                        <>
                            <ImageIcon size={44} color="#10b981" style={{ opacity: 0.85 }} />
                            <span style={{ color: 'var(--muted)', fontSize: 15 }}>
                                {isDragActive ? 'Drop image here' : 'Tap or drag image here'}
                            </span>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {['📄 Document', '📝 Handwritten', '🪪 ID Card', '📜 Form', '📸 Signboard'].map(t => (
                                    <span key={t} style={{
                                        fontSize: 11, padding: '2px 8px', borderRadius: 6,
                                        background: 'rgba(16,185,129,0.1)', color: '#34d399', fontWeight: 600,
                                    }}>{t}</span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Progress bar (while processing) */}
            {loading && (
                <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            Scanning image…
                        </span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{progress}%</span>
                    </div>
                    <div className="progress-wrap">
                        <div className="progress-bar" style={{
                            width: `${progress}%`,
                            background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                            transition: 'width 0.3s ease',
                        }} />
                    </div>
                </div>
            )}

            {/* Scan button */}
            {!result && (
                <button
                    className="btn-primary"
                    onClick={handleOcr}
                    disabled={loading || !file}
                    style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                >
                    {loading
                        ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Scanning…</>
                        : <><ScanText size={18} /> Extract Text</>
                    }
                </button>
            )}

            {/* Result */}
            {result && (
                <div style={{ animation: 'fadeSlide 0.4s ease both' }}>

                    {/* Stats row */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 10, marginBottom: 14,
                    }}>
                        {[
                            { label: 'Words',      val: result.wordCount, color: '#10b981' },
                            { label: 'Characters', val: result.charCount, color: '#06b6d4' },
                            { label: 'Confidence', val: `${result.confidence}%`, color: confColor },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: 'var(--card)', border: '1px solid var(--border)',
                                borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                                borderTop: `3px solid ${s.color}`,
                            }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Confidence note */}
                    {result.confidence < 70 && (
                        <div style={{
                            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                            borderRadius: 8, padding: '8px 12px', marginBottom: 10,
                            fontSize: 12, color: '#f59e0b',
                        }}>
                            ⚠️ Low confidence ({result.confidence}%) — try a clearer, higher-contrast image for better results
                        </div>
                    )}

                    {/* Extracted text box */}
                    <div style={{ marginBottom: 12 }}>
                        <div style={{
                            fontSize: 12, fontWeight: 700, color: 'var(--muted)',
                            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <FileText size={13} /> Extracted Text
                        </div>
                        <textarea
                            ref={textRef}
                            value={result.text}
                            onChange={(e) => setResult(prev => ({ ...prev, text: e.target.value }))}
                            rows={8}
                            style={{
                                width: '100%', padding: '12px 14px',
                                background: 'var(--card)', border: '1.5px solid var(--border)',
                                borderRadius: 10, color: 'var(--text)',
                                fontSize: 13.5, lineHeight: 1.7,
                                fontFamily: 'Inter, monospace',
                                resize: 'vertical', outline: 'none',
                                boxSizing: 'border-box',
                            }}
                            onFocus={e => e.target.style.borderColor = '#10b981'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                            ✏️ You can edit the text above before copying/downloading
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                            className="btn-primary"
                            onClick={handleCopy}
                            style={{
                                flex: 1,
                                background: copied
                                    ? 'linear-gradient(135deg,#22c55e,#16a34a)'
                                    : 'linear-gradient(135deg,#10b981,#06b6d4)',
                            }}
                        >
                            {copied
                                ? <><CheckCheck size={18} /> Copied!</>
                                : <><Copy size={18} /> Copy Text</>
                            }
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={handleDownload}
                            style={{ flex: 1 }}
                        >
                            <Download size={16} /> Save as .txt
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={handleReset}
                            style={{ flex: '0 0 auto' }}
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
