import { embedText } from "../services/embedding.js";
import { storeDocument } from "../services/qdrant.js";

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
