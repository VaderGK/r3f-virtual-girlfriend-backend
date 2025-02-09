import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateChatResponse = async (body) => {
    const { message: userMessage, user_browser_language: userBrowserLanguage = "en" } = body;

    if (!userMessage) {
        throw new Error("Brak wiadomości w żądaniu.");
    }

    if (!process.env.ELEVEN_LABS_API_KEY || openai.apiKey === "-") {
        throw new Error("Brak kluczy API OpenAI i ElevenLabs.");
    }

    const systemPrompt = `
        You are Liliana - a virtual girlfriend. You will always reply with a JSON array of up to 3 messages, where each message has text, facialExpression (smile, sad, angry, surprised, funnyFace, default), and animation (Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, Angry) properties.

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

        console.log("📝 Odpowiedź OpenAI:", messages);

        // Tutaj wrzucamy logikę generowania audio i lip sync
        await Promise.all(messages.map(async (message, i) => {
            const fileExtension = process.env.DEFAULT_TTS_PROVIDER === "cartesia" ? "wav" : "mp3";
            const fileName = `audios/message_${i}.${fileExtension}`;

            const text = message.text.trim();

            console.log(`🔍 Generowanie audio dla wiadomości ${i}: "${text}"`);

            const audioFile = await generateSpeech(text, fileName);

            // ✅ Sprawdzenie, czy plik MP3 rzeczywiście się zapisał
            try {
                await fs.access(fileName);
                console.log(`✅ Plik MP3 istnieje: ${fileName}`);
            } catch (error) {
                console.error(`❌ Plik MP3 NIE został zapisany: ${fileName}`);
                return;
            }

            const lipSyncData = await lipSyncMessage(i);
            const audioBase64 = await audioFileToBase64(fileName);

            message.lipsync = lipSyncData;
            message.audio = audioBase64;
        }));

        return { messages };

    } catch (error) {
        console.error("❌ Błąd OpenAI:", error);
        throw new Error("Błąd podczas generowania odpowiedzi OpenAI.");
    }
};

import { promises as fs } from 'fs';
import { generateSpeech } from './ttsService.js';


const audioFileToBase64 = async (file) => {
    try {
        const data = await fs.readFile(file);
        return data.toString("base64");
    } catch (error) {
        console.error(`❌ Błąd odczytu pliku audio: ${file}`, error);
        return null;
    }
};