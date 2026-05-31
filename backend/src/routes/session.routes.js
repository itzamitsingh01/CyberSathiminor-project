/**
 * session.routes.js
 * POST /session/create — requires auth (prevents session flooding)
 * GET /session/:id     — public (customer mobile upload page needs this)
 */
const router = require('express').Router();
const { createSession, getSession } = require('../controllers/session.controller');
const authenticate = require('../middleware/authenticate');

// POST /session/create — auth required to prevent DoS
router.post('/create', authenticate, createSession);

// GET /session/:id — public (needed for mobile upload page)
router.get('/:id', getSession);

module.exports = router;
