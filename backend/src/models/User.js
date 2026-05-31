/**
 * User.js – Mongoose schema for CyberSathi users
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: 2,
            maxlength: 60,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
        },
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['free', 'premium', 'admin'],
            default: 'free',
        },
        mobile: { type: String, default: '' },
        userType: { type: String, default: '' },
        shopName: { type: String, default: '' },
        address: { type: String, default: '' },
        dailyCustomers: { type: String, default: '' },

        // ── Email verification ──────────────────────────────
        isVerified: { type: Boolean, default: false },
        emailOtpHash: String,             // bcrypt hash of 6-digit OTP
        emailOtpExpiry: Date,             // OTP valid for 10 min
        emailOtpAttempts: { type: Number, default: 0 },
        emailOtpLockedUntil: Date,        // brute-force lock

        // ── Password reset ──────────────────────────────────
        resetOtpHash: String,             // bcrypt hash of reset OTP
        resetOtpExpiry: Date,
        resetOtpAttempts: { type: Number, default: 0 },
        resetOtpLockedUntil: Date,

        // ── Subscription ────────────────────────────────────
        subscription: {
            plan: { type: String, enum: ['free', 'premium'], default: 'free' },
            startDate: Date,
            endDate: Date,
        },

        // ── Monthly usage ───────────────────────────────────
        usage: {
            month: { type: String, default: '' },
            removeBg:   { type: Number, default: 0 },
            passport:   { type: Number, default: 0 },
            compress:   { type: Number, default: 0 },
            pdf:        { type: Number, default: 0 },
            signature:  { type: Number, default: 0 },
            qrSessions: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) return;
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

// Compare plain password with hash
userSchema.methods.matchPassword = function (plain) {
    return bcrypt.compare(plain, this.passwordHash);
};

// Verify a plain OTP against stored hash
userSchema.methods.matchEmailOtp = function (plain) {
    if (!this.emailOtpHash) return Promise.resolve(false);
    return bcrypt.compare(plain, this.emailOtpHash);
};

userSchema.methods.matchResetOtp = function (plain) {
    if (!this.resetOtpHash) return Promise.resolve(false);
    return bcrypt.compare(plain, this.resetOtpHash);
};

/**
 * Check if subscription is still active; auto-downgrade if expired.
 * Returns true if currently premium.
 */
userSchema.methods.checkSubscription = function () {
    if (this.subscription.plan === 'premium' && this.subscription.endDate) {
        if (new Date() > new Date(this.subscription.endDate)) {
            // Expired — downgrade (caller must save)
            this.subscription.plan = 'free';
            this.role = 'free';
            return false;
        }
        return true;
    }
    return this.subscription.plan === 'premium';
};

// Safe public object (no hashes)
userSchema.methods.toPublic = function () {
    // Check and auto-downgrade expired subscription before returning
    const isPremium = this.checkSubscription();
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        isVerified: this.isVerified,
        subscription: {
            plan: this.subscription.plan,
            startDate: this.subscription.startDate,
            endDate: this.subscription.endDate,
        },
        usage: this.usage,
        mobile: this.mobile,
        userType: this.userType,
        shopName: this.shopName,
        address: this.address,
        dailyCustomers: this.dailyCustomers,
        createdAt: this.createdAt,
    };
};

module.exports = mongoose.model('User', userSchema);
