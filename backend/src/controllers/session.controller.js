/**
 * session.controller.js – handles session creation and retrieval.
 */
const sessionService = require('../services/session.service');
const User = require('../models/User');

/**
 * POST /session/create
 * Body: { toolType: string, frontendUrl: string }
 * Requires: authenticated user (req.user set by authenticate middleware)
 */
async function createSession(req, res) {
    try {
        const { toolType = 'general', frontendUrl } = req.body;
        const baseUrl = frontendUrl || `${req.protocol}://${req.get('host')}`;

        // Pass userId so the session is owned by the operator (M-4 fix)
        const session = await sessionService.createSession(toolType, baseUrl, req.user.id);

        // Track QR session usage
        const currentMonth = new Date().toISOString().slice(0, 7);
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { 'usage.qrSessions': 1 },
            $set: { 'usage.month': currentMonth },
        });

        res.json({ success: true, session });
    } catch (err) {
        console.error('createSession error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * GET /session/:id
 */
async function getSession(req, res) {
    try {
        const session = await sessionService.getSession(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found or expired' });

        // Strip internal Mongo fields before returning
        const { sessionId, toolType, uploadUrl, qrDataUrl, expiresAt, files } = session;
        res.json({ success: true, session: { sessionId, toolType, uploadUrl, qrDataUrl, expiresAt, files } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * DELETE /session/:id  (optional manual end)
 */
async function deleteSession(req, res) {
    try {
        await sessionService.expireSession(req.params.id);
        res.json({ success: true, message: 'Session ended.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { createSession, getSession, deleteSession };
