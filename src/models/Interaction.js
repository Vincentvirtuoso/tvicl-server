import mongoose from "mongoose";
const { Schema } = mongoose;

const interactionSchema = new Schema({
  userId: { type: String, required: true },
  propertyId: { type: String },
  action: {
    type: String,
    enum: ["view", "save", "share", "search"],
    required: true,
  },
  searchQuery: String,
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Interaction", interactionSchema);
