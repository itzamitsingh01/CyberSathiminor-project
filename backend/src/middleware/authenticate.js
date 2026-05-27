/**
 * authenticate.js – JWT middleware. Attaches req.user = { id, role }
 */
const { verifyAccess } = require('../services/auth.service');

function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
        return res.status(401).json({ success: false, message: 'Unauthorized — no token.' });

    const token = header.split(' ')[1];
    try {
        req.user = verifyAccess(token);
        next();
    } catch {
        return res.status(401).json({ success: false, message: 'Token expired or invalid.' });
    }
}

module.exports = authenticate;
