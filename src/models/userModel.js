import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  google_id: { type: String, required: true },
  email: { type: String, required: true },
  name: String,
  picture: String
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
