import express from "express";
import { ingest, pdfIngest } from "../controllers/ingest.controller.js";
import { auth } from "../middleware/auth.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum size is 50MB." });
    }
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  next(err);
};

router.post("/", auth, ingest);
router.post("/pdf", auth, upload.single("file"), handleMulterError, pdfIngest);

export default router;
