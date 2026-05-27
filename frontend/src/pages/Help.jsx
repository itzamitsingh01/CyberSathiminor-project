import { QrCode, Camera, FileArchive, FileText, PenLine, HelpCircle, ChevronDown, ChevronUp, ExternalLink, Mail } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../LanguageContext'

const faqs = [
    {
        q: 'How do I use the QR File Transfer?',
        a: 'Go to QR Upload Session in the sidebar. Click "Start Session" — a QR code will appear on screen. Ask your customer to scan it with their phone\'s camera. They can upload any file directly from their phone without any app, USB cable, or WhatsApp transfer.'
    },
    {
        q: 'How do I generate a passport photo?',
        a: 'Open Passport Photo in the sidebar. Upload the customer\'s photo, select background colour (white, blue, or red), choose the count (4, 8, or 16), and click Generate. A print-ready A4 layout with cutting guides will be produced. Click Print to send it directly to your printer.'
    },
    {
        q: 'What formats does the File Compressor support?',
        a: 'The compressor supports JPEG, PNG, and WebP image formats, as well as PDF documents. You can set a target size in KB and the tool will automatically reduce the file to meet that limit while maintaining the best possible quality.'
    },
    {
        q: 'How do I merge multiple PDFs?',
        a: 'Open PDF Tools from the sidebar, select the "Merge" tab, upload multiple PDF files, arrange them in the correct order by dragging, then click Merge. The combined PDF will be ready to download instantly.'
    },
    {
        q: 'Can guest users use the tools without an account?',
        a: 'Yes! Guest users can try all tools without signing up. However, guests are limited to 3 uses per tool. Creating a free account gives you 20 uses per tool each month. Premium members get unlimited usage.'
    },
    {
        q: 'I didn\'t receive my OTP email. What should I do?',
        a: 'Check your Spam or Junk folder — email providers commonly filter automated OTP emails. If it\'s not there, wait 60 seconds and click "Resend OTP". Make sure the email address you entered is correct.'
    },
    {
        q: 'How do I reset my password?',
        a: 'Go to the Login page and click "Forgot password?". Enter your registered email, receive a 6-digit OTP, verify it, and set a new password. The process takes under 2 minutes.'
    },
    {
        q: 'Is my uploaded data secure?',
        a: 'Yes. All uploaded files are processed securely on our cloud servers and automatically deleted after your session ends. We never store customer files permanently. All connections are encrypted via HTTPS.'
    },
]

const tools = [
    { icon: Camera,      name: 'Passport Photo',    path: '/passport',   desc: 'Generate print-ready A4 layouts with cutting guides.' },
    { icon: FileArchive, name: 'File Compressor',   path: '/compress',   desc: 'Compress images and PDFs to exact KB targets.' },
    { icon: FileText,    name: 'PDF Tools',         path: '/pdf',        desc: 'Merge, compress and convert files to PDF format.' },
    { icon: PenLine,     name: 'Signature Creator', path: '/signature',  desc: 'Draw signatures or remove backgrounds to PNG.' },
    { icon: QrCode,      name: 'QR Transfer',       path: '/qr-session', desc: 'Let customers upload from their phones via QR code.' },
]

function FaqItem({ q, a }) {
    const [open, setOpen] = useState(false)
    return (
        <div
            style={{
                borderRadius: '14px',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
                borderColor: open ? 'rgba(99,102,241,0.4)' : 'var(--border)'
            }}
        >
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '16px 20px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', gap: '12px'
                }}
            >
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{q}</span>
                {open
                    ? <ChevronUp size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                    : <ChevronDown size={16} color="var(--muted)" style={{ flexShrink: 0 }} />
                }
            </button>
            {open && (
                <div style={{
                    padding: '0 20px 18px',
                    fontSize: '13.5px', color: 'var(--muted)', lineHeight: '1.7',
                    borderTop: '1px solid var(--border)', paddingTop: '14px'
                }}>
                    {a}
                </div>
            )}
        </div>
    )
}

export default function Help() {
    const { t } = useLanguage()

    return (
        <div className="page" style={{ maxWidth: '860px', margin: '0 auto', animation: 'fadeSlide 0.5s ease both' }}>

            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '6px 14px', borderRadius: '99px',
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                    marginBottom: '16px'
                }}>
                    <HelpCircle size={14} color="var(--primary)" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Help Centre
                    </span>
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                    How can we help you?
                </h1>
                <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: '1.6' }}>
                    Find quick answers to the most common questions about using CyberSathi tools.
                </p>
            </div>

            {/* Quick tool guide cards */}
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '14px' }}>
                Quick Tool Guides
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '36px' }}>
                {tools.map(({ icon: Icon, name, path, desc }) => (
                    <a
                        key={path}
                        href={path}
                        style={{ textDecoration: 'none' }}
                    >
                        <div
                            className="card"
                            style={{
                                padding: '18px', cursor: 'pointer',
                                transition: 'transform 0.18s, box-shadow 0.18s',
                                display: 'flex', gap: '12px', alignItems: 'flex-start'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-3px)'
                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(79,70,229,0.1)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                            }}
                        >
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                                background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Icon size={16} color="var(--primary)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {name} <ExternalLink size={11} color="var(--muted)" />
                                </div>
                                <div style={{ fontSize: '11.5px', color: 'var(--muted)', lineHeight: '1.4' }}>{desc}</div>
                            </div>
                        </div>
                    </a>
                ))}
            </div>

            {/* FAQ Accordion */}
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '14px' }}>
                Frequently Asked Questions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '36px' }}>
                {faqs.map(faq => <FaqItem key={faq.q} {...faq} />)}
            </div>

            {/* Contact CTA */}
            <div style={{
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(79,70,229,0.1) 0%, rgba(124,58,237,0.06) 100%)',
                border: '1px solid rgba(99,102,241,0.2)',
                padding: '28px 24px',
                textAlign: 'center'
            }}>
                <Mail size={28} color="var(--primary)" style={{ margin: '0 auto 14px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                    Still need help?
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px', lineHeight: '1.6' }}>
                    Our support team typically responds within a few hours. Drop us an email and we'll get you sorted.
                </p>
                <a
                    href="mailto:support@cybersathi.app"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '11px 24px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        color: '#fff', fontWeight: 700, fontSize: '14px',
                        textDecoration: 'none', boxShadow: '0 4px 16px rgba(79,70,229,0.35)',
                        transition: 'transform 0.18s, box-shadow 0.18s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <Mail size={15} /> support@cybersathi.app
                </a>
            </div>
        </div>
    )
}
