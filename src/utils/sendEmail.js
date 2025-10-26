// services/emailService.js
import dotenv from "dotenv";
import SibApiV3Sdk from "sib-api-v3-sdk";

dotenv.config();

if (!process.env.BREVO_API_KEY) {
  throw new Error("❌ BREVO_API_KEY is missing in environment variables!");
}

// ========================= SETUP =========================
const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const FROM_EMAIL = "michaelnwode023@gmail.com"; 
const BRAND_COLOR = "#facc15";
const APP_NAME = "TVICL";

// ========================= GENERIC SEND FUNCTION =========================
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!to) {
      console.error("❌ ERROR: sendEmail called without 'to' value!");
      return { success: false, error: "Missing 'to' email address" };
    }

    const emailData = {
      sender: { email: FROM_EMAIL, name: APP_NAME },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    };

    const response = await apiInstance.sendTransacEmail(emailData);

    console.log("✅ Email sent successfully via Brevo:", response?.messageId || response);
    return { success: true, id: response?.messageId || null };
  } catch (error) {
    console.error("❌ Email failed with exception:", error?.message || error);
    return { success: false, error: error?.message };
  }
};

// ========================= VERIFICATION EMAIL =========================
export const sendVerificationEmail = async ({ to, fullName, verificationUrl }) => {
  const subject = "Verify your TVICL account";
  const html = `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8f8f8; padding: 40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <tr>
          <td style="background-color: ${BRAND_COLOR}; padding: 20px; text-align: center; color: #000; font-size: 24px; font-weight: bold;">
            ${APP_NAME}
          </td>
        </tr>
        <tr>
          <td style="padding: 30px; color: #333; font-size: 16px; line-height: 1.6;">
            <p>Hello <strong>${fullName}</strong>,</p>
            <p>Thank you for creating an account with ${APP_NAME}. To complete your registration and secure your account, please verify your email by clicking the button below:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: ${BRAND_COLOR}; color: #000; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block;">
                Verify Your Email
              </a>
            </p>
            <p>This verification link will expire in 24 hours. If you did not create this account, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #888; text-align: center;">
              Need help? Contact our support team at <a href="mailto:support@tvicl.com" style="color: ${BRAND_COLOR}; text-decoration: none;">support@tvicl.com</a><br/>
              &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;
  const text = `Hello ${fullName}, verify your account: ${verificationUrl}`;
  return sendEmail({ to, subject, html, text });
};

// ========================= PASSWORD RESET EMAIL =========================
export const sendPasswordResetEmail = async ({ to, fullName, resetUrl }) => {
  const subject = "Reset your TVICL password";
  const html = `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8f8f8; padding: 40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <tr>
          <td style="background-color: ${BRAND_COLOR}; padding: 20px; text-align: center; color: #000; font-size: 24px; font-weight: bold;">
            ${APP_NAME}
          </td>
        </tr>
        <tr>
          <td style="padding: 30px; color: #333; font-size: 16px; line-height: 1.6;">
            <p>Hello <strong>${fullName}</strong>,</p>
            <p>We received a request to reset your password. Click the button below to set a new password for your ${APP_NAME} account:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: ${BRAND_COLOR}; color: #000; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p>This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #888; text-align: center;">
              Need help? Contact our support team at <a href="mailto:support@tvicl.com" style="color: ${BRAND_COLOR}; text-decoration: none;">support@tvicl.com</a><br/>
              &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;
  const text = `Hello ${fullName}, reset password link: ${resetUrl}`;
  return sendEmail({ to, subject, html, text });
};
