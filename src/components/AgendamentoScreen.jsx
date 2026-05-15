import { useState, useEffect } from "react";
import logo from "../assets/logo.png";

const AGENDAMENTOS_KEY = "oficina_agendamentos";

export function AgendamentoScreen({ onBack }) {
  const [dataAtual, setDataAtual] = useState(new Date());
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
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(AGENDAMENTOS_KEY, JSON.stringify(agendamentos));
  }, [agendamentos]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfNome(file.name);
      const reader = new FileReader();
      reader.onload = () => setPdfBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSalvarAgendamento = (e) => {
    e.preventDefault();
    const novoAgendamento = {
      id: Date.now(),
      ano: dataAtual.getFullYear(),
      mes: dataAtual.getMonth(),
      dia: diaSelecionado,
      hora, cliente, veiculo, servico,
      pdf: pdfBase64,
      pdfNome: pdfNome || "Ordem_de_Servico.pdf"
    };
    setAgendamentos([...agendamentos, novoAgendamento]);
    setCliente(""); setVeiculo(""); setServico(""); setPdfBase64(""); setPdfNome("");
    alert("Agendamento salvo!");
  };

  const abrirPdf = (base64String) => {
    const novaJanela = window.open();
    novaJanela.document.write(`<iframe src="${base64String}" frameborder="0" style="width:100%; height:100%;"></iframe>`);
  };

  const anoAtual = dataAtual.getFullYear();
  const mesAtual = dataAtual.getMonth();
  const primeiroDiaDoMes = new Date(anoAtual, mesAtual, 1).getDay();
  const totalDiasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const diasCalendario = [];
  for (let i = 0; i < primeiroDiaDoMes; i++) diasCalendario.push(null);
  for (let i = 1; i <= totalDiasNoMes; i++) diasCalendario.push(i);

  const agendamentosDoMes = agendamentos.filter(a => a.ano === anoAtual && a.mes === mesAtual)
    .sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora));

  return (
    <div className="main-card">
      <header className="app-header">
        <div className="header-left">
          <img src={logo} alt="Logo" className="app-logo" />
          <div>
            <div className="app-subtitle">AGENDAMENTOS</div>
            <div className="app-sm">Gerencie horários e documentos PDF.</div>
          </div>
        </div>
        <button className="btn-outline" onClick={onBack} style={{ maxWidth: '120px' }}>← Voltar</button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px" }}>
        
        {/* COLUNA 1: CALENDÁRIO DARK */}
        <div className="section" style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "20px", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <button className="btn-icon" onClick={() => setDataAtual(new Date(anoAtual, mesAtual - 1, 1))}>◀</button>
            <span style={{ fontWeight: "800", color: "var(--accent)", letterSpacing: "1px" }}>{nomesMeses[mesAtual].toUpperCase()} {anoAtual}</span>
            <button className="btn-icon" onClick={() => setDataAtual(new Date(anoAtual, mesAtual + 1, 1))}>▶</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "10px", color: "var(--text-dim)", fontWeight: "800", marginBottom: "10px" }}>
            <div>DOM</div><div>SEG</div><div>TER</div><div>QUA</div><div>QUI</div><div>SEX</div><div>SÁB</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
            {diasCalendario.map((dia, index) => {
              if (dia === null) return <div key={index}></div>;
              const temAgendamento = agendamentos.some(a => a.ano === anoAtual && a.mes === mesAtual && a.dia === dia);
              const selecionado = dia === diaSelecionado;

              return (
                <button
                  key={dia}
                  onClick={() => setDiaSelecionado(dia)}
                  style={{
                    aspectRatio: "1/1",
                    borderRadius: "12px",
                    border: selecionado ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: selecionado ? "var(--accent)" : temAgendamento ? "rgba(0, 210, 255, 0.1)" : "var(--input)",
                    color: selecionado ? "#000" : temAgendamento ? "var(--accent)" : "white",
                    cursor: "pointer",
                    fontWeight: "bold",
                    transition: "var(--transition)",
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
            <div className="section-title" style={{ marginBottom: "10px" }}>Novo para dia {diaSelecionado}</div>
            <div className="grid-form">
              <div className="input-group">
                <label>HORA</label>
                <input type="time" value={hora} onChange={e => setHora(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>VEÍCULO</label>
                <input type="text" value={veiculo} onChange={e => setVeiculo(e.target.value)} required />
              </div>
            </div>
            <div className="input-group" style={{ marginTop: "10px" }}>
              <label>CLIENTE</label>
              <input type="text" value={cliente} onChange={e => setCliente(e.target.value)} required />
            </div>
            <div className="input-group" style={{ marginTop: "10px", padding: "15px", background: "rgba(0,210,255,0.05)", borderRadius: "12px", border: "1px dashed var(--accent)" }}>
              <label style={{ color: "var(--accent)" }}>IMPORTAR OS (PDF)</label>
              <input type="file" accept=".pdf" onChange={handleFileChange} style={{ border: "none", background: "none", padding: "5px 0" }} />
              {pdfNome && <div style={{ fontSize: "10px", color: "var(--success)" }}>✓ {pdfNome}</div>}
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "15px" }}>AGENDAR SERVIÇO</button>
          </form>
        </div>

        {/* COLUNA 2: LISTA DE AGENDAMENTOS */}
        <div>
          <div className="section-title">Serviços do Mês</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "600px", overflowY: "auto", paddingRight: "5px" }}>
            {agendamentosDoMes.length === 0 ? (
              <div className="app-sm" style={{ textAlign: "center", padding: "40px" }}>Nenhum serviço este mês.</div>
            ) : (
              agendamentosDoMes.map(ag => (
                <div key={ag.id} className="item-card" style={{ borderLeft: ag.dia === diaSelecionado ? "4px solid var(--accent)" : "1px solid var(--border)" }}>
                  <div className="flex-3">
                    <div style={{ fontSize: "11px", fontWeight: "900", color: "var(--accent)" }}>DIA {ag.dia} ÀS {ag.hora}</div>
                    <div style={{ fontSize: "15px", fontWeight: "bold", margin: "4px 0" }}>{ag.veiculo}</div>
                    <div className="app-sm">{ag.cliente}</div>
                  </div>
                  <div className="item-actions">
                    {ag.pdf && (
                      <button className="btn-icon" onClick={() => abrirPdf(ag.pdf)} title="Ver PDF">📄</button>
                    )}
                    <button className="btn-icon" onClick={() => {
                       if(confirm("Excluir?")) setAgendamentos(agendamentos.filter(x => x.id !== ag.id))
                    }} style={{ color: "var(--danger)" }}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}