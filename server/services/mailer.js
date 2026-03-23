const nodemailer = require('nodemailer');

let transporter;

function toBool(value) {
  return String(value).toLowerCase() === 'true';
}

function getTransporter() {
  if (transporter) return transporter;

  const hasSmtpConfig = process.env.SMTP_HOST
    && process.env.SMTP_PORT
    && process.env.SMTP_USER
    && process.env.SMTP_PASS;

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: toBool(process.env.SMTP_SECURE),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Fallback for local development if SMTP is not configured.
  transporter = nodemailer.createTransport({ jsonTransport: true });
  return transporter;
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const from = process.env.SMTP_FROM || 'TutorAI <no-reply@tutorai.local>';

  const info = await getTransporter().sendMail({
    from,
    to,
    subject: 'TutorAI Password Reset',
    text: `You requested a password reset. Use this link within 30 minutes: ${resetUrl}`,
    html: `<p>You requested a password reset.</p><p>Use this link within 30 minutes:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  if (!process.env.SMTP_HOST) {
    console.info('SMTP not configured. Password reset email captured locally:');
    console.info(resetUrl);
  }

  return info;
}

module.exports = {
  sendPasswordResetEmail,
};
