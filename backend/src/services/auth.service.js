/**
 * auth.service.js – JWT token generation helpers
 */
const jwt = require('jsonwebtoken');

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

function signAccess(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function signRefresh(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

function verifyAccess(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

function verifyRefresh(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

/**
 * Set refresh token as secure httpOnly cookie
 */
function setRefreshCookie(res, token) {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}

function clearRefreshCookie(res) {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, setRefreshCookie, clearRefreshCookie };
