import Groq from "groq-sdk";

let groqClient: Groq | null = null;

export function getGroqClient() {
  if (groqClient) return groqClient;

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not defined");
  }

  groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  return groqClient;
}
