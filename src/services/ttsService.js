// src/services/ttsService.js
// version 1.0.0
// changes: 
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
        let result = null;

        if (defaultProvider === "elevenlabs") {
            console.log("📁 Generowanie pliku MP3:", fileName);
            console.log(`🗣️ Wywołuję generateSpeechElevenLabs: text="${text}", fileName="${fileName}"`);
            result = await generateSpeechElevenLabs(text, fileName);
            console.log(`✔️ generateSpeechElevenLabs zwróciło: ${result}`);
            
            if (!result) {
                console.warn("⚠️  generateSpeechElevenLabs nie powiodło się. Przełączam na Cartesia...");
                defaultProvider = "cartesia";
                console.log(`🗣️ Wywołuję generateSpeechCartesia: text="${text}", fileName="${fileName}"`);
                result = await generateSpeechCartesia(text, fileName);
            }
        } else {
            console.log("📁 Generowanie pliku MP3:", fileName);
            console.log(`🗣️ Wywołuję generateSpeechCartesia: text="${text}", fileName="${fileName}"`);
            result = await generateSpeechCartesia(text, fileName);
            console.log(`✔️ generateSpeechCartesia zwróciło: ${result}`);

            if (!result) {
                console.warn("🔄 generateSpeechCartesia nie powiodło się. Przełączam na ElevenLabs...");
                defaultProvider = "elevenlabs";
                console.log(`🗣️ Wywołuję generateSpeechElevenLabs: text="${text}", fileName="${fileName}"`);
                result = await generateSpeechElevenLabs(text, fileName);
            }
        }

        if (!result) {
            console.error("❌ Generowanie dźwięku nie powiodło się w obu providerach!");
            return null;
        }

        // ✅ SPRAWDZENIE CZY PLIK ZOSTAŁ UTWORZONY
        try {
            await fs.access(fileName);
            console.log(`✅ Plik MP3 został poprawnie zapisany: ${fileName}`);
        } catch (err) {
            console.error(`❌ Plik MP3 NIE ISTNIEJE! Możliwe problemy z zapisem: ${fileName}`, err);
            return null;
        }

        return result;

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