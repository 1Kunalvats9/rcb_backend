import { HfInference } from "@huggingface/inference";
import dotenv from "dotenv";
dotenv.config();

const hf = new HfInference(process.env.HF_API_KEY);

export async function embedText(text) {
  try {
    const response = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text,
    });

    // The response is already the embedding array
    return Array.isArray(response) ? response : response[0];
  } catch (error) {
    throw new Error(`Hugging Face API error: ${error.message}`);
  }
}
