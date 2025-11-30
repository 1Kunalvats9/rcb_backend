import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  fileName: String,
  size: Number,
  chunkCount: Number,
  uploadedAt: { type: Date, default: Date.now },
  source: String
});

export default mongoose.model("Document", DocumentSchema);
