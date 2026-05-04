import jsPDF from "jspdf";
import logo from "./assets/logo.png";

export function Resultado({ resultado, cliente, desconto, config }) {
  if (!resultado.length) return null;

  const pageWidth = 210;

  const subtotal = resultado.reduce((a, i) => a + i.valorFinal, 0);

  const valorDesconto =
    subtotal * ((desconto?.porcentagem || 0) / 100);

  const totalSemTaxa = subtotal - valorDesconto;

  const taxa = config?.taxaMaquininha || 0;

  const total = totalSemTaxa * (1 + taxa / 100);

  const totalMaoObra = resultado.reduce(
    (a, i) => a + (i.maoObra || 0),
    0
  );

  function gerarPDF() {
    const doc = new jsPDF();

    let y = 10;

    // LOGO
    const logoWidth = 90;
    const logoHeight = 35;
    const logoX = (pageWidth - logoWidth) / 2;

    doc.addImage(logo, "PNG", logoX, y, logoWidth, logoHeight);
    y += logoHeight + 10;

    // TÍTULO
    doc.setFont("helvetica", "bold");
    doc.text("ORDEM DE SERVIÇO", pageWidth / 2, y, {
      align: "center",
    });

    y += 10;

    // ================= CLIENTE =================
    doc.setFont("helvetica", "normal");

    const info = [
      `Data: ${cliente.data}`,
      `Nome: ${cliente.nome}`,
      `Veículo: ${cliente.veiculo}`,
      `Placa: ${cliente.placa}`,
      `Telefone: ${cliente.telefone}`,
      `Endereço: ${cliente.endereco}`,
      `CPF/CNPJ: ${cliente.documento}`,
    ];

    const startY = y;
    const lh = 6;

    info.forEach((t, i) => {
      doc.text(t, 12, y + (i + 1) * lh);
    });

    doc.rect(10, startY, 190, info.length * lh + 8);

    y += info.length * lh + 15;

    // ================= SERVIÇOS =================
    doc.setFont("helvetica", "bold");
    doc.text("Descrição do Serviço", 12, y);
    doc.text("Valor", 190, y, { align: "right" });

    y += 5;
    doc.line(10, y, 200, y);
    y += 7;

    doc.setFont("helvetica", "normal");

    resultado.forEach((item) => {
      doc.text(item.nome, 12, y);
      doc.text(`R$ ${item.valorFinal.toFixed(2)}`, 190, y, {
        align: "right",
      });
      y += 7;
    });

    // ================= MÃO DE OBRA =================
    if (config?.mostrarMaoObraSeparada) {
      y += 3;
      doc.text("Mão de obra", 12, y);
      doc.text(`R$ ${totalMaoObra.toFixed(2)}`, 190, y, {
        align: "right",
      });
      y += 7;
    }

    // ================= DESCONTO =================
    if (desconto?.porcentagem > 0) {
      doc.text(
        `Desconto (${desconto.porcentagem}% - ${
          desconto.motivo || "sem motivo"
        })`,
        12,
        y
      );
      doc.text(`- R$ ${valorDesconto.toFixed(2)}`, 190, y, {
        align: "right",
      });
      y += 7;
    }

    // ================= TOTAL =================
    y += 3;
    doc.line(120, y, 200, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.text(`Total: R$ ${total.toFixed(2)}`, 190, y, {
      align: "right",
    });

    // ================= ASSINATURA =================
    y += 80;

    doc.setFont("helvetica", "normal");
    doc.line(20, y, 100, y);
    doc.text("Autorização do Cliente", 20, y + 7);

    // ================= FOOTER =================
    const footerWidth = 30;
    const footerHeight = 15;
    const footerX = (pageWidth - footerWidth) / 2;

    doc.addImage(logo, "PNG", footerX, 270, footerWidth, footerHeight);

    // ================= NOME DO ARQUIVO =================
    const cpf = (cliente.documento || "").replace(/\D/g, "");
    const placa = (cliente.placa || "")
      .replace(/\s/g, "")
      .toUpperCase();

    doc.save(`${cpf || "semcpf"}_${placa || "semplaca"}.pdf`);
  }

  return (
    <div className="resumo">
      <h3>Resumo</h3>

      {resultado.map((item, i) => (
        <div key={i} className="resumo-item">
          <span>{item.nome}</span>
          <strong>R$ {item.valorFinal.toFixed(2)}</strong>
        </div>
      ))}

      {config?.mostrarMaoObraSeparada && (
        <div className="resumo-item">
          <span>Mão de obra</span>
          <strong>R$ {totalMaoObra.toFixed(2)}</strong>
        </div>
      )}

      {desconto?.porcentagem > 0 && (
        <div className="resumo-item">
          <span>Desconto</span>
          <strong>- R$ {valorDesconto.toFixed(2)}</strong>
        </div>
      )}

      <div className="total">
        <span>Total</span>
        <span>R$ {total.toFixed(2)}</span>
      </div>

      <button onClick={gerarPDF}>📄 Gerar PDF</button>
    </div>
  );
}