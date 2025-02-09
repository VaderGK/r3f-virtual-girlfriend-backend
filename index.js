import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import express from "express";
import { promises as fs } from "fs";
import OpenAI from "openai";
dotenv.config();

// 🟢 API Keys i konfiguracja
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const cartesiaApiKey = process.env.CARTESIA_API_KEY;
let defaultProvider = process.env.DEFAULT_TTS_PROVIDER || "elevenlabs";

const voiceID = "XrExE9yKIg1WjnnlVkGX";

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 8000;

// 🛠️ Sprawdzanie zależności
function checkDependencies() {
  exec("ffmpeg -version", (error, stdout) => {
      if (error) console.error("🚨 FFmpeg NIE jest zainstalowany!");
      else console.log("✅ FFmpeg działa:\n", stdout);
  });

  const rhubarbPath = "/usr/local/bin/rhubarb";
  exec("rhubarb --version", async (error, stdout) => {
      if (error) {
          console.warn("🚨 Rhubarb NIE jest zainstalowany! Pobieranie...");
          try {
              await execCommand(`curl -L -o ${rhubarbPath} https://github.com/DanielSWolf/rhubarb-lip-sync/releases/latest/download/rhubarb-linux`);
              await execCommand(`chmod +x ${rhubarbPath}`);
              console.log("✅ Rhubarb został pobrany.");
          } catch (installError) {
              console.error("❌ Nie udało się pobrać Rhubarb!", installError);
          }
      } else console.log("✅ Rhubarb działa:\n", stdout);
  });
}
checkDependencies();

// 🟢 STATUS API
app.get("/", (req, res) => res.send("Hello World!"));
app.get("/api/status", (req, res) => res.json({ status: "ok", message: "Backend działa poprawnie!" }));

// 🟢 Pobieranie głosów
app.get("/voices", async (req, res) => {
  try {
      const response = await fetch("https://api.elevenlabs.io/v1/voices?show_legacy=true", { headers: { "xi-api-key": elevenLabsApiKey } });
      const data = await response.json();
      res.send(data.voices);
  } catch (error) {
      console.error("❌ Błąd pobierania głosów:", error);
      res.status(500).json({ error: "Błąd pobierania głosów ElevenLabs." });
  }
});

// 🟢 Generowanie mowy (ElevenLabs lub Cartesia)
const generateSpeech = async (text, fileName) => {
  console.log(`🎤 Generowanie mowy dla: ${text} -> ${fileName}`);

  await fs.unlink(fileName).catch(() => {});

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

// ✅ ElevenLabs
const generateSpeechElevenLabs = async (text, fileName) => {
  try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "xi-api-key": elevenLabsApiKey },
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

// ✅ Cartesia
const generateSpeechCartesia = async (text, fileName) => {
  try {
      const response = await fetch(`https://api.cartesia.ai/v1/text-to-speech`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cartesiaApiKey}` },
          body: JSON.stringify({
              text, voice: "default", format: "wav",
              encoding: "pcm_s16le", sample_rate: 16000
          })
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



/**
 * ✅ Endpoint do czatu z obsługą języka
 */
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const userBrowserLanguage = req.body.user_browser_language || "en"; // Domyślny język przeglądarki użytkownika

  if (!userMessage) {
    return res.status(400).json({ error: "Brak wiadomości w żądaniu." });
  }

  if (!elevenLabsApiKey || openai.apiKey === "-") {
    return res.status(500).json({ error: "Brak kluczy API OpenAI i ElevenLabs." });
  }

  // 📌 Nowy prompt systemowy do dynamicznej zmiany języka
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
    
    console.log("📝 Odpowiedź OpenAI:", messages); // ✅ Sprawdzamy, co zwraca OpenAI
    
    await Promise.all(messages.map(async (message, i) => {
      const fileExtension = defaultProvider === "cartesia" ? "wav" : "mp3";
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
    
  

    res.send({ messages });

  } catch (error) {
    console.error("❌ Błąd OpenAI:", error);
    res.status(500).json({ error: "Błąd podczas generowania odpowiedzi OpenAI." });
  }
});

app.listen(PORT, () => {
  console.log(`Virtual Girlfriend listening on port ${PORT}`);
});



const audioFileToBase64 = async (file) => {
  try {
    const data = await fs.readFile(file);
    return data.toString("base64");
  } catch (error) {
    console.error(`❌ Błąd odczytu pliku audio: ${file}`, error);
    return null;
  }
};

const readJsonTranscript = async (file) => {
  try {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Błąd odczytu pliku JSON: ${file}`, error);
    return null;
  }
};

async function fetchVoices() {
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices?show_legacy=true", {
      headers: { "xi-api-key": elevenLabsApiKey },
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


