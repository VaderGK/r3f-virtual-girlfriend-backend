import fetch from 'node-fetch';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

export const generateSpeechCartesia = async (text, fileName) => {
  console.log(`🎤 [Cartesia] Generowanie mowy dla: ${text} -> ${fileName}`);

  try {
    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.CARTESIA_API_KEY,
        "Cartesia-Version": "2024-06-10",
      },
      body: JSON.stringify({
        model_id: "sonic-english", // Można zmienić na inny dostępny model
        transcript: text,
        voice: {
          mode: "id",
          id: "575a5d29-1fdc-4d4e-9afa-5a9a71759864", // ID głosu, zmień jeśli potrzeba
        },
        output_format: {
          container: "wav",
          sample_rate: 22050,
          encoding: "pcm_s16le",
        },
        language: "pl", // Można zmieniać dynamicznie
      }),
    });

    if (!response.ok) {
      console.error(`❌ Błąd API Cartesia: ${response.status} - ${response.statusText}`);
      const errorData = await response.json();
      console.error("📝 Szczegóły błędu Cartesia:", errorData);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    await fs.writeFile(fileName, Buffer.from(audioBuffer));
    console.log(`✅ [Cartesia] Plik audio poprawnie zapisany: ${fileName}`);
    return fileName;
  } catch (error) {
    console.error("❌ Błąd połączenia z Cartesia API:", error);
    return null;
  }
};