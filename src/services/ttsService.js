// src/services/ttsService.js
import { generateSpeechElevenLabs } from './ttsElevenLabs.js';
import { generateSpeechCartesia } from './ttsCartesia.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

let defaultProvider = process.env.DEFAULT_TTS_PROVIDER || "elevenlabs";

export const generateSpeech = async (text, fileName) => {
    console.log(`🎤 Rozpoczęto generateSpeech: text="${text}", fileName="${fileName}"`);
    console.log(`⚙️ Aktualny defaultProvider: ${defaultProvider}`);

    try {
        //await fs.unlink(fileName).catch(() => { }); // Pomijamy usuwanie pliku na początku

        if (defaultProvider === "elevenlabs") {
            console.log(`🗣️ Wywołuję generateSpeechElevenLabs: text="${text}", fileName="${fileName}"`);
            const result = await generateSpeechElevenLabs(text, fileName);
            console.log(`✔️ generateSpeechElevenLabs zwróciło: ${result}`);
            if (!result) {
                console.warn("⚠️  generateSpeechElevenLabs nie powiodło się. Przełączam na Cartesia...");
                defaultProvider = "cartesia";
                console.log(`🗣️ Wywołuję generateSpeechCartesia: text="${text}", fileName="${fileName}"`);
                return await generateSpeechCartesia(text, fileName);
            }
            return result;
        } else {
            console.log(`🗣️ Wywołuję generateSpeechCartesia: text="${text}", fileName="${fileName}"`);
            const result = await generateSpeechCartesia(text, fileName);
            console.log(`✔️ generateSpeechCartesia zwróciło: ${result}`);
            if (!result) {
                console.warn("🔄 generateSpeechCartesia nie powiodło się. Przełączam na ElevenLabs...");
                defaultProvider = "elevenlabs";
                console.log(`🗣️ Wywołuję generateSpeechElevenLabs: text="${text}", fileName="${fileName}"`);
                return await generateSpeechElevenLabs(text, fileName);
            }
            return result;
        }
    } catch (error) {
        console.error("❌ Błąd w generateSpeech:", error);
        return null;
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