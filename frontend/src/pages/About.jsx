import { Shield, Zap, QrCode, FileImage, FileText, PenLine, Users, Globe, Star } from 'lucide-react'
import { useLanguage } from '../LanguageContext'

const features = [
    { icon: FileImage, label: 'Passport Photo Generator', desc: 'Auto-layout A4 sheets with cutting guides in seconds.' },
    { icon: FileText,  label: 'PDF Suite',                desc: 'Merge, compress, and convert files to PDF — all in-browser.' },
    { icon: Zap,       label: 'Image Compressor',         desc: 'Hit exact KB targets without visible quality loss.' },
    { icon: PenLine,   label: 'Signature Creator',        desc: 'Draw or upload a signature with AI background removal.' },
    { icon: QrCode,    label: 'QR File Transfer',         desc: 'Customers scan a QR, files appear on your PC instantly.' },
]

const team = [
    { initial: 'AB', name: 'Abhishek Jain', role: 'Founder & Lead Engineer', color: '#4f46e5' },
    { initial: 'CS', name: 'CyberSathi AI', role: 'AI Processing Engine',    color: '#10b981' },
]

export default function About() {
    const { t } = useLanguage()

    return (
        <div className="page" style={{ maxWidth: '860px', margin: '0 auto', animation: 'fadeSlide 0.5s ease both' }}>

            {/* Hero */}
            <div style={{
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(79,70,229,0.12) 0%, rgba(124,58,237,0.08) 100%)',
                border: '1px solid rgba(99,102,241,0.2)',
                padding: '40px 32px',
                marginBottom: '28px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: '-60px', right: '-60px',
                    width: '200px', height: '200px', borderRadius: '50%',
                    background: 'rgba(79,70,229,0.15)', filter: 'blur(60px)',
                    pointerEvents: 'none'
                }} />
                <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(79,70,229,0.35)'
                }}>
                    <Shield size={26} color="#fff" />
                </div>
                <h1 style={{ fontSize: '30px', fontWeight: 900, color: 'var(--text)', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                    About CyberSathi
                </h1>
                <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: '1.7', maxWidth: '580px', margin: '0 auto' }}>
                    CyberSathi is a modern SaaS toolkit built specifically for Indian cyber café operators and digital service centres —
                    helping them process customer files faster, smarter, and without any friction.
                </p>
            </div>

            {/* Mission */}
            <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Our Mission</span>
                </div>
                <p style={{ color: 'var(--text)', lineHeight: '1.75', fontSize: '15px' }}>
                    We believe every cyber café operator deserves enterprise-grade digital tools — at zero cost to start.
                    CyberSathi removes the complexity from everyday tasks like passport photo printing, PDF handling,
                    and mobile file transfers. We make the complex simple, so you can serve more customers in less time.
                </p>
            </div>

            {/* Features grid */}
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '16px' }}>
                What We Power
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                {features.map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="card" style={{ padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                            background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Icon size={18} color="var(--primary)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{label}</div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.5' }}>{desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
                {[
                    { val: '2,000+', label: 'Active Operators', icon: Users },
                    { val: '5',      label: 'Integrated Tools',  icon: Zap },
                    { val: '99.9%',  label: 'Uptime SLA',        icon: Star },
                ].map(({ val, label, icon: Icon }) => (
                    <div key={label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
                        <Icon size={20} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text)' }}>{val}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, marginTop: '3px' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Team */}
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '16px' }}>
                The Team
            </h2>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
                {team.map(({ initial, name, role, color }) => (
                    <div key={name} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', flex: '1', minWidth: '220px' }}>
                        <div style={{
                            width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                            background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 900, fontSize: '16px'
                        }}>{initial}</div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{role}</div>
                        </div>
                    </div>
                ))}
            </div>

            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                Built with ❤️ for India's digital service operators · CyberSathi © {new Date().getFullYear()}
            </p>
        </div>
    )
}
