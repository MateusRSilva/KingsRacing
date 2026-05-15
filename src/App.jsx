import { useState } from "react";
import "./App.css";
import { HomeScreen } from "./components/HomeScreen";
import { EstoqueScreen } from "./components/EstoqueScreen";
import { OrderScreen } from "./components/OrderScreen";
import { VendasScreen } from "./components/VendasScreen";
import { AgendamentoScreen } from "./components/AgendamentoScreen";

export default function App() {
  const [screen, setScreen] = useState("home");

  return (
    <div className="app-viewport">
      {screen === "home" && <HomeScreen onStart={() => setScreen("ordem")} onExcel={() => setScreen("estoque")} onVendas={() => setScreen("vendas")} onAgendamento={() => setScreen("agendamento")} />}
      {screen === "ordem" && <OrderScreen onBack={() => setScreen("home")} />}
      {screen === "estoque" && (
        <EstoqueScreen onBack={() => setScreen("home")} />
      )}
      {screen === "vendas" && (
        <VendasScreen onBack={() => setScreen("home")} />
      )}
      {screen === "agendamento" && (
        <AgendamentoScreen onBack={() => setScreen("home")} />
      )}
    </div>
  );
}