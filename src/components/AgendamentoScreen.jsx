import { useState, useEffect } from "react";
import logo from "../assets/logo.png";

const AGENDAMENTOS_KEY = "oficina_agendamentos";

export function AgendamentoScreen({ onBack }) {
  const [dataVisualizacao, setDataVisualizacao] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState(new Date().getDate());
  const [hora, setHora] = useState("08:00");
  const [cliente, setCliente] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [servico, setServico] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [pdfNome, setPdfNome] = useState("");

  const [expandidos, setExpandidos] = useState({});

  const [agendamentos, setAgendamentos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(AGENDAMENTOS_KEY)) || [];
    } catch { return []; }
  });

  // --- REGRA: LIMPEZA AUTOMÁTICA (Remove agendamentos com mais de 7 dias de atraso) ---
  useEffect(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const umaSemanaAtras = new Date(hoje);
    umaSemanaAtras.setDate(hoje.getDate() - 7);

    const filtrados = agendamentos.filter(ag => {
      const dataAg = new Date(ag.ano, ag.mes, ag.dia);
      return dataAg >= umaSemanaAtras;
    });
    
    if (filtrados.length !== agendamentos.length) setAgendamentos(filtrados);
  }, []);

  useEffect(() => {
    localStorage.setItem(AGENDAMENTOS_KEY, JSON.stringify(agendamentos));
  }, [agendamentos]);

  const toggleItem = (id) => {
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- LÓGICA DE AGRUPAMENTO E ORDENAÇÃO POR HORA ---
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const agendamentosAgrupados = agendamentos.reduce((acc, ag) => {
    const chaveMes = `${ag.ano}-${ag.mes}`;
    const chaveDia = `${chaveMes}-${ag.dia}`;
    if (!acc[chaveMes]) acc[chaveMes] = { id: chaveMes, nome: nomesMeses[ag.mes], ano: ag.ano, dias: {} };
    if (!acc[chaveMes].dias[chaveDia]) acc[chaveMes].dias[chaveDia] = { id: chaveDia, dia: ag.dia, lista: [] };
    acc[chaveMes].dias[chaveDia].lista.push(ag);
    acc[chaveMes].dias[chaveDia].lista.sort((a, b) => a.hora.localeCompare(b.hora));
    return acc;
  }, {});

  const handleSalvarAgendamento = (e) => {
    e.preventDefault();
    
    // --- REGRA: NÃO SALVAR DATAS PASSADAS ---
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera hora para comparar apenas o dia
    
    const dataEscolhida = new Date(dataVisualizacao.getFullYear(), dataVisualizacao.getMonth(), diaSelecionado);
    dataEscolhida.setHours(0, 0, 0, 0);

    if (dataEscolhida < hoje) {
      alert("⚠️ Bloqueado: Não é possível realizar agendamentos em dias que já passaram.");
      return;
    }

    const novo = {
      id: Date.now(),
      ano: dataVisualizacao.getFullYear(),
      mes: dataVisualizacao.getMonth(),
      dia: diaSelecionado,
      hora, cliente, veiculo, servico,
      pdf: pdfBase64, pdfNome: pdfNome || "OS.pdf"
    };

    setAgendamentos([...agendamentos, novo]);
    setCliente(""); setVeiculo(""); setServico(""); setPdfBase64(""); setPdfNome("");
    alert("Agendamento salvo!");
  };

  const abrirPdf = (base64String) => {
    try {
      const base64SemPrefixo = base64String.split(',')[1] || base64String;
      const byteCharacters = atob(base64SemPrefixo);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) { alert("Erro ao abrir PDF."); }
  };

  const anoAtual = dataVisualizacao.getFullYear();
  const mesAtual = dataVisualizacao.getMonth();
  const primeiroDiaDoMes = new Date(anoAtual, mesAtual, 1).getDay();
  const totalDiasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

  const diasCalendario = [];
  for (let i = 0; i < primeiroDiaDoMes; i++) diasCalendario.push(null);
  for (let i = 1; i <= totalDiasNoMes; i++) diasCalendario.push(i);

  return (
    <div className="main-card">
      <header className="app-header">
        <div className="header-left">
          <img src={logo} alt="Logo" className="app-logo" />
          <div>
            <div className="app-subtitle">AGENDAMENTOS</div>
            <div className="app-sm">Regras de bloqueio de data retroativa ativas.</div>
          </div>
        </div>
        <button className="btn-outline" onClick={onBack} style={{ maxWidth: '120px' }}>← Voltar</button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px" }}>

        {/* COLUNA ESQUERDA: CALENDÁRIO E CADASTRO */}
        <div className="section" style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "20px", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <button className="btn-icon" onClick={() => setDataVisualizacao(new Date(anoAtual, mesAtual - 1, 1))}>◀</button>
            <span style={{ fontWeight: "800", color: "var(--accent)" }}>{nomesMeses[mesAtual].toUpperCase()} {anoAtual}</span>
            <button className="btn-icon" onClick={() => setDataVisualizacao(new Date(anoAtual, mesAtual + 1, 1))}>▶</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
            {diasCalendario.map((dia, i) => {
              if (dia === null) return <div key={i}></div>;
              
              const hoje = new Date(); hoje.setHours(0,0,0,0);
              const dataDesteDia = new Date(anoAtual, mesAtual, dia);
              const isPassado = dataDesteDia < hoje;
              const sel = dia === diaSelecionado;
              const tem = agendamentos.some(a => a.ano === anoAtual && a.mes === mesAtual && a.dia === dia);

              return (
                <button 
                  key={dia} 
                  disabled={isPassado}
                  onClick={() => setDiaSelecionado(dia)} 
                  style={{
                    aspectRatio: "1/1", borderRadius: "12px", 
                    border: sel ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: sel ? "var(--accent)" : tem ? "rgba(0, 210, 255, 0.1)" : "var(--input)",
                    color: sel ? "#000" : isPassado ? "var(--text-dim)" : "white", 
                    cursor: isPassado ? "not-allowed" : "pointer", 
                    opacity: isPassado ? 0.3 : 1,
                    fontWeight: "bold"
                  }}
                >
                  {dia}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSalvarAgendamento} style={{ marginTop: "25px" }}>
            <div className="grid-form">
              <div className="input-group"><label>HORA</label><input type="time" value={hora} onChange={e => setHora(e.target.value)} required /></div>
              <div className="input-group"><label>VEÍCULO</label><input type="text" value={veiculo} onChange={e => setVeiculo(e.target.value)} required /></div>
            </div>
            <div className="input-group" style={{ marginTop: "10px" }}><label>CLIENTE</label><input type="text" value={cliente} onChange={e => setCliente(e.target.value)} required /></div>
            <div className="input-group" style={{ marginTop: "10px", padding: "10px", border: "1px dashed var(--accent)", borderRadius: "10px" }}>
              <label style={{ fontSize: "10px", color: "var(--accent)" }}>ANEXAR OS (PDF)</label>
              <input type="file" accept=".pdf" onChange={(e) => {
                const f = e.target.files[0];
                if (f) { setPdfNome(f.name); const r = new FileReader(); r.onload = () => setPdfBase64(r.result); r.readAsDataURL(f); }
              }} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "15px" }}>SALVAR AGENDAMENTO</button>
          </form>
        </div>

        {/* COLUNA DIREITA: CRONOGRAMA RECOLHÍVEL */}
        <div className="scroll-container" style={{ maxHeight: "750px", overflowY: "auto", paddingRight: "10px" }}>
          <div className="section-title">Cronograma de Serviços</div>

          {Object.keys(agendamentosAgrupados).length === 0 ? (
            <div className="app-sm" style={{ textAlign: "center", padding: "20px" }}>Sem serviços agendados.</div>
          ) : (
            Object.keys(agendamentosAgrupados).sort().map(chaveMes => {
              const mesObj = agendamentosAgrupados[chaveMes];
              const mesAberto = expandidos[chaveMes] !== false;

              return (
                <div key={chaveMes} className="month-group">
                  <div className="month-header" onClick={() => toggleItem(chaveMes)}>
                    <span>{mesObj.nome.toUpperCase()} {mesObj.ano}</span>
                    <span className={`arrow-icon ${mesAberto ? 'rotated' : ''}`}>▼</span>
                  </div>

                  <div className={`collapsible-wrapper ${mesAberto ? 'is-open' : ''}`}>
                    <div className="collapsible-content">
                      <div style={{ padding: "12px" }}>
                        {Object.keys(mesObj.dias).sort((a, b) => a.localeCompare(b)).map(chaveDia => {
                          const diaObj = mesObj.dias[chaveDia];
                          const diaAberto = expandidos[chaveDia] !== false;

                          return (
                            <div key={chaveDia} className="day-group">
                              <div className="day-header" onClick={() => toggleItem(chaveDia)}>
                                <span>📅 Dia {diaObj.dia} <small style={{ color: 'var(--text-dim)', marginLeft: '8px' }}>({diaObj.lista.length})</small></span>
                                <span className={`arrow-icon ${diaAberto ? 'rotated' : ''}`} style={{ fontSize: '10px' }}>▼</span>
                              </div>

                              <div className={`collapsible-wrapper ${diaAberto ? 'is-open' : ''}`}>
                                <div className="collapsible-content">
                                  <div style={{ padding: "10px" }}>
                                    {diaObj.lista.map(ag => (
                                      <div key={ag.id} className="service-item">
                                        <div style={{ flex: 1 }}>
                                          <div style={{ color: "var(--accent)", fontWeight: "bold", fontSize: "12px" }}>{ag.hora} - {ag.veiculo}</div>
                                          <div className="app-sm" style={{ fontSize: "11px" }}>{ag.cliente}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                          {ag.pdf && <button onClick={() => abrirPdf(ag.pdf)} className="btn-icon">📄</button>}
                                          <button onClick={() => setAgendamentos(agendamentos.filter(x => x.id !== ag.id))} className="btn-icon" style={{ color: "var(--danger)" }}>✕</button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}