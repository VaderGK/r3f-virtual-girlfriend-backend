import { generateSpeechElevenLabs } from "./ttsElevenLabs.js";
import { generateSpeechCartesia } from "./ttsCartesia.js";
import dotenv from "dotenv";

dotenv.config();
let defaultProvider = process.env.DEFAULT_TTS_PROVIDER || "elevenlabs";

export const generateSpeech = async (text, fileName) => {
  console.log(`🎤 Generowanie mowy dla: ${text} -> ${fileName}`);

  if (defaultProvider === "elevenlabs") {
    const result = await generateSpeechElevenLabs(text, fileName);
    if (!result) {
      console.warn("🔄 Przełączam na Cartesia...");
      defaultProvider = "cartesia";
      return await generateSpeechCartesia(text, fileName);
    }
    return result;
  } else {
    const result = await generateSpeechCartesia(text, fileName);
    if (!result) {
      console.warn("🔄 Przełączam na ElevenLabs...");
      defaultProvider = "elevenlabs";
      return await generateSpeechElevenLabs(text, fileName);
    }
    return result;
  }
};
