/**
 * multer.js – Memory-storage multer config with file type validation.
 * Files never touch disk — buffers are passed directly to Cloudinary.
 */
const multer = require('multer');

const ALLOWED_MIMETYPES = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    // PDF
    'application/pdf',
];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype}. Only images (JPG, PNG, WEBP, GIF, BMP, TIFF) and PDFs are accepted.`), false);
    }
};

// Use memory storage; req.file.buffer holds raw bytes
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
    fileFilter,
});

module.exports = upload;
