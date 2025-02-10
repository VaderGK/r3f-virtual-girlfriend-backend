// src/routes/chatRoutes.js
// version 1.0.0
import express from 'express';
import { generateChatResponse } from '../services/openaiService.js';

const router = express.Router();

router.post("/chat", async (req, res) => {
    try {
        const response = await generateChatResponse(req.body);
        res.send(response);
    } catch (error) {
        console.error("❌ Błąd podczas obsługi żądania czatu:", error);
        res.status(500).json({ error: "Błąd podczas generowania odpowiedzi OpenAI." });
    }
});

export default router;