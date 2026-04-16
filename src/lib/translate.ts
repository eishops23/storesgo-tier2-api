/* eslint-disable */
// ==========================================================
// 🌍 StoresGo Multilingual Translation Utility — Phase 12D
// Detects + Translates (English, Spanish, Haitian Creole)
// ==========================================================

import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function translateToEnglish(
  query: string,
  lang: "en" | "es" | "ht"
): Promise<{ ok: boolean; text: string; detected?: string; error?: string }> {
  try {
    // 🧠 Skip translation if English
    if (lang === "en") return { ok: true, text: query, detected: "en" };

    const prompt = `
You are a translator that converts ${lang} text into English clearly.
Return only the translated text, no commentary.

Input:
${query}
`;

    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Translate the following to English." },
        { role: "user", content: prompt },
      ],
    });

    const text = res.choices[0]?.message?.content?.trim() || query;
    return { ok: true, text, detected: lang };
  } catch (err: any) {
    console.error("❌ Translation failed:", err.message);
    return { ok: false, text: query, error: err.message };
  }
}
