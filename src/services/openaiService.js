// src/services/openaiService.js
// version 1.0.0
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { generateSpeech } from './ttsService.js';
import { lipSyncMessage } from './lipSyncService.js'; // Załóżmy, że masz lipSyncService
import { promises as fs } from 'fs';

dotenv.config();

const ttsMode = process.env.TTS_MODE || 'eco'; // Domyślnie tryb ECO
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const audioFileToBase64 = async (file) => {
    try {
        const data = await fs.readFile(file);
        return data.toString("base64");
    } catch (error) {
        console.error(`❌ Błąd odczytu pliku audio: ${file}`, error);
        return null;
    }
};

export const generateChatResponse = async (body) => {
    console.log("🔵 Rozpoczęto generateChatResponse", { body });
    const { message: userMessage, user_browser_language: userBrowserLanguage = "en" } = body;

    if (!userMessage) {
        throw new Error("Brak wiadomości w żądaniu.");
    }

    if (!process.env.ELEVEN_LABS_API_KEY || !openai.apiKey) { // Poprawione sprawdzenie OpenAI API key
        throw new Error("Brak kluczy API OpenAI i ElevenLabs.");
    }

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
        if (messages.messages) {
            messages = messages.messages;
        }

        console.log("🟢 Odpowiedź OpenAI:", { messages });
        console.log(`⚙️ Tryb TTS: ${ttsMode}`);

        if (ttsMode === 'pro') {
            // ✅ Tryb PRO: Wywołaj TTS równocześnie (Promise.all)
            await Promise.all(messages.map(async (message, i) => {
                try {
                    console.log(`➡️ Przetwarzanie wiadomości ${i}: "${message.text}"`);
                    const fileExtension = "mp3"; // Zmieniono na stale mp3
                    const fileName = `audios/message_${i}.${fileExtension}`;

                    const text = message.text.trim();

                    console.log(`🔍 [PRO] Generowanie audio dla wiadomości ${i}: "${text}"`);

                    const audioFile = await generateSpeech(text, fileName);
                    console.log(`🎵 Wygenerowano plik audio: ${audioFile}`);

                    if (!audioFile) {
                        console.error(`❌ [PRO] Nie udało się wygenerować audio dla wiadomości ${i}`);
                        return; // Przejdź do następnej iteracji
                    }

                    // ✅ Sprawdzenie, czy plik istnieje
                    try {
                        await fs.access(fileName);
                        console.log(`✅ [PRO] Plik istnieje: ${fileName}`);
                    } catch (error) {
                        console.error(`❌ [PRO] Plik NIE został zapisany: ${fileName}`);
                        return; // Przejdź do następnej iteracji
                    }

                    const lipSyncData = await lipSyncMessage(i);

                    if (!lipSyncData) {
                        console.warn(`⚠️  [PRO] Brak danych lip sync dla wiadomości ${i}`);
                        return;
                    }

                    const audioBase64 = await audioFileToBase64(fileName);

                    if (!audioBase64) {
                        console.error(`❌ [PRO] Błąd konwersji audio do base64 dla wiadomości ${i}`);
                        return;
                    }


                    message.lipsync = lipSyncData;
                    message.audio = audioBase64;
                } catch (error) {
                    console.error(`❌ [PRO] Błąd podczas przetwarzania wiadomości ${i}:`, error);
                }
            }));
        } else {
            // ✅ Tryb ECO: Wywołaj TTS sekwencyjnie (pętla for...of)
            for (const [i, message] of messages.entries()) {
                try {
                    console.log(`➡️ Przetwarzanie wiadomości ${i}: "${message.text}"`);
                   const fileExtension = "mp3"; // Zmieniono na stale mp3
                    const fileName = `audios/message_${i}.${fileExtension}`;

                    const text = message.text.trim();

                    console.log(`🔍 [ECO] Generowanie audio dla wiadomości ${i}: "${text}"`);

                    const audioFile = await generateSpeech(text, fileName);
                    console.log(`🎵 Wygenerowano plik audio: ${audioFile}`);

                    if (!audioFile) {
                        console.error(`❌ [ECO] Nie udało się wygenerować audio dla wiadomości ${i}`);
                        continue; // Przejdź do następnej wiadomości
                    }

                    // ✅ Sprawdzenie, czy plik istnieje
                    try {
                        await fs.access(fileName);
                        console.log(`✅ [ECO] Plik istnieje: ${fileName}`);
                    } catch (error) {
                        console.error(`❌ [ECO] Plik NIE został zapisany: ${fileName}`);
                        continue; // Przejdź do następnej wiadomości
                    }

                    const lipSyncData = await lipSyncMessage(i);
                    if (!lipSyncData) {
                        console.warn(`⚠️  [ECO] Brak danych lip sync dla wiadomości ${i}`);
                        continue;
                    }


                    const audioBase64 = await audioFileToBase64(fileName);

                    if (!audioBase64) {
                        console.error(`❌ [ECO] Błąd konwersji audio do base64 dla wiadomości ${i}`);
                        continue;
                    }

                    message.lipsync = lipSyncData;
                    message.audio = audioBase64;
                } catch (error) {
                    console.error(`❌ [ECO] Błąd podczas przetwarzania wiadomości ${i}:`, error);
                }
            }
        }

        return { messages };

    } catch (error) {
        console.error("❌ Błąd OpenAI:", error);
        throw new Error("Błąd podczas generowania odpowiedzi OpenAI.");
    }
};