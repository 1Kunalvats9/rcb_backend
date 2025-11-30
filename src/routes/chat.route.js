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

    try {
        const { query } = req.body;
        if (!query) {
            res.write("Error: No query provided\n");
            return res.end();
        }

        // 1. Retrieve relevant chunks
        const context = await getContextFromQdrant(query);

        // 2. Prepare prompt
        const prompt = `
        You are a helpful assistant. Use the context below to answer:

        CONTEXT:
        ${context.join("\n")}

        QUESTION:
        ${query}
        `;

        // 3. Gemini Streaming
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const stream = await model.generateContentStream(prompt);

        for await (const chunk of stream.stream) {
            const text = chunk.text();
            if (text) {
                res.write(text);
            }
        }

        res.write("[END]");
        res.end();

    } catch (err) {
        console.error("Streaming Error:", err);
        res.write("Error occurred\n");
        res.end();
    }
});


export default router;
