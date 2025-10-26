import mongoose from "mongoose";

const estateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    estateName: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    contactEmail: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    website: String,
    totalProperties: { type: Number, default: 0 },
    estateLogo: String,

    // Verification & compliance
    verified: { type: Boolean, default: false },
    registrationDocuments: [{ type: String }],

    // Portfolio
    propertiesManaged: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    ],

    // Activity tracking
    active: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

const Estate = mongoose.model("Estate", estateSchema);
export default Estate;
