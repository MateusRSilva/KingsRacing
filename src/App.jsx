import { useState, useEffect } from "react";
import "./App.css";
import { Resultado } from "./Resultado";
import logo from "./assets/logo.png";

const CONFIG_KEY = "simulador_config";

function carregarConfig() {
  try {
    const salva = JSON.parse(localStorage.getItem(CONFIG_KEY));
    return {
      porcentagemItens: salva?.porcentagemItens ?? 50,
      porcentagemHoras: salva?.porcentagemHoras ?? 50,
      salarioMensal: salva?.salarioMensal ?? 3000
    };
  } catch {
    return {
      porcentagemItens: 50,
      porcentagemHoras: 50,
      salarioMensal: 3000
    };
  }
}

export default function App() {
  const [itens, setItens] = useState([{ nome: "", valor: "" }]);
  const [resultado, setResultado] = useState([]);
  const [horas, setHoras] = useState(0);

  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [mostrarDesconto, setMostrarDesconto] = useState(false);

  const [desconto, setDesconto] = useState({
    porcentagem: 0,
    motivo: ""
  });

  const [config, setConfig] = useState(carregarConfig);

  const [cliente, setCliente] = useState({
    nome: "",
    veiculo: "",
    placa: "",
    telefone: "",
    endereco: "",
    documento: "",
    data: new Date().toLocaleDateString("pt-BR")
  });

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  function atualizarCliente(campo, valor) {
    setCliente(prev => ({ ...prev, [campo]: valor }));
  }

  function adicionarItem() {
    setItens([...itens, { nome: "", valor: "" }]);
  }

  function removerItem(i) {
    setItens(itens.filter((_, index) => index !== i));
  }

  function atualizarItem(i, campo, valor) {
    const novos = [...itens];
    novos[i][campo] = valor;
    setItens(novos);
  }

  function calcular() {
    const itensNum = itens.map(i => ({
      nome: i.nome,
      valor: Number(i.valor)
    }));

    const totalItens = itensNum.reduce((a, i) => a + i.valor, 0);
    if (!totalItens || !horas) return;

    const valorHora = (config.salarioMensal || 0) / 220;
    const custo = valorHora * horas * (1 + config.porcentagemHoras / 100);

    const res = itensNum.map(item => {
      const perc = item.valor / totalItens;

      const valorFinal =
        item.valor * (1 + config.porcentagemItens / 100) +
        custo * perc;

      return { nome: item.nome, valorFinal };
    });

    setResultado(res);
  }

  function limparTudo() {
    if (!window.confirm("Tem certeza que deseja limpar tudo?")) return;

    setItens([{ nome: "", valor: "" }]);
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
      data: new Date().toLocaleDateString("pt-BR")
    });
  }

  return (
    <div className="container">
      <img src={logo} alt="logo" className="logo" />

      {/* BOTÃO CONFIG */}
      <button onClick={() => setMostrarConfig(true)}>
        ⚙️ Configurar
      </button>

      {/* MODAL CONFIG */}
      {mostrarConfig && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Configurações</h3>

            <label>% Itens</label>
            <input
              type="number"
              value={config.porcentagemItens}
              onChange={(e) =>
                setConfig({ ...config, porcentagemItens: Number(e.target.value) })
              }
            />

            <label>% Mão de obra</label>
            <input
              type="number"
              value={config.porcentagemHoras}
              onChange={(e) =>
                setConfig({ ...config, porcentagemHoras: Number(e.target.value) })
              }
            />

            <label>Salário mensal</label>
            <input
              type="number"
              value={config.salarioMensal}
              onChange={(e) =>
                setConfig({ ...config, salarioMensal: Number(e.target.value) })
              }
            />

            <button onClick={() => setMostrarConfig(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DESCONTO */}
      {mostrarDesconto && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Desconto (%)</h3>

            <input
              type="number"
              placeholder="Ex: 10"
              value={desconto.porcentagem}
              onChange={(e) =>
                setDesconto({
                  ...desconto,
                  porcentagem: Number(e.target.value)
                })
              }
            />

            <input
              type="text"
              placeholder="Motivo"
              value={desconto.motivo}
              onChange={(e) =>
                setDesconto({
                  ...desconto,
                  motivo: e.target.value
                })
              }
            />

            <button onClick={() => setMostrarDesconto(false)}>
              Salvar
            </button>
          </div>
        </div>
      )}

      <h3>Cliente</h3>

      {["nome","veiculo","placa","telefone","endereco","documento"].map(c => (
        <input
          key={c}
          placeholder={c}
          value={cliente[c]}
          onChange={(e) => atualizarCliente(c, e.target.value)}
        />
      ))}

      <p>Data: {cliente.data}</p>

      <h3>Itens</h3>

      {itens.map((item, i) => (
        <div key={i} className="item-row">
          <input
            placeholder="Nome"
            value={item.nome}
            onChange={(e) => atualizarItem(i, "nome", e.target.value)}
          />
          <input
            type="number"
            placeholder="Valor"
            value={item.valor}
            onChange={(e) => atualizarItem(i, "valor", e.target.value)}
          />
          <button className="remove-btn" onClick={() => removerItem(i)}>X</button>
        </div>
      ))}

      {/* 🔥 BOTÕES LADO A LADO COM ESPAÇO */}
      <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
        <button onClick={adicionarItem}>+ Item</button>
        <button onClick={() => setMostrarDesconto(true)}>
          💸 Desconto
        </button>
      </div>

      <h3>Horas</h3>
      <input
        type="number"
        value={horas}
        onChange={(e) => setHoras(Number(e.target.value))}
      />

      <br /><br />

      <button onClick={calcular}>Calcular</button>
      <button onClick={limparTudo} className="btn-clear">
        🧹 Limpar tudo
      </button>

      <Resultado
        resultado={resultado}
        cliente={cliente}
        desconto={desconto}
      />
    </div>
  );
}