// src/services/ttsCartesia.js
// version 1.0.0
import fetch from 'node-fetch';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

export const generateSpeechCartesia = async (text, fileName) => {
    console.log(`🎧 [Cartesia] Rozpoczęto generateSpeechCartesia: text="${text}", fileName="${fileName}"`);

    try {
        const url = "https://api.cartesia.ai/tts/bytes";
        console.log(`🌐 [Cartesia] Wywołuję API Cartesia: ${url}`);

        const requestBody = JSON.stringify({
            model_id: "sonic",
            transcript: text,
            voice: {
                mode: "id",
                id: "575a5d29-1fdc-4d4e-9afa-5a9a71759864"
            },
            output_format: {
                container: "mp3",
                bit_rate: 128000,
                sample_rate: 44100
            },
            language: "pl"
        });

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.CARTESIA_API_KEY,
                "Cartesia-Version": "2024-06-10",
            },
            body: requestBody,
        });

        console.log(`✉️  [Cartesia] Otrzymano odpowiedź z API Cartesia: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            console.error(`❌ [Cartesia] Błąd API Cartesia: ${response.status} - ${response.statusText}`);
            try {
                const errorData = await response.json();
                console.error("📝 [Cartesia] Szczegóły błędu Cartesia:", errorData);
            } catch (e) {
                console.error("❌ [Cartesia] Błąd parsowania JSON z odpowiedzi Cartesia:", e);
                const errorText = await response.text();
                console.error("❌ [Cartesia] Treść odpowiedzi Cartesia (nie-JSON):", errorText);
            }
            return null;
        }

        const audioBuffer = await response.arrayBuffer();
        await fs.writeFile(fileName, Buffer.from(audioBuffer));
        console.log(`✅ [Cartesia] Plik audio poprawnie zapisany: ${fileName}`);
        return fileName;
    } catch (error) {
        console.error("❌ [Cartesia] Błąd połączenia z Cartesia API:", error);
        return null;
    }
};