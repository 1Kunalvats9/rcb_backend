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

// Increase body size limit for PDF uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.path} at ${new Date().toISOString()}`);
  next();
});

app.use("/ingest", ingestRoute);
app.use("/chat", chatRoute);
app.use("/auth", authRoute);

app.listen(3000, async () => {
  console.log("Server running on port 3000");
  await initCollection();
});
