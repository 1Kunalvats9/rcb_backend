import { embedText } from "../services/embedding.js";
import { qdrant, storeDocument } from "../services/qdrant.js";
import multer from "multer";
import Document from "../models/documentModel.js";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config();

// Use dynamic import to load pdf-parse via CommonJS wrapper
let pdfParse = null;

async function getPdfParse() {
  if (!pdfParse) {
    const pdfParserModule = await import("../utils/pdfParser.cjs");
    // The wrapper exports pdfParse as default
    const imported = pdfParserModule.default;
    
    // Handle the export - it should be the function from the wrapper
    if (typeof imported === 'function') {
      pdfParse = imported;
    } else {
      // Fallback: try to get it from the module structure
      throw new Error(`pdf-parse not available. Got type: ${typeof imported}`);
    }
  }
  return pdfParse;
}

const upload = multer({ storage: multer.memoryStorage() });

export async function ingest(req, res) {
  try {
    const { id, text } = req.body;
    const embedding = await embedText(text);
    await storeDocument(id, text, embedding);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function pdfIngest(req, res) {
  try {
    // Multer handled in route
    console.log("[PDF Ingest] Request received");
    console.log("[PDF Ingest] File:", req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : "No file");
    console.log("[PDF Ingest] User:", req.user);
    
    if (!req.file) {
      console.log("[PDF Ingest] No file in request");
      return res.status(400).json({ error: "No PDF file uploaded." });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "File is not a PDF." });
    }

    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated." });
    }

    // Extract text from PDF
    console.log("[PDF Ingest] Starting PDF parsing...");
    const pdfParseFn = await getPdfParse();
    const pdfData = await pdfParseFn(req.file.buffer);
    console.log("[PDF Ingest] PDF parsed successfully");
    const fullText = pdfData.text?.trim() || "";
    if (!fullText) {
      return res.status(400).json({ error: "PDF contains no extractable text." });
    }
    console.log(`[PDF Ingest] Extracted ${fullText.length} characters from PDF`);

    // Chunking
    const CHUNK_SIZE = 1600;
    const CHUNK_OVERLAP = 100;
    const chunks = [];

    let start = 0;
    while (start < fullText.length) {
      const end = Math.min(start + CHUNK_SIZE, fullText.length);
      const chunk = fullText.slice(start, end).trim();
      if (chunk) chunks.push(chunk);
      if (end === fullText.length) break;
      start = end - CHUNK_OVERLAP;
    }

    if (chunks.length === 0) {
      return res.status(400).json({ error: "No chunks produced from PDF." });
    }
    console.log(`[PDF Ingest] Created ${chunks.length} chunks`);

    // Create embeddings + points
    const now = Date.now();
    const points = [];
    console.log("[PDF Ingest] Starting embedding generation...");

    for (let i = 0; i < chunks.length; i++) {
      console.log(`[PDF Ingest] Processing chunk ${i + 1}/${chunks.length}`);
      const vector = await embedText(chunks[i]);
      points.push({
        id: randomUUID(), // Qdrant requires UUID or unsigned integer
        vector,
        payload: {
          userId,
          text: chunks[i],
          fileName: req.file.originalname,
          source: "pdf",
          chunkIndex: i,
          uploadedAt: new Date(now).toISOString(),
        },
      });
    }
    console.log("[PDF Ingest] All embeddings generated");

    // Upsert to Qdrant
    console.log("[PDF Ingest] Upserting to Qdrant...");
    await qdrant.upsert(process.env.COLLECTION_NAME, { points });
    console.log("[PDF Ingest] Qdrant upsert complete");

    // Save metadata
    console.log("[PDF Ingest] Saving document metadata...");
    const doc = await Document.create({
      userId,
      fileName: req.file.originalname,
      size: req.file.size,
      chunkCount: chunks.length,
      uploadedAt: new Date(),
      source: "pdf",
    });
    console.log("[PDF Ingest] Document saved with ID:", doc._id);

    res.json({
      success: true,
      message: "PDF ingested successfully",
      chunks: chunks.length,
      documentId: doc._id,
    });

  } catch (err) {
    console.error("PDF ingest error:", err);
    res.status(500).json({ error: "PDF ingestion failed", details: err.message });
  }
}
