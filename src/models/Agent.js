import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    licenseNumber: { type: String, required: true, trim: true },
    agencyName: { type: String, required: true, trim: true },
    yearsOfExperience: { type: Number, default: 0 },
    specializations: [
      { type: String, enum: ["residential", "commercial", "rental", "luxury"] },
    ],
    phone: String,
    address: String,
    profilePhoto: String,

    // Performance & credibility
    ratings: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    propertiesListed: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    ],

    // Verification
    verified: { type: Boolean, default: false },
    verificationDocuments: [{ type: String }],

    // Activity tracking
    active: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

const Agent = mongoose.model("Agent", agentSchema);
export default Agent;
