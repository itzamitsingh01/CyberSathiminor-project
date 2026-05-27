/**
 * email.service.js – Nodemailer transporter + OTP email templates
 */
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',   // true for 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Generate a cryptographically random 6-digit OTP string.
 */
function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Shared HTML shell for emails
 */
function emailShell(title, bodyHtml) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                🛡️ CyberSathi
              </div>
              <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">
                Cyber Café Toolkit
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="font-size:12px;color:#9ca3af;margin:0;">
                If you didn't request this, you can safely ignore this email.
              </p>
              <p style="font-size:12px;color:#9ca3af;margin:8px 0 0;">
                © ${new Date().getFullYear()} CyberSathi · All rights reserved
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send email verification OTP
 */
async function sendVerificationOtp(email, name, otp) {
    const body = `
      <h2 style="font-size:22px;font-weight:800;color:#1f2937;margin:0 0 8px;">Verify your email ✉️</h2>
      <p style="font-size:15px;color:#6b7280;margin:0 0 28px;">Hi ${name}, thanks for signing up! Use the OTP below to verify your account.</p>

      <!-- OTP Box -->
      <div style="text-align:center;margin:0 0 28px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#ede9fe,#ddd6fe);border:2px solid #c4b5fd;border-radius:16px;padding:20px 40px;">
          <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#4f46e5;">${otp}</div>
        </div>
        <p style="font-size:13px;color:#9ca3af;margin:10px 0 0;">Expires in <strong>10 minutes</strong></p>
      </div>

      <!-- Spam warning -->
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:14px 16px;margin:0 0 8px;">
        <p style="font-size:13px;color:#92400e;margin:0;">
          📂 <strong>Not seeing this email?</strong> Please check your <strong>Spam</strong> or <strong>Junk</strong> folder — email providers sometimes filter OTP emails automatically.
        </p>
      </div>`;

    return transporter.sendMail({
        from: `"CyberSathi" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `${otp} is your CyberSathi verification code`,
        html: emailShell('Verify your CyberSathi account', body),
    });
}

/**
 * Send password reset OTP
 */
async function sendPasswordResetOtp(email, name, otp) {
    const body = `
      <h2 style="font-size:22px;font-weight:800;color:#1f2937;margin:0 0 8px;">Reset your password 🔐</h2>
      <p style="font-size:15px;color:#6b7280;margin:0 0 28px;">Hi ${name}, we received a request to reset your password. Use the OTP below.</p>

      <!-- OTP Box -->
      <div style="text-align:center;margin:0 0 28px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#fef2f2,#fee2e2);border:2px solid #fca5a5;border-radius:16px;padding:20px 40px;">
          <div style="font-size:40px;font-weight:900;letter-spacing:10px;color:#ef4444;">${otp}</div>
        </div>
        <p style="font-size:13px;color:#9ca3af;margin:10px 0 0;">Expires in <strong>10 minutes</strong></p>
      </div>

      <!-- Spam warning -->
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:14px 16px;margin:0 0 8px;">
        <p style="font-size:13px;color:#92400e;margin:0;">
          📂 <strong>Not seeing this email?</strong> Please check your <strong>Spam</strong> or <strong>Junk</strong> folder — email providers sometimes filter OTP emails automatically.
        </p>
      </div>

      <p style="font-size:13px;color:#9ca3af;margin:16px 0 0;text-align:center;">
        If you didn't request a password reset, your account is safe — just ignore this email.
      </p>`;

    return transporter.sendMail({
        from: `"CyberSathi" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `${otp} is your CyberSathi password reset code`,
        html: emailShell('Reset your CyberSathi password', body),
    });
}

module.exports = { generateOtp, sendVerificationOtp, sendPasswordResetOtp };
