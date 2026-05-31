import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, FileText, Download, Image, X, ChevronUp, ChevronDown } from 'lucide-react'
import { useGuestLimit } from '../hooks/useGuestLimit'

/** Fetch via backend proxy and trigger a real browser download (bypasses cross-origin download restrictions) */
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
    { id: 'merge', label: 'Merge PDFs', accent: '#6366f1' },
    { id: 'jpg-to-pdf', label: 'JPG → PDF', accent: '#10b981' },
    { id: 'compress', label: 'Compress', accent: '#f59e0b' },
]

export default function PdfTools() {
    const nav = useNavigate()
    const { checkAndConsume, GuestModal } = useGuestLimit('pdf')
    const [tab, setTab] = useState('merge')
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null) // { url, pages?, originalSizeKB?, finalSizeKB? }

    const accept = tab === 'jpg-to-pdf' ? { 'image/*': [] } : { 'application/pdf': ['.pdf'] }
    const multiple = tab !== 'compress'

    const onDrop = useCallback((accepted) => {
        setFiles((prev) => [...prev, ...accepted])
        setResult(null)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, multiple })

    function switchTab(id) { setTab(id); setFiles([]); setResult(null) }
    function removeFile(i) { setFiles((p) => p.filter((_, idx) => idx !== i)) }
    function moveUp(i) { if (i === 0) return; const a = [...files];[a[i - 1], a[i]] = [a[i], a[i - 1]]; setFiles(a) }
    function moveDown(i) { if (i === files.length - 1) return; const a = [...files];[a[i], a[i + 1]] = [a[i + 1], a[i]]; setFiles(a) }

    async function handleProcess() {
        if (!checkAndConsume()) return
        if (files.length === 0) return toast.error('Add files first')
        if (tab === 'merge' && files.length < 2) return toast.error('Need at least 2 PDFs to merge')
        setLoading(true)
        try {
            const fd = new FormData()
            let res
            if (tab === 'merge') {
                files.forEach((f) => fd.append('pdfs', f))
                res = await axios.post('/pdf/merge', fd)
            } else if (tab === 'jpg-to-pdf') {
                files.forEach((f) => fd.append('images', f))
                res = await axios.post('/pdf/jpg-to-pdf', fd)
            } else {
                fd.append('pdf', files[0])
                res = await axios.post('/pdf/compress', fd)
            }
            setResult(res.data)
            toast.success('PDF ready!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed')
        } finally { setLoading(false) }
    }

    const btnLabel = tab === 'merge' ? 'Merge PDFs' : tab === 'jpg-to-pdf' ? 'Convert to PDF' : 'Compress PDF'
    const currentTab = TABS.find((t) => t.id === tab)

    return (
        <div className="page">
            <div className="back-header">
                <button className="back-btn" onClick={() => nav('/')}><ArrowLeft size={18} /></button>
                <div>
                    <div className="page-title">PDF Tools</div>
                    <div className="page-sub">Merge · Convert · Compress</div>
                </div>
            </div>

            {/* Tab row */}
            <div className="tab-row">
                {TABS.map((t) => (
                    <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                        onClick={() => switchTab(t.id)}
                        style={tab === t.id ? { background: t.accent } : {}}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Dropzone */}
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: 16 }}>
                <input {...getInputProps()} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    {tab === 'jpg-to-pdf' ? <Image size={38} color={currentTab.accent} /> : <FileText size={38} color={currentTab.accent} />}
                    <span style={{ color: 'var(--muted)', fontSize: 15 }}>
                        {isDragActive ? 'Drop here!' : tab === 'merge'
                            ? 'Upload PDFs (2 or more)'
                            : tab === 'jpg-to-pdf'
                                ? 'Upload JPG/PNG images'
                                : 'Upload a single PDF'}
                    </span>
                </div>
            </div>

            {/* File list with reorder */}
            {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="file-item" style={{ animation: 'fadeSlide 0.25s ease both' }}>
                    <FileText size={18} color="var(--muted)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {f.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{Math.round(f.size / 1024)} KB</div>
                    </div>
                    {multiple && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <button onClick={() => moveUp(i)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 2 }}>
                                <ChevronUp size={14} />
                            </button>
                            <button onClick={() => moveDown(i)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 2 }}>
                                <ChevronDown size={14} />
                            </button>
                        </div>
                    )}
                    <button onClick={() => removeFile(i)}
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}>
                        <X size={16} />
                    </button>
                </div>
            ))}

            {files.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                    {files.length} file{files.length !== 1 ? 's' : ''} selected
                </div>
            )}

            <button className="btn-primary" onClick={handleProcess} disabled={loading}
                style={{ background: `linear-gradient(135deg,${currentTab.accent},${tab === 'merge' ? '#8b5cf6' : tab === 'jpg-to-pdf' ? '#06b6d4' : '#ef4444'})` }}>
                {loading ? <><span className="spin">◌</span> Processing…</> : <><FileText size={18} />{btnLabel}</>}
            </button>

            {/* Result */}
            {result && (
                <div className="result-success" style={{ animation: 'fadeSlide 0.4s ease both' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ color: '#34d399', fontWeight: 700, fontSize: 14 }}>✅ PDF ready</span>
                        {result.pages && <span className="badge badge-green">{result.pages} pages</span>}
                        {result.finalSizeKB && (
                            <span className="badge badge-amber">{result.originalSizeKB}KB → {result.finalSizeKB}KB</span>
                        )}
                    </div>
                    <button
                        className="btn-secondary"
                        onClick={() => downloadFile(
                            `/pdf/download?url=${encodeURIComponent(result.url)}&name=document.pdf`,
                            'document.pdf'
                        )}
                    >
                        <Download size={16} /> Download PDF
                    </button>
                </div>
            )}
            <GuestModal />
        </div>
    )
}
