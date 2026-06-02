/**
 * files.routes.js – Recent file management for the dashboard.
 *
 * GET  /api/files/recent          – last 10 uploaded files (newest first)
 * DELETE /api/files/:id           – delete from Cloudinary + DB
 * POST /api/files/:id/history     – append a processing history entry
 */
const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const UploadedFile = require('../models/UploadedFile');
const { deleteFile } = require('../utils/cloudinary');

// ── GET /api/files/recent ─────────────────────────────────────────────────────
router.get('/recent', authenticate, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
        const files = await UploadedFile.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        res.json({ success: true, files });
    } catch (err) {
        console.error('Recent files error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── DELETE /api/files/:id ─────────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const file = await UploadedFile.findById(req.params.id).lean();
        if (!file) return res.status(404).json({ success: false, message: 'File not found' });

        // Delete from Cloudinary
        const resourceType = file.fileType?.includes('pdf') ? 'raw' : 'image';
        await deleteFile(file.cloudinaryPublicId, resourceType);

        // Remove from DB
        await UploadedFile.deleteOne({ _id: req.params.id });

        res.json({ success: true, message: 'File deleted' });
    } catch (err) {
        console.error('Delete file error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/files/:id/history ───────────────────────────────────────────────
// Body: { action: 'passport' | 'compress' | 'pdf' | 'signature' | 'print', resultUrl? }
router.post('/:id/history', authenticate, async (req, res) => {
    try {
        const { action, resultUrl = null } = req.body;
        if (!action) return res.status(400).json({ success: false, message: 'action required' });

        const file = await UploadedFile.findByIdAndUpdate(
            req.params.id,
            { $push: { processingHistory: { action, resultUrl, timestamp: new Date() } } },
            { new: true, lean: true }
        );
        if (!file) return res.status(404).json({ success: false, message: 'File not found' });

        res.json({ success: true, file });
    } catch (err) {
        console.error('History update error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
