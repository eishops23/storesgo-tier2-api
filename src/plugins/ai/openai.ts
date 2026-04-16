// ---------------------------------------------------------
// 🧠 AI Helper — OpenAI Meta Generator
// ---------------------------------------------------------
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateMetaContent(name: string, description?: string) {
  const prompt = `
Generate SEO metadata for a product or seller.
Title and description should be natural and concise.

Name: ${name}
Description: ${description || "N/A"}
Return JSON: { "metaTitle": "", "metaDescription": "" }
  `;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(completion.choices[0].message.content);
}
