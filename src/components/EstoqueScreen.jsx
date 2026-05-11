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
  const [jsonFileName, setJsonFileName] = useState("Nenhum arquivo selecionado");
  // O 'fileHandle' é a chave: ele guarda a referência do arquivo físico no seu PC
  const [fileHandle, setFileHandle] = useState(null);

  // Recupera do cache do navegador apenas para não perder dados em caso de refresh
  useEffect(() => {
    const cache = localStorage.getItem(CACHE_KEY);
    if (cache) {
      try {
        const { data, fileName } = JSON.parse(cache);
        if (Array.isArray(data)) {
          setEstoqueData(data);
          setJsonFileName(fileName);
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

  // CRIAR UM NOVO ARQUIVO (Ex: Estoque_Verão.json)
  const criarNovoEstoque = async () => {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: "novo_estoque.json",
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
      });
      
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(DEFAULT_TEMPLATE, null, 2));
      await writable.close();

      setFileHandle(handle);
      setEstoqueData(DEFAULT_TEMPLATE);
      setJsonFileName(handle.name);
      persistCache(DEFAULT_TEMPLATE, handle.name);
    } catch (err) { console.log("Operação cancelada"); }
  };

  // CARREGAR UM ARQUIVO EXISTENTE (Alternar entre arquivos)
  const carregarJSON = async () => {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        multiple: false
      });

      const file = await handle.getFile();
      const text = await file.text();
      const jsonData = JSON.parse(text);

      setFileHandle(handle); // Vincula o sistema a este arquivo específico
      setEstoqueData(jsonData);
      setJsonFileName(file.name);
      persistCache(jsonData, file.name);
    } catch (err) { console.log("Seleção cancelada"); }
  };

  // SALVAR NO ARQUIVO QUE ESTIVER ABERTO (Sem "Salvar Como")
  const salvarNoArquivoAtual = async () => {
    if (!fileHandle) {
      alert("Por favor, carregue ou crie um arquivo JSON primeiro para poder salvar diretamente.");
      return;
    }

    try {
      // Solicita permissão se necessário (segurança do navegador)
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(estoqueData, null, 2));
      await writable.close();
      
      alert(`Alterações salvas em: ${fileHandle.name}`);
      persistCache(estoqueData, fileHandle.name);
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const atualizarLinha = (rowIndex, key, value) => {
    const updated = [...estoqueData];
    updated[rowIndex] = { ...updated[rowIndex], [key]: value };
    setEstoqueData(updated);
    persistCache(updated, jsonFileName);
  };

  const adicionarProduto = () => {
    const novoProduto = {
      Codigo: gerarCodigo(), Produto: "", Quantidade: 0,
      ValorDeCompra: 0, ValorDeVenda: 0, Observacao: "",
    };
    const updated = [...estoqueData, novoProduto];
    setEstoqueData(updated);
    persistCache(updated, jsonFileName);
  };

  const removerProduto = (index) => {
    if (!window.confirm("Remover este produto?")) return;
    const updated = estoqueData.filter((_, i) => i !== index);
    setEstoqueData(updated);
    persistCache(updated, jsonFileName);
  };

  return (
    <div className="excel-screen">
      <div className="excel-card">
        <div className="excel-header">
          <div>
            <h2>Kings Racing - Gestão de Arquivos</h2>
            <p>Arquivo Conectado: <span style={{ color: '#007bff', fontWeight: 'bold' }}>{jsonFileName}</span></p>
          </div>
          <button className="btn-outline" onClick={onBack}>← Voltar</button>
        </div>

        <div className="excel-actions">
          <button className="btn-primary" onClick={carregarJSON} title="Trocar de arquivo de estoque">
            Carregar/Trocar JSON
          </button>

          <button className="btn-primary" onClick={criarNovoEstoque}>
            Novo Estoque (.json)
          </button>

          <button
            className="btn-primary"
            onClick={salvarNoArquivoAtual}
            disabled={!fileHandle}
            style={{ backgroundColor: fileHandle ? '#28a745' : '#ccc' }}
          >
            Salvar no Arquivo Original
          </button>

          <button className="btn-primary" onClick={adicionarProduto}>
            + Adicionar Produto
          </button>
        </div>

        {estoqueData.length > 0 ? (
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
                          onChange={(e) => atualizarLinha(rowIndex, key, e.target.value)}
                        />
                      </td>
                    ))}
                    <td>
                      <button className="btn-delete" onClick={() => removerProduto(rowIndex)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>Nenhum arquivo carregado. Use os botões acima para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}