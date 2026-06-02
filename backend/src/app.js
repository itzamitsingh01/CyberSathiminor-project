/**
 * app.js – Express application setup
 * Mounts all middleware and routes.
 */
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth.routes');
const sessionRoutes   = require('./routes/session.routes');
const uploadRoutes    = require('./routes/upload.routes');
const filesRoutes     = require('./routes/files.routes');
const passportRoutes  = require('./routes/passport.routes');
const compressRoutes  = require('./routes/compress.routes');
const pdfRoutes       = require('./routes/pdf.routes');
const signatureRoutes = require('./routes/signature.routes');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://cyber-sathi-delta.vercel.app',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,   // needed for httpOnly cookie
}));

// ── Middleware ────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// (Static /files removed — all file storage is Cloudinary, no local uploads folder)

// ── Rate Limiters ─────────────────────────────────────────────────

// Auth endpoints — strict: 10 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many requests. Please wait 15 minutes and try again.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
});

// OTP endpoints — very strict: 5 per 10 minutes
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many OTP attempts. Please wait 10 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Tool endpoints — moderate: 30 per minute per IP
const toolLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});

// Upload endpoint — 20 per minute
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many uploads. Please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Session create — 10 per hour per IP (prevent flooding)
const sessionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many sessions created. Please wait.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Routes ───────────────────────────────────────────────────────
// Apply rate limits to auth routes selectively
app.use('/api/auth/login',           authLimiter);
app.use('/api/auth/register',        authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/verify-email',    otpLimiter);
app.use('/api/auth/resend-otp',      otpLimiter);

app.use('/api/auth',      authRoutes);
app.use('/api/session/create', sessionLimiter);
app.use('/api/session',   sessionRoutes);
app.use('/api/upload',    uploadLimiter, uploadRoutes);
app.use('/api/files',     toolLimiter, filesRoutes);
app.use('/api/passport',  toolLimiter, passportRoutes);
app.use('/api/compress',  toolLimiter, compressRoutes);
app.use('/api/pdf',       toolLimiter, pdfRoutes);
app.use('/api/signature', toolLimiter, signatureRoutes);

// Health check
app.get('/', (_req, res) => res.json({ status: 'ok', app: 'CyberSathi Backend' }));

// Global Error Handler
app.use((err, req, res, _next) => {
    console.error('Unhandled Error:', err.message);
    // Multer / file-type validation error
    if (err.message && err.message.startsWith('File type not allowed')) {
        return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

module.exports = app;
