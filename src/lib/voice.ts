/* eslint-disable */
// ==========================================================
// 🎙️ StoresGo Voice-to-Text Utility (Phase 12C)
// Transcribes uploaded MP3/WAV audio using OpenAI Whisper
// ==========================================================

import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function transcribeAudio(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) {
      return { ok: false, error: "Audio file not found" };
    }

    const fileStream = fs.createReadStream(filePath);
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream as any,
      model: "whisper-1",
      language: "en",
    });

    const text = transcription.text?.trim() || "";
    return { ok: true, text };
  } catch (err: any) {
    console.error("❌ Voice transcription failed:", err.message);
    return { ok: false, error: err.message };
  }
}
