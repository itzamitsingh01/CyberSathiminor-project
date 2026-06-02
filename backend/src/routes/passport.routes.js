/**
 * passport.routes.js – Buffer-in → Cloudinary URL out.
 * Accepts: image, count, removeBg, personName, showDate, stampDate, dateFormat, cropPosition
 * Protected: requires authentication. Tracks per-user monthly usage.
 *
 * Two modes:
 *  POST /generate          — multipart file upload (FormData)
 *  POST /generate-from-url — JSON { url } preloaded from Recent Files (no re-upload)
 */
const router = require('express').Router();
const upload = require('../middleware/multer');
const authenticate = require('../middleware/authenticate');
const { generatePassportPhoto } = require('../services/passport.service');
const { uploadBuffer, downloadBuffer } = require('../utils/cloudinary');
const User = require('../models/User');

// ── Shared processing helper ────────────────────────────────────────────────
async function processPassport(buffer, body, userId) {
    const count        = parseInt(body.count || '8', 10);
    const removeBg     = body.removeBg === 'true' || body.removeBg === true;
    const personName   = body.personName  || '';
    const showDate     = body.showDate === 'true' || body.showDate === true;
    const stampDate    = body.stampDate   || '';
    const dateFormat   = body.dateFormat  || 'DD-MM-YYYY';
    const cropPosition = body.cropPosition || 'center';

    const resultBuffer = await generatePassportPhoto(
        buffer, count, removeBg,
        { personName, showDate, stampDate, dateFormat, cropPosition }
    );

    const { url } = await uploadBuffer(resultBuffer, {
        folder: 'mp-online-hub/passport',
        resource_type: 'image',
        format: 'png',
    });

    // Increment monthly usage counter
    const currentMonth = new Date().toISOString().slice(0, 7);
    await User.findByIdAndUpdate(userId, {
        $inc: { 'usage.passport': 1 },
        $set: { 'usage.month': currentMonth },
    });

    return { url, count };
}

// ── POST /passport/generate  (multipart upload) ─────────────────────────────
router.post('/generate', authenticate, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Image file required' });
    try {
        const result = await processPassport(req.file.buffer, req.body, req.user.id);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Passport error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /passport/generate-from-url  (preloaded Cloudinary URL) ────────────
// Body: { url: <cloudinary-url>, count, removeBg, personName, ... }
router.post('/generate-from-url', authenticate, async (req, res) => {
    const { url } = req.body;
    if (!url || !url.includes('cloudinary.com')) {
        return res.status(400).json({ success: false, message: 'Valid Cloudinary URL required' });
    }
    try {
        const buffer = await downloadBuffer(url);
        const result = await processPassport(buffer, req.body, req.user.id);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Passport from-url error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
