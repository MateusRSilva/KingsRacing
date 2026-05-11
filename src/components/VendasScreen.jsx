import { useState, useEffect } from "react";

const CACHE_KEY = "kingsracing_estoque_cache";

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
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: novosProdutos,
      })
    );
  };

  const filtrarProdutos = (textoBusca) => {
    setBusca(textoBusca);

    if (!textoBusca.trim()) {
      setProdutosFiltrados(produtos);
      return;
    }

    const termo = textoBusca.toLowerCase();

    const filtrados = produtos.filter((produto) => {
      return (
        produto.Codigo.toLowerCase().includes(termo) ||
        produto.Produto.toLowerCase().includes(termo) ||
        produto.Observacao.toLowerCase().includes(termo)
      );
    });

    setProdutosFiltrados(filtrados);
  };

  const abrirVenda = (produto) => {
    setProdutoSelecionado(produto);
    setQuantidadeVenda(1);
    setPopupVenda(true);
  };

  const confirmarVenda = () => {
    if (!produtoSelecionado) return;

    const quantidadeAtual = Number(produtoSelecionado.Quantidade);
    const quantidadeDesejada = Number(quantidadeVenda);

    if (quantidadeDesejada <= 0) {
      alert("Informe uma quantidade válida.");
      return;
    }

    if (quantidadeDesejada > quantidadeAtual) {
      alert("Quantidade insuficiente em estoque.");
      return;
    }

    const novosProdutos = produtos.map((produto) => {
      if (produto.Codigo === produtoSelecionado.Codigo) {
        return {
          ...produto,
          Quantidade: quantidadeAtual - quantidadeDesejada,
        };
      }

      return produto;
    });

    setProdutos(novosProdutos);
    setProdutosFiltrados(novosProdutos);

    atualizarCache(novosProdutos);

    alert("Venda realizada com sucesso!");

    setPopupVenda(false);
    setProdutoSelecionado(null);
  };

  const valorTotal =
    produtoSelecionado &&
    Number(produtoSelecionado.ValorDeVenda) * Number(quantidadeVenda);

  return (
    <div className="excel-screen">
      <div className="excel-card">
        <div className="excel-header">
          <div>
            <h2>Sistema de Vendas</h2>

            <p>
              Visualize o estoque e busque produtos por código, nome ou
              categoria.
            </p>
          </div>

          <button className="btn-outline" onClick={onBack}>
            ← Voltar
          </button>
        </div>

        <div className="excel-actions">
          <input
            type="text"
            placeholder="🔍 Buscar por código, produto ou observação..."
            value={busca}
            onChange={(e) => filtrarProdutos(e.target.value)}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "var(--input)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "white",
              fontSize: "14px",
            }}
          />
        </div>

        {produtosFiltrados.length > 0 ? (
          <div className="excel-table-wrapper">
            <table className="excel-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Valor Compra</th>
                  <th>Valor Venda</th>
                  <th>Observação</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {produtosFiltrados.map((produto, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        value={produto.Codigo}
                        disabled
                        style={{
                          fontWeight: "bold",
                          color: "var(--accent)",
                        }}
                      />
                    </td>

                    <td>
                      <input value={produto.Produto} disabled />
                    </td>

                    <td>
                      <input
                        value={produto.Quantidade}
                        disabled
                        style={{
                          color:
                            produto.Quantidade > 0
                              ? "var(--success)"
                              : "var(--danger)",
                        }}
                      />
                    </td>

                    <td>
                      <input
                        value={`R$ ${produto.ValorDeCompra}`}
                        disabled
                      />
                    </td>

                    <td>
                      <input
                        value={`R$ ${produto.ValorDeVenda}`}
                        disabled
                        style={{ color: "var(--accent)" }}
                      />
                    </td>

                    <td>
                      <input value={produto.Observacao} disabled />
                    </td>

                    <td>
                      <button
                        onClick={() => abrirVenda(produto)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "10px",
                          border: "none",
                          background: "var(--accent)",
                          color: "white",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        Vender
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--text-dim)",
            }}
          >
            {produtos.length === 0
              ? "Nenhum estoque carregado"
              : "Nenhum produto encontrado"}
          </div>
        )}

        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            background: "rgba(0, 210, 255, 0.05)",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            color: "var(--text-dim)",
            fontSize: "13px",
          }}
        >
          <strong>Total de produtos: {produtosFiltrados.length}</strong> de{" "}
          {produtos.length}
        </div>
      </div>

      {/* POPUP VENDA */}
      {popupVenda && produtoSelecionado && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: "400px",
              background: "var(--card)",
              padding: "24px",
              borderRadius: "16px",
              border: "1px solid var(--border)",
            }}
          >
            <h2 style={{ marginBottom: "10px" }}>Realizar Venda</h2>

            <p style={{ marginBottom: "20px", color: "var(--text-dim)" }}>
              Produto: <strong>{produtoSelecionado.Produto}</strong>
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <input
                type="number"
                min={1}
                max={produtoSelecionado.Quantidade}
                value={quantidadeVenda}
                onChange={(e) => setQuantidadeVenda(e.target.value)}
                placeholder="Quantidade"
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--input)",
                  color: "white",
                }}
              />

              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: "rgba(0, 210, 255, 0.08)",
                  border: "1px solid var(--border)",
                }}
              >
                <strong>
                  Total da venda: R$ {valorTotal?.toFixed(2)}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  onClick={confirmarVenda}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "none",
                    borderRadius: "10px",
                    background: "var(--success)",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Confirmar Venda
                </button>

                <button
                  onClick={() => setPopupVenda(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "none",
                    borderRadius: "10px",
                    background: "var(--danger)",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}