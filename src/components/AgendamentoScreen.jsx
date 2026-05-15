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

  const [agendamentos, setAgendamentos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(AGENDAMENTOS_KEY)) || [];
    } catch { return []; }
  });

  // --- LIMPEZA AUTOMÁTICA (7 DIAS) ---
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

  // --- LÓGICA DO CALENDÁRIO (CORRIGIDA) ---
  const anoAtual = dataVisualizacao.getFullYear();
  const mesAtual = dataVisualizacao.getMonth();

  // Obtém o dia da semana do primeiro dia do mês (0 = Domingo, 1 = Segunda...)
  const primeiroDiaDoMes = new Date(anoAtual, mesAtual, 1).getDay();
  // Obtém o último dia do mês
  const totalDiasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  // Gerar array de dias
  const diasCalendario = [];
  for (let i = 0; i < primeiroDiaDoMes; i++) diasCalendario.push(null);
  for (let i = 1; i <= totalDiasNoMes; i++) diasCalendario.push(i);

  const handleSalvarAgendamento = (e) => {
    e.preventDefault();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataEscolhida = new Date(anoAtual, mesAtual, diaSelecionado);

    if (dataEscolhida < hoje) {
      alert("⚠️ Não é possível agendar em datas passadas.");
      return;
    }

    const novo = {
      id: Date.now(),
      ano: anoAtual, mes: mesAtual, dia: diaSelecionado,
      hora, cliente, veiculo, servico,
      pdf: pdfBase64, pdfNome: pdfNome || "OS.pdf"
    };

    setAgendamentos([...agendamentos, novo]);
    setCliente(""); setVeiculo(""); setServico(""); setPdfBase64(""); setPdfNome("");
    alert("Agendado!");
  };

  const abrirPdf = (base64String) => {
    const novaJanela = window.open();
    novaJanela.document.write(`<iframe src="${base64String}" frameborder="0" style="width:100%; height:100%;"></iframe>`);
  };

  const agendamentosDoMes = agendamentos.filter(a => a.ano === anoAtual && a.mes === mesAtual)
    .sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora));

  return (
    <div className="main-card">
      <header className="app-header">
        <div className="header-left">
          <img src={logo} alt="Logo" className="app-logo" />
          <div>
            <div className="app-subtitle">AGENDAMENTOS</div>
            <div className="app-sm">Calendário sincronizado com dias da semana.</div>
          </div>
        </div>
        <button className="btn-outline" onClick={onBack} style={{ maxWidth: '120px' }}>← Voltar</button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px" }}>
        
        <div className="section" style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "20px", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <button className="btn-icon" onClick={() => setDataVisualizacao(new Date(anoAtual, mesAtual - 1, 1))}>◀</button>
            <span style={{ fontWeight: "800", color: "var(--accent)", letterSpacing: "1px" }}>{nomesMeses[mesAtual].toUpperCase()} {anoAtual}</span>
            <button className="btn-icon" onClick={() => setDataVisualizacao(new Date(anoAtual, mesAtual + 1, 1))}>▶</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "10px", color: "var(--text-dim)", fontWeight: "800", marginBottom: "10px" }}>
            <div>DOM</div><div>SEG</div><div>TER</div><div>QUA</div><div>QUI</div><div>SEX</div><div>SÁB</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
            {diasCalendario.map((dia, index) => {
              if (dia === null) return <div key={`empty-${index}`}></div>;
              
              const hoje = new Date();
              hoje.setHours(0,0,0,0);
              const dataDesteDia = new Date(anoAtual, mesAtual, dia);
              const isPassado = dataDesteDia < hoje;
              const selecionado = dia === diaSelecionado;
              const temAgendamento = agendamentos.some(a => a.ano === anoAtual && a.mes === mesAtual && a.dia === dia);

              return (
                <button
                  key={dia}
                  disabled={isPassado}
                  onClick={() => setDiaSelecionado(dia)}
                  style={{
                    aspectRatio: "1/1",
                    borderRadius: "12px",
                    border: selecionado ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: selecionado ? "var(--accent)" : temAgendamento ? "rgba(0, 210, 255, 0.1)" : "var(--input)",
                    color: selecionado ? "#000" : isPassado ? "var(--text-dim)" : "white",
                    cursor: isPassado ? "not-allowed" : "pointer",
                    opacity: isPassado ? 0.3 : 1,
                    fontWeight: "bold",
                    fontSize: "14px",
                    position: "relative"
                  }}
                >
                  {dia}
                  {temAgendamento && !selecionado && (
                    <div style={{ position: "absolute", bottom: "4px", left: "50%", transform: "translateX(-50%)", width: "4px", height: "4px", borderRadius: "50%", background: "var(--accent)" }}></div>
                  )}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSalvarAgendamento} style={{ marginTop: "25px" }}>
            <div className="section-title">Agendar para: {diaSelecionado}/{mesAtual + 1}</div>
            <div className="grid-form">
              <div className="input-group"><label>HORA</label><input type="time" value={hora} onChange={e => setHora(e.target.value)} required /></div>
              <div className="input-group"><label>VEÍCULO</label><input type="text" value={veiculo} onChange={e => setVeiculo(e.target.value)} required /></div>
            </div>
            <div className="input-group" style={{ marginTop: "10px" }}><label>CLIENTE</label><input type="text" value={cliente} onChange={e => setCliente(e.target.value)} required /></div>
            <div className="input-group" style={{ marginTop: "10px", padding: "15px", background: "rgba(0,210,255,0.05)", borderRadius: "12px", border: "1px dashed var(--accent)" }}>
              <label style={{ color: "var(--accent)" }}>VINCULAR OS (PDF)</label>
              <input type="file" accept=".pdf" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setPdfNome(file.name);
                  const reader = new FileReader();
                  reader.onload = () => setPdfBase64(reader.result);
                  reader.readAsDataURL(file);
                }
              }} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "15px" }}>SALVAR AGENDAMENTO</button>
          </form>
        </div>

        <div>
          <div className="section-title">Agendamentos do Mês</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "600px", overflowY: "auto" }}>
            {agendamentosDoMes.map(ag => (
              <div key={ag.id} className="item-card" style={{ borderLeft: ag.dia === diaSelecionado ? "4px solid var(--accent)" : "1px solid var(--border)" }}>
                <div className="flex-3">
                  <div style={{ fontSize: "11px", fontWeight: "900", color: "var(--accent)" }}>DIA {ag.dia}/{ag.mes + 1} ÀS {ag.hora}</div>
                  <div style={{ fontSize: "15px", fontWeight: "bold" }}>{ag.veiculo}</div>
                  <div className="app-sm">{ag.cliente}</div>
                </div>
                <div className="item-actions">
                  {ag.pdf && <button className="btn-icon" onClick={() => abrirPdf(ag.pdf)}>📄</button>}
                  <button className="btn-icon" onClick={() => setAgendamentos(agendamentos.filter(x => x.id !== ag.id))} style={{ color: "var(--danger)" }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}