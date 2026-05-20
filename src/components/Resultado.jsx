import jsPDF from "jspdf";
import logo from "../assets/logo.png";

export function Resultado({ resultado, cliente, desconto, config }) {
  if (!resultado.length) return null;

  const pageWidth = 210;
  const taxaMaq = (config?.taxaMaquininha || 0) / 100;
  const fatorDesconto = 1 - (desconto?.porcentagem || 0) / 100;

  // --- NOVA LÓGICA DE CÁLCULO COM RATEIO INTEGRADO ---
  
  // 1. Calculamos o total bruto da ordem (Itens com margem + Mão de obra se houver)
  // Nota: i.valorBase aqui já vem do OrderScreen com a margem (e com a MO caso não esteja separada)
  const totalBrutoItens = resultado.reduce((a, i) => a + i.valorBase, 0);
  const totalMaoObraSeparada = config?.mostrarMaoObraSeparada
    ? resultado.reduce((a, i) => a + (i.maoObraIndividual || 0), 0)
    : 0;

  const baseTotalO_S = totalBrutoItens + totalMaoObraSeparada;

  // 2. Aplicamos o desconto e a taxa no montante geral para achar o multiplicador de ajuste
  const valorPosDescontoGeral = baseTotalO_S * fatorDesconto;
  const totalGeral = valorPosDescontoGeral * (1 + taxaMaq);

  // 3. Fator de ajuste: diz quanto cada Real bruto virou após o desconto + taxa
  const fatorAjuste = baseTotalO_S > 0 ? totalGeral / baseTotalO_S : 1;

  // 4. MAPEAMENTO DOS ITENS: Criamos uma lista onde cada item já absorveu sua parte da taxa e do desconto
  const itensProcessados = resultado.map(item => {
    // Se a MO estiver separada, o valor base do item é só a peça. Se não, inclui a MO embutida.
    const valorBaseComMO = item.valorBase; 
    return {
      nome: item.nome || "Item sem nome",
      // O valor final do item já com desconto aplicado e taxa rateada proporcionalmente:
      valorFinalRateado: valorBaseComMO * fatiadorItemAjuste(item)
    };
  });

  // Auxiliar para aplicar o fator de ajuste mantendo a proporção exata
  function fatiadorItemAjuste(item) {
    return fatorAjuste;
  }

  // Se a Mão de obra estiver separada, ela também precisa sofrer o desconto e a taxa do cartão
  const maoObraFinalSeparada = totalMaoObraSeparada * fatiadorItemAjuste();

  // Recalcula o subtotal dos itens já atualizados com a taxa embutida
  const subtotalItensComTaxa = itensProcessados.reduce((a, i) => a + i.valorFinalRateado, 0);

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
    doc.text("Descrição do Serviço / Peça (Valores com Taxas)", 12, y);
    doc.text("Valor Final", 190, y, { align: "right" });

    y += 5;
    doc.line(10, y, 200, y);
    y += 7;

    doc.setFont("helvetica", "normal");

    itensProcessados.forEach((item) => {
      doc.text(item.nome, 12, y);
      doc.text(`R$ ${item.valorFinalRateado.toFixed(2)}`, 190, y, {
        align: "right",
      });
      y += 7;
    });

    y += 5;
    doc.line(120, y, 200, y);
    y += 7;

    // --- RESUMO FINAL NO PDF ---
    doc.text("Subtotal Itens:", 140, y);
    doc.text(`R$ ${subtotalItensComTaxa.toFixed(2)}`, 190, y, {
      align: "right",
    });
    y += 7;

    if (config?.mostrarMaoObraSeparada) {
      doc.setFont("helvetica", "bold");
      doc.text("Mão de Obra:", 140, y);
      doc.text(`R$ ${maoObraFinalSeparada.toFixed(2)}`, 190, y, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      y += 7;
    }

    // Nota informativa se houve desconto original
    if (desconto?.porcentagem > 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text(`* Desconto de ${desconto.porcentagem}% aplicado nos itens`, 120, y);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
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
            <th>Descrição do Serviço / Peça (Taxa Inclusa)</th>
            <th className="col-valor">Total</th>
          </tr>
        </thead>
        <tbody>
          {itensProcessados.map((item, i) => (
            <tr key={i}>
              <td>{item.nome}</td>
              <td className="col-valor">
                R$ {item.valorFinalRateado.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="resumo-footer">
        <div className="total-box">
          <div className="total-linha">
            <span>Subtotal Itens:</span>
            <span>R$ {subtotalItensComTaxa.toFixed(2)}</span>
          </div>

          {config?.mostrarMaoObraSeparada && (
            <div className="total-linha mo-destaque">
              <span>Mão de Obra:</span>
              <span>R$ {maoObraFinalSeparada.toFixed(2)}</span>
            </div>
          )}

          {desconto?.porcentagem > 0 && (
            <div className="total-linha informativo-desconto">
              <span style={{ fontSize: '0.85em', color: '#666' }}>
                * Valores acima já calculados com {desconto.porcentagem}% de desconto.
              </span>
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