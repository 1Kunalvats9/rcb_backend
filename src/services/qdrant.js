import { QdrantClient } from "@qdrant/qdrant-js";
import dotenv from "dotenv";
import { embedText } from "./embedding.js";
dotenv.config();

let qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
// Remove trailing slash if present for the official client
if (qdrantUrl.endsWith("/")) {
  qdrantUrl = qdrantUrl.slice(0, -1);
}

export const qdrant = new QdrantClient({
  url: qdrantUrl,
  apiKey: process.env.QDRANT_API_KEY,
});

export async function initCollection() {
  try {
    await qdrant.createCollection(process.env.COLLECTION_NAME, {
      vectors: {
        size: 384,
        distance: "Cosine",
      },
    });
  } catch (error) {
    if (
      error.status === 409 ||
      (error.data?.status?.error && error.data.status.error.includes("already exists")) ||
      (error.message && error.message.includes("already exists"))
    ) {
      return;
    }
    throw error;
  }
}

export async function storeDocument(id, text, embedding) {
  await qdrant.upsert(process.env.COLLECTION_NAME, {
    points: [
      {
        id,
        vector: embedding,
        payload: { text },
      },
    ],
  });
}

export async function searchDocs(embedding) {
  const result = await qdrant.search(process.env.COLLECTION_NAME, {
    vector: embedding,
    limit: 5,
  });

  return result.map((r) => ({
    id: r.id,
    text: r.payload?.text || '',
    score: r.score,
  }));
}

export async function getContextFromQdrant(query) {
  const embedding = await embedText(query);
  const docs = await searchDocs(embedding);
  return docs.map((doc) => doc.text);
}
