/**
 * UploadedFile.js – Persistent record for every file uploaded through CyberSathi.
 *
 * Unlike Session (10-min TTL), these records persist indefinitely until
 * explicitly deleted by the operator. This powers the Recent Files panel.
 */
const mongoose = require('mongoose');

const processingHistorySchema = new mongoose.Schema({
    action:    { type: String, required: true }, // 'uploaded' | 'passport' | 'compress' | 'pdf' | 'signature' | 'print'
    timestamp: { type: Date, default: Date.now },
    resultUrl: { type: String, default: null },  // Cloudinary URL of the processed output
}, { _id: false });

const uploadedFileSchema = new mongoose.Schema({
    // Cloudinary storage
    cloudinaryUrl:      { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },

    // File metadata
    originalName: { type: String, required: true },
    fileType:     { type: String, required: true }, // mimetype e.g. 'image/jpeg'
    fileSize:     { type: Number, required: true }, // bytes

    // Origin tracking
    sessionId:  { type: String, default: null },   // QR session that produced this file
    uploadedBy: { type: String, default: 'qr' },   // 'qr' | 'direct'

    // Processing trail
    processingHistory: { type: [processingHistorySchema], default: [] },
}, { timestamps: true });

// Index for fast recent-files queries
uploadedFileSchema.index({ createdAt: -1 });
uploadedFileSchema.index({ sessionId: 1 });

module.exports = mongoose.model('UploadedFile', uploadedFileSchema);
