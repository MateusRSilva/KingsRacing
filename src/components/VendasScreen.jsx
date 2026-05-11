import { useState, useEffect } from "react";

const CACHE_KEY = "kingsracing_estoque_cache";
window.kingsFileHandle = window.kingsFileHandle || null;

export function VendasScreen({ onBack }) {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [popupVenda, setPopupVenda] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidadeVenda, setQuantidadeVenda] = useState(1);

  useEffect(() => {
    const cache = localStorage.getItem(CACHE_KEY);
    if (cache) {
      try {
        const { data } = JSON.parse(cache);
        if (Array.isArray(data) && data.length > 0) {
          setProdutos(data);
          setProdutosFiltrados(data);
        }
      } catch {
        alert("Erro ao carregar estoque.");
      }
    } else {
      alert("Nenhum estoque carregado. Acesse a tela de estoque primeiro.");
    }
  }, []);

  const atualizarCache = (novosProdutos) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: novosProdutos }));
  };

  const salvarNoArquivo = async (dados) => {
    try {
      if (!window.kingsFileHandle) return;
      const writable = await window.kingsFileHandle.createWritable();
      await writable.write(JSON.stringify(dados, null, 2));
      await writable.close();
    } catch (error) {
      console.error("Erro ao salvar arquivo:", error);
    }
  };

  const filtrarProdutos = (textoBusca) => {
    setBusca(textoBusca);
    if (!textoBusca.trim()) {
      setProdutosFiltrados(produtos);
      return;
    }
    const termo = textoBusca.toLowerCase();
    const filtrados = produtos.filter((p) => 
      p.Codigo.toLowerCase().includes(termo) ||
      p.Produto.toLowerCase().includes(termo) ||
      p.Observacao.toLowerCase().includes(termo)
    );
    setProdutosFiltrados(filtrados);
  };

  const abrirVenda = (produto) => {
    setProdutoSelecionado(produto);
    setQuantidadeVenda(1);
    setPopupVenda(true);
  };

  const confirmarVenda = async () => {
    if (!produtoSelecionado) return;
    const qta = Number(produtoSelecionado.Quantidade);
    const qtdDesejada = Number(quantidadeVenda);

    if (qtdDesejada <= 0 || qtdDesejada > qta) {
      alert("Quantidade inválida ou insuficiente.");
      return;
    }

    const novosProdutos = produtos.map((p) => 
      p.Codigo === produtoSelecionado.Codigo 
      ? { ...p, Quantidade: Number(p.Quantidade) - qtdDesejada } 
      : p
    );

    setProdutos(novosProdutos);
    setProdutosFiltrados(novosProdutos);
    atualizarCache(novosProdutos);
    await salvarNoArquivo(novosProdutos);
    
    alert("Venda realizada!");
    setPopupVenda(false);
  };

  const valorTotal = produtoSelecionado && Number(produtoSelecionado.ValorDeVenda) * Number(quantidadeVenda);

  return (
    <div className="excel-screen">
      <div className="excel-card">
        <div className="excel-header">
          <div>
            <h2>Sistema de Vendas</h2>
            <p>Visualize o estoque e realize vendas rápidas.</p>
          </div>
          <button className="btn-outline" onClick={onBack}>← Voltar</button>
        </div>

        <div className="excel-actions">
          <input
            className="vendas-search-input"
            type="text"
            placeholder="🔍 Buscar por código, produto ou observação..."
            value={busca}
            onChange={(e) => filtrarProdutos(e.target.value)}
          />
        </div>

        {produtosFiltrados.length > 0 ? (
          <div className="excel-table-wrapper">
            <table className="excel-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Estoque</th>
                  <th>Preço</th>
                  <th>Observação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((p, i) => (
                  <tr key={i}>
                    <td><input value={p.Codigo} disabled className="codigo-destaque" /></td>
                    <td><input value={p.Produto} disabled /></td>
                    <td>
                      <input 
                        value={p.Quantidade} 
                        disabled 
                        className="estoque-status" 
                        style={{ color: p.Quantidade > 0 ? "var(--success)" : "var(--danger)" }}
                      />
                    </td>
                    <td><input value={`R$ ${p.ValorDeVenda}`} disabled className="codigo-destaque" /></td>
                    <td><input value={p.Observacao} disabled /></td>
                    <td>
                      <button className="btn-vender-acao" onClick={() => abrirVenda(p)}>
                        Vender
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">Nenhum produto encontrado</div>
        )}

        <div className="venda-info-footer">
          <strong>Total exibido: {produtosFiltrados.length}</strong> de {produtos.length} produtos.
        </div>
      </div>

      {popupVenda && produtoSelecionado && (
        <div className="modal-overlay">
          <div className="venda-modal-content">
            <h2>Confirmar Venda</h2>
            <p className="app-sm">Produto: <strong>{produtoSelecionado.Produto}</strong></p>
            
            <div className="venda-form-group">
              <label className="app-sm">Quantidade a vender:</label>
              <input
                type="number"
                min={1}
                max={produtoSelecionado.Quantidade}
                value={quantidadeVenda}
                onChange={(e) => setQuantidadeVenda(e.target.value)}
              />

              <div className="total-venda-display">
                <strong>Total: R$ {valorTotal?.toFixed(2)}</strong>
              </div>

              <div className="action-bar">
                <button className="btn-primary" onClick={confirmarVenda}>Confirmar</button>
                <button className="btn-delete" onClick={() => setPopupVenda(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}