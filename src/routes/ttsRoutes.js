import express from "express";
import { generateSpeech } from "../services/ttsService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { text, fileName } = req.body;
  if (!text || !fileName) {
    return res.status(400).json({ error: "Brak wymaganych parametrów." });
  }

  try {
    const audioFile = await generateSpeech(text, fileName);
    if (!audioFile) throw new Error("Błąd generowania mowy.");
    res.json({ success: true, file: audioFile });
  } catch (error) {
    console.error("❌ Błąd generowania mowy:", error);
    res.status(500).json({ error: "Nie udało się wygenerować mowy." });
  }
});

export default router;
