/**
 * session.service.js – MongoDB-backed QR upload session store.
 *
 * Replaces the previous in-memory Map (which was wiped on every server restart/deploy).
 * Sessions expire via MongoDB TTL index on the expiresAt field.
 * Cloudinary files are cleaned up by the expireSession() function called from
 * the scheduled cleanup job or explicitly by the controller.
 */
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const Session = require('../models/Session');
const { deleteFile } = require('../utils/cloudinary');

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Create a new session in MongoDB and generate its QR code.
 * @param {string} toolType
 * @param {string} baseUrl
 * @param {string} userId  – MongoDB ObjectId of the authenticated shop operator
 */
async function createSession(toolType, baseUrl, userId) {
    const sessionId = uuidv4();
    const uploadUrl = `${baseUrl}/upload/${sessionId}`;
    const qrDataUrl = await QRCode.toDataURL(uploadUrl, { width: 300 });

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const session = await Session.create({
        sessionId,
        toolType,
        uploadUrl,
        qrDataUrl,
        files: [],
        createdBy: userId || null,
        expiresAt,
    });

    return session.toObject();
}

/**
 * Get session by ID (returns null if missing or expired).
 */
async function getSession(sessionId) {
    const session = await Session.findOne({
        sessionId,
        expiresAt: { $gt: new Date() },  // not yet expired
    }).lean();
    return session || null;
}

/**
 * Add an uploaded file record to an existing session.
 */
async function addFileToSession(sessionId, fileInfo) {
    const session = await Session.findOneAndUpdate(
        { sessionId, expiresAt: { $gt: new Date() } },
        { $push: { files: fileInfo } },
        { new: true, lean: true }
    );
    if (!session) throw new Error('Session not found or expired');
    return session;
}

/**
 * Manually expire a session: delete its Cloudinary files and remove from DB.
 */
async function expireSession(sessionId) {
    const session = await Session.findOne({ sessionId }).lean();
    if (!session) return;

    // Delete Cloudinary files
    for (const f of session.files) {
        if (f.publicId) {
            const resourceType = f.mimetype?.includes('pdf') ? 'raw' : 'image';
            try {
                await deleteFile(f.publicId, resourceType);
            } catch (err) {
                console.error(`Cloudinary delete failed for ${f.publicId}:`, err.message);
            }
        }
    }

    await Session.deleteOne({ sessionId });
    console.log(`Session ${sessionId} expired & Cloudinary files cleaned up.`);
}

/**
 * Check if a session was created by a specific user (for socket auth).
 */
async function isSessionOwner(sessionId, userId) {
    const session = await Session.findOne({ sessionId }).lean();
    if (!session) return false;
    return session.createdBy?.toString() === userId?.toString();
}

module.exports = { createSession, getSession, addFileToSession, expireSession, isSessionOwner };
