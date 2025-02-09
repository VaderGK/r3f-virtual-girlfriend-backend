import express from 'express';
const router = express.Router();
import { getVoices } from '../services/ttsService.js';


router.get("/voices", async (req, res) => {
    try {
        const voices = await getVoices();
        res.send(voices);
    } catch (error) {
        console.error("❌ Błąd pobierania głosów:", error);
        res.status(500).json({ error: "Błąd pobierania głosów ElevenLabs." });
    }
});

export default router;