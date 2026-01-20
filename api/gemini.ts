import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { prompt } = req.body as { prompt?: string };
  if (!prompt) {
    return res.status(400).json({ error: "Prompt required" });
  }
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY as string,
  });
  const result = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  res.status(200).json({
    text: result.text,
  });
}
