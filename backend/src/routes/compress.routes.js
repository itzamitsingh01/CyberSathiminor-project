/**
 * compress.routes.js – Memory buffer → compress → Cloudinary URL.
 * Protected: requires authentication. Tracks per-user monthly usage.
 *
 * Two modes:
 *  POST /compress          — multipart file upload (FormData)
 *  POST /compress/from-url — JSON { url, targetKB } preloaded from Recent Files
 */
const router = require('express').Router();
const upload = require('../middleware/multer');
const authenticate = require('../middleware/authenticate');
const { compressImage, compressRawPdf } = require('../services/compress.service');
const { uploadBuffer, downloadBuffer } = require('../utils/cloudinary');
const User = require('../models/User');
const path = require('path');

// ── Shared compression helper ───────────────────────────────────────────────
async function processCompress(buffer, originalname, mimetype, targetKB, userId) {
    const ext = path.extname(originalname || '').toLowerCase();
    let resultBuffer, resourceType, format, finalSizeKB;
    const originalSizeKB = Math.round(buffer.length / 1024);

    if (ext === '.pdf' || mimetype === 'application/pdf') {
        resultBuffer = await compressRawPdf(buffer);
        resourceType = 'raw';
        format = 'pdf';
        finalSizeKB = Math.round(resultBuffer.length / 1024);
    } else {
        const result = await compressImage(buffer, targetKB);
        resultBuffer = result.buffer;
        finalSizeKB = result.finalSizeKB;
        resourceType = 'image';
        format = 'jpg';
    }

    const { url } = await uploadBuffer(resultBuffer, {
        folder: 'mp-online-hub/compressed',
        resource_type: resourceType,
        format,
    });

    // Increment monthly usage counter
    const currentMonth = new Date().toISOString().slice(0, 7);
    await User.findByIdAndUpdate(userId, {
        $inc: { 'usage.compress': 1 },
        $set: { 'usage.month': currentMonth },
    });

    return { url, originalSizeKB, finalSizeKB, targetKB };
}

// ── POST /compress  (multipart upload) ─────────────────────────────────────
router.post('/', authenticate, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'File required' });
    const targetKB = parseInt(req.body.targetKB || '100', 10);
    try {
        const result = await processCompress(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            targetKB,
            req.user.id
        );
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Compress error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /compress/from-url  (preloaded Cloudinary URL) ────────────────────
// Body: { url: <cloudinary-url>, targetKB?, originalName? }
router.post('/from-url', authenticate, async (req, res) => {
    const { url, targetKB = 100, originalName = 'file' } = req.body;
    if (!url || !url.includes('cloudinary.com')) {
        return res.status(400).json({ success: false, message: 'Valid Cloudinary URL required' });
    }
    try {
        const buffer = await downloadBuffer(url);
        // Detect type from URL extension
        const isPdf = url.toLowerCase().includes('.pdf') || originalName.toLowerCase().endsWith('.pdf');
        const result = await processCompress(
            buffer,
            originalName,
            isPdf ? 'application/pdf' : 'image/jpeg',
            parseInt(targetKB, 10),
            req.user.id
        );
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Compress from-url error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
