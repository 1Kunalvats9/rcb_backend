import express from "express";
import { ingest, pdfIngest } from "../controllers/ingest.controller.js";
import { auth } from "../middleware/auth.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", auth, ingest);
router.post("/pdf", auth, upload.single("file"), pdfIngest);

export default router;
