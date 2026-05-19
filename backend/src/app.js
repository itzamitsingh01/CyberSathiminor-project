/**
 * app.js – Express application setup
 * Mounts all middleware and routes.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const sessionRoutes = require('./routes/session.routes');
const uploadRoutes = require('./routes/upload.routes');
const passportRoutes = require('./routes/passport.routes');
const compressRoutes = require('./routes/compress.routes');
const pdfRoutes = require('./routes/pdf.routes');
const signatureRoutes = require('./routes/signature.routes');

const app = express();

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/files', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/session', sessionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/passport', passportRoutes);
app.use('/api/compress', compressRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/signature', signatureRoutes);

// Health check
app.get('/', (_req, res) => res.json({ status: 'ok', app: 'MP Online Hub' }));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;
