import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// 🚀 Inicializa o servidor Express
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(".")); // Serve o index.html, script.js etc.

// 🔗 Conexão com o Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🧠 Função para gerar plano via Gemini
async function gerarPlanoGemini(dados) {
  const prompt = `
Gere um plano de aula completo e detalhado com base nas informações abaixo:

Tema: ${dados.tema}
Faixa Etária: ${dados.faixa_etaria}
Disciplina: ${dados.disciplina}
Duração: ${dados.duracao}
Nível de dificuldade: ${dados.nivel_dificuldade}
Observações adicionais: ${dados.observacoes}

Responda em formato JSON com a estrutura:
{
  "introducao": "texto introdutório criativo e breve",
  "objetivo_bncc": "objetivo de aprendizagem alinhado à BNCC",
  "passo_a_passo": "etapas práticas da aula",
  "rubrica_avaliacao": "forma de avaliar o aprendizado"
}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();

  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(text);
  } catch {
    console.warn("⚠️ Resposta inválida do Gemini:", text);
    return {
      introducao: "Erro ao gerar a introdução.",
      objetivo_bncc: "Erro ao gerar o objetivo BNCC.",
      passo_a_passo: "Erro ao gerar o passo a passo.",
      rubrica_avaliacao: "Erro ao gerar a rubrica.",
    };
  }
}

// 🧾 Rota principal para gerar e salvar plano
app.post("/api/gerar", async (req, res) => {
  try {
    const dados = req.body;
    console.log("📩 Dados recebidos:", dados);

    const planoGerado = await gerarPlanoGemini(dados);

    const { data, error } = await supabase
      .from("planos_aula")
      .insert([
        {
          titulo: dados.tema,
          tema: dados.tema,
          faixa_etaria: dados.faixa_etaria,
          disciplina: dados.disciplina,
          duracao: dados.duracao,
          nivel_dificuldade: dados.nivel_dificuldade,
          observacoes: dados.observacoes,
          introducao: planoGerado.introducao,
          objetivo_bncc: planoGerado.objetivo_bncc,
          passo_a_passo: planoGerado.passo_a_passo,
          rubrica_avaliacao: planoGerado.rubrica_avaliacao,
        },
      ])
      .select();

    if (error) throw error;

    res.json({
      mensagem: "Plano de aula gerado e salvo com sucesso!",
      plano: data[0],
    });
  } catch (error) {
    console.error("❌ Erro ao gerar plano:", error);
    res.status(500).json({ erro: "Erro ao gerar plano de aula." });
  }
});

// 📋 Rota para listar planos
app.get("/api/planos", async (req, res) => {
  const { data, error } = await supabase
    .from("planos_aula")
    .select("*")
    .order("id", { ascending: false });

  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
});

// 🗑️ Rota para excluir plano
app.delete("/api/planos/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("planos_aula").delete().eq("id", id);
  if (error) return res.status(500).json({ erro: error.message });
  res.json({ mensagem: "Plano excluído com sucesso!" });
});

// 🚀 Inicializa servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));
