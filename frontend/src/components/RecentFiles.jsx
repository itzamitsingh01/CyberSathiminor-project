/**
 * RecentFiles.jsx — Dashboard panel showing the last 10 uploaded files.
 *
 * Hover a card → action overlay appears (Google Drive / Canva style):
 *   📷 Passport Photo  📦 Compress  📄 PDF Tools  ✍ Signature  🖨 Print  ⬇ Download  🗑 Delete
 *
 * Clicking a tool action navigates to the tool page with ?fileId=&fileUrl= query params
 * so the tool page can preload the file without a second upload.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
    Camera, FileArchive, FileText, PenLine, Printer,
    Download, Trash2, Clock, RefreshCw, Loader2, Image,
} from 'lucide-react'
import { useRecentFiles } from '../hooks/useRecentFiles'

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' · ' + d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

function isImage(fileType) {
    return fileType?.startsWith('image/')
}

function typeBadge(fileType) {
    if (fileType === 'application/pdf') return { label: 'PDF', color: '#f59e0b' }
    if (fileType?.startsWith('image/')) return { label: 'IMG', color: '#6366f1' }
    return { label: 'FILE', color: '#64748b' }
}

// ── Action menu definition ───────────────────────────────────────────────────
function getActions(file) {
    const img = isImage(file.fileType)
    return [
        img && { id: 'passport',  label: 'Passport Photo', icon: Camera,      color: '#6366f1', path: '/passport' },
        {       id: 'compress',   label: 'Compress',        icon: FileArchive, color: '#f59e0b', path: '/compress' },
        {       id: 'pdf',        label: 'PDF Tools',       icon: FileText,    color: '#10b981', path: '/pdf' },
        img && { id: 'signature', label: 'Signature Tool',  icon: PenLine,     color: '#ec4899', path: '/signature' },
    ].filter(Boolean)
}

// ── Single file card ─────────────────────────────────────────────────────────
function FileCard({ file, onDelete }) {
    const nav = useNavigate()
    const [hovered, setHovered] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const badge = typeBadge(file.fileType)
    const img = isImage(file.fileType)
    const actions = getActions(file)

    function openTool(path) {
        const params = new URLSearchParams({
            fileId:   file._id,
            fileUrl:  file.cloudinaryUrl,
            fileName: file.originalName,
        })
        nav(`${path}?${params.toString()}`)
    }

    function printFile() {
        if (!img) return
        const iframe = document.createElement('iframe')
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
        document.body.appendChild(iframe)
        iframe.contentDocument.write(`
            <html><head><title>${file.originalName}</title>
            <style>@page{size:auto;margin:8mm}body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh}img{max-width:100%;max-height:100%}</style>
            </head><body><img src="${file.cloudinaryUrl}" onload="window.focus();window.print();" /></body></html>`)
        setTimeout(() => document.body.removeChild(iframe), 15000)
    }

    async function handleDelete() {
        if (deleting) return
        setDeleting(true)
        try {
            await onDelete(file._id)
            toast.success('File deleted')
        } catch (err) {
            toast.error(err.message)
            setDeleting(false)
        }
    }

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                borderRadius: 16,
                border: `1.5px solid ${hovered ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                background: hovered ? 'rgba(99,102,241,0.04)' : 'var(--card)',
                transition: 'all 0.18s ease',
                overflow: 'hidden',
                boxShadow: hovered ? '0 8px 24px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.05)',
                transform: hovered ? 'translateY(-2px)' : 'none',
            }}
        >
            {/* ── Thumbnail ── */}
            <div style={{
                width: '100%', aspectRatio: '4/3',
                background: 'var(--input-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative',
            }}>
                {img ? (
                    <img
                        src={file.cloudinaryUrl}
                        alt={file.originalName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                    />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <FileText size={36} color={badge.color} style={{ opacity: 0.7 }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: badge.color }}>{badge.label}</span>
                    </div>
                )}

                {/* Type badge overlay */}
                <div style={{
                    position: 'absolute', top: 8, left: 8,
                    background: badge.color + 'cc',
                    color: '#fff', fontSize: 9, fontWeight: 800,
                    padding: '2px 7px', borderRadius: 6, letterSpacing: '0.04em',
                }}>
                    {badge.label}
                </div>
            </div>

            {/* ── File info ── */}
            <div style={{ padding: '10px 12px' }}>
                <div style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: 3,
                }}>
                    {file.originalName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--muted)' }}>
                    <span>{formatBytes(file.fileSize)}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <Clock size={9} />
                    <span>{formatTime(file.createdAt)}</span>
                </div>
            </div>

            {/* ── Hover action overlay ── */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(10,8,28,0.82)',
                backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 6, padding: 12,
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.18s ease',
                pointerEvents: hovered ? 'auto' : 'none',
                borderRadius: 16,
            }}>
                {/* Tool actions */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 4 }}>
                    {actions.map(action => {
                        const Icon = action.icon
                        return (
                            <button
                                key={action.id}
                                onClick={() => openTool(action.path)}
                                title={action.label}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                                    background: action.color + '22',
                                    border: `1px solid ${action.color}55`,
                                    color: action.color,
                                    cursor: 'pointer', transition: 'all 0.12s',
                                    whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = action.color + '44'
                                    e.currentTarget.style.transform = 'scale(1.05)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = action.color + '22'
                                    e.currentTarget.style.transform = 'scale(1)'
                                }}
                            >
                                <Icon size={12} /> {action.label}
                            </button>
                        )
                    })}
                </div>

                {/* Utility actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                    {img && (
                        <button
                            onClick={printFile}
                            title="Print"
                            style={{
                                width: 32, height: 32, borderRadius: 9,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)',
                                color: '#34d399', cursor: 'pointer', transition: 'all 0.12s',
                            }}
                        >
                            <Printer size={13} />
                        </button>
                    )}
                    <a
                        href={file.cloudinaryUrl}
                        download={file.originalName}
                        target="_blank"
                        rel="noreferrer"
                        title="Download"
                        style={{
                            width: 32, height: 32, borderRadius: 9,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
                            color: '#818cf8', textDecoration: 'none', transition: 'all 0.12s',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <Download size={13} />
                    </a>
                    <button
                        onClick={handleDelete}
                        title="Delete"
                        disabled={deleting}
                        style={{
                            width: 32, height: 32, borderRadius: 9,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                            color: '#f87171', cursor: 'pointer', transition: 'all 0.12s',
                            opacity: deleting ? 0.5 : 1,
                        }}
                    >
                        {deleting ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={13} />}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center', padding: '40px 20px',
            background: 'var(--input-bg)', border: '1.5px dashed var(--border)',
            borderRadius: 16,
        }}>
            <Image size={36} color="var(--muted)" style={{ opacity: 0.4, margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                No recent uploads
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                Start a QR session and have a customer upload a file — it will appear here instantly.
            </p>
        </div>
    )
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function RecentFiles() {
    const { files, loading, error, refresh, deleteFile } = useRecentFiles()

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 18,
            }}>
                <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                        Recent Uploads
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>
                        Hover a file to see available actions
                    </p>
                </div>
                <button
                    onClick={refresh}
                    disabled={loading}
                    title="Refresh"
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        background: 'var(--input-bg)', border: '1px solid var(--border)',
                        color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                >
                    <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
                    {loading ? 'Loading…' : 'Refresh'}
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: 13, color: '#f87171',
                }}>
                    {error}
                </div>
            )}

            {/* Cards grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 14,
            }}>
                {files.length === 0 && !loading
                    ? <EmptyState />
                    : files.map(file => (
                        <FileCard
                            key={file._id}
                            file={file}
                            onDelete={deleteFile}
                        />
                    ))
                }
            </div>
        </div>
    )
}
