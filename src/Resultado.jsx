import jsPDF from "jspdf";
import logo from "./assets/logo.png";

export function Resultado({ resultado, cliente, desconto }) {
  if (!resultado.length) return null;

  const subtotal = resultado.reduce((a, i) => a + i.valorFinal, 0);

  const valorDesconto =
    subtotal * ((desconto?.porcentagem || 0) / 100);

  const total = subtotal - valorDesconto;

  function gerarPDF() {
    const doc = new jsPDF();
    const pageWidth = 210;

    let y = 10;

    const logoWidth = 90;
    const logoHeight = 35;
    const logoX = (pageWidth - logoWidth) / 2;

    doc.addImage(logo, "PNG", logoX, y, logoWidth, logoHeight);

    y += logoHeight + 10;

    doc.setFont("helvetica", "bold");
    doc.text("ORDEM DE SERVIÇO", pageWidth / 2, y, { align: "center" });

    y += 10;

    doc.setFont("helvetica", "normal");

    const info = [
      `Data: ${cliente.data}`,
      `Nome: ${cliente.nome}`,
      `Veículo: ${cliente.veiculo}`,
      `Placa: ${cliente.placa}`,
      `Telefone: ${cliente.telefone}`,
      `Endereço: ${cliente.endereco}`,
      `CPF/CNPJ: ${cliente.documento}`
    ];

    const startY = y;
    const lh = 6;

    info.forEach((t, i) => {
      doc.text(t, 12, y + (i + 1) * lh);
    });

    doc.rect(10, startY, 190, info.length * lh + 8);

    y += info.length * lh + 15;

    doc.text("Descrição do Serviço", 12, y);
    doc.text("Preço", 170, y);

    y += 3;
    doc.line(10, y, 200, y);

    y += 7;

    resultado.forEach(item => {
      doc.text(item.nome, 12, y);
      doc.text(`R$ ${item.valorFinal.toFixed(2)}`, 170, y);
      y += 7;
    });

    // DESCONTO
    if (desconto?.porcentagem > 0) {
      y += 5;
      // DESCRIÇÃO (esquerda)
      doc.text(
        `Desconto (${desconto.porcentagem}% - ${desconto.motivo})`,
        12,
        y
      );

      // VALOR (direita alinhado igual os itens)
      doc.text(
        `- R$ ${valorDesconto.toFixed(2)}`,
        170,
        y
      );
    }

    y += 5;
    doc.line(120, y, 200, y);

    y += 7;
    doc.setFont("helvetica", "bold");
    doc.text(`Total: R$ ${total.toFixed(2)}`, 140, y);

    y += 30;

    doc.setFont("helvetica", "normal");
    doc.line(20, y, 100, y);
    doc.text("Assinatura do Cliente", 20, y + 7);

    const footerWidth = 30;
    const footerHeight = 15;
    const footerX = (pageWidth - footerWidth) / 2;

    doc.addImage(logo, "PNG", footerX, 270, footerWidth, footerHeight);

    const cpf = (cliente.documento || "").replace(/\D/g, "");
    const placa = (cliente.placa || "").replace(/\s/g, "").toUpperCase();

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

      {desconto?.porcentagem > 0 && (
        <div className="resumo-item">
          <span>Desconto ({desconto.porcentagem}%)</span>
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