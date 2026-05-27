/**
 * useGuestLimit.js – Hook used inside tool pages to gate guest usage.
 *
 * Usage:
 *   const { checkAndConsume, GuestModal } = useGuestLimit('passport')
 *   // before processing:
 *   if (!checkAndConsume()) return   // modal auto-shows
 *   // render modal anywhere:
 *   <GuestModal />
 */
import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import useGuestStore from '../store/guestStore'
import GuestLimitModal from '../components/GuestLimitModal'

export function useGuestLimit(tool) {
    const { isLoggedIn } = useAuth()
    const { canUse, consume, remaining } = useGuestStore()
    const [showModal, setShowModal] = useState(false)

    const checkAndConsume = useCallback(() => {
        if (isLoggedIn) return true          // logged-in users bypass
        if (canUse(tool)) {
            consume(tool)
            return true
        }
        setShowModal(true)
        return false
    }, [isLoggedIn, canUse, consume, tool])

    const Modal = () => (
        <GuestLimitModal
            open={showModal}
            tool={tool}
            onClose={() => setShowModal(false)}
        />
    )

    return {
        checkAndConsume,
        remainingUses: isLoggedIn ? Infinity : remaining(tool),
        GuestModal: Modal,
    }
}
