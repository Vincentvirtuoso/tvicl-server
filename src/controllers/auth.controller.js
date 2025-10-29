// controllers/auth.controller.js
import User from "#models/User";
import "#models/Property";
import Agent from "#models/Agent";
import Estate from "#models/Estate";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "#utils/sendEmail";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const { CLIENT_URL = "http://localhost:5173/", NODE_ENV } = process.env;

// Generate access token (15 minutes)
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "15m",
  });
};

// Generate refresh token (7 days)
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, roles } = req.body;

    // Validate input
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Ensure at least one role
    const userRoles =
      Array.isArray(roles) && roles.length > 0 ? roles : ["buyer"];
    const activeRole = userRoles[0]; // first role is active by default

    // Create new user (pre-save hook hashes password)
    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      roles: userRoles,
      activeRole,
      verificationToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Build verification URL
    const verificationUrl = `${CLIENT_URL.replace(
      /\/$/,
      ""
    )}/verify-email/${encodeURIComponent(verificationToken)}`;

    // Attempt to send verification email, but don't crash if it fails
    let emailSent = true;
    let emailInfo = null;

    try {
      emailInfo = await sendVerificationEmail({
        to: email,
        fullName: user.fullName,
        verificationUrl,
      });
    } catch (emailErr) {
      emailSent = false;
      console.error("⚠️ Verification email failed to send:", emailErr);
    }

    // Respond 201 regardless; include emailSent flag for client-side UX
    return res.status(201).json({
      message: emailSent
        ? "Registration successful! Please check your email to verify your account."
        : "Registration successful, but we couldn't send the verification email. Please contact support or request a resend.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles,
        activeRole: user.activeRole,
      },
      emailSent,
      ...(NODE_ENV !== "production" && { emailInfo }),
    });
  } catch (err) {
    console.error("Registration error:", err.stack || err);
    return res
      .status(500)
      .json({ message: "Server error during registration" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with or without expiration check
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({
        message: "Invalid verification link or token has expired.",
      });
    }

    // ✅ NEW: if user already verified
    if (user.verified) {
      return res.status(200).json({
        alreadyVerified: true,
        message: "Your email is already verified. You can now log in.",
      });
    }

    // ✅ Check if token is expired
    if (user.verificationTokenExpires < Date.now()) {
      return res.status(400).json({
        message:
          "Verification link has expired. Please request a new verification email.",
        expired: true,
      });
    }

    // ✅ Verify email
    user.verified = true;
    // user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully!",
      verifiedNow: true,
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Server error during email verification" });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    const verificationUrl = `${CLIENT_URL.replace(
      /\/$/,
      ""
    )}/verify-email/${encodeURIComponent(verificationToken)}`;

    await sendVerificationEmail({
      to: user.email,
      fullName: user.fullName,
      verificationUrl,
    });

    res.json({ message: "Verification email sent successfully" });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is verified
    if (!user.verified) {
      return res.status(401).json({
        message: "Please verify your email before logging in",
        requiresVerification: true,
        email: user.email,
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Ensure roles and activeRole are defined
    const roles =
      Array.isArray(user.roles) && user.roles.length ? user.roles : ["buyer"];
    const activeRole = user.activeRole || roles[0];

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Saved properties count
    const savedPropertiesCount = Array.isArray(user.savedProperties)
      ? user.savedProperties.length
      : 0;

    // Send tokens as HTTP-only cookies
    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000, // 15 minutes
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({
        message: "Logged in successfully",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          roles,
          activeRole,
          profilePhoto: user.profilePhoto,
          verified: user.verified,
          savedPropertiesCount,
        },
      });
  } catch (err) {
    console.error("Login error:", err.stack || err);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    jwt.verify(token, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res
          .status(403)
          .json({ message: "Invalid or expired refresh token" });
      }

      // Find user by ID
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is still verified
      if (!user.verified) {
        return res
          .status(403)
          .json({ message: "User account is not verified" });
      }

      // Generate new access token
      const newAccessToken = generateToken(user);

      // Send new access token as HTTP-only cookie
      res
        .cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000, // 15 minutes
        })
        .json({
          message: "Access token refreshed successfully",
          user: {
            id: user._id,
            roles: user.roles,
          },
        });
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ message: "Server error during token refresh" });
  }
};

export const logout = (req, res) => {
  try {
    res
      .clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // ✅
      })
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // ✅
      })
      .json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        message: "If the email exists, a password reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send password reset email
    const resetUrl = `${CLIENT_URL}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(user.email, user.fullName, resetUrl);

    res.json({
      message: "If the email exists, a password reset link has been sent",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Hash the token from URL
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message:
        "Password reset successfully! You can now log in with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id)
      .select(
        "-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires"
      )
      .populate("savedProperties", "title price location images status");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const roles =
      Array.isArray(user.roles) && user.roles.length ? user.roles : ["buyer"];
    const activeRole = user.activeRole || roles[0];

    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roles,
        activeRole,
        profilePhoto: user.profilePhoto,
        savedProperties: user.savedProperties,
        verified: user.verified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addProfile = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { role } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    // Parse FormData JSON safely
    let profileData = {};
    try {
      profileData = JSON.parse(req.body.profileData || "{}");
    } catch {
      return res.status(400).json({ message: "Invalid profile data format" });
    }

    // ✅ Validate role type
    if (!["agent", "estate"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // ✅ Fetch user and ensure it exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Prevent duplicate role profile
    if (user.roles.includes(role)) {
      return res
        .status(400)
        .json({ message: `${role} profile already exists` });
    }

    // ✅ Handle file uploads dynamically and cleanly
    const files = req.files || {};

    if (role === "agent" && files.profilePhoto?.[0]) {
      profileData.profilePhoto = files.profilePhoto[0].path.replace(/\\/g, "/");
    }

    if (role === "estate" && files.estateLogo?.[0]) {
      profileData.estateLogo = files.estateLogo[0].path.replace(/\\/g, "/");
    }

    if (files.verificationDocuments) {
      profileData.verificationDocuments = files.verificationDocuments.map((f) =>
        f.path.replace(/\\/g, "/")
      );
    }

    if (files.registrationDocuments) {
      profileData.registrationDocuments = files.registrationDocuments.map((f) =>
        f.path.replace(/\\/g, "/")
      );
    }

    // ✅ Add reference to user & save
    let profileRef;
    let createdProfile;

    if (role === "agent") {
      createdProfile = await Agent.create({ ...profileData, user: user._id });
    } else {
      createdProfile = await Estate.create({ ...profileData, user: user._id });
    }

    profileRef = createdProfile._id;

    // ✅ Update user roles and references
    user.roles.push(role);
    user.rolesData.push({ role, profile: profileRef });
    await user.save();

    // ✅ Response
    res.status(201).json({
      success: true,
      message: `${role} profile added successfully`,
      profile: createdProfile,
      userRoles: user.roles,
    });
  } catch (err) {
    console.error("Add Profile Error:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong while creating profile",
      error: err.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, profilePhoto } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error during profile update" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new passwords are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error during password change" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role, makeActive } = req.body; // role to add or set as active
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add role if not already present
    if (role && !user.roles.includes(role)) {
      user.roles.push(role);
    }

    // Set active role
    if (makeActive) {
      if (!user.roles.includes(makeActive)) {
        return res
          .status(400)
          .json({ message: "Cannot set active role that user doesn't have" });
      }
      user.activeRole = makeActive;
    }

    await user.save();

    res.status(200).json({
      message: "Roles updated successfully",
      roles: user.roles,
      activeRole: user.activeRole,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
