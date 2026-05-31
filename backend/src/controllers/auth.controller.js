/**
 * auth.controller.js – Registration, OTP verify, Login, Refresh, Logout, Forgot/Reset Password
 * Security hardening:
 *  - OTPs stored as bcrypt hashes (not plaintext)
 *  - OTP brute-force lock after 5 failed attempts (15 min)
 *  - Subscription endDate auto-validated on /me
 *  - Monthly usage reset on new month
 */
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateOtp, sendVerificationOtp, sendPasswordResetOtp } = require('../services/email.service');
const { signAccess, signRefresh, verifyRefresh, setRefreshCookie, clearRefreshCookie } = require('../services/auth.service');

const OTP_TTL = 10 * 60 * 1000;          // 10 minutes
const OTP_LOCK_TTL = 15 * 60 * 1000;     // 15 min lockout after 5 bad guesses
const OTP_MAX_ATTEMPTS = 5;

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────
async function register(req, res) {
    try {
        const { name, email, password, mobile, userType, shopName, address, dailyCustomers } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ success: false, message: 'All fields are required.' });

        if (password.length < 6)
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing && existing.isVerified)
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });

        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + OTP_TTL);
        const otpHash = await bcrypt.hash(otp, 10);  // hash OTP before storage

        if (existing && !existing.isVerified) {
            existing.name = name;
            existing.passwordHash = password;   // pre-save hook re-hashes
            existing.emailOtpHash = otpHash;
            existing.emailOtpExpiry = otpExpiry;
            existing.emailOtpAttempts = 0;
            existing.emailOtpLockedUntil = undefined;
            existing.mobile = mobile || '';
            existing.userType = userType || '';
            existing.shopName = shopName || '';
            existing.address = address || '';
            existing.dailyCustomers = dailyCustomers || '';
            await existing.save();
        } else {
            await User.create({
                name,
                email,
                passwordHash: password,
                emailOtpHash: otpHash,
                emailOtpExpiry: otpExpiry,
                mobile: mobile || '',
                userType: userType || '',
                shopName: shopName || '',
                address: address || '',
                dailyCustomers: dailyCustomers || '',
            });
        }

        await sendVerificationOtp(email, name, otp);

        return res.status(201).json({
            success: true,
            message: 'OTP sent to your email. Please verify your account.',
            email,
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: err.message || 'Registration failed.' });
    }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/verify-email
// ─────────────────────────────────────────────────────────────
async function verifyEmail(req, res) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp)
            return res.status(400).json({ success: false, message: 'Email and OTP are required.' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user)
            return res.status(404).json({ success: false, message: 'No account found for this email.' });

        if (user.isVerified)
            return res.status(400).json({ success: false, message: 'Email already verified. Please login.' });

        // Check brute-force lock
        if (user.emailOtpLockedUntil && new Date() < new Date(user.emailOtpLockedUntil)) {
            const waitMin = Math.ceil((new Date(user.emailOtpLockedUntil) - Date.now()) / 60000);
            return res.status(429).json({ success: false, message: `Too many failed attempts. Try again in ${waitMin} minute(s).` });
        }

        // Check OTP expiry
        if (!user.emailOtpHash || !user.emailOtpExpiry || Date.now() > new Date(user.emailOtpExpiry).getTime())
            return res.status(400).json({ success: false, message: 'OTP has expired. Please register again to get a new OTP.' });

        // Compare against hash
        const otpMatch = await user.matchEmailOtp(otp);
        if (!otpMatch) {
            user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
            if (user.emailOtpAttempts >= OTP_MAX_ATTEMPTS) {
                user.emailOtpLockedUntil = new Date(Date.now() + OTP_LOCK_TTL);
                await user.save();
                return res.status(429).json({ success: false, message: 'Too many failed attempts. Account locked for 15 minutes.' });
            }
            const remaining = OTP_MAX_ATTEMPTS - user.emailOtpAttempts;
            await user.save();
            return res.status(400).json({ success: false, message: `Invalid OTP. ${remaining} attempt(s) remaining.` });
        }

        user.isVerified = true;
        user.emailOtpHash = undefined;
        user.emailOtpExpiry = undefined;
        user.emailOtpAttempts = 0;
        user.emailOtpLockedUntil = undefined;
        await user.save();

        // Auto login after verification
        const payload = { id: user._id, role: user.role };
        const accessToken = signAccess(payload);
        const refreshToken = signRefresh(payload);
        setRefreshCookie(res, refreshToken);

        return res.json({
            success: true,
            message: 'Email verified! Welcome to CyberSathi 🎉',
            accessToken,
            user: user.toPublic(),
        });
    } catch (err) {
        console.error('Verify email error:', err);
        res.status(500).json({ success: false, message: 'Verification failed.' });
    }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/resend-otp
// ─────────────────────────────────────────────────────────────
async function resendOtp(req, res) {
    try {
        const { email } = req.body;
        // Always respond OK even if email not found (prevent enumeration)
        const user = await User.findOne({ email: email?.toLowerCase() });

        if (!user || user.isVerified) {
            // Don't reveal whether the account exists or is verified
            return res.json({ success: true, message: 'If that email has a pending verification, a new OTP has been sent.' });
        }

        const otp = generateOtp();
        const otpHash = await bcrypt.hash(otp, 10);
        user.emailOtpHash = otpHash;
        user.emailOtpExpiry = new Date(Date.now() + OTP_TTL);
        user.emailOtpAttempts = 0;
        user.emailOtpLockedUntil = undefined;
        await user.save();

        await sendVerificationOtp(email, user.name, otp);

        return res.json({ success: true, message: 'If that email has a pending verification, a new OTP has been sent.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
    }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email and password are required.' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user)
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });

        if (!user.isVerified)
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in.',
                needsVerification: true,
                email: user.email,
            });

        const match = await user.matchPassword(password);
        if (!match)
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });

        // Auto-downgrade expired subscription
        const wasModified = user.checkSubscription();
        if (!wasModified && user.isModified('subscription')) await user.save();

        const payload = { id: user._id, role: user.role };
        const accessToken = signAccess(payload);
        const refreshToken = signRefresh(payload);
        setRefreshCookie(res, refreshToken);

        return res.json({
            success: true,
            accessToken,
            user: user.toPublic(),
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Login failed.' });
    }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────
async function refresh(req, res) {
    try {
        const token = req.cookies?.refreshToken;
        if (!token)
            return res.status(401).json({ success: false, message: 'No refresh token.' });

        const payload = verifyRefresh(token);
        const user = await User.findById(payload.id);
        if (!user)
            return res.status(401).json({ success: false, message: 'User not found.' });

        // Auto-downgrade expired subscription silently
        user.checkSubscription();

        const accessToken = signAccess({ id: user._id, role: user.role });
        return res.json({ success: true, accessToken });
    } catch {
        res.status(401).json({ success: false, message: 'Refresh token invalid or expired.' });
    }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
function logout(req, res) {
    clearRefreshCookie(res);
    return res.json({ success: true, message: 'Logged out.' });
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email?.toLowerCase() });

        // Always respond OK to prevent email enumeration
        if (!user || !user.isVerified)
            return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });

        const otp = generateOtp();
        const otpHash = await bcrypt.hash(otp, 10);
        user.resetOtpHash = otpHash;
        user.resetOtpExpiry = new Date(Date.now() + OTP_TTL);
        user.resetOtpAttempts = 0;
        user.resetOtpLockedUntil = undefined;
        await user.save();

        await sendPasswordResetOtp(email, user.name, otp);

        return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to send reset OTP.' });
    }
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────
async function resetPassword(req, res) {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword)
            return res.status(400).json({ success: false, message: 'All fields are required.' });

        if (newPassword.length < 6)
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.resetOtpHash)
            return res.status(400).json({ success: false, message: 'No reset request found. Please try again.' });

        // Check brute-force lock
        if (user.resetOtpLockedUntil && new Date() < new Date(user.resetOtpLockedUntil)) {
            const waitMin = Math.ceil((new Date(user.resetOtpLockedUntil) - Date.now()) / 60000);
            return res.status(429).json({ success: false, message: `Too many failed attempts. Try again in ${waitMin} minute(s).` });
        }

        // Check expiry
        if (Date.now() > new Date(user.resetOtpExpiry).getTime())
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

        // Compare against hash
        const otpMatch = await user.matchResetOtp(otp);
        if (!otpMatch) {
            user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
            if (user.resetOtpAttempts >= OTP_MAX_ATTEMPTS) {
                user.resetOtpLockedUntil = new Date(Date.now() + OTP_LOCK_TTL);
                await user.save();
                return res.status(429).json({ success: false, message: 'Too many failed attempts. Locked for 15 minutes.' });
            }
            const remaining = OTP_MAX_ATTEMPTS - user.resetOtpAttempts;
            await user.save();
            return res.status(400).json({ success: false, message: `Invalid OTP. ${remaining} attempt(s) remaining.` });
        }

        user.passwordHash = newPassword;  // pre-save hook re-hashes
        user.resetOtpHash = undefined;
        user.resetOtpExpiry = undefined;
        user.resetOtpAttempts = 0;
        user.resetOtpLockedUntil = undefined;
        await user.save();

        return res.json({ success: true, message: 'Password reset successfully! You can now log in.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Password reset failed.' });
    }
}

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────────────────────
async function getMe(req, res) {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        // Auto-downgrade expired subscription + reset monthly usage if new month
        let dirty = false;
        const subscriptionChanged = user.checkSubscription();
        if (user.isModified('subscription')) dirty = true;

        const currentMonth = new Date().toISOString().slice(0, 7);
        if (user.usage.month && user.usage.month !== currentMonth) {
            // New month — reset all usage counters
            user.usage = { month: currentMonth, removeBg: 0, passport: 0, compress: 0, pdf: 0, signature: 0, qrSessions: 0 };
            dirty = true;
        }

        if (dirty) await user.save();

        res.json({ success: true, user: user.toPublic() });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch user.' });
    }
}

module.exports = { register, verifyEmail, resendOtp, login, refresh, logout, forgotPassword, resetPassword, getMe };
