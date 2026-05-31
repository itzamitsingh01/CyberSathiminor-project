/**
 * socket.js – Socket.IO singleton
 * Provides initSocket() and getIO() helpers used across the app.
 */
const { Server } = require('socket.io');

let io;

// Must match the allowedOrigins in app.js
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://cyber-sathi-delta.vercel.app',
    process.env.FRONTEND_URL,
].filter(Boolean);

/**
 * Initialise Socket.IO on the given HTTP server.
 * @param {http.Server} httpServer
 */
function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: (origin, cb) => {
                if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
                cb(new Error(`Socket CORS: ${origin} not allowed`));
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        // Shop owner joins a room named after their sessionId to receive live updates
        socket.on('join-session', (sessionId) => {
            if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) return;
            socket.join(sessionId);
            console.log(`Socket ${socket.id} joined room: ${sessionId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    console.log('✅  Socket.IO initialised');
}

/**
 * Returns the Socket.IO instance. Must be called after initSocket().
 * @returns {Server}
 */
function getIO() {
    if (!io) throw new Error('Socket.IO not initialised. Call initSocket first.');
    return io;
}

module.exports = { initSocket, getIO };
