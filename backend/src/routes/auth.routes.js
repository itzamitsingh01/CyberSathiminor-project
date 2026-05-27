/**
 * auth.routes.js
 */
const router = require('express').Router();
const {
    register,
    verifyEmail,
    resendOtp,
    login,
    refresh,
    logout,
    forgotPassword,
    resetPassword,
    getMe,
} = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');

router.post('/register',        register);
router.post('/verify-email',    verifyEmail);
router.post('/resend-otp',      resendOtp);
router.post('/login',           login);
router.post('/refresh',         refresh);
router.post('/logout',          logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);
router.get('/me',               authenticate, getMe);

module.exports = router;
