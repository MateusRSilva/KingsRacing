import logo from "../assets/logo.png";

export function HomeScreen({ onStart, onExcel, onVendas }) {
  return (
    <div className="home-screen">
      <div className="home-card">
        <img src={logo} alt="Logo" className="app-logo" />
        <div className="home-copy">
          <h1>Bem-vindo ao Kings Racing</h1>
          <p>Use esta tela inicial para acessar a ordem de serviço e navegar facilmente entre as áreas do sistema.</p>
        </div>

        <div className="home-actions">
          <button className="btn-primary btn-large" onClick={onStart} style={{ marginBottom: "10px" }}>
            Abrir Ordem de Serviço
          </button>
          <button className="btn-primary btn-large" onClick={onExcel} style={{ marginBottom: "10px" }}>
            Estoque
          </button>
          <button className="btn-primary btn-large" onClick={onVendas}>
            Vendas
          </button>
        </div>

        <div className="home-grid">
          <div className="home-feature">
            <strong>Ordem de Serviço</strong>
            <span>Cadastre peças, serviços e acompanhe o cálculo do orçamento.</span>
          </div>
          <div className="home-feature">
            <strong>Estoque</strong>
            <span>Gere um modelo e leia/edite um arquivo em seguida.</span>
          </div>
          <div className="home-feature">
            <strong>Vendas</strong>
            <span>Visualize e busque produtos do seu estoque para vender.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
