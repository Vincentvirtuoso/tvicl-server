// services/emailService.js
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.RESEND_API_KEY) {
  throw new Error("❌ RESEND_API_KEY is missing in environment variables!");
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || "no-reply@resend.dev";
const BRAND_COLOR = "#facc15";
const APP_NAME = "TVICL Real Estate";

// ========================= HELPER =========================
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const data = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
    console.log("✅ Email sent:", data?.id);
    return { success: true };
  } catch (error) {
    console.error("❌ Email failed:", error);
    return { success: false, error: error.message };
  }
};

// ========================= VERIFICATION EMAIL =========================
export const sendVerificationEmail = async ({ to, fullName, verificationUrl }) => {
  const subject = "Verify your TVICL account";
  const html = `
    <div style="font-family: Arial,sans-serif;padding:24px;background:#f4f4f4">
      <div style="max-width:600px;margin:auto;background:white;border-radius:10px;overflow:hidden">
        <div style="background:${BRAND_COLOR};padding:20px;color:black;font-weight:bold">
          ${APP_NAME}
        </div>
        <div style="padding:24px">
          <h2>Hello ${fullName},</h2>
          <p>Please verify your email using the button below:</p>
          <a href="${verificationUrl}" style="display:inline-block;background:${BRAND_COLOR};padding:10px 18px;color:black;border-radius:6px;text-decoration:none">
            Verify Email
          </a>
          <p>This link expires in 24 hours.</p>
        </div>
      </div>
    </div>
  `;
  const text = `Hello ${fullName}, verify your account: ${verificationUrl}`;
  return sendEmail({ to, subject, html, text });
};

// ========================= PASSWORD RESET EMAIL =========================
export const sendPasswordResetEmail = async ({ to, fullName, resetUrl }) => {
  const subject = "Reset your TVICL password";
  const html = `
    <div style="font-family: Arial,sans-serif;padding:24px;background:#f4f4f4">
      <div style="max-width:600px;margin:auto;background:white;border-radius:10px;overflow:hidden">
        <div style="background:${BRAND_COLOR};padding:20px;color:black;font-weight:bold">
          ${APP_NAME}
        </div>
        <div style="padding:24px">
          <h2>Hello ${fullName},</h2>
          <p>To reset your TVICL password, click below:</p>
          <a href="${resetUrl}" style="display:inline-block;background:${BRAND_COLOR};padding:10px 18px;color:black;border-radius:6px;text-decoration:none">
            Reset Password
          </a>
          <p>This link expires in 1 hour.</p>
        </div>
      </div>
    </div>
  `;
  const text = `Hello ${fullName}, reset password link: ${resetUrl}`;
  return sendEmail({ to, subject, html, text });
};
