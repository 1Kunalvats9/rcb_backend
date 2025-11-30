import express from "express";
import { chat } from "../controllers/chat.controller.js";
import { auth } from "../middleware/auth.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getContextFromQdrant } from "../services/qdrant.js";


const router = express.Router();
router.post("/",auth, chat);

router.post("/stream", auth, async (req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.flushHeaders();

    // Handle client disconnection
    req.on("close", () => {
        if (!res.writableEnded) {
            res.end();
        }
    });

    try {
        const { query } = req.body;
        if (!query) {
            res.write("Error: No query provided\n");
            return res.end();
        }

        // 1. Retrieve relevant chunks
        const context = await getContextFromQdrant(query);
        
        // Handle empty context gracefully
        const contextText = context && context.length > 0 
            ? context.join("\n") 
            : "No specific context available.";

        // 2. Prepare prompt
        const prompt = `You are a helpful assistant. Use the context below to answer the question.
Make sure to answer the question in a friendly tone and engaging manner.

CONTEXT:
${contextText}

QUESTION:
${query}

Please provide a clear and helpful answer based on the context provided.`;

        // 3. Gemini Streaming
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured");
        }
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContentStream(prompt);

        // Stream the response
        for await (const chunk of result.stream) {
            // Check if client disconnected
            if (res.writableEnded) {
                break;
            }
            
            try {
                const chunkText = chunk.text();
                if (chunkText) {
                    res.write(chunkText);
                }
            } catch (chunkError) {
                console.error("Error processing chunk:", chunkError);
                // Continue streaming even if one chunk fails
            }
        }

        if (!res.writableEnded) {
            res.write("\n[END]");
            res.end();
        }

    } catch (err) {
        console.error("Streaming Error:", err);
        if (!res.writableEnded) {
            res.write(`\nError: ${err.message}\n`);
            res.end();
        }
    }
});


export default router;
