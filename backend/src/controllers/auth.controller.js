/**
 * auth.controller.js – Registration, OTP verify, Login, Refresh, Logout, Forgot/Reset Password
 */
const User = require('../models/User');
const { generateOtp, sendVerificationOtp, sendPasswordResetOtp } = require('../services/email.service');
const { signAccess, signRefresh, verifyRefresh, setRefreshCookie, clearRefreshCookie } = require('../services/auth.service');

const OTP_TTL = 10 * 60 * 1000; // 10 minutes

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

        if (existing && !existing.isVerified) {
            // Resend OTP to unverified user
            existing.name = name;
            existing.passwordHash = password;   // pre-save hook re-hashes
            existing.emailOtp = otp;
            existing.emailOtpExpiry = otpExpiry;
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
                emailOtp: otp,
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

        if (!user.emailOtp || user.emailOtp !== otp)
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });

        if (Date.now() > new Date(user.emailOtpExpiry).getTime())
            return res.status(400).json({ success: false, message: 'OTP has expired. Please register again to get a new OTP.' });

        user.isVerified = true;
        user.emailOtp = undefined;
        user.emailOtpExpiry = undefined;
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
        const user = await User.findOne({ email: email?.toLowerCase() });

        if (!user || user.isVerified)
            return res.status(400).json({ success: false, message: 'Cannot resend OTP for this email.' });

        const otp = generateOtp();
        user.emailOtp = otp;
        user.emailOtpExpiry = new Date(Date.now() + OTP_TTL);
        await user.save();

        await sendVerificationOtp(email, user.name, otp);

        return res.json({ success: true, message: 'New OTP sent to your email.' });
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
        user.resetOtp = otp;
        user.resetOtpExpiry = new Date(Date.now() + OTP_TTL);
        await user.save();

        await sendPasswordResetOtp(email, user.name, otp);

        return res.json({ success: true, message: 'Password reset OTP sent to your email.' });
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
        if (!user || !user.resetOtp)
            return res.status(400).json({ success: false, message: 'No reset request found. Please try again.' });

        if (user.resetOtp !== otp)
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });

        if (Date.now() > new Date(user.resetOtpExpiry).getTime())
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });

        user.passwordHash = newPassword;  // pre-save hook re-hashes
        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;
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
        res.json({ success: true, user: user.toPublic() });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch user.' });
    }
}

module.exports = { register, verifyEmail, resendOtp, login, refresh, logout, forgotPassword, resetPassword, getMe };
