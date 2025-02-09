import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const chatWithAI = async (userMessage, userBrowserLanguage) => {
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

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("❌ Błąd OpenAI:", error);
    throw error;
  }
};
