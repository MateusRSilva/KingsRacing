import { useState } from "react";

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

export function EstoqueScreen({ onBack }) {
  const [estoqueData, setEstoqueData] = useState([]);
  const [fileHandle, setFileHandle] = useState(null);

  const gerarCodigo = () => {
    const ultimoIndex = estoqueData.length + 1;
    return `P${String(ultimoIndex).padStart(3, "0")}`;
  };

  const salvarDiretoNoArquivo = async (
    data = estoqueData,
    handle = fileHandle
  ) => {
    try {
      if (!handle) {
        alert("Nenhum arquivo carregado.");
        return;
      }

      const writable = await handle.createWritable();

      await writable.write(JSON.stringify(data, null, 2));

      await writable.close();

      alert("Arquivo salvo com sucesso!");
    } catch (err) {
      console.log(err);
      alert("Erro ao salvar arquivo.");
    }
  };

  const criarNovoEstoque = async () => {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: "estoque.json",
        types: [
          {
            description: "Arquivo JSON",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });

      setFileHandle(handle);

      setEstoqueData(DEFAULT_TEMPLATE);

      await salvarDiretoNoArquivo(DEFAULT_TEMPLATE, handle);
    } catch (err) {
      console.log(err);
    }
  };

  const carregarJSON = async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Arquivo JSON",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });

      const file = await handle.getFile();

      const text = await file.text();

      const jsonData = JSON.parse(text);

      if (!Array.isArray(jsonData)) {
        alert("O JSON precisa ser um array.");
        return;
      }

      setEstoqueData(jsonData);

      setFileHandle(handle);
    } catch (err) {
      console.log(err);
      alert("Erro ao carregar JSON.");
    }
  };

  const atualizarLinha = async (rowIndex, key, value) => {
    const updated = [...estoqueData];

    updated[rowIndex] = {
      ...updated[rowIndex],
      [key]:
        key === "Quantidade" ||
        key === "ValorDeCompra" ||
        key === "ValorDeVenda"
          ? Number(value)
          : value,
    };

    setEstoqueData(updated);

    if (fileHandle) {
      await salvarDiretoNoArquivo(updated, fileHandle);
    }
  };

  const adicionarProduto = async () => {
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

    if (fileHandle) {
      await salvarDiretoNoArquivo(updated, fileHandle);
    }
  };

  const removerProduto = async (index) => {
    const updated = estoqueData.filter((_, i) => i !== index);

    setEstoqueData(updated);

    if (fileHandle) {
      await salvarDiretoNoArquivo(updated, fileHandle);
    }
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
          <button
            className="btn-primary"
            onClick={criarNovoEstoque}
          >
            Gerar JSON
          </button>

          <button
            className="btn-primary"
            onClick={carregarJSON}
          >
            Carregar JSON
          </button>

          <button
            className="btn-primary"
            onClick={() => salvarDiretoNoArquivo()}
            disabled={!estoqueData.length}
          >
            Salvar Alterações
          </button>

          <button
            className="btn-primary"
            onClick={adicionarProduto}
            disabled={!fileHandle}
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
                          type={
                            key === "Quantidade" ||
                            key === "ValorDeCompra" ||
                            key === "ValorDeVenda"
                              ? "number"
                              : "text"
                          }
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