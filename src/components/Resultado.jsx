import jsPDF from "jspdf";
import logo from "../assets/logo.png";

export function Resultado({ resultado, cliente, desconto, config }) {
  if (!resultado.length) return null;

  const pageWidth = 210;

  // --- LÓGICA DE CÁLCULO (CORRIGIDA E ORGANIZADA) ---

  // 1. Subtotal apenas dos itens (Peças / Serviços)
  const subtotalItens = resultado.reduce((a, i) => a + i.valorBase, 0);

  // 2. Mão de obra separada (se ativado)
  const totalMaoObraSeparada = config?.mostrarMaoObraSeparada
    ? resultado.reduce((a, i) => a + (i.maoObraIndividual || 0), 0)
    : 0;

  // 3. Base real total (itens + mão de obra)
  const baseTotal = subtotalItens + totalMaoObraSeparada;

  // 4. Desconto aplicado corretamente em cima do total real
  const valorDesconto =
    baseTotal * ((desconto?.porcentagem || 0) / 100);

  // 5. Valor após desconto
  const valorPosDesconto = baseTotal - valorDesconto;

  // 6. Taxa da maquininha aplicada após desconto
  const taxaMaq = (config?.taxaMaquininha || 0) / 100;
  const valorTaxaMaquininha = valorPosDesconto * taxaMaq;

  // 7. TOTAL FINAL
  const totalGeral = valorPosDesconto + valorTaxaMaquininha;

  function gerarPDF() {
    const doc = new jsPDF();
    let y = 10;

    const logoWidth = 90;
    const logoHeight = 45;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logo, "PNG", logoX, y, logoWidth, logoHeight);
    y += logoHeight + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ORDEM DE SERVIÇO", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
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

    doc.setFont("helvetica", "bold");
    doc.text("Descrição do Serviço / Peça", 12, y);
    doc.text("Valor", 190, y, { align: "right" });

    y += 5;
    doc.line(10, y, 200, y);
    y += 7;

    doc.setFont("helvetica", "normal");

    resultado.forEach((item) => {
      doc.text(item.nome || "Item sem nome", 12, y);
      doc.text(`R$ ${item.valorBase.toFixed(2)}`, 190, y, {
        align: "right",
      });
      y += 7;
    });

    y += 5;
    doc.line(120, y, 200, y);
    y += 7;

    // --- RESUMO FINAL ---

    doc.text("Subtotal:", 140, y);
    doc.text(`R$ ${subtotalItens.toFixed(2)}`, 190, y, {
      align: "right",
    });
    y += 7;

    if (config?.mostrarMaoObraSeparada) {
      doc.setFont("helvetica", "bold");
      doc.text("Mão de Obra:", 140, y);
      doc.text(`R$ ${totalMaoObraSeparada.toFixed(2)}`, 190, y, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      y += 7;
    }

    if (desconto?.porcentagem > 0) {
      doc.text(`Desconto (${desconto.porcentagem}%):`, 140, y);
      doc.text(`- R$ ${valorDesconto.toFixed(2)}`, 190, y, {
        align: "right",
      });
      y += 7;
    }

    if (config?.taxaMaquininha > 0) {
      doc.text(`Taxa Cartão (${config.taxaMaquininha}%):`, 140, y);
      doc.text(`R$ ${valorTaxaMaquininha.toFixed(2)}`, 190, y, {
        align: "right",
      });
      y += 7;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL GERAL:", 140, y);
    doc.text(`R$ ${totalGeral.toFixed(2)}`, 190, y, {
      align: "right",
    });

    // --- ASSINATURA ---
    y = 250;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.line(20, y, 100, y);
    doc.text("Autorização do Cliente", 20, y + 7);

    // FOOTER
    const footerWidth = 30;
    const footerHeight = 15;
    const footerX = (pageWidth - footerWidth) / 2;

    doc.addImage(logo, "PNG", footerX, 275, footerWidth, footerHeight);

    doc.save(`OS_${(cliente.placa || "OS").toUpperCase()}.pdf`);
  }

  return (
    <div className="resumo-conteudo">
      <div className="resumo-header">
        <div>
          <h2>RESUMO DO ORÇAMENTO</h2>
          <span className="data-orcamento">
            {cliente.veiculo} • {cliente.placa}
          </span>
        </div>
        <div className="data-orcamento">{cliente.data}</div>
      </div>

      <table className="resumo-table">
        <thead>
          <tr>
            <th>Descrição do Serviço / Peça</th>
            <th className="col-valor">Total</th>
          </tr>
        </thead>
        <tbody>
          {resultado.map((item, i) => (
            <tr key={i}>
              <td>{item.nome || "Item sem nome"}</td>
              <td className="col-valor">
                R$ {item.valorBase.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="resumo-footer">
        <div className="total-box">
          <div className="total-linha">
            <span>Subtotal Itens:</span>
            <span>R$ {subtotalItens.toFixed(2)}</span>
          </div>

          {config?.mostrarMaoObraSeparada && (
            <div className="total-linha mo-destaque">
              <span>Mão de Obra:</span>
              <span>R$ {totalMaoObraSeparada.toFixed(2)}</span>
            </div>
          )}

          {desconto?.porcentagem > 0 && (
            <div className="total-linha">
              <span>
                Desconto{" "}
                <span className="desconto-badge">
                  {desconto.porcentagem}%
                </span>
                :
              </span>
              <span className="valor-desconto">
                - R$ {valorDesconto.toFixed(2)}
              </span>
            </div>
          )}

          {config?.taxaMaquininha > 0 && (
            <div className="total-linha">
              <span>Taxa Cartão ({config.taxaMaquininha}%):</span>
              <span>R$ {valorTaxaMaquininha.toFixed(2)}</span>
            </div>
          )}

          <div className="total-linha destaque">
            <span>TOTAL GERAL:</span>
            <span className="valor-final">
              R$ {totalGeral.toFixed(2)}
            </span>
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: "25px", width: "100%" }}
            onClick={gerarPDF}
          >
            📄 GERAR PDF
          </button>
        </div>
      </div>
    </div>
  );
}