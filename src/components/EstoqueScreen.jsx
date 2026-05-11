import { useState, useEffect } from "react";

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

// HANDLE GLOBAL
window.kingsFileHandle = window.kingsFileHandle || null;

export function EstoqueScreen({ onBack }) {
  const [estoqueData, setEstoqueData] = useState([]);
  const [jsonFileName, setJsonFileName] =
    useState("estoque.json");

  const [fileHandle, setFileHandle] =
    useState(null);

  useEffect(() => {
    const cache =
      localStorage.getItem(CACHE_KEY);

    if (cache) {
      try {
        const { data, fileName } =
          JSON.parse(cache);

        if (
          Array.isArray(data) &&
          data.length > 0
        ) {
          setEstoqueData(data);

          setJsonFileName(
            fileName || "estoque.json"
          );
        }
      } catch {
        localStorage.removeItem(
          CACHE_KEY
        );
      }
    }
  }, []);

  const persistCache = (
    data,
    fileName
  ) => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        fileName,
      })
    );
  };

  const gerarCodigo = () => {
    const ultimoIndex =
      estoqueData.length + 1;

    return `P${String(
      ultimoIndex
    ).padStart(3, "0")}`;
  };

  // DESKTOP = SALVA DIRETO
  // MOBILE = SOMENTE CACHE
  const salvarDiretoNoArquivo =
    async (
      data,
      customHandle = null
    ) => {
      try {
        const handle =
          customHandle || fileHandle;

        // DESKTOP
        if (
          handle &&
          window.showSaveFilePicker
        ) {
          const writable =
            await handle.createWritable();

          await writable.write(
            JSON.stringify(
              data,
              null,
              2
            )
          );

          await writable.close();

          return true;
        }

        // MOBILE
        persistCache(
          data,
          jsonFileName
        );

        return true;
      } catch (error) {
        console.error(
          "Erro ao salvar:",
          error
        );

        return false;
      }
    };

  // EXPORTAR BACKUP
  const baixarBackupJSON = (
    data
  ) => {
    const blob = new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      jsonFileName ||
      "estoque.json";

    link.click();

    URL.revokeObjectURL(url);
  };

  const criarNovoEstoque =
    async () => {
      try {
        // DESKTOP
        if (
          window.showSaveFilePicker
        ) {
          const handle =
            await window.showSaveFilePicker(
              {
                suggestedName:
                  "estoque.json",
                types: [
                  {
                    description:
                      "Arquivo JSON",
                    accept: {
                      "application/json":
                        [".json"],
                    },
                  },
                ],
              }
            );

          window.kingsFileHandle =
            handle;

          setFileHandle(handle);

          setEstoqueData(
            DEFAULT_TEMPLATE
          );

          setJsonFileName(
            "estoque.json"
          );

          persistCache(
            DEFAULT_TEMPLATE,
            "estoque.json"
          );

          await salvarDiretoNoArquivo(
            DEFAULT_TEMPLATE,
            handle
          );

          return;
        }

        // MOBILE
        setEstoqueData(
          DEFAULT_TEMPLATE
        );

        setJsonFileName(
          "estoque.json"
        );

        persistCache(
          DEFAULT_TEMPLATE,
          "estoque.json"
        );
      } catch (error) {
        console.error(error);
      }
    };

  const carregarJSON = async (
    event = null
  ) => {
    try {
      // DESKTOP
      if (
        window.showOpenFilePicker
      ) {
        const [handle] =
          await window.showOpenFilePicker(
            {
              types: [
                {
                  description:
                    "Arquivo JSON",
                  accept: {
                    "application/json":
                      [".json"],
                  },
                },
              ],
            }
          );

        const file =
          await handle.getFile();

        const text =
          await file.text();

        const jsonData =
          JSON.parse(text);

        if (
          !Array.isArray(
            jsonData
          )
        ) {
          alert(
            "O JSON precisa ser um array."
          );

          return;
        }

        window.kingsFileHandle =
          handle;

        setFileHandle(handle);

        setEstoqueData(
          jsonData
        );

        setJsonFileName(
          file.name
        );

        persistCache(
          jsonData,
          file.name
        );

        return;
      }

      // MOBILE
      const file =
        event.target.files?.[0];

      if (!file) return;

      const text =
        await file.text();

      const jsonData =
        JSON.parse(text);

      if (
        !Array.isArray(
          jsonData
        )
      ) {
        alert(
          "O JSON precisa ser um array."
        );

        return;
      }

      setEstoqueData(jsonData);

      setJsonFileName(
        file.name
      );

      persistCache(
        jsonData,
        file.name
      );
    } catch (error) {
      console.error(error);
    }
  };

  const salvarJSONAlterado =
    async () => {
      const confirmar =
        window.confirm(
          "Tem certeza que deseja salvar as alterações?"
        );

      if (!confirmar) return;

      persistCache(
        estoqueData,
        jsonFileName
      );

      const salvou =
        await salvarDiretoNoArquivo(
          estoqueData
        );

      if (!salvou) {
        alert(
          "Erro ao salvar arquivo."
        );
      }
    };

  const atualizarLinha = (
    rowIndex,
    key,
    value
  ) => {
    const updated = [
      ...estoqueData,
    ];

    updated[rowIndex] = {
      ...updated[rowIndex],
      [key]: value,
    };

    setEstoqueData(updated);

    persistCache(
      updated,
      jsonFileName
    );
  };

  const adicionarProduto = () => {
    const novoProduto = {
      Codigo: gerarCodigo(),
      Produto: "",
      Quantidade: 0,
      PrecoCompra: 0,
      PrecoVenda: 0,
      Observacao: "",
    };

    const updated = [
      ...estoqueData,
      novoProduto,
    ];

    setEstoqueData(updated);

    persistCache(
      updated,
      jsonFileName
    );
  };

  const removerProduto = (
    index
  ) => {
    const updated =
      estoqueData.filter(
        (_, i) => i !== index
      );

    setEstoqueData(updated);

    persistCache(
      updated,
      jsonFileName
    );
  };

  return (
    <div className="excel-screen">
      <div className="excel-card">
        <div className="excel-header">
          <div>
            <h2>
              Sistema de Estoque
            </h2>

            <p>
              Gerencie peças,
              códigos,
              quantidades e valores
              diretamente pela
              interface.
            </p>
          </div>

          <button
            className="btn-outline"
            onClick={onBack}
          >
            ← Voltar
          </button>
        </div>

        <div className="excel-actions">
          <button
            className="btn-primary"
            onClick={
              criarNovoEstoque
            }
          >
            Gerar JSON
          </button>

          {window.showOpenFilePicker ? (
            <button
              className="btn-primary"
              onClick={
                carregarJSON
              }
            >
              Carregar JSON
            </button>
          ) : (
            <label className="btn-primary">
              Carregar JSON

              <input
                type="file"
                accept=".json"
                hidden
                onChange={
                  carregarJSON
                }
              />
            </label>
          )}

          <button
            className="btn-primary"
            onClick={
              salvarJSONAlterado
            }
            disabled={
              !estoqueData.length
            }
          >
            Salvar Alterações
          </button>

          {/* SOMENTE MOBILE */}
          {!window.showSaveFilePicker && (
            <button
              className="btn-primary"
              onClick={() =>
                baixarBackupJSON(
                  estoqueData
                )
              }
              disabled={
                !estoqueData.length
              }
            >
              Exportar Backup
            </button>
          )}

          <button
            className="btn-primary"
            onClick={
              adicionarProduto
            }
          >
            + Adicionar Produto
          </button>
        </div>

        {estoqueData.length >
          0 && (
          <div className="excel-table-wrapper">
            <table className="excel-table">
              <thead>
                <tr>
                  {Object.keys(
                    estoqueData[0]
                  ).map(
                    (column) => (
                      <th
                        key={column}
                      >
                        {column}
                      </th>
                    )
                  )}

                  <th>
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {estoqueData.map(
                  (
                    row,
                    rowIndex
                  ) => (
                    <tr
                      key={
                        rowIndex
                      }
                    >
                      {Object.entries(
                        row
                      ).map(
                        ([
                          key,
                          value,
                        ]) => (
                          <td
                            key={
                              key
                            }
                          >
                            <input
                              value={
                                value
                              }
                              disabled={
                                key ===
                                "Codigo"
                              }
                              onChange={(
                                event
                              ) =>
                                atualizarLinha(
                                  rowIndex,
                                  key,
                                  event
                                    .target
                                    .value
                                )
                              }
                            />
                          </td>
                        )
                      )}

                      <td>
                        <button
                          className="btn-delete"
                          onClick={() =>
                            removerProduto(
                              rowIndex
                            )
                          }
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}