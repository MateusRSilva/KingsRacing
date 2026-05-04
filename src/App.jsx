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

  // 🔥 LIMPAR TUDO
  function limparTudo() {
    if (!window.confirm("Tem certeza que deseja limpar tudo?")) return;

    setItens([{ nome: "", valor: "" }]);
    setResultado([]);
    setHoras(0);

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
      {/* LOGO */}
      <img src={logo} alt="logo" className="logo" />

      <button onClick={() => setMostrarConfig(true)}>⚙️ Configurar</button>

      {mostrarConfig && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Configurações</h3>

            <label>Porcentagem sobre os itens (%)</label>
            <input
              type="number"
              value={config.porcentagemItens}
              onChange={(e) =>
                setConfig({ ...config, porcentagemItens: Number(e.target.value) })
              }
            />

            <label>Porcentagem sobre a mão de obra (%)</label>
            <input
              type="number"
              value={config.porcentagemHoras}
              onChange={(e) =>
                setConfig({ ...config, porcentagemHoras: Number(e.target.value) })
              }
            />

            <label>Salário mensal (R$)</label>
            <input
              type="number"
              value={config.salarioMensal}
              onChange={(e) =>
                setConfig({ ...config, salarioMensal: Number(e.target.value) })
              }
            />

            <button onClick={() => setMostrarConfig(false)}>
              Salvar e fechar
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

      <button onClick={adicionarItem}>+ Item</button>

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

      <Resultado resultado={resultado} cliente={cliente} />
    </div>
  );
}