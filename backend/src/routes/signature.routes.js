/**
 * signature.routes.js – Transparent PNG via Cloudinary.
 * Protected: requires authentication. Tracks per-user monthly usage.
 */
const router = require('express').Router();
const upload = require('../middleware/multer');
const authenticate = require('../middleware/authenticate');
const { removeBackground } = require('../services/signature.service');
const { uploadBuffer, downloadBuffer } = require('../utils/cloudinary');
const User = require('../models/User');

router.post('/generate', authenticate, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image required' });
    try {
        const threshold = parseInt(req.body.threshold || '200', 10);
        const resultBuffer = await removeBackground(req.file.buffer, threshold);
        const { url } = await uploadBuffer(resultBuffer, {
            folder: 'mp-online-hub/signatures',
            resource_type: 'image',
            format: 'png',
        });

        // Increment monthly usage counter
        const currentMonth = new Date().toISOString().slice(0, 7);
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { 'usage.signature': 1 },
            $set: { 'usage.month': currentMonth },
        });

        res.json({ success: true, url });
    } catch (err) {
        console.error('Signature error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /signature/download?url=<cloudinary-url>&name=<filename>
// Proxy: fetches image from Cloudinary server-side and streams it to the browser.
// Avoids cross-origin download attribute restrictions.
router.get('/download', authenticate, async (req, res) => {
    const { url, name = 'signature.png' } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'url query param required' });
    // Only allow Cloudinary URLs
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
