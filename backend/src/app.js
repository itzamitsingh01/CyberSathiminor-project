/**
 * app.js – Express application setup
 * Mounts all middleware and routes.
 */
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes      = require('./routes/auth.routes');
const sessionRoutes   = require('./routes/session.routes');
const uploadRoutes    = require('./routes/upload.routes');
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

// Serve uploaded files statically
app.use('/files', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/session',   sessionRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/passport',  passportRoutes);
app.use('/api/compress',  compressRoutes);
app.use('/api/pdf',       pdfRoutes);
app.use('/api/signature', signatureRoutes);

// Health check
app.get('/', (_req, res) => res.json({ status: 'ok', app: 'CyberSathi Backend' }));

// Global Error Handler
app.use((err, req, res, _next) => {
    console.error('Unhandled Error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

module.exports = app;
