import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ A chave GEMINI_API_KEY não foi encontrada no .env");
  process.exit(1);
}

async function testarGemini() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: "Diga: Gemini conectado com sucesso!" }] }
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("🔍 Resposta completa:", JSON.stringify(data, null, 2));

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      console.log("✅ Resposta da API:", data.candidates[0].content.parts[0].text);
    } else {
      console.error("⚠️ Resposta inesperada da API:", data);
    }
  } catch (error) {
    console.error("❌ Erro ao conectar com Gemini:", error);
  }
}

testarGemini();
