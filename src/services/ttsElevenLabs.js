import fetch from 'node-fetch';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

const voiceID = "XrExE9yKIg1WjnnlVkGX";

export const generateSpeechElevenLabs = async (text, fileName) => {
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "xi-api-key": process.env.ELEVEN_LABS_API_KEY },
            body: JSON.stringify({
                text, model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.5, style: 0.0, use_speaker_boost: true }
            })
        });

        if (!response.ok) throw new Error(`Błąd API ElevenLabs: ${response.status}`);

        const audioBuffer = await response.arrayBuffer();
        await fs.writeFile(fileName, Buffer.from(audioBuffer));
        return fileName;
    } catch (error) {
        console.error("❌ Błąd ElevenLabs:", error);
        return null;
    }
};