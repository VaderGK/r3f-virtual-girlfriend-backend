// src/routes/chatRoutes.js
// version 1.0.1
// change: Dodano obsługę błędów dla pustego `req.body` oraz logowanie żądania

import express from 'express';
import { generateChatResponse } from '../services/openaiService.js';

const router = express.Router();

router.post("/chat", async (req, res) => {
    try {
        console.log("📩 Otrzymano żądanie na /chat:", req.body); // 🔍 Debugowanie

        if (!req.body || typeof req.body !== "object") {
            throw new Error("❌ Błędne żądanie! Brak `body` lub ma zły format.");
        }

        const response = await generateChatResponse(req.body);
        res.send(response);
    } catch (error) {
        console.error("❌ Błąd podczas obsługi żądania czatu:", error);
        res.status(500).json({ error: "Błąd podczas generowania odpowiedzi OpenAI." });
    }
});

export default router;