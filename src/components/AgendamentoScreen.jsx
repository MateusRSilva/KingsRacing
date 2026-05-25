import { useState, useEffect } from "react";
import logo from "../assets/logo.png";

const AGENDAMENTOS_KEY = "oficina_agendamentos";

export function AgendamentoScreen({ onBack }) {
  const [dataVisualizacao, setDataVisualizacao] = useState(new Date());
  
  const [diaSelecionado, setDiaSelecionado] = useState(new Date().getDate());
  const [diaSaidaSelecionado, setDiaSaidaSelecionado] = useState(new Date().getDate());

  const [horaEntrada, setHoraEntrada] = useState("08:00");
  const [horaSaida, setHoraSaida] = useState("09:00");

  const [cliente, setCliente] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [servico, setServico] = useState("");
  const [pdfBase64, setPdfBase64] = useState("");
  const [pdfNome, setPdfNome] = useState("");

  const [expandidos, setExpandidos] = useState({});

  const [agendamentos, setAgendamentos] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(AGENDAMENTOS_KEY)) || [];
    } catch {
      return [];
    }
  });

  // =========================
  // LIMPEZA AUTOMÁTICA
  // =========================
  useEffect(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const umaSemanaAtras = new Date(hoje);
    umaSemanaAtras.setDate(hoje.getDate() - 7);

    const filtrados = agendamentos.filter((ag) => {
      const dataAgSaida = new Date(ag.anoSaida || ag.ano, ag.mesSaida || ag.mes, ag.diaSaida || ag.dia);
      return dataAgSaida >= umaSemanaAtras;
    });

    if (filtrados.length !== agendamentos.length) {
      setAgendamentos(filtrados);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      AGENDAMENTOS_KEY,
      JSON.stringify(agendamentos)
    );
  }, [agendamentos]);

  const toggleItem = (id) => {
    setExpandidos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // =========================
  // AGRUPAMENTO INTELIGENTE (ESPALHA O CARRO POR TODOS OS DIAS DE OCUPAÇÃO)
  // =========================
  const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const agendamentosAgrupados = agendamentos.reduce((acc, ag) => {
    const [hEntrada, mEntrada] = ag.horaEntrada.split(":").map(Number);
    const [hSaida, mSaida] = ag.horaSaida.split(":").map(Number);

    // Geramos as datas completas de início e fim daquele agendamento
    const dataInicio = new Date(ag.ano, ag.mes, ag.dia, hEntrada, mEntrada, 0, 0);
    const dataFim = new Date(ag.anoSaida || ag.ano, ag.mesSaida || ag.mes, ag.diaSaida || ag.dia, hSaida, mSaida, 0, 0);

    // Vamos rodar dia por dia do período que o carro vai ficar na oficina
    let dataCorrente = new Date(ag.ano, ag.mes, ag.dia, 0, 0, 0, 0);
    const dataLimite = new Date(ag.anoSaida || ag.ano, ag.mesSaida || ag.mes, ag.diaSaida || ag.dia, 0, 0, 0, 0);

    while (dataCorrente <= dataLimite) {
      const anoCorrente = dataCorrente.getFullYear();
      const mesCorrente = dataCorrente.getMonth();
      const diaCorrente = dataCorrente.getDate();

      const chaveMes = `${anoCorrente}-${mesCorrente}`;
      const chaveDia = `${chaveMes}-${diaCorrente}`;

      if (!acc[chaveMes]) {
        acc[chaveMes] = {
          id: chaveMes,
          nome: nomesMeses[mesCorrente],
          ano: anoCorrente,
          dias: {},
        };
      }

      if (!acc[chaveMes].dias[chaveDia]) {
        acc[chaveMes].dias[chaveDia] = {
          id: chaveDia,
          dia: diaCorrente,
          lista: [],
        };
      }

      // Adicionamos o carro no dia atual do loop
      acc[chaveMes].dias[chaveDia].lista.push(ag);

      // Ordena por horário de entrada para ficar organizado
      acc[chaveMes].dias[chaveDia].lista.sort((a, b) =>
        a.horaEntrada.localeCompare(b.horaEntrada)
      );

      // Avança para o próximo dia
      dataCorrente.setDate(dataCorrente.getDate() + 1);
    }

    return acc;
  }, {});

  // =========================
  // LÓGICA DE SELEÇÃO DE DIAS
  // =========================
  const handleCliqueDia = (dia) => {
    if (!diaSelecionado || (diaSelecionado && diaSaidaSelecionado)) {
      setDiaSelecionado(dia);
      setDiaSaidaSelecionado(null);
    } else {
      if (dia < diaSelecionado) {
        setDiaSelecionado(dia);
      } else {
        setDiaSaidaSelecionado(dia);
      }
    }
  };

  // =========================
  // SALVAR AGENDAMENTO
  // =========================
  const handleSalvarAgendamento = (e) => {
    e.preventDefault();

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const ano = dataVisualizacao.getFullYear();
    const mes = dataVisualizacao.getMonth();
    const diaSaidaFinal = diaSaidaSelecionado || diaSelecionado;

    const [hEntrada, mEntrada] = horaEntrada.split(":").map(Number);
    const [hSaida, mSaida] = horaSaida.split(":").map(Number);

    const novaDataEntradaCompleta = new Date(ano, mes, diaSelecionado, hEntrada, mEntrada, 0, 0);
    const novaDataSaidaCompleta = new Date(ano, mes, diaSaidaFinal, hSaida, mSaida, 0, 0);

    if (new Date(ano, mes, diaSelecionado, 0, 0, 0, 0) < hoje) {
      alert("⚠️ Bloqueado: Não é possível realizar agendamentos em dias que já passaram.");
      return;
    }

    if (novaDataSaidaCompleta <= novaDataEntradaCompleta) {
      alert("⚠️ O momento de saída deve ser maior que o momento de entrada.");
      return;
    }

    let limiteExcedido = false;
    const inicioTimestamp = novaDataEntradaCompleta.getTime();
    const fimTimestamp = novaDataSaidaCompleta.getTime();

    const agendamentosAtivos = agendamentos.map(ag => {
      const [agHE, agME] = ag.horaEntrada.split(":").map(Number);
      const [agHS, agMS] = ag.horaSaida.split(":").map(Number);
      
      return {
        id: ag.id,
        inicio: new Date(ag.ano, ag.mes, ag.dia, agHE, agME, 0, 0).getTime(),
        fim: new Date(ag.anoSaida || ag.ano, ag.mesSaida || ag.mes, ag.diaSaida || ag.dia, agHS, agMS, 0, 0).getTime()
      };
    });

    const pontosDeChecagem = new Set([inicioTimestamp, fimTimestamp]);
    agendamentosAtivos.forEach(ag => {
      if (ag.inicio >= inicioTimestamp && ag.inicio <= fimTimestamp) pontosDeChecagem.add(ag.inicio);
      if (ag.fim >= inicioTimestamp && ag.fim <= fimTimestamp) pontosDeChecagem.add(ag.fim);
    });

    for (let timestamp of pontosDeChecagem) {
      const instanteDeTeste = timestamp === fimTimestamp ? timestamp - 1 : timestamp;

      if (instanteDeTeste >= inicioTimestamp && instanteDeTeste < fimTimestamp) {
        const carrosSobrepostos = agendamentosAtivos.filter(ag => {
          return instanteDeTeste >= ag.inicio && instanteDeTeste < ag.fim;
        });

        if (carrosSobrepostos.length >= 3) {
          limiteExcedido = true;
          break;
        }
      }
    }

    if (limiteExcedido) {
      alert("⚠️ Não há vagas! Já existem 3 veículos ocupando a oficina em partes deste período selecionado.");
      return;
    }

    const novo = {
      id: Date.now(),
      ano,
      mes,
      dia: diaSelecionado,
      
      anoSaida: ano,
      mesSaida: mes,
      diaSaida: diaSaidaFinal,

      horaEntrada,
      horaSaida,
      cliente,
      veiculo,
      servico,
      pdf: pdfBase64,
      pdfNome: pdfNome || "OS.pdf",
    };

    setAgendamentos([...agendamentos, novo]);

    setCliente("");
    setVeiculo("");
    setServico("");
    setHoraEntrada("08:00");
    setHoraSaida("09:00");
    setPdfBase64("");
    setPdfNome("");

    alert("Agendamento salvo com sucesso!");
  };

  // =========================
  // ABRIR PDF
  // =========================
  const abrirPdf = (base64String) => {
    try {
      const base64SemPrefixo = base64String.split(",")[1] || base64String;
      const byteCharacters = atob(base64SemPrefixo);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      alert("Erro ao abrir PDF.");
    }
  };

  // =========================
  // CALENDÁRIO
  // =========================
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
            <div className="app-sm">Máximo de 3 veículos simultâneos por horário da oficina.</div>
          </div>
        </div>
        <button className="btn-outline" onClick={onBack} style={{ maxWidth: "120px" }}>
          ← Voltar
        </button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px" }}>
        
        {/* COLUNA ESQUERDA */}
        <div className="section" style={{ background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "20px", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <button className="btn-icon" onClick={() => setDataVisualizacao(new Date(anoAtual, mesAtual - 1, 1))}>◀</button>
            <span style={{ fontWeight: "800", color: "var(--accent)" }}>
              {nomesMeses[mesAtual].toUpperCase()} {anoAtual}
            </span>
            <button className="btn-icon" onClick={() => setDataVisualizacao(new Date(anoAtual, mesAtual + 1, 1))}>▶</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
            {diasCalendario.map((dia, i) => {
              if (dia === null) return <div key={i}></div>;

              const hoje = new Date();
              hoje.setHours(0, 0, 0, 0);
              const dataDesteDia = new Date(anoAtual, mesAtual, dia);
              const isPassado = dataDesteDia < hoje;

              const isEntrada = dia === diaSelecionado;
              const isSaida = dia === diaSaidaSelecionado;
              const noIntervalo = dia > diaSelecionado && dia < diaSaidaSelecionado;

              const tem = agendamentos.some((a) => {
                const inicioAg = new Date(a.ano, a.mes, a.dia).getTime();
                const fimAg = new Date(a.anoSaida || a.ano, a.mesSaida || a.mes, a.diaSaida || a.dia).getTime();
                const atualTime = dataDesteDia.getTime();
                return atualTime >= inicioAg && atualTime <= fimAg;
              });

              return (
                <button
                  key={dia}
                  disabled={isPassado}
                  type="button"
                  onClick={() => handleCliqueDia(dia)}
                  style={{
                    aspectRatio: "1/1",
                    borderRadius: "12px",
                    border: (isEntrada || isSaida) ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: (isEntrada || isSaida)
                      ? "var(--accent)"
                      : noIntervalo
                      ? "rgba(0, 210, 255, 0.3)"
                      : tem
                      ? "rgba(0, 210, 255, 0.1)"
                      : "var(--input)",
                    color: (isEntrada || isSaida) ? "#000" : isPassado ? "var(--text-dim)" : "white",
                    cursor: isPassado ? "not-allowed" : "pointer",
                    opacity: isPassado ? 0.3 : 1,
                    fontWeight: "bold",
                  }}
                >
                  {dia}
                </button>
              );
            })}
          </div>

          {/* FORMULÁRIO */}
          <form onSubmit={handleSalvarAgendamento} style={{ marginTop: "25px" }}>
            <div style={{ fontSize: "11px", marginBottom: "15px", color: "var(--text-dim)" }}>
              📅 <b>Entrada:</b> {diaSelecionado ? `Dia ${diaSelecionado}` : "Selecione"} | 
              <b> Saída:</b> {diaSaidaSelecionado ? `Dia ${diaSaidaSelecionado}` : diaSelecionado ? `Dia ${diaSelecionado}` : "Selecione"}
            </div>

            <div className="grid-form">
              <div className="input-group">
                <label>ENTRADA</label>
                <input type="time" value={horaEntrada} onChange={(e) => setHoraEntrada(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>SAÍDA</label>
                <input type="time" value={horaSaida} onChange={(e) => setHoraSaida(e.target.value)} required />
              </div>
            </div>

            <div className="input-group" style={{ marginTop: "10px" }}>
              <label>VEÍCULO</label>
              <input type="text" value={veiculo} onChange={(e) => setVeiculo(e.target.value)} required />
            </div>

            <div className="input-group" style={{ marginTop: "10px" }}>
              <label>CLIENTE</label>
              <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} required />
            </div>

            <div className="input-group" style={{ marginTop: "10px", padding: "10px", border: "1px dashed var(--accent)", borderRadius: "10px" }}>
              <label style={{ fontSize: "10px", color: "var(--accent)" }}>ANEXAR OS (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) {
                    setPdfNome(f.name);
                    const r = new FileReader();
                    r.onload = () => setPdfBase64(r.result);
                    r.readAsDataURL(f);
                  }
                }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "15px" }}>
              SALVAR AGENDAMENTO
            </button>
          </form>
        </div>

        {/* COLUNA DIREITA */}
        <div className="scroll-container" style={{ maxHeight: "750px", overflowY: "auto", paddingRight: "10px" }}>
          <div className="section-title">Cronograma de Serviços</div>

          {Object.keys(agendamentosAgrupados).length === 0 ? (
            <div className="app-sm" style={{ textAlign: "center", padding: "20px" }}>Sem serviços agendados.</div>
          ) : (
            Object.keys(agendamentosAgrupados).sort().map((chaveMes) => {
              const mesObj = agendamentosAgrupados[chaveMes];
              const mesAberto = expandidos[chaveMes] !== false;

              return (
                <div key={chaveMes} className="month-group">
                  <div className="month-header" onClick={() => toggleItem(chaveMes)}>
                    <span>{mesObj.nome.toUpperCase()} {mesObj.ano}</span>
                    <span className={`arrow-icon ${mesAberto ? "rotated" : ""}`}>▼</span>
                  </div>

                  <div className={`collapsible-wrapper ${mesAberto ? "is-open" : ""}`}>
                    <div className="collapsible-content">
                      <div style={{ padding: "12px" }}>
                        {Object.keys(mesObj.dias).sort((a, b) => Number(a.split("-")[2]) - Number(b.split("-")[2])).map((chaveDia) => {
                          const diaObj = mesObj.dias[chaveDia];
                          const diaAberto = expandidos[chaveDia] !== false;

                          return (
                            <div key={chaveDia} className="day-group">
                              <div className="day-header" onClick={() => toggleItem(chaveDia)}>
                                <span>📅 Dia {diaObj.dia} <small style={{ color: "var(--text-dim)", marginLeft: "8px" }}>({diaObj.lista.length} ativos)</small></span>
                                <span className={`arrow-icon ${diaAberto ? "rotated" : ""}`} style={{ fontSize: "10px" }}>▼</span>
                              </div>

                              <div className={`collapsible-wrapper ${diaAberto ? "is-open" : ""}`}>
                                <div className="collapsible-content">
                                  <div style={{ padding: "10px" }}>
                                    {diaObj.lista.map((ag) => (
                                      <div key={`${ag.id}-${diaObj.dia}`} className="service-item">
                                        <div style={{ flex: 1 }}>
                                          <div style={{ color: "var(--accent)", fontWeight: "bold", fontSize: "12px" }}>
                                            {ag.horaEntrada} às {ag.horaSaida}{" "}
                                            {/* Informa o período total se for multi-dias */}
                                            {(ag.diaSaida && ag.diaSaida !== ag.dia) && `(Período: Dia ${ag.dia} ao ${ag.diaSaida})`}{" "}
                                            - {ag.veiculo}
                                          </div>
                                          <div className="app-sm" style={{ fontSize: "11px" }}>{ag.cliente}</div>
                                        </div>

                                        <div style={{ display: "flex", gap: "8px" }}>
                                          {ag.pdf && (
                                            <button onClick={() => abrirPdf(ag.pdf)} className="btn-icon">📄</button>
                                          )}
                                          <button
                                            onClick={() => setAgendamentos(agendamentos.filter((x) => x.id !== ag.id))}
                                            className="btn-icon"
                                            style={{ color: "var(--danger)" }}
                                          >
                                            ✕
                                          </button>
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