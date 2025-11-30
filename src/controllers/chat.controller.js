import { runRAG } from "../services/rag.js";

export async function chat(req, res) {
  try {
    const { query } = req.body;

    const result = await runRAG(query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
