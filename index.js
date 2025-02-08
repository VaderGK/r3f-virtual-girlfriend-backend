import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import voice from "elevenlabs-node";
import express from "express";
import { promises as fs } from "fs";
import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "-", 
});

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "kgG7dCoKCfLehAPWkJOE";

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
            console.error("🚨 Rhubarb NIE jest zainstalowany!");
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

app.get("/voices", async (req, res) => {
  res.send(await voice.getVoices(elevenLabsApiKey));
});

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

/**
 * ✅ Generowanie lip sync + sprawdzanie błędów
 */
const lipSyncMessage = async (message) => {
  const time = new Date().getTime();
  console.log(`🔄 Rozpoczynam konwersję dla wiadomości: ${message}`);

  try {
    await execCommand(`ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`);
    console.log(`✅ Konwersja do WAV zakończona w ${new Date().getTime() - time}ms`);
  } catch (error) {
    console.error("❌ Błąd w FFmpeg:", error);
    return null;
  }

  try {
    await execCommand(`rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`);
    console.log(`✅ Lip sync zakończony w ${new Date().getTime() - time}ms`);
  } catch (error) {
    console.error("❌ Błąd w Rhubarb Lip Sync:", error);
    return null;
  }

  try {
    const lipsyncData = await readJsonTranscript(`audios/message_${message}.json`);
    console.log("📄 Plik JSON z lipsyncem:", JSON.stringify(lipsyncData, null, 2));
    return lipsyncData;
  } catch (error) {
    console.error("❌ Błąd odczytu pliku JSON:", error);
    return null;
  }
};

/**
 * ✅ Endpoint do czatu z obsługą błędów
 */
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ error: "Brak wiadomości w żądaniu." });
  }

  if (!elevenLabsApiKey || openai.apiKey === "-") {
    return res.status(500).json({ error: "Brak kluczy API OpenAI i ElevenLabs." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      max_tokens: 1000,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
          You are a virtual girlfriend.
          You will always reply with a JSON array of messages. With a maximum of 3 messages.
          Each message has a text, facialExpression, and animation property.
          The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
          The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry. 
          `,
        },
        { role: "user", content: userMessage || "Hello" },
      ],
    });

    let messages = JSON.parse(completion.choices[0].message.content);
    if (messages.messages) {
      messages = messages.messages;
    }

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      // Generate audio file
      const fileName = `audios/message_${i}.mp3`;
      const textInput = message.text;
      await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, textInput);

      // Generate lipsync
      message.lipsync = await lipSyncMessage(i);
      message.audio = await audioFileToBase64(fileName);
    }

    res.send({ messages });

  } catch (error) {
    console.error("❌ Błąd OpenAI:", error);
    res.status(500).json({ error: "Błąd podczas generowania odpowiedzi OpenAI." });
  }
});

/**
 * ✅ Funkcje pomocnicze do obsługi plików
 */
const readJsonTranscript = async (file) => {
  try {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Błąd odczytu pliku JSON: ${file}`, error);
    return null;
  }
};

const audioFileToBase64 = async (file) => {
  try {
    const data = await fs.readFile(file);
    return data.toString("base64");
  } catch (error) {
    console.error(`❌ Błąd odczytu pliku audio: ${file}`, error);
    return null;
  }
};

/**
 * ✅ Start serwera
 */
app.listen(PORT, () => {
  console.log(`Virtual Girlfriend listening on port ${PORT}`);
});
