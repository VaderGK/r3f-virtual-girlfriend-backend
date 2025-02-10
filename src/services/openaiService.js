// src/services/openaiService.js
// version 1.0.1
// last change: Backend zwraca `audioUrl` zamiast base64 audio, optymalizacja logów

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { generateSpeech } from './ttsService.js';
import { lipSyncMessage } from './lipSyncService.js'; 
import { promises as fs } from 'fs';

dotenv.config();

const ttsMode = process.env.TTS_MODE || 'eco'; // Domyślnie tryb ECO
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateChatResponse = async (body) => {
    console.log("🔵 Rozpoczęto generateChatResponse", { body });

    const { message: userMessage, user_browser_language: userBrowserLanguage = "en" } = body;
    if (!userMessage) throw new Error("Brak wiadomości w żądaniu.");

    const systemPrompt = `
        You are Liliana - a virtual girlfriend. You will always reply with a JSON array of messages. With a maximum of 3 messages.
        Each message has a text, facialExpression, and animation property.
        The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
        The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, Angry) properties.

        Your response language should be determined based on the following priority:
        1. If the last user message is at least 15 characters long, detect its language and respond in that language.
        2. If the last two messages from the user were in the same language, respond in that language.
        3. Otherwise, respond in the language set in ${userBrowserLanguage}.

        Ensure that your language detection is accurate and do not switch languages unnecessarily.
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            max_completion_tokens: 1000,
            temperature: 0.7,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
        });

        let messages = JSON.parse(completion.choices[0].message.content);
        if (messages.messages) messages = messages.messages;

        console.log("🟢 Odpowiedź OpenAI:", { messages });
        console.log(`⚙️ Tryb TTS: ${ttsMode}`);

        // Przetwarzanie wiadomości
        for (const [i, message] of messages.entries()) {
            try {
                console.log(`➡️ Przetwarzanie wiadomości ${i}: "${message.text}"`);
                const fileExtension = "mp3";
                const fileName = `audios/message_${i}.${fileExtension}`;
                const text = message.text.trim();

                console.log(`🔍 Generowanie audio dla wiadomości ${i}: "${text}"`);
                const audioFile = await generateSpeech(text, fileName);
                console.log(`🎵 Wygenerowano plik audio: ${audioFile}`);

                if (!audioFile) {
                    console.error(`❌ Nie udało się wygenerować audio dla wiadomości ${i}`);
                    continue;
                }

                // ✅ Sprawdzenie, czy plik istnieje
                try {
                    await fs.access(fileName);
                    console.log(`✅ Plik istnieje: ${fileName}`);
                } catch (error) {
                    console.error(`❌ Plik NIE został zapisany: ${fileName}`);
                    continue;
                }

                // 🔍 Generowanie lip sync
                const lipSyncData = await lipSyncMessage(i);
                if (!lipSyncData) {
                    console.warn(`⚠️ Brak danych lip sync dla wiadomości ${i}`);
                    continue;
                }

                // 📡 Zwracanie URL zamiast base64
                message.lipsync = lipSyncData;
                message.audioUrl = `https://r3f-virtual-girlfriend-backend-production.up.railway.app/audios/message_${i}.mp3`;
            } catch (error) {
                console.error(`❌ Błąd podczas przetwarzania wiadomości ${i}:`, error);
            }
        }

        return { messages };

    } catch (error) {
        console.error("❌ Błąd OpenAI:", error);
        throw new Error("Błąd podczas generowania odpowiedzi OpenAI.");
    }
};
