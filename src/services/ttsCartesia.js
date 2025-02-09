import fetch from "node-fetch";
import fs from "fs/promises";
import dotenv from "dotenv";

dotenv.config();

export const generateSpeechCartesia = async (text, fileName) => {
  try {
    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: { "X-API-Key": process.env.CARTESIA_API_KEY },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error(`Błąd API Cartesia: ${response.status}`);

    const audioBuffer = await response.arrayBuffer();
    await fs.writeFile(fileName, Buffer.from(audioBuffer));
    return fileName;
  } catch (error) {
    console.error("❌ Błąd Cartesia:", error);
    return null;
  }
};
