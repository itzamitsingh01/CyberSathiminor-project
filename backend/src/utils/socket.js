/**
 * socket.js – Socket.IO singleton
 * Provides initSocket() and getIO() helpers used across the app.
 *
 * Security: join-session now validates that the requesting socket belongs
 * to the operator who created the session (M-4 fix).
 */
const { Server } = require('socket.io');
const { verifyAccess } = require('../services/auth.service');
const { isSessionOwner } = require('../services/session.service');

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
        /**
         * join-session — shop operator subscribes to a session room.
         * Payload: { sessionId: string, token: string }
         * The access token is validated and the user must be the session owner.
         */
        socket.on('join-session', async ({ sessionId, token } = {}) => {
            // Basic input validation
            if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
                socket.emit('session-error', { message: 'Invalid session ID' });
                return;
            }

            // Verify the JWT token
            let userId;
            try {
                const payload = verifyAccess(token);
                userId = payload.id;
            } catch {
                socket.emit('session-error', { message: 'Authentication required to join session' });
                return;
            }

            // Check the user actually created this session
            const isOwner = await isSessionOwner(sessionId, userId);
            if (!isOwner) {
                socket.emit('session-error', { message: 'You are not the owner of this session' });
                return;
            }

            socket.join(sessionId);
            console.log(`Socket ${socket.id} (user ${userId}) joined room: ${sessionId}`);
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
