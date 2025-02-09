import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import express from "express";
import { promises as fs } from "fs";
import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "-", 
});

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "EXAVITQu4vr4xnSDxMaL"; // Sprawdź, czy ten głos istnieje

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 8000;

/**
 * ✅ Sprawdzanie, czy `FFmpeg` i `Rhubarb` są dostępne
 */
function checkDependencies() {
    exec("ffmpeg -version", (error, stdout) => {
        if (error) {
            console.error("🚨 FFmpeg NIE jest zainstalowany!");
        } else {
            console.log("✅ FFmpeg działa:\n", stdout);
        }
    });

    exec("rhubarb --version", (error, stdout) => {
        if (error) {
            console.error("🚨 Rhubarb NIE jest zainstalowany! Pobieranie...");
            exec("curl -L -o /usr/local/bin/rhubarb https://github.com/DanielSWolf/rhubarb-lip-sync/releases/latest/download/rhubarb-linux && chmod +x /usr/local/bin/rhubarb", (installError) => {
                if (installError) {
                    console.error("❌ Nie udało się pobrać Rhubarb!", installError);
                } else {
                    console.log("✅ Rhubarb został pobrany!");
                }
            });
        } else {
            console.log("✅ Rhubarb działa:\n", stdout);
        }
    });
}

checkDependencies();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api/status", (req, res) => {
  res.json({ status: "ok", message: "Backend działa poprawnie!" });
});

/**
 * ✅ Pobieranie dostępnych głosów z ElevenLabs
 */
app.get("/voices", async (req, res) => {
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": elevenLabsApiKey },
    });
    const data = await response.json();
    res.send(data.voices);
  } catch (error) {
    console.error("❌ Błąd pobierania głosów:", error);
    res.status(500).json({ error: "Błąd pobierania głosów ElevenLabs." });
  }
});

/**
 * ✅ Wykonywanie komend terminalowych
 */
const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Błąd wykonania komendy:", command, error);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
};

/**
 * ✅ Generowanie mowy za pomocą ElevenLabs
 */
const generateSpeech = async (text, fileName) => {
    if (!elevenLabsApiKey) {
        console.error("🚨 Błąd: Brak klucza API ElevenLabs!");
        return null;
    }

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "xi-api-key": elevenLabsApiKey,
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5,
                    style: 0.0,
                    use_speaker_boost: true
                }
            }),
        });

        if (!response.ok) {
            console.error(`❌ Błąd API ElevenLabs: ${response.status} - ${response.statusText}`);
            const errorData = await response.json();
            console.error("📝 Szczegóły błędu:", errorData);
            return null;
        }

        const audioBuffer = await response.arrayBuffer();
        await fs.writeFile(fileName, Buffer.from(audioBuffer));
        console.log(`✅ Plik audio zapisany: ${fileName}`);

        return fileName;
    } catch (error) {
        console.error("❌ Błąd połączenia z ElevenLabs API:", error);
        return null;
    }
};

/**
 * ✅ Generowanie lip sync + sprawdzanie błędów
 */
const lipSyncMessage = async (message) => {
  console.log(`🔄 Rozpoczynam konwersję dla wiadomości: ${message}`);

  try {
    await execCommand(`ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`);
    console.log(`✅ Konwersja do WAV zakończona`);
  } catch (error) {
    console.error("❌ Błąd w FFmpeg:", error);
    return null;
  }

  try {
    await execCommand(`/usr/local/bin/Rhubarb-Lip-Sync-1.13.0-Linux/rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`);
    console.log(`✅ Lip sync zakończony`);
  } catch (error) {
    console.error("❌ Błąd w Rhubarb Lip Sync:", error);
    return null;
  }

  return await readJsonTranscript(`audios/message_${message}.json`);
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

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      const fileName = `audios/message_${i}.mp3`;
      await generateSpeech(message.text, fileName);
      message.lipsync = await lipSyncMessage(i);
      message.audio = await audioFileToBase64(fileName);
    }

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
  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": elevenLabsApiKey },
  });
  const data = await response.json();
  return data.voices;
}
