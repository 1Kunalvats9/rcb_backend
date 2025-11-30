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
    console.error("[Multer Error]:", err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: "File too large. Maximum size is 50MB." });
    }
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  next(err);
};

// Debug middleware to log incoming requests
router.use("/pdf", (req, res, next) => {
  console.log(`[PDF Route] ${req.method} ${req.path} - Headers:`, {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length'],
    'authorization': req.headers['authorization'] ? 'present' : 'missing'
  });
  next();
});

router.post("/", auth, ingest);
router.post("/pdf", auth, upload.single("file"), handleMulterError, pdfIngest);

export default router;
