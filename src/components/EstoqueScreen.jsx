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

// HANDLE GLOBAL
window.kingsFileHandle = window.kingsFileHandle || null;

export function EstoqueScreen({ onBack }) {
  const [estoqueData, setEstoqueData] = useState([]);
  const [jsonFileName, setJsonFileName] = useState("estoque.json");
  const [fileHandle, setFileHandle] = useState(null);

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
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, fileName }));
  };

  const gerarCodigo = () => {
    const ultimoIndex = estoqueData.length + 1;
    return `P${String(ultimoIndex).padStart(3, "0")}`;
  };

  const salvarDiretoNoArquivo = async (data, customHandle = null) => {
    try {
      const handle = customHandle || fileHandle;
      if (handle && window.showSaveFilePicker) {
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
        return true;
      }
      persistCache(data, jsonFileName);
      return true;
    } catch (error) {
      console.error("Erro ao salvar:", error);
      return false;
    }
  };

  const baixarBackupJSON = (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = jsonFileName || "estoque.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const criarNovoEstoque = async () => {
    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: "estoque.json",
          types: [{ description: "Arquivo JSON", accept: { "application/json": [".json"] } }],
        });
        window.kingsFileHandle = handle;
        setFileHandle(handle);
        setEstoqueData(DEFAULT_TEMPLATE);
        setJsonFileName("estoque.json");
        persistCache(DEFAULT_TEMPLATE, "estoque.json");
        await salvarDiretoNoArquivo(DEFAULT_TEMPLATE, handle);
        return;
      }
      setEstoqueData(DEFAULT_TEMPLATE);
      setJsonFileName("estoque.json");
      persistCache(DEFAULT_TEMPLATE, "estoque.json");
    } catch (error) {
      console.error(error);
    }
  };

  const carregarJSON = async (event = null) => {
    try {
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: "Arquivo JSON", accept: { "application/json": [".json"] } }],
        });
        const file = await handle.getFile();
        const text = await file.text();
        const jsonData = JSON.parse(text);
        if (!Array.isArray(jsonData)) return alert("O JSON precisa ser um array.");
        window.kingsFileHandle = handle;
        setFileHandle(handle);
        setEstoqueData(jsonData);
        setJsonFileName(file.name);
        persistCache(jsonData, file.name);
        return;
      }
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const jsonData = JSON.parse(text);
      if (!Array.isArray(jsonData)) return alert("O JSON precisa ser um array.");
      setEstoqueData(jsonData);
      setJsonFileName(file.name);
      persistCache(jsonData, file.name);
    } catch (error) {
      console.error(error);
    }
  };

  const salvarJSONAlterado = async () => {
    const confirmar = window.confirm("Tem certeza que deseja salvar as alterações?");
    if (!confirmar) return;
    persistCache(estoqueData, jsonFileName);
    const salvou = await salvarDiretoNoArquivo(estoqueData);
    if (!salvou) alert("Erro ao salvar arquivo.");
  };

  const atualizarLinha = (rowIndex, key, value) => {
    const updated = [...estoqueData];
    let finalValue = value;

    // Lógica para campos numéricos
    const camposNumericos = ["Quantidade", "ValorDeCompra", "ValorDeVenda"];
    
    if (camposNumericos.includes(key)) {
      // Se apagar tudo, mantém 0
      if (value === "") {
        finalValue = 0;
      } else {
        // Remove zeros extras à esquerda e garante que seja número
        const num = Number(value.replace(/^0+/, ''));
        finalValue = isNaN(num) ? 0 : num;
      }
    }

    updated[rowIndex] = {
      ...updated[rowIndex],
      [key]: finalValue,
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
            <p>Gerencie peças, códigos, quantidades e valores diretamente pela interface.</p>
          </div>
          <button className="btn-outline" onClick={onBack}>← Voltar</button>
        </div>

        <div className="excel-actions">
          <button className="btn-primary" onClick={criarNovoEstoque}>Gerar JSON</button>

          {window.showOpenFilePicker ? (
            <button className="btn-primary" onClick={() => carregarJSON()}>Carregar JSON</button>
          ) : (
            <label className="btn-primary">
              Carregar JSON
              <input type="file" accept=".json" hidden onChange={carregarJSON} />
            </label>
          )}

          <button className="btn-primary" onClick={salvarJSONAlterado} disabled={!estoqueData.length}>
            Salvar Alterações
          </button>

          {!window.showSaveFilePicker && (
            <button className="btn-primary" onClick={() => baixarBackupJSON(estoqueData)} disabled={!estoqueData.length}>
              Exportar Backup
            </button>
          )}

          <button className="btn-primary" onClick={adicionarProduto}>+ Adicionar Produto</button>
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
                    {Object.entries(row).map(([key, value]) => {
                      const isNumeric = ["Quantidade", "ValorDeCompra", "ValorDeVenda"].includes(key);
                      return (
                        <td key={key}>
                          <input
                            type={isNumeric ? "number" : "text"}
                            value={value}
                            disabled={key === "Codigo"}
                            onChange={(e) => atualizarLinha(rowIndex, key, e.target.value)}
                            // Seleciona o texto ao focar se for zero, permitindo substituir imediatamente
                            onFocus={(e) => value === 0 && e.target.select()}
                          />
                        </td>
                      );
                    })}
                    <td>
                      <button className="btn-delete" onClick={() => removerProduto(rowIndex)}>Remover</button>
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