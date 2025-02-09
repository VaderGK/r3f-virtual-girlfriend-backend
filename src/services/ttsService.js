import { generateSpeechElevenLabs } from './ttsElevenLabs.js';
import { generateSpeechCartesia } from './ttsCartesia.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

let defaultProvider = process.env.DEFAULT_TTS_PROVIDER || "elevenlabs";

export const generateSpeech = async (text, fileName) => {
  console.log(`🎤 Generowanie mowy dla: ${text} -> ${fileName}`);

  await fs.unlink(fileName).catch(() => {});

  if (defaultProvider === "elevenlabs") {
    const result = await generateSpeechElevenLabs(text, fileName);
    if (!result) {
      console.warn("🔄 Przełączam na Cartesia...");
      defaultProvider = "cartesia";
      return await generateSpeechCartesia(text, fileName);
    }
    return result;
  } else {
    const result = await generateSpeechCartesia(text, fileName);
    if (!result) {
      console.warn("🔄 Przełączam na ElevenLabs...");
      defaultProvider = "elevenlabs";
      return await generateSpeechElevenLabs(text, fileName);
    }
    return result;
  }
};

export async function getVoices() {
    try {
        const response = await fetch("https://api.elevenlabs.io/v1/voices?show_legacy=true", {
            headers: { "xi-api-key": process.env.ELEVEN_LABS_API_KEY },
        });

        if (!response.ok) {
            console.error("❌ Błąd pobierania głosów:", response.status, response.statusText);
            return [];
        }

        const data = await response.json();
        return data.voices || [];
    } catch (error) {
        console.error("❌ Błąd połączenia z ElevenLabs API:", error);
        return [];
    }
}
import fetch from 'node-fetch';