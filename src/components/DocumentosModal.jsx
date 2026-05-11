import jsPDF from "jspdf";

export function DocumentosModal({ open, onClose, cliente }) {
    if (!open) return null;

    // Função auxiliar para configurar o layout padrão (Bordas e Cabeçalho)
    const configurarLayoutBase = (doc, titulo) => {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Desenha uma borda elegante
        doc.setDrawColor(200, 200, 200);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

        // Título Centralizado
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(titulo, pageWidth / 2, 30, { align: "center" });

        // Linha divisória abaixo do título
        doc.setDrawColor(0);
        doc.line(20, 35, pageWidth - 20, 35);

        return 50; // Retorna a posição Y inicial para o texto
    };

    const gerarRodape = (doc, y) => {
        const pageWidth = doc.internal.pageSize.getWidth();
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Data: ${cliente.data || new Date().toLocaleDateString()}`, 20, y);

        y += 35;
        doc.line(20, y, 100, y); // Linha de assinatura
        doc.setFontSize(10);
        doc.text("Assinatura do Cliente", 20, y + 7);
        doc.text(cliente.nome || "", 20, y + 12);
    };

    // =========================
    // 📄 PDF - RESPONSABILIDADE
    // =========================
    function gerarTermoResponsabilidade() {
        const doc = new jsPDF();
        let y = configurarLayoutBase(doc, "TERMO DE RESPONSABILIDADE");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setLineHeightFactor(1.5); // Melhora o espaçamento entre linhas

        // Texto formatado sem quebras de linha bruscas para evitar erro no justify
        const texto = `Eu, ${cliente.nome || "____________________________"}, portador do CPF/CNPJ ${cliente.documento || "________________"}, declaro estar ciente e de acordo com os serviços realizados no veículo ${cliente.veiculo || "________"} placa ${cliente.placa || "______"}. Autorizo a execução dos serviços descritos no orçamento, assumindo total responsabilidade pelos mesmos. Declaro que fui devidamente informado sobre os procedimentos realizados.`.replace(/\n/g, ' ');

        doc.text(texto, 20, y, { maxWidth: 170, align: "justify" });

        gerarRodape(doc, 150);
        doc.save(`TERMO_RESP_${(cliente.nome || "cliente").toUpperCase()}.pdf`);
    }

    // =========================
    // ⚠️ PDF - ISENÇÃO GARANTIA
    // =========================
    function gerarTermoIsencao() {
        const doc = new jsPDF();
        let y = configurarLayoutBase(doc, "TERMO DE ISENÇÃO DE GARANTIA");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setLineHeightFactor(1.5);

        const texto = `Eu, ${cliente.nome || "____________________________"}, portador do CPF/CNPJ ${cliente.documento || "________________"}, declaro que forneci por conta própria as peças utilizadas no veículo ${cliente.veiculo || "________"} placa ${cliente.placa || "______"}. Estou ciente de que, por se tratarem de peças externas, NÃO haverá garantia sobre as mesmas, nem tampouco sobre a mão de obra aplicada para sua instalação e eventuais retrabalhos. Isento a oficina de qualquer responsabilidade por defeitos, falhas ou danos decorrentes da utilização dos itens fornecidos por mim.`.replace(/\n/g, ' ');

        doc.text(texto, 20, y, { maxWidth: 170, align: "justify" });

        gerarRodape(doc, 150);
        doc.save(`ISENCAO_${(cliente.nome || "cliente").toUpperCase()}.pdf`);
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 className="section-title" style={{ textAlign: "center", marginBottom: "20px" }}>
                    📄 Gestão de Documentos
                </h3>

                <div className="docs-actions" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button className="docs-btn-resp" onClick={gerarTermoResponsabilidade}>
                        📝 Gerar Termo de Responsabilidade
                    </button>

                    <button className="docs-btn-warning" onClick={gerarTermoIsencao}>
                        ⚠️ Gerar Termo de Isenção de Peças
                    </button>

                    <button className="docs-btn-close" onClick={onClose}>
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}