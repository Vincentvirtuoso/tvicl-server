// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      required: true,
    },

    // Multi-role support
    roles: {
      type: [String],
      enum: ["buyer", "seller", "agent", "admin", "estate"],
      default: ["buyer"],
    },

    // Active role for hybrid approach
    activeRole: {
      type: String,
      enum: ["buyer", "seller", "agent", "admin", "estate"],
      default: "buyer",
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    // Role-specific profile references
    rolesData: [
      {
        role: { type: String, enum: ["agent", "estate"] },
        profile: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "rolesData.role",
        },
      },
    ],

    savedProperties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
      },
    ],

    verified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpires: {
      type: Date,
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user has a role
userSchema.methods.hasRole = function (role) {
  return this.roles.includes(role);
};

// Auto-clear expired verification token
userSchema.pre("save", function (next) {
  if (
    this.verified &&
    this.verificationToken &&
    this.verificationTokenExpires &&
    this.verificationTokenExpires <
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  ) {
    this.verificationToken = null;
    this.verificationTokenExpires = null;
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
