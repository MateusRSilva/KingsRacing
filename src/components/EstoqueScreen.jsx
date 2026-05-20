import { useState, useEffect, useRef } from "react";

// Definição estrita das colunas do sistema para evitar desalinhamento
const COLUNAS = ["Codigo", "Produto", "Quantidade", "PrecoCompra", "PrecoVenda", "Observacao"];

const DEFAULT_TEMPLATE = [
  {
    Codigo: "P001",
    Produto: "",
    Quantidade: 0,
    PrecoCompra: 0,
    PrecoVenda: 0,
    Observacao: "",
  },
];

const CACHE_KEY = "kingsracing_estoque_cache";

export function EstoqueScreen({ onBack }) {
  const [estoqueData, setEstoqueData] = useState([]);
  const [jsonFileName, setJsonFileName] = useState("estoque.json");
  const fileInputRef = useRef(null); // Referência para o input tradicional oculto

  useEffect(() => {
    const cache = localStorage.getItem(CACHE_KEY);
    if (cache) {
      try {
        const { data, fileName } = JSON.parse(cache);
        if (Array.isArray(data) && data.length > 0) {
          setEstoqueData(normalizarDados(data));
          setJsonFileName(fileName || "estoque.json");
        } else {
          setEstoqueData(DEFAULT_TEMPLATE);
        }
      } catch {
        localStorage.removeItem(CACHE_KEY);
        setEstoqueData(DEFAULT_TEMPLATE);
      }
    } else {
      setEstoqueData(DEFAULT_TEMPLATE);
    }
  }, []);

  // Garante que todo item tenha todas as propriedades necessárias e corretas
  const normalizarDados = (lista) => {
    return lista.map((item) => ({
      Codigo: item.Codigo || "",
      Produto: item.Produto || "",
      Quantidade: item.Quantidade === "" || item.Quantidade === undefined ? 0 : Number(item.Quantidade),
      PrecoCompra: item.PrecoCompra === "" || item.PrecoCompra === undefined ? 0 : Number(item.PrecoCompra),
      PrecoVenda: item.PrecoVenda === "" || item.PrecoVenda === undefined ? 0 : Number(item.PrecoVenda),
      Observacao: item.Observacao || "",
    }));
  };

  const persistCache = (data, fileName) => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        fileName,
      })
    );
  };

  const gerarCodigo = (dadosAtuais) => {
    const lista = dadosAtuais || estoqueData;
    const ultimoIndex = lista.length + 1;
    return `P${String(ultimoIndex).padStart(3, "0")}`;
  };

  // EXPORTAR BACKUP (Abordagem Universal via Link Temporário)
  const baixarBackupJSON = (data) => {
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        alert("Não há dados disponíveis para exportar.");
        return;
      }

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const nomeDoArquivo = jsonFileName && jsonFileName.trim() !== "" 
        ? jsonFileName 
        : "estoque.json";

      const link = document.createElement("a");
      link.href = url;
      link.download = nomeDoArquivo.endsWith(".json") ? nomeDoArquivo : `${nomeDoArquivo}.json`;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro crítico ao exportar o arquivo:", error);
      alert("Ocorreu um erro ao gerar o arquivo de backup.");
    }
  };

  // CARREGAR JSON (Abordagem Universal e Compatível com todos os navegadores)
  const lidarComSelecaoDeArquivo = (event) => {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    
    leitor.onload = (e) => {
      try {
        const texto = e.target.result;
        const jsonData = JSON.parse(texto);

        if (!Array.isArray(jsonData)) {
          alert("O JSON precisa ser um array de produtos (ex: [{...}]).");
          return;
        }

        const dadosNormalizados = normalizarDados(jsonData.length === 0 ? DEFAULT_TEMPLATE : jsonData);

        setJsonFileName(arquivo.name);
        setEstoqueData([...dadosNormalizados]);
        persistCache(dadosNormalizados, arquivo.name);
        
        // Limpa o valor do input para permitir carregar o mesmo arquivo novamente se necessário
        event.target.value = "";
      } catch (error) {
        console.error("Erro na leitura do JSON:", error);
        alert("Erro ao processar o arquivo. Certifique-se de que ele é um arquivo JSON válido.");
      }
    };

    leitor.onerror = () => {
      alert("Erro ao ler o arquivo físico.");
    };

    leitor.readAsText(arquivo);
  };

  const dispararSeletorArquivo = () => {
    // Simula o clique no input file invisível
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
    const updated = [
      ...estoqueData,
      {
        Codigo: gerarCodigo(estoqueData),
        Produto: "",
        Quantidade: 0,
        PrecoCompra: 0,
        PrecoVenda: 0,
        Observacao: "",
      },
    ];
    setEstoqueData(updated);
    persistCache(updated, jsonFileName);
  };

  const removerProduto = (index) => {
    let updated = estoqueData.filter((_, i) => i !== index);
    if (updated.length === 0) {
      updated = DEFAULT_TEMPLATE;
    }
    setEstoqueData(updated);
    persistCache(updated, jsonFileName);
  };

  return (
    <div className="excel-screen">
      {/* Input de arquivo invisível para máxima compatibilidade */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".json,application/json"
        onChange={lidarComSelecaoDeArquivo}
      />

      <div className="excel-card">
        <div className="excel-header">
          <div>
            <h2>Sistema de Estoque</h2>
            <p>Gerencie peças, códigos, quantidades e valores diretamente pela interface.</p>
            <small style={{ color: "#666" }}>Arquivo atual: {jsonFileName}</small>
          </div>
          <button className="btn-outline" onClick={onBack}>
            ← Voltar
          </button>
        </div>

        <div className="excel-actions">
          <button className="btn-primary" onClick={dispararSeletorArquivo}>
            Carregar JSON
          </button>
          <button
            className="btn-primary"
            onClick={() => baixarBackupJSON(estoqueData)}
            disabled={!estoqueData || estoqueData.length === 0}
          >
            Exportar Backup
          </button>
          <button className="btn-primary" onClick={adicionarProduto}>
            + Adicionar Produto
          </button>
        </div>

        {estoqueData && estoqueData.length > 0 && (
          <div className="excel-table-wrapper">
            <table className="excel-table">
              <thead>
                <tr>
                  {COLUNAS.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {estoqueData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {COLUNAS.map((key) => {
                      const value = row[key];
                      const isNumberField = ["Quantidade", "PrecoCompra", "PrecoVenda"].includes(key);

                      return (
                        <td key={key}>
                          <input
                            type={isNumberField ? "number" : "text"}
                            value={isNumberField && value === 0 ? "" : (value ?? "")}
                            placeholder={isNumberField ? "0" : ""}
                            disabled={key === "Codigo"}
                            onChange={(event) => {
                              const rawVal = event.target.value;
                              const finalVal = isNumberField
                                ? rawVal === "" ? 0 : Number(rawVal)
                                : rawVal;

                              atualizarLinha(rowIndex, key, finalVal);
                            }}
                          />
                        </td>
                      );
                    })}
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