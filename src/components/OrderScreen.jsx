import { useState, useEffect } from "react";
import { DocumentosModal } from "./DocumentosModal";
import { Resultado } from "./Resultado";
import logo from "../assets/logo.png";

const CONFIG_KEY = "simulador_config";

const carregarConfig = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY));
    return {
      porcentagemItens: saved?.porcentagemItens ?? 50,
      porcentagemHoras: saved?.porcentagemHoras ?? 50,
      salarioMensal: saved?.salarioMensal ?? 3000,
      taxaMaquininha: saved?.taxaMaquininha ?? 0,
      mostrarMaoObraSeparada: saved?.mostrarMaoObraSeparada ?? false,
    };
  } catch {
    return {
      porcentagemItens: 50,
      porcentagemHoras: 50,
      salarioMensal: 3000,
      taxaMaquininha: 0,
      mostrarMaoObraSeparada: false,
    };
  }
};

const nomesCampos = {
  nome: "Nome do Cliente",
  veiculo: "Veículo (Modelo)",
  placa: "Placa",
  telefone: "Telefone / WhatsApp",
  endereco: "Endereço",
  documento: "CPF / CNPJ",
};

export function OrderScreen({ onBack }) {
  const [itens, setItens] = useState([{ nome: "", valor: "", isServico: false, isSemMO: false }]);
  const [resultado, setResultado] = useState([]);
  const [horas, setHoras] = useState(0);
  const [calculoAtivado, setCalculoAtivado] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [mostrarDocumentos, setMostrarDocumentos] = useState(false);
  const [mostrarDesconto, setMostrarDesconto] = useState(false);
  const [desconto, setDesconto] = useState({ porcentagem: 0, motivo: "" });
  const [config, setConfig] = useState(carregarConfig);
  const [cliente, setCliente] = useState({
    nome: "",
    veiculo: "",
    placa: "",
    telefone: "",
    endereco: "",
    documento: "",
    data: new Date().toLocaleDateString("pt-BR"),
  });

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (calculoAtivado) {
      executarCalculo();
    }
  }, [itens, horas, config, desconto, calculoAtivado]);

  const atualizarCliente = (campo, valor) => setCliente((prev) => ({ ...prev, [campo]: valor }));

  const adicionarItem = () => setItens([...itens, { nome: "", valor: "", isServico: false, isSemMO: false }]);

  const removerItem = (index) => setItens(itens.filter((_, i) => i !== index));

  const atualizarItem = (index, campo, valor) => {
    const updatedItems = [...itens];
    updatedItems[index][campo] = valor;
    setItens(updatedItems);
  };

  const executarCalculo = () => {
    const totalItensOriginal = itens.reduce((sum, item) => sum + Number(item.valor || 0), 0);
    if (totalItensOriginal === 0 && !horas) {
      setResultado([]);
      return;
    }

    const valorHoraBase = (config.salarioMensal || 0) / 220;
    const custoMOComAdicional = valorHoraBase * (horas || 0) * (1 + (config.porcentagemHoras || 0) / 100);

    const res = itens.map((item) => {
      const valorItem = Number(item.valor || 0);
      const percParticipacao = totalItensOriginal > 0 ? valorItem / totalItensOriginal : 1 / itens.length;

      const margem = item.isServico ? 0 : config.porcentagemItens / 100;
      const valorComMargem = valorItem * (1 + margem);
      const mostrarMOnoItem = !config.mostrarMaoObraSeparada && !item.isSemMO;
      const moNoItem = mostrarMOnoItem ? custoMOComAdicional * percParticipacao : 0;

      return {
        nome: item.nome || "Item sem nome",
        valorBase: valorComMargem + moNoItem,
        maoObraIndividual: item.isSemMO ? 0 : custoMOComAdicional * percParticipacao,
      };
    });

    setResultado(res);
  };

  const calcular = () => {
    setCalculoAtivado(true);
    executarCalculo();
  };

  const limparTudo = () => {
    if (!window.confirm("Deseja apagar todos os dados?")) return;

    setCalculoAtivado(false);
    setItens([{ nome: "", valor: "", isServico: false, isSemMO: false }]);
    setResultado([]);
    setHoras(0);
    setDesconto({ porcentagem: 0, motivo: "" });
    setCliente({
      nome: "",
      veiculo: "",
      placa: "",
      telefone: "",
      endereco: "",
      documento: "",
      data: new Date().toLocaleDateString("pt-BR"),
    });
  };

  return (
    <div className="main-card">
      <header className="app-header app-header-order">
        <div className="header-left">
          <img src={logo} alt="Logo" className="app-logo" />
          <div>
            <div className="app-subtitle">Ordem de Serviço</div>
            <div className="app-sm">Preencha os dados e gere o orçamento.</div>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-outline" onClick={onBack}>← Voltar</button>
          <button className="btn-icon" onClick={() => setMostrarConfig(true)}>⚙️</button>
        </div>
      </header>

      <section className="section">
        <h3 className="section-title">Informações do Cliente</h3>
        <div className="grid-form">
          {Object.keys(nomesCampos).map((campo) => (
            <div key={campo} className="input-group">
              <label>{campo.toUpperCase()}</label>
              <input value={cliente[campo]} onChange={(event) => atualizarCliente(campo, event.target.value)} placeholder={nomesCampos[campo]} />
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h3 className="section-title">Peças e Serviços</h3>
          <button className="btn-small" onClick={adicionarItem}>+ Novo Item</button>
        </div>
        <div className="items-list">
          {itens.map((item, index) => (
            <div key={index} className="item-card">
              <input
                className="input-flat flex-3"
                placeholder="Ex: Pastilha de freio..."
                value={item.nome}
                onChange={(event) => atualizarItem(index, "nome", event.target.value)}
              />
              <input
                className="input-flat flex-1"
                type="number"
                placeholder="R$ 0,00"
                value={item.valor}
                onChange={(event) => atualizarItem(index, "valor", event.target.value)}
              />
              <div className="item-actions">
                <label className={`toggle-chip ${item.isServico ? "active" : ""}`}>
                  <input type="checkbox" checked={item.isServico} onChange={(event) => atualizarItem(index, "isServico", event.target.checked)} /> Sem %
                </label>
                <label className={`toggle-chip ${(config.mostrarMaoObraSeparada || item.isSemMO) ? "active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={config.mostrarMaoObraSeparada ? true : item.isSemMO}
                    disabled={config.mostrarMaoObraSeparada}
                    onChange={(event) => atualizarItem(index, "isSemMO", event.target.checked)}
                  />
                  Sem MO
                </label>
                <button className="btn-delete" onClick={() => removerItem(index)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section row-spread">
        <div className="input-group" style={{ width: "160px" }}>
          <label>TEMPO DE EXECUÇÃO (H)</label>
          <input type="number" placeholder="Total Horas" value={horas || ""} onChange={(event) => setHoras(Number(event.target.value))} />
        </div>
        <button className="btn-discount" onClick={() => setMostrarDesconto(true)}>
          {desconto.porcentagem > 0 ? `💰 ${desconto.porcentagem}% OFF` : "🏷️ Add Desconto"}
        </button>
      </section>

      <section className="action-bar">
        <button className="btn-primary" onClick={calcular}>CALCULAR ORÇAMENTO</button>
        <button className="btn-outline" onClick={() => setMostrarDocumentos(true)}>📄 DOCUMENTOS</button>
        <div className="secondary-btns">
          <button className="btn-outline" onClick={limparTudo}>LIMPAR TUDO</button>
        </div>
      </section>

      {resultado.length > 0 && (
        <div className="resumo-container">
          <Resultado resultado={resultado} cliente={cliente} desconto={desconto} config={config} />
        </div>
      )}

      {mostrarConfig && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="section-title" style={{ textAlign: 'center', marginBottom: '20px' }}>⚙️ Configurações Base</h3>
            <div className="grid-form">
              <div className="input-group"><label>% LUCRO ITENS</label><input type="number" value={config.porcentagemItens} onChange={(event) => setConfig({ ...config, porcentagemItens: Number(event.target.value) })} /></div>
              <div className="input-group"><label>% ADICIONAL MO</label><input type="number" value={config.porcentagemHoras} onChange={(event) => setConfig({ ...config, porcentagemHoras: Number(event.target.value) })} /></div>
              <div className="input-group"><label>SALÁRIO BASE</label><input type="number" value={config.salarioMensal} onChange={(event) => setConfig({ ...config, salarioMensal: Number(event.target.value) })} /></div>
              <div className="input-group"><label>TAXA MÁQUINA (%)</label><input type="number" value={config.taxaMaquininha} onChange={(event) => setConfig({ ...config, taxaMaquininha: Number(event.target.value) })} /></div>
            </div>
            <div className="config-global-item" style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="moSeparada" checked={config.mostrarMaoObraSeparada} onChange={(event) => setConfig({ ...config, mostrarMaoObraSeparada: event.target.checked })} />
              <label htmlFor="moSeparada">Separar Mão de Obra no Resumo</label>
            </div>
            <button className="btn-primary" style={{ marginTop: '25px' }} onClick={() => setMostrarConfig(false)}>SALVAR CONFIGURAÇÕES</button>
          </div>
        </div>
      )}

      {mostrarDesconto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="section-title">Aplicar Desconto</h3>
            <div className="input-group">
              <label>VALOR DO DESCONTO (%)</label>
              <input type="number" value={desconto.porcentagem || ""} onChange={(event) => setDesconto({ ...desconto, porcentagem: Number(event.target.value) })} />
            </div>
            <div className="input-group" style={{ marginTop: '15px' }}>
              <label>MOTIVO</label>
              <input type="text" value={desconto.motivo} onChange={(event) => setDesconto({ ...desconto, motivo: event.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button className="btn-primary" style={{ flex: 2 }} onClick={() => setMostrarDesconto(false)}>APLICAR</button>
              <button className="btn-outline" style={{ flex: 1, borderColor: '#ff4d4d', color: '#ff4d4d' }} onClick={() => { setDesconto({ porcentagem: 0, motivo: "" }); setMostrarDesconto(false); }}>LIMPAR</button>
            </div>
          </div>
        </div>
      )}

      <DocumentosModal open={mostrarDocumentos} onClose={() => setMostrarDocumentos(false)} cliente={cliente} />
    </div>
  );
}
