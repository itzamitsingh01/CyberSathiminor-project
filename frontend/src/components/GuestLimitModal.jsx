/**
 * GuestLimitModal.jsx – Shown when a guest exhausts their free uses for a tool.
 * Clean, non-annoying, premium upsell.
 */
import { useNavigate } from 'react-router-dom'
import { Shield, LogIn, UserPlus, X, Zap, Star } from 'lucide-react'
import { useEffect } from 'react'
import './GuestLimitModal.css'

const TOOL_LABELS = {
    passport:  'Passport Photo',
    compress:  'Image Compressor',
    pdf:       'PDF Tools',
    signature: 'Signature Generator',
    removeBg:  'Background Remover',
    qrSession: 'QR Upload Session',
}

export default function GuestLimitModal({ open, tool, onClose }) {
    const navigate = useNavigate()

    // Lock scroll when open
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    if (!open) return null

    const toolLabel = TOOL_LABELS[tool] || 'this tool'

    return (
        <div className="glm-overlay" onClick={onClose}>
            <div className="glm-card" onClick={e => e.stopPropagation()}>
                {/* Close */}
                <button className="glm-close" onClick={onClose} aria-label="Close">
                    <X size={18} />
                </button>

                {/* Icon + heading */}
                <div className="glm-icon-wrap">
                    <div className="glm-icon-ring" />
                    <div className="glm-icon">
                        <Shield size={28} color="#4f46e5" />
                    </div>
                </div>

                <h2 className="glm-title">You've used your free quota</h2>
                <p className="glm-sub">
                    You've reached the guest limit for{' '}
                    <strong>{toolLabel}</strong>.
                    Create a free account to keep going — no credit card needed.
                </p>

                {/* Benefits */}
                <ul className="glm-perks">
                    <li><span className="glm-perk-dot green" /><span>Free account: 20+ uses per tool/month</span></li>
                    <li><span className="glm-perk-dot purple" /><span>Premium: unlimited everything for ₹199/mo</span></li>
                    <li><span className="glm-perk-dot amber" /><span>QR sessions, history & priority processing</span></li>
                </ul>

                {/* Actions */}
                <div className="glm-actions">
                    <button
                        className="glm-btn glm-btn-primary"
                        onClick={() => { onClose(); navigate('/register') }}
                    >
                        <UserPlus size={17} />
                        Create Free Account
                    </button>
                    <button
                        className="glm-btn glm-btn-secondary"
                        onClick={() => { onClose(); navigate('/login') }}
                    >
                        <LogIn size={17} />
                        Sign In
                    </button>
                </div>

                {/* Premium badge */}
                <div className="glm-premium-strip">
                    <Star size={13} color="#f59e0b" fill="#f59e0b" />
                    <span>Premium plan — ₹199/month · Cancel anytime</span>
                    <button
                        className="glm-link"
                        onClick={() => { onClose(); navigate('/register') }}
                    >
                        Upgrade <Zap size={12} />
                    </button>
                </div>
            </div>
        </div>
    )
}
