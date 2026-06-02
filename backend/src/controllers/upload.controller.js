/**
 * upload.controller.js – Mobile customer file upload → Cloudinary → notify dashboard.
 *
 * Flow:
 *  1. Multer memory buffer → Cloudinary
 *  2. File info pushed to Session (10-min TTL, in-session tracking)
 *  3. File also persisted in UploadedFile (permanent, powers Recent Files panel)
 *  4. Socket event fired → dashboard updates in real-time
 */
const sessionService = require('../services/session.service');
const { uploadBuffer } = require('../utils/cloudinary');
const { getIO } = require('../utils/socket');
const UploadedFile = require('../models/UploadedFile');

async function uploadFile(req, res) {
    try {
        const { sessionId } = req.params;
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const session = await sessionService.getSession(sessionId);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found or expired' });

        // Determine Cloudinary resource type
        const isPdf = req.file.mimetype === 'application/pdf';
        const resourceType = isPdf ? 'raw' : 'image';

        // Upload to Cloudinary
        const { url, publicId } = await uploadBuffer(req.file.buffer, {
            folder: `mp-online-hub/sessions/${sessionId}`,
            resource_type: resourceType,
        });

        const fileInfo = {
            filename:     publicId.split('/').pop(),
            originalname: req.file.originalname,
            url,
            publicId,
            size:         req.file.size,
            mimetype:     req.file.mimetype,
            uploadedAt:   new Date().toISOString(),
        };

        // Push to session (TTL-bound, in-session live view)
        const updatedSession = await sessionService.addFileToSession(sessionId, fileInfo);
        if (!updatedSession) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        // ── Persist to UploadedFile (permanent, powers Recent Files panel) ──
        const savedFile = await UploadedFile.create({
            cloudinaryUrl:      url,
            cloudinaryPublicId: publicId,
            originalName:       req.file.originalname,
            fileType:           req.file.mimetype,
            fileSize:           req.file.size,
            sessionId,
            uploadedBy:         'qr',
            processingHistory:  [{ action: 'uploaded', resultUrl: url }],
        });

        // Attach the DB id to the socket payload so the dashboard can reference it
        const socketPayload = {
            sessionId,
            file: { ...fileInfo, _id: savedFile._id.toString() },
            totalFiles: updatedSession.files?.length || 0,
        };

        getIO().to(sessionId).emit('file-uploaded', socketPayload);

        res.json({ success: true, message: 'File uploaded successfully', file: socketPayload.file });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { uploadFile };
