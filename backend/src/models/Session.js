/**
 * Session.js – Mongoose model for QR upload sessions.
 * Replaces the in-memory Map in session.service.js.
 * TTL index automatically removes expired sessions from MongoDB.
 */
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename:     { type: String },
    originalname: { type: String },
    url:          { type: String },
    publicId:     { type: String },
    size:         { type: Number },
    mimetype:     { type: String },
    uploadedAt:   { type: String },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
    sessionId:  { type: String, required: true, unique: true, index: true },
    toolType:   { type: String, default: 'general' },
    uploadUrl:  { type: String },
    qrDataUrl:  { type: String },
    files:      { type: [fileSchema], default: [] },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // the shop operator
    expiresAt:  { type: Date, required: true },
}, { timestamps: true });

// MongoDB TTL index — auto-deletes documents after expiresAt
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
