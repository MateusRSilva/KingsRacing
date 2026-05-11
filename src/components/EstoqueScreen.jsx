import { useState, useEffect } from "react";

const DEFAULT_TEMPLATE = [
  {
    Codigo: "P001",
    Produto: "",
    Quantidade: 0,
    ValorDeCompra: 0,
    ValorDeVenda: 0,
    Observacao: "",
  },
];

const CACHE_KEY = "kingsracing_estoque_cache";

export function EstoqueScreen({ onBack }) {
  const [estoqueData, setEstoqueData] = useState([]);
  const [jsonFileName, setJsonFileName] = useState("estoque.json");

  useEffect(() => {
    const cache = localStorage.getItem(CACHE_KEY);

    if (cache) {
      try {
        const { data, fileName } = JSON.parse(cache);

        if (Array.isArray(data) && data.length > 0) {
          setEstoqueData(data);
          setJsonFileName(fileName || "estoque.json");
        }
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }, []);

  const persistCache = (data, fileName) => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        fileName,
      })
    );
  };

  const gerarCodigo = () => {
    const ultimoIndex = estoqueData.length + 1;
    return `P${String(ultimoIndex).padStart(3, "0")}`;
  };

  const criarNovoEstoque = () => {
    setEstoqueData(DEFAULT_TEMPLATE);
    setJsonFileName("estoque.json");

    persistCache(DEFAULT_TEMPLATE, "estoque.json");

    baixarJSON(DEFAULT_TEMPLATE, "estoque.json");
  };

  const baixarJSON = (data, fileName) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  };

  const carregarJSON = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const text = await file.text();

    try {
      const jsonData = JSON.parse(text);

      if (!Array.isArray(jsonData)) {
        alert("O JSON precisa ser um array.");
        return;
      }

      const fileName = file.name.replace(/\.json$/, "_editado.json");

      setEstoqueData(jsonData);
      setJsonFileName(fileName);

      persistCache(jsonData, fileName);
    } catch {
      alert("Arquivo JSON inválido.");
    }
  };

  const salvarJSONAlterado = () => {
  const confirmar = window.confirm(
    "Tem certeza que deseja salvar as alterações?"
  );

  if (confirmar) {
    persistCache(estoqueData, jsonFileName);

    baixarJSON(estoqueData, jsonFileName);
  }
};

  const atualizarLinha = (rowIndex, key, value) => {
    const updated = [...estoqueData];

    updated[rowIndex] = {
      ...updated[rowIndex],
      [key]: value,
    };

    setEstoqueData(updated);

    persistCache(updated, jsonFileName);
  };

  const adicionarProduto = () => {
    const novoProduto = {
      Codigo: gerarCodigo(),
      Produto: "",
      Quantidade: 0,
      ValorDeCompra: 0,
      ValorDeVenda: 0,
      Observacao: "",
    };

    const updated = [...estoqueData, novoProduto];

    setEstoqueData(updated);

    persistCache(updated, jsonFileName);
  };

  const removerProduto = (index) => {
    const updated = estoqueData.filter((_, i) => i !== index);

    setEstoqueData(updated);

    persistCache(updated, jsonFileName);
  };

  return (
    <div className="excel-screen">
      <div className="excel-card">
        <div className="excel-header">
          <div>
            <h2>Sistema de Estoque</h2>

            <p>
              Gerencie peças, códigos, quantidades e valores diretamente pela
              interface.
            </p>
          </div>

          <button className="btn-outline" onClick={onBack}>
            ← Voltar
          </button>
        </div>

        <div className="excel-actions">
          <button className="btn-primary" onClick={criarNovoEstoque}>
            Gerar JSON
          </button>

          <label className="excel-upload-label">
            Carregar JSON

            <input
              type="file"
              accept=".json"
              onChange={carregarJSON}
            />
          </label>

          <button
            className="btn-primary"
            onClick={salvarJSONAlterado}
            disabled={!estoqueData.length}
          >
            Salvar Alterações
          </button>

          <button
            className="btn-primary"
            onClick={adicionarProduto}
          >
            + Adicionar Produto
          </button>
        </div>

        {estoqueData.length > 0 && (
          <div className="excel-table-wrapper">
            <table className="excel-table">
              <thead>
                <tr>
                  {Object.keys(estoqueData[0]).map((column) => (
                    <th key={column}>{column}</th>
                  ))}

                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {estoqueData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.entries(row).map(([key, value]) => (
                      <td key={key}>
                        <input
                          value={value}
                          disabled={key === "Codigo"}
                          onChange={(event) =>
                            atualizarLinha(
                              rowIndex,
                              key,
                              event.target.value
                            )
                          }
                        />
                      </td>
                    ))}

                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => removerProduto(rowIndex)}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}