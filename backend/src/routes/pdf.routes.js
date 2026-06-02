/**
 * pdf.routes.js – All PDF operations; files arrive as memory buffers, output → Cloudinary.
 * Protected: requires authentication. Tracks per-user monthly usage.
 */
const router = require('express').Router();
const upload = require('../middleware/multer');
const authenticate = require('../middleware/authenticate');
const { mergePdfs, jpgToPdf, compressPdf } = require('../services/pdf.service');
const { uploadBuffer, downloadBuffer } = require('../utils/cloudinary');
const User = require('../models/User');

// ── Usage tracking helper ────────────────────────────────────────────────────
async function trackUsage(userId) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    await User.findByIdAndUpdate(userId, {
        $inc: { 'usage.pdf': 1 },
        $set: { 'usage.month': currentMonth },
    });
}

// POST /pdf/merge  — multiple PDFs (field: "pdfs")
router.post('/merge', authenticate, upload.array('pdfs', 10), async (req, res) => {
    if (!req.files || req.files.length < 2)
        return res.status(400).json({ success: false, message: 'At least 2 PDFs required (max 10)' });
    try {
        const buffers = req.files.map((f) => f.buffer);
        const merged = await mergePdfs(buffers);
        const { url } = await uploadBuffer(merged, { folder: 'mp-online-hub/pdf', resource_type: 'raw', format: 'pdf' });
        await trackUsage(req.user.id);
        res.json({ success: true, url, pages: req.files.length });
    } catch (err) {
        console.error('PDF merge error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /pdf/jpg-to-pdf  — multiple images (field: "images")
router.post('/jpg-to-pdf', authenticate, upload.array('images', 20), async (req, res) => {
    if (!req.files || req.files.length === 0)
        return res.status(400).json({ success: false, message: 'At least 1 image required' });
    try {
        const buffers = req.files.map((f) => f.buffer);
        const pdf = await jpgToPdf(buffers);
        const { url } = await uploadBuffer(pdf, { folder: 'mp-online-hub/pdf', resource_type: 'raw', format: 'pdf' });
        await trackUsage(req.user.id);
        res.json({ success: true, url, pages: req.files.length });
    } catch (err) {
        console.error('JPG-to-PDF error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /pdf/compress  — single PDF (field: "pdf")
router.post('/compress', authenticate, upload.single('pdf'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'PDF required' });
    try {
        const originalSizeKB = Math.round(req.file.size / 1024);
        const compressed = await compressPdf(req.file.buffer);
        const finalSizeKB = Math.round(compressed.length / 1024);
        const { url } = await uploadBuffer(compressed, { folder: 'mp-online-hub/pdf', resource_type: 'raw', format: 'pdf' });
        await trackUsage(req.user.id);
        res.json({ success: true, url, originalSizeKB, finalSizeKB });
    } catch (err) {
        console.error('PDF compress error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /pdf/from-session  — merge PDFs uploaded via QR session (by Cloudinary URLs)
router.post('/from-session', authenticate, async (req, res) => {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length < 1)
        return res.status(400).json({ success: false, message: 'No URLs provided' });
    if (urls.some(u => typeof u !== 'string' || !u.includes('cloudinary.com')))
        return res.status(400).json({ success: false, message: 'Invalid URL in list' });
    try {
        const buffers = await Promise.all(urls.map(downloadBuffer));
        const merged = await mergePdfs(buffers);
        const { url } = await uploadBuffer(merged, { folder: 'mp-online-hub/pdf', resource_type: 'raw', format: 'pdf' });
        await trackUsage(req.user.id);
        res.json({ success: true, url });
    } catch (err) {
        console.error('PDF from-session error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /pdf/jpg-to-pdf-from-url — convert a single preloaded Cloudinary image to PDF (no re-upload)
// Body: { url: <cloudinary-image-url> }
router.post('/jpg-to-pdf-from-url', authenticate, async (req, res) => {
    const { url } = req.body;
    if (!url || !url.includes('cloudinary.com'))
        return res.status(400).json({ success: false, message: 'Valid Cloudinary URL required' });
    try {
        const buffer = await downloadBuffer(url);
        const pdf = await jpgToPdf([buffer]);
        const { url: resultUrl } = await uploadBuffer(pdf, { folder: 'mp-online-hub/pdf', resource_type: 'raw', format: 'pdf' });
        await trackUsage(req.user.id);
        res.json({ success: true, url: resultUrl, pages: 1 });
    } catch (err) {
        console.error('PDF jpg-to-pdf-from-url error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /pdf/download?url=<cloudinary-url>&name=<filename>
router.get('/download', authenticate, async (req, res) => {
    const { url, name = 'document.pdf' } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'url query param required' });
    const decoded = decodeURIComponent(url);
    if (!decoded.includes('cloudinary.com'))
        return res.status(400).json({ success: false, message: 'Invalid URL' });
    try {
        const buffer = await downloadBuffer(decoded);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (err) {
        console.error('PDF proxy download error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
