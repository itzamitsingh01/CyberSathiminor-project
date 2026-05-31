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
        const session = await sessionService.createSession(toolType, baseUrl);

        // Track QR session usage
        const currentMonth = new Date().toISOString().slice(0, 7);
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { 'usage.qrSessions': 1 },
            $set: { 'usage.month': currentMonth },
        });

        res.json({ success: true, session });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * GET /session/:id
 */
function getSession(req, res) {
    const session = sessionService.getSession(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found or expired' });

    // Return session but strip internal fields not needed by client
    const { sessionId, toolType, uploadUrl, qrDataUrl, expiresAt, files } = session;
    res.json({ success: true, session: { sessionId, toolType, uploadUrl, qrDataUrl, expiresAt, files } });
}

module.exports = { createSession, getSession };
