import { embedText } from "./embedding.js";
import { searchDocs } from "./qdrant.js";
import { buildPrompt } from "../utils/prompt.js";
import { askGemini } from "./llm.js";

export async function runRAG(query) {
  const embedding = await embedText(query);
  const docs = await searchDocs(embedding);

  const prompt = buildPrompt(query, docs);
  const llmResponse = await askGemini(prompt);

  // Clean the response - remove markdown code blocks if present
  let cleanedResponse = llmResponse.trim();
  
  // Remove markdown code blocks (```json ... ```)
  if (cleanedResponse.startsWith("```")) {
    cleanedResponse = cleanedResponse.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
  }
  
  // Remove any leading/trailing whitespace
  cleanedResponse = cleanedResponse.trim();

  return JSON.parse(cleanedResponse);
}
