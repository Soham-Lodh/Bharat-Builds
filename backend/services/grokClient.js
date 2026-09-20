import axios from "axios";

const GROK_URL = "https://api.x.ai/v1/chat/completions";

const grokClient = {
  isConfigured() {
    return Boolean(process.env.GROK_API_KEY);
  },

  async chat(messages, systemPrompt, temperature = 0.4, maxTokens = 1800) {
    if (!this.isConfigured()) {
      throw new Error("GROK_API_KEY is not configured");
    }

    const response = await axios.post(
      GROK_URL,
      {
        model: process.env.GROK_MODEL || "llm-grok-20250110",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROK_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    return response.data?.choices?.[0]?.message?.content || "";
  },

  async vision(imageBase64, prompt, imageMediaType = "image/jpeg") {
    if (!this.isConfigured()) {
      throw new Error("GROK_API_KEY is not configured");
    }

    const response = await axios.post(
      GROK_URL,
      {
        model: process.env.GROK_MODEL || "llm-grok-20250110",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageMediaType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 1600,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROK_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 45000,
      }
    );

    return response.data?.choices?.[0]?.message?.content || "";
  },
};

export default grokClient;
