import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const FROM_NAME = process.env.FROM_NAME || "TVICL Real Estate";

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: true, // MUST be true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP server is ready to take messages");
  }
});


// Generic send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("Email sending error:", err);
    throw new Error("Email could not be sent");
  }
};

// ========================= SEND VERIFICATION EMAIL =========================
export const sendVerificationEmail = async (to, fullName, verificationUrl) => {
  const subject = "Verify Your TVICL Account";
  const html = `
    <div style="font-family: sans-serif; line-height: 1.5;">
      <h2>Hello ${fullName},</h2>
      <p>Thanks for registering on TVICL Real Estate!</p>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="background-color:#25aff3;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not register, please ignore this email.</p>
    </div>
  `;
  const text = `Hello ${fullName},\n\nPlease verify your email by visiting: ${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you did not register, ignore this email.`;

  await sendEmail({ to, subject, html, text });
};

// ========================= SEND PASSWORD RESET EMAIL =========================
export const sendPasswordResetEmail = async (to, fullName, resetUrl) => {
  const subject = "Reset Your TVICL Password";
  const html = `
    <div style="font-family: sans-serif; line-height: 1.5;">
      <h2>Hello ${fullName},</h2>
      <p>We received a request to reset your TVICL account password.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color:#25aff3;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
  `;
  const text = `Hello ${fullName},\n\nReset your password by visiting: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, ignore this email.`;

  await sendEmail({ to, subject, html, text });
};
