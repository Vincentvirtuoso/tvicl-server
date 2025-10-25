// services/emailService.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const {
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_HOST,
  EMAIL_PORT,
  FROM_NAME = "TVICL Real Estate",
  NODE_ENV,
} = process.env;

// let transporter;
let usingTestAccount = false;

const createTransporter = async () => {
  // Priority 1: explicit SMTP host+port provided
  if (EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS) {
    return nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  logger: true, // ✅ log SMTP activity
  debug: true,  // ✅ include SMTP traffic in logs
});
  }

  // Priority 2: service via Gmail credentials (common case)
  if (EMAIL_USER && EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  // Fallback (dev): create a test account (Ethereal). This will not send real email.
  // Useful for local development and CI.
  const testAccount = await nodemailer.createTestAccount();
  usingTestAccount = true;
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

// Immediately initialize transporter (async)
const transporter = nodemailer.createTransport({
service: "gmail",
auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS, // Gmail App Password REQUIRED
},
});
(async () => {
  try {

    transporter.verify((err, success) => {
      if (err) {
        console.error("⚠️ SMTP verify failed:", err);
      } else {
        if (usingTestAccount) {
          console.log("ℹ️ Using Nodemailer test account (ethereal) for emails.");
        }
        console.log("✅ SMTP server is ready to take messages");
      }
    });
  } catch (err) {
    console.error("🔥 Failed to create email transporter:", err);
  }
})();

// Helpers: templates
const BRAND_COLOR = "#facc15";

const generateVerificationHtml = ({ fullName, verificationUrl, company = FROM_NAME }) => {
  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
    </head>
    <body style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#222; margin:0; padding:24px; background:#f6f9fc;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:white; border-radius:12px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.06);">
              <tr>
                <td style="padding:20px 28px; background:linear-gradient(90deg, ${BRAND_COLOR}, #0ea5c8); color:white;">
                  <h1 style="margin:0; font-size:20px;">${company}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <h2 style="margin-top:0; color:#111;">Hello ${fullName},</h2>
                  <p style="color:#444; line-height:1.5;">
                    Thanks for registering at ${company}! Click the button below to verify your email address.
                  </p>
                  <p style="text-align:center; margin:28px 0;">
                    <a href="${verificationUrl}" style="display:inline-block; padding:12px 22px; background:${BRAND_COLOR}; color:white; text-decoration:none; border-radius:8px; font-weight:600;">
                      Verify Email
                    </a>
                  </p>
                  <p style="color:#666; font-size:13px;">
                    If the button doesn't work, copy and paste this link into your browser:
                    <br/><a href="${verificationUrl}" style="color:${BRAND_COLOR}; word-break:break-all;">${verificationUrl}</a>
                  </p>
                  <hr style="border:none; border-top:1px solid #eee; margin:18px 0;">
                  <p style="color:#666; font-size:13px;">
                    This link will expire in 24 hours.
                    If you didn't register, you can safely ignore this message.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 28px; background:#fafafa; text-align:center; font-size:12px; color:#999;">
                  ${company} • <a href="#" style="color:#999; text-decoration:none;">Support</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};

const generateVerificationText = ({ fullName, verificationUrl }) => {
  return `Hello ${fullName},

  Please verify your TVICL account by visiting the link below:
  ${verificationUrl}

  This link will expire in 24 hours.

  If you did not register, you can ignore this message.
  `;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Email failed:", error.message);
    console.error("SMTP CONFIG:", {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
    });
    return { success: false, error: error.message };
  }
};


// exports for verification email specifically
export const sendVerificationEmail = async ({ to, fullName, verificationUrl }) => {
  const subject = "Verify your TVICL account";
  const html = generateVerificationHtml({ fullName, verificationUrl });
  const text = generateVerificationText({ fullName, verificationUrl });

  return sendEmail({ to, subject, html, text });
};

// ========================= PASSWORD RESET EMAIL =========================

const generatePasswordResetHtml = ({ fullName, resetUrl, company = FROM_NAME }) => {
  return `
  <!doctype html>
  <html>
    <body style="font-family: system-ui, Arial; background:#f6f9fc; padding:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
          <table width="600" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 3px 10px rgba(0,0,0,.08);">
            <tr>
              <td style="background:${BRAND_COLOR};padding:20px 28px;color:white;">
                <h2 style="margin:0;">${company}</h2>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h3>Hello ${fullName},</h3>
                <p>We received a request to reset your account password. Click the button below to create a new password:</p>
                <p style="text-align:center;margin:26px 0;">
                  <a href="${resetUrl}" style="background:${BRAND_COLOR};color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">
                    Reset Password
                  </a>
                </p>
                <p>If the button doesn’t work, copy and paste this link:</p>
                <p><a href="${resetUrl}" style="color:${BRAND_COLOR};word-break:break-all;">${resetUrl}</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn’t request a password reset, please ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#fafafa;padding:16px;text-align:center;font-size:12px;color:#999;">
                ${company} • Secure Account Service
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
  </html>
  `;
};

const generatePasswordResetText = ({ fullName, resetUrl }) => {
  return `Hello ${fullName},

You requested a password reset.

Reset your password here: ${resetUrl}

This link expires in 1 hour. If you didn’t request this, ignore this email.
`;
};

export const sendPasswordResetEmail = async ({ to, fullName, resetUrl }) => {
  return sendEmail({
    to,
    subject: "Reset Your Password – TVICL",
    html: generatePasswordResetHtml({ fullName, resetUrl }),
    text: generatePasswordResetText({ fullName, resetUrl }),
  });
};

