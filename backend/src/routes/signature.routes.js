/**
 * signature.routes.js – Transparent PNG via Cloudinary.
 * Protected: requires authentication. Tracks per-user monthly usage.
 *
 * Two modes:
 *  POST /signature/generate          — multipart file upload (FormData)
 *  POST /signature/generate-from-url — JSON { url, threshold } preloaded from Recent Files
 */
const router = require('express').Router();
const upload = require('../middleware/multer');
const authenticate = require('../middleware/authenticate');
const { removeBackground } = require('../services/signature.service');
const { uploadBuffer, downloadBuffer } = require('../utils/cloudinary');
const User = require('../models/User');

// ── Shared helper ───────────────────────────────────────────────────────────
async function processSignature(buffer, threshold, userId) {
    const resultBuffer = await removeBackground(buffer, threshold);
    const { url } = await uploadBuffer(resultBuffer, {
        folder: 'mp-online-hub/signatures',
        resource_type: 'image',
        format: 'png',
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    await User.findByIdAndUpdate(userId, {
        $inc: { 'usage.signature': 1 },
        $set: { 'usage.month': currentMonth },
    });

    return { url };
}

// ── POST /signature/generate  (multipart upload) ────────────────────────────
router.post('/generate', authenticate, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image required' });
    try {
        const threshold = parseInt(req.body.threshold || '200', 10);
        const result = await processSignature(req.file.buffer, threshold, req.user.id);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Signature error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /signature/generate-from-url  (preloaded Cloudinary URL) ───────────
// Body: { url: <cloudinary-url>, threshold? }
router.post('/generate-from-url', authenticate, async (req, res) => {
    const { url, threshold = 200 } = req.body;
    if (!url || !url.includes('cloudinary.com')) {
        return res.status(400).json({ success: false, message: 'Valid Cloudinary URL required' });
    }
    try {
        const buffer = await downloadBuffer(url);
        const result = await processSignature(buffer, parseInt(threshold, 10), req.user.id);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Signature from-url error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET /signature/download?url=<cloudinary-url>&name=<filename> ────────────
router.get('/download', authenticate, async (req, res) => {
    const { url, name = 'signature.png' } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'url query param required' });
    const decoded = decodeURIComponent(url);
    if (!decoded.includes('cloudinary.com')) {
        return res.status(400).json({ success: false, message: 'Invalid URL' });
    }
    try {
        const buffer = await downloadBuffer(decoded);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (err) {
        console.error('Signature proxy download error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
