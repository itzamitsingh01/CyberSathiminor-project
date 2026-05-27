/**
 * OtpInput.jsx – 6-box OTP input with keyboard navigation, paste support
 */
import { useRef, useState } from 'react'

export default function OtpInput({ length = 6, value = '', onChange, hasError = false }) {
    const inputs = useRef([])
    const digits = value.split('')

    function handleChange(e, idx) {
        const val = e.target.value.replace(/\D/g, '').slice(-1)
        const next = [...digits]
        next[idx] = val
        onChange(next.join(''))
        if (val && idx < length - 1) {
            inputs.current[idx + 1]?.focus()
        }
    }

    function handleKeyDown(e, idx) {
        if (e.key === 'Backspace') {
            if (digits[idx]) {
                const next = [...digits]
                next[idx] = ''
                onChange(next.join(''))
            } else if (idx > 0) {
                inputs.current[idx - 1]?.focus()
            }
        } else if (e.key === 'ArrowLeft' && idx > 0) {
            inputs.current[idx - 1]?.focus()
        } else if (e.key === 'ArrowRight' && idx < length - 1) {
            inputs.current[idx + 1]?.focus()
        }
    }

    function handlePaste(e) {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
        onChange(pasted.padEnd(length, '').slice(0, length))
        const focusIdx = Math.min(pasted.length, length - 1)
        inputs.current[focusIdx]?.focus()
    }

    return (
        <div className="otp-row">
            {Array.from({ length }).map((_, idx) => (
                <input
                    key={idx}
                    ref={(el) => (inputs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[idx] || ''}
                    onChange={(e) => handleChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={handlePaste}
                    className={`otp-cell ${digits[idx] ? 'filled' : ''} ${hasError ? 'error-cell' : ''}`}
                    autoComplete="one-time-code"
                    aria-label={`OTP digit ${idx + 1}`}
                />
            ))}
        </div>
    )
}
