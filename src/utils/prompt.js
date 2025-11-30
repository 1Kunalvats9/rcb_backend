export function buildPrompt(query, chunks) {
    return `
  You are an AI assistant helping the user with information from the provided context.
  
  RULES:
  1. Only use the provided context.
  2. If answer not found, say:
     "The information is not available in the provided context."
  3. Output valid JSON only.
  
  JSON format:
  {
    "answer": "<response>",
    "confidence": "<low | medium | high>",
    "sources": ["<chunk_id_1>", "<chunk_id_2>"]
  }
  
  USER QUESTION:
  ${query}
  
  CONTEXT:
  ${chunks.map((c) => `ID: ${c.id} | TEXT: ${c.text}`).join("\n")}
  `;
  }
  