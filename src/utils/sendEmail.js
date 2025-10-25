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

let transporter;
let usingTestAccount = false;

const createTransporter = async () => {
  // Priority 1: explicit SMTP host+port provided
  if (EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS) {
    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: Number(EMAIL_PORT) === 465, // true for 465, false for other ports (587)
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        // better compatibility on some hosts
        rejectUnauthorized: false,
      },
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
(async () => {
  try {
    transporter = await createTransporter();
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
const BRAND_COLOR = "#25aff3";

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

// sendEmail wrapper
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    // transporter creation failed earlier
    throw new Error("Email transporter is not initialized");
  }

  const mailOptions = {
    from: `"${FROM_NAME}" <${EMAIL_USER || "no-reply@example.com"}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    // If using ethereal, provide preview URL in logs
    if (usingTestAccount && nodemailer.getTestMessageUrl(info)) {
      console.log("📨 Preview email URL:", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (err) {
    // rethrow with more context
    console.error("Email sending error:", err);
    throw err;
  }
};

// exports for verification email specifically
export const sendVerificationEmail = async ({ to, fullName, verificationUrl }) => {
  const subject = "Verify your TVICL account";
  const html = generateVerificationHtml({ fullName, verificationUrl });
  const text = generateVerificationText({ fullName, verificationUrl });

  return sendEmail({ to, subject, html, text });
};

export  {
  sendEmail,
  sendVerificationEmail,
};
