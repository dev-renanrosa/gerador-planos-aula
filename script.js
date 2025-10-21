// =====================
// 📘 script.js
// =====================

// Formulário e botões
const form = document.getElementById("formPlano");
const planosDiv = document.getElementById("planos");
const btnVerPlanos = document.getElementById("btnVerPlanos");

// =====================
// 🧾 GERAR PLANO
// =====================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const plano = {
    tema: document.getElementById("tema").value,
    faixa_etaria: document.getElementById("faixa_etaria").value,
    disciplina: document.getElementById("disciplina").value,
    duracao: document.getElementById("duracao").value,
    nivel_dificuldade: document.getElementById("nivel_dificuldade").value,
    observacoes: document.getElementById("observacoes").value,
  };

  try {
    const res = await fetch("http://localhost:3000/api/gerar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plano),
    });

    const data = await res.json();
    if (res.ok) {
      alert("✅ Plano gerado e salvo com sucesso!");
      mostrarPlanos(); // atualiza lista
    } else {
      alert("❌ Erro: " + (data.erro || "Falha ao gerar o plano."));
    }
  } catch (err) {
    console.error("❌ Erro ao gerar o plano:", err);
    alert("Erro ao gerar o plano. Verifique o console.");
  }
});

// =====================
// 📋 LISTAR PLANOS
// =====================
async function mostrarPlanos() {
  planosDiv.innerHTML = "<h2>📘 Planos Salvos</h2>";

  try {
    const res = await fetch("http://localhost:3000/api/planos");
    const planos = await res.json();

    if (!res.ok) {
      throw new Error(planos.erro || "Erro ao listar planos");
    }

    if (planos.length === 0) {
      planosDiv.innerHTML += "<p>Nenhum plano cadastrado ainda.</p>";
      return;
    }

    planos.forEach((p) => {
      planosDiv.innerHTML += `
        <div class="plano">
          <h3>${p.tema || "Sem tema"}</h3>
          <p><b>Faixa Etária:</b> ${p.faixa_etaria}</p>
          <p><b>Disciplina:</b> ${p.disciplina}</p>
          <p><b>Duração:</b> ${p.duracao}</p>
          <p><b>Nível:</b> ${p.nivel_dificuldade}</p>
          <p><b>Introdução:</b> ${formatarTexto(p.introducao)}</p>
          <p><b>Objetivo BNCC:</b> ${formatarTexto(p.objetivo_bncc)}</p>
          <p><b>Passo a Passo:</b><br>${formatarTexto(p.passo_a_passo)}</p>
          <p><b>Rubrica:</b><br>${formatarTexto(p.rubrica_avaliacao)}</p>
          <button onclick="baixarPDF('${p.tema}', ${p.id})">📄 Baixar PDF</button>
          <button style="background:#dc3545;margin-left:10px;" onclick="excluirPlano(${p.id})">🗑️ Excluir</button>
        </div>
      `;
    });
  } catch (err) {
    console.error("❌ Erro ao listar planos:", err);
    planosDiv.innerHTML += "<p>Erro ao carregar planos.</p>";
  }
}

btnVerPlanos.addEventListener("click", mostrarPlanos);
window.addEventListener("load", mostrarPlanos);

// =====================
// 📄 BAIXAR PDF
// =====================
async function baixarPDF(tema, id) {
  try {
    const res = await fetch("http://localhost:3000/api/planos");
    const planos = await res.json();
    const plano = planos.find((p) => p.id == id);
    if (!plano) {
      alert("Plano não encontrado!");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 🧠 Cabeçalho
    doc.setFontSize(18);
    doc.text(plano.tema, 10, 15);
    doc.setFontSize(12);
    doc.text(`Faixa Etária: ${plano.faixa_etaria}`, 10, 25);
    doc.text(`Disciplina: ${plano.disciplina}`, 10, 32);
    doc.text(`Duração: ${plano.duracao}`, 10, 39);
    doc.text(`Nível: ${plano.nivel_dificuldade}`, 10, 46);

    // 🔹 Texto formatado
    const adicionarTexto = (titulo, texto, y) => {
      doc.setFontSize(14);
      doc.text(titulo, 10, y);
      doc.setFontSize(11);
      const linhas = doc.splitTextToSize(formatarTexto(texto).replace(/<[^>]*>?/gm, ''), 180);
      doc.text(linhas, 10, y + 6);
      return y + linhas.length * 6 + 10;
    };

    let y = 60;
    y = adicionarTexto("Introdução:", plano.introducao, y);
    y = adicionarTexto("Objetivo BNCC:", plano.objetivo_bncc, y);
    y = adicionarTexto("Passo a Passo:", plano.passo_a_passo, y);
    y = adicionarTexto("Rubrica de Avaliação:", plano.rubrica_avaliacao, y);

    doc.save(`${plano.tema}.pdf`);
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    alert("Erro ao gerar PDF.");
  }
}

// =====================
// 🗑️ EXCLUIR PLANO
// =====================
async function excluirPlano(id) {
  if (!confirm("Tem certeza que deseja excluir este plano?")) return;

  try {
    const res = await fetch(`http://localhost:3000/api/planos/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (res.ok) {
      alert("🗑️ " + data.mensagem);
      mostrarPlanos();
    } else {
      alert("❌ Erro: " + (data.erro || "Falha ao excluir o plano."));
    }
  } catch (err) {
    console.error("❌ Erro ao excluir plano:", err);
    alert("Erro ao excluir o plano. Veja o console.");
  }
}

// =====================
// ✨ FORMATAR TEXTO
// =====================
function formatarTexto(texto) {
  if (!texto) return "";
  try {
    const obj = JSON.parse(texto);
    if (Array.isArray(obj)) {
      return obj
        .map(
          (item) =>
            `<p><b>${item.etapa ? "Etapa " + item.etapa + ":" : ""}</b> ${
              item.descricao || JSON.stringify(item)
            }</p>`
        )
        .join("");
    }
    return texto;
  } catch {
    return texto
      .replace(/\\n/g, "<br>")
      .replace(/\. /g, ".<br>")
      .replace(/\*/g, "")
      .trim();
  }
}
