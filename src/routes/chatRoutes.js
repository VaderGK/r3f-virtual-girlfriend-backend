import express from "express";
import { chatWithAI } from "../services/openaiService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const userMessage = req.body.message;
  const userBrowserLanguage = req.body.user_browser_language || "en";

  if (!userMessage) {
    return res.status(400).json({ error: "Brak wiadomości w żądaniu." });
  }

  try {
    const response = await chatWithAI(userMessage, userBrowserLanguage);
    res.json(response);
  } catch (error) {
    console.error("❌ Błąd OpenAI:", error);
    res.status(500).json({ error: "Błąd podczas generowania odpowiedzi OpenAI." });
  }
});

export default router;
