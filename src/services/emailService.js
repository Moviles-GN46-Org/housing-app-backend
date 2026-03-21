const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const emailService = {
  async sendVerificationCode({ to, firstName, code }) {
    const mailOptions = {
      from: `"Casandes" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Your Casandes verification code',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #FBF3EB; border-radius: 16px;">
          <h2 style="color: #3C2E26; margin-bottom: 8px;">Hi ${firstName},</h2>
          <p style="color: #8B7264; font-size: 16px; margin-bottom: 24px;">
            Welcome to Casandes! Use the code below to verify your email address.
          </p>
          <div style="background: #DA9958; color: white; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 16px 24px; border-radius: 12px; margin-bottom: 24px;">
            ${code}
          </div>
          <p style="color: #8B7264; font-size: 14px;">
            This code expires in <strong>10 minutes</strong>. If you didn't create an account, you can ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info('Verification email sent', { to });
    } catch (error) {
      logger.error('Failed to send verification email', { to, error: error.message });
      // Don't throw — registration should still succeed even if email fails.
      // The user can request a resend.
    }
  },
};

module.exports = emailService;
