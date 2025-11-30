import express from "express";
import cors from "cors";
import ingestRoute from "./routes/ingest.route.js";
import chatRoute from "./routes/chat.route.js";
import { initCollection } from "./services/qdrant.js";
import authRoute from "./routes/auth.route.js";
import mongoose from "mongoose";

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));


const app = express();
app.use(express.json());
app.use(cors());

app.use("/ingest", ingestRoute);
app.use("/chat", chatRoute);
app.use("/auth", authRoute);

app.listen(3000, async () => {
  console.log("Server running on port 3000");
  await initCollection();
});
