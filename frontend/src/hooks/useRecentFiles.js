/**
 * useRecentFiles.js — Fetches and manages the recent uploaded files list.
 * Polls every 30 seconds when mounted and refreshes after socket events.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'
import useAuthStore from '../store/authStore'

export function useRecentFiles() {
    const [files, setFiles]     = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState(null)
    const { accessToken }       = useAuthStore()
    const pollRef               = useRef(null)

    const fetchFiles = useCallback(async () => {
        if (!accessToken) return
        setLoading(true)
        setError(null)
        try {
            const res = await api.get('/files/recent?limit=10')
            setFiles(res.data.files || [])
        } catch (err) {
            if (err.response?.status !== 401) {
                setError(err.response?.data?.message || 'Failed to load files')
            }
        } finally {
            setLoading(false)
        }
    }, [accessToken])

    // Initial fetch + 30-second polling
    useEffect(() => {
        fetchFiles()
        pollRef.current = setInterval(fetchFiles, 30_000)
        return () => clearInterval(pollRef.current)
    }, [fetchFiles])

    // Delete a file by id (Cloudinary + DB)
    const deleteFile = useCallback(async (id) => {
        try {
            await api.delete(`/files/${id}`)
            setFiles(prev => prev.filter(f => f._id !== id))
            return true
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Delete failed')
        }
    }, [])

    // Append a processing history entry
    const addHistory = useCallback(async (id, action, resultUrl = null) => {
        try {
            await api.post(`/files/${id}/history`, { action, resultUrl })
        } catch {
            // Non-critical — fail silently
        }
    }, [])

    return { files, loading, error, refresh: fetchFiles, deleteFile, addHistory }
}
