import fetch from "node-fetch";
import fs from "fs/promises";
import dotenv from "dotenv";

dotenv.config();

export const generateSpeechElevenLabs = async (text, fileName) => {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVEN_LABS_API_KEY },
      body: JSON.stringify({ text }),
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
