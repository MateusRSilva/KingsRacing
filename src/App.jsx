import { useState, useEffect } from "react";
import "./App.css";
import { Resultado } from "./Resultado";
import logo from "./assets/logo.png";

const CONFIG_KEY = "simulador_config";

const carregarConfig = () => {
  try {
    const salva = JSON.parse(localStorage.getItem(CONFIG_KEY));
    return {
      porcentagemItens: salva?.porcentagemItens ?? 50,
      porcentagemHoras: salva?.porcentagemHoras ?? 50,
      salarioMensal: salva?.salarioMensal ?? 3000,
      taxaMaquininha: salva?.taxaMaquininha ?? 0,
      mostrarMaoObraSeparada: salva?.mostrarMaoObraSeparada ?? false
    };
  } catch {
    return { porcentagemItens: 50, porcentagemHoras: 50, salarioMensal: 3000, taxaMaquininha: 0, mostrarMaoObraSeparada: false };
  }
};

export default function App() {
  const [itens, setItens] = useState([{ nome: "", valor: "", isServico: false, isSemMO: false }]);
  const [resultado, setResultado] = useState([]);
  const [horas, setHoras] = useState(0);
  const [calculoAtivado, setCalculoAtivado] = useState(false);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [mostrarDesconto, setMostrarDesconto] = useState(false);
  const [desconto, setDesconto] = useState({ porcentagem: 0, motivo: "" });
  const [config, setConfig] = useState(carregarConfig);
  const [cliente, setCliente] = useState({
    nome: "", veiculo: "", placa: "", telefone: "", endereco: "", documento: "",
    data: new Date().toLocaleDateString("pt-BR")
  });

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (calculoAtivado) executarCalculo();
  }, [itens, horas, config, desconto, calculoAtivado]);

  const atualizarCliente = (campo, valor) => setCliente(prev => ({ ...prev, [campo]: valor }));
  const adicionarItem = () => setItens([...itens, { nome: "", valor: "", isServico: false, isSemMO: false }]);
  const removerItem = (i) => setItens(itens.filter((_, index) => index !== i));
  
  const atualizarItem = (i, campo, valor) => {
    const novos = [...itens];
    novos[i][campo] = valor;
    setItens(novos);
  };

  const executarCalculo = () => {
    const totalItensOriginal = itens.reduce((a, i) => a + Number(i.valor || 0), 0);
    if (totalItensOriginal === 0 && !horas) { setResultado([]); return; }

    const valorHoraBase = (config.salarioMensal || 0) / 220;
    const custoMOComAdicional = valorHoraBase * (horas || 0) * (1 + (config.porcentagemHoras || 0) / 100);

    const res = itens.map(item => {
      const valorItem = Number(item.valor || 0);
      const percParticipacao = totalItensOriginal > 0 ? valorItem / totalItensOriginal : 1 / itens.length;
      
      const margem = item.isServico ? 0 : (config.porcentagemItens / 100);
      const valorComMargem = valorItem * (1 + margem);
      
      const mostrarMOnoItem = !config.mostrarMaoObraSeparada && !item.isSemMO;
      const moNoItem = mostrarMOnoItem ? (custoMOComAdicional * percParticipacao) : 0;

      return {
        nome: item.nome || "Item sem nome",
        valorBase: valorComMargem + moNoItem, 
        maoObraIndividual: item.isSemMO ? 0 : (custoMOComAdicional * percParticipacao)
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
      nome: "", veiculo: "", placa: "", telefone: "", endereco: "", documento: "",
      data: new Date().toLocaleDateString("pt-BR")
    });
  };

  const nomesCampos = {
    nome: "Nome do Cliente", veiculo: "Veículo (Modelo)", placa: "Placa",
    telefone: "Telefone / WhatsApp", endereco: "Endereço", documento: "CPF / CNPJ"
  };

  return (
    <div className="app-viewport">
      <div className="main-card">
        <header className="app-header">
          <img src={logo} alt="Logo" className="app-logo" />
          <button className="btn-icon" onClick={() => setMostrarConfig(true)}>⚙️</button>
        </header>

        <section className="section">
          <h3 className="section-title">Informações do Cliente</h3>
          <div className="grid-form">
            {Object.keys(nomesCampos).map(f => (
              <div key={f} className="input-group">
                <label>{f.toUpperCase()}</label>
                <input value={cliente[f]} onChange={(e) => atualizarCliente(f, e.target.value)} placeholder={nomesCampos[f]} />
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
            {itens.map((item, i) => (
              <div key={i} className="item-card">
                <input className="input-flat flex-3" placeholder="Ex: Pastilha de freio..." value={item.nome} onChange={(e) => atualizarItem(i, "nome", e.target.value)} />
                <input className="input-flat flex-1" type="number" placeholder="R$ 0,00" value={item.valor} onChange={(e) => atualizarItem(i, "valor", e.target.value)} />
                <div className="item-actions">
                  <label className={`toggle-chip ${item.isServico ? "active" : ""}`}>
                    <input type="checkbox" checked={item.isServico} onChange={(e) => atualizarItem(i, "isServico", e.target.checked)} /> Sem %
                  </label>
                  <label className={`toggle-chip ${ (config.mostrarMaoObraSeparada || item.isSemMO) ? "active" : "" }`}>
                    <input type="checkbox" checked={config.mostrarMaoObraSeparada ? true : item.isSemMO} disabled={config.mostrarMaoObraSeparada} onChange={(e) => atualizarItem(i, "isSemMO", e.target.checked)} /> Sem MO
                  </label>
                  <button className="btn-delete" onClick={() => removerItem(i)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section row-spread">
          <div className="input-group" style={{ width: "160px" }}>
            <label>TEMPO DE EXECUÇÃO (H)</label>
            <input type="number" placeholder="Total Horas" value={horas || ""} onChange={(e) => setHoras(Number(e.target.value))} />
          </div>
          <button className="btn-discount" onClick={() => setMostrarDesconto(true)}>
            {desconto.porcentagem > 0 ? `💰 ${desconto.porcentagem}% OFF` : "🏷️ Add Desconto"}
          </button>
        </section>

        <section className="action-bar">
          <button className="btn-primary" onClick={calcular}>CALCULAR ORÇAMENTO</button>
          <div className="secondary-btns">
            <button className="btn-outline" onClick={limparTudo}>LIMPAR TUDO</button>
          </div>
        </section>

        {resultado.length > 0 && (
          <div className="resumo-container">
             <Resultado resultado={resultado} cliente={cliente} desconto={desconto} config={config} />
          </div>
        )}
      </div>

      {mostrarConfig && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="section-title" style={{textAlign: 'center', marginBottom: '20px'}}>⚙️ Configurações Base</h3>
            <div className="grid-form">
              <div className="input-group"><label>% LUCRO ITENS</label><input type="number" value={config.porcentagemItens} onChange={e => setConfig({...config, porcentagemItens: Number(e.target.value)})} /></div>
              <div className="input-group"><label>% ADICIONAL MO</label><input type="number" value={config.porcentagemHoras} onChange={e => setConfig({...config, porcentagemHoras: Number(e.target.value)})} /></div>
              <div className="input-group"><label>SALÁRIO BASE</label><input type="number" value={config.salarioMensal} onChange={e => setConfig({...config, salarioMensal: Number(e.target.value)})} /></div>
              <div className="input-group"><label>TAXA MÁQUINA (%)</label><input type="number" value={config.taxaMaquininha} onChange={e => setConfig({...config, taxaMaquininha: Number(e.target.value)})} /></div>
            </div>
            <div className="config-global-item" style={{marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <input type="checkbox" id="moSeparada" checked={config.mostrarMaoObraSeparada} onChange={e => setConfig({...config, mostrarMaoObraSeparada: e.target.checked})} />
              <label htmlFor="moSeparada">Separar Mão de Obra no Resumo</label>
            </div>
            <button className="btn-primary" style={{marginTop: '25px'}} onClick={() => setMostrarConfig(false)}>SALVAR CONFIGURAÇÕES</button>
          </div>
        </div>
      )}

      {mostrarDesconto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="section-title">Aplicar Desconto</h3>
            <div className="input-group">
              <label>VALOR DO DESCONTO (%)</label>
              <input type="number" value={desconto.porcentagem || ""} onChange={e => setDesconto({...desconto, porcentagem: Number(e.target.value)})} />
            </div>
            <div className="input-group" style={{marginTop: '15px'}}>
              <label>MOTIVO</label>
              <input type="text" value={desconto.motivo} onChange={e => setDesconto({...desconto, motivo: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button className="btn-primary" style={{ flex: 2 }} onClick={() => setMostrarDesconto(false)}>APLICAR</button>
                <button className="btn-outline" style={{ flex: 1, borderColor: '#ff4d4d', color: '#ff4d4d' }} onClick={() => { setDesconto({ porcentagem: 0, motivo: "" }); setMostrarDesconto(false); }}>LIMPAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}