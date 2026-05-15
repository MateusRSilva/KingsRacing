import logo from "../assets/logo.png";

export function HomeScreen({
  onStart,
  onExcel,
  onVendas,
  onAgendamento,
}) {
  return (
    <div className="home-screen">
      <div className="home-card">
        <img
          src={logo}
          alt="Logo"
          className="app-logo"
        />

        <div className="home-copy">
          <h1>Bem-vindo ao Kings Racing</h1>

          <p>
            Use esta tela inicial para acessar rapidamente
            todas as áreas do sistema da oficina.
          </p>
        </div>

        <div className="home-actions">
          <button
            className="btn-primary btn-large"
            onClick={onStart}
            style={{ marginBottom: "12px" }}
          >
            Abrir Ordem de Serviço
          </button>

          <button
            className="btn-primary btn-large"
            onClick={onExcel}
            style={{ marginBottom: "12px" }}
          >
            Estoque
          </button>

          <button
            className="btn-primary btn-large"
            onClick={onVendas}
            style={{ marginBottom: "12px" }}
          >
            Vendas
          </button>

          <button
            className="btn-primary btn-large"
            onClick={onAgendamento}
          >
            Agendamentos
          </button>
        </div>

        <div className="home-grid">
          <div className="home-feature">
            <strong>Ordem de Serviço</strong>

            <span>
              Cadastre peças, serviços e acompanhe o
              orçamento completo.
            </span>
          </div>

          <div className="home-feature">
            <strong>Estoque</strong>

            <span>
              Gerencie produtos, atualize quantidades e
              edite arquivos.
            </span>
          </div>

          <div className="home-feature">
            <strong>Vendas</strong>

            <span>
              Busque produtos rapidamente e registre vendas
              do estoque.
            </span>
          </div>

          <div className="home-feature">
            <strong>Agendamentos</strong>

            <span>
              Organize horários, serviços e atendimentos
              da oficina.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}