import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BlockchainProvider } from "./context/BlockchainContext";
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard";
import { LiveMonitoring } from "./pages/LiveMonitoring";
import { Transactions } from "./pages/Transactions";
import { TransactionDetails } from "./pages/TransactionDetails";
import { WalletIntelligence } from "./pages/WalletIntelligence";
import { RiskAnalytics } from "./pages/RiskAnalytics";
import { TransactionGraph } from "./pages/TransactionGraph";
import { Alerts } from "./pages/Alerts";
import { Investigations } from "./pages/Investigations";
import { Cases } from "./pages/Cases";
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";

function App() {
  return (
    <BlockchainProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/live" element={<LiveMonitoring />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/tx/:hash" element={<TransactionDetails />} />
            <Route path="/wallets" element={<WalletIntelligence />} />
            <Route path="/risk" element={<RiskAnalytics />} />
            <Route path="/graph" element={<TransactionGraph />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/investigations" element={<Investigations />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </BlockchainProvider>
  );
}

export default App;
