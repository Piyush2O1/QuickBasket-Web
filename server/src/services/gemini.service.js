import { env, requireEnv } from "../config/env.js";

export const getReplySuggestions = async ({ role, message }) => {
  const apiKey = requireEnv(env.geminiApiKey, "GEMINI_API_KEY");
  const prompt = `You are a professional delivery assistant chatbot.

Return exactly 3 short WhatsApp-style reply suggestions.
Rules:
- role is either "user" or "delivery_boy"
- Match the last message context
- Max 10 words per suggestion
- Helpful, respectful, delivery/location/status focused
- No numbering, no extra text
- Return comma-separated suggestions only

Role: ${role}
Last message: ${message}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  const data = await response.json();
  const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return replyText
    .split(",")
    .map((suggestion) => suggestion.trim())
    .filter(Boolean)
    .slice(0, 3);
};
