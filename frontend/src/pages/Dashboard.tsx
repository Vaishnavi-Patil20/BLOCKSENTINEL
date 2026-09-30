import { motion } from "framer-motion";
import { ArrowRightLeft, Brain, Bell, GitGraph } from "lucide-react";
import { TransactionFeed } from "../components/TransactionFeed";
import { LiveNetworkGraph3D } from "../components/LiveNetworkGraph3D";
import { RiskBadge } from "../components/RiskBadge";
import { useBlockchain } from "../context/BlockchainContext";
import { useNavigate } from "react-router-dom";

export const Dashboard: React.FC = () => {
  const { transactions, connectionState, metrics } = useBlockchain();
  const navigate = useNavigate();

  const stats = [
    { label: "Transactions", value: metrics.transactions_processed.toLocaleString(), icon: ArrowRightLeft, color: "text-sentinel-accent" },
    { label: "High Risk", value: metrics.high_risk.toLocaleString(), icon: Brain, color: "text-sentinel-high" },
    { label: "Alerts", value: metrics.alerts_open.toLocaleString(), icon: Bell, color: "text-sentinel-critical" },
    { label: "Network", value: connectionState.status === "LIVE" ? "LIVE" : "OFFLINE", icon: GitGraph, color: connectionState.status === "LIVE" ? "text-sentinel-low" : "text-sentinel-high" },
  ];

  const highRiskTxs = transactions.filter((t) => (t.risk?.level === "HIGH" || t.risk?.level === "CRITICAL") || (t.risk_level === "HIGH" || t.risk_level === "CRITICAL")).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">Live blockchain intelligence overview</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${connectionState.status === "LIVE" ? "bg-sentinel-low animate-pulse" : "bg-sentinel-high"}`} />
          <span className={connectionState.status === "LIVE" ? "text-sentinel-low" : "text-sentinel-high"}>
            {connectionState.status}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">Block #{connectionState.last_block ? parseInt(connectionState.last_block).toLocaleString() : "—"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-sentinel-surface border border-sentinel-border rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${s.color}`} />
                <span className="text-xs text-slate-600 font-mono uppercase tracking-wider">{s.label}</span>
              </div>
              <div className="text-2xl font-bold font-mono">{s.value}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LiveNetworkGraph3D />
          <TransactionFeed limit={20} />
        </div>
        <div className="space-y-6">
          <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-5">
            <h3 className="font-semibold text-sm tracking-wide mb-4">HIGH-RISK TRANSACTIONS</h3>
            {highRiskTxs.length === 0 ? (
              <div className="text-sm text-slate-600 py-4 text-center">No high-risk transactions detected yet.</div>
            ) : (
              <div className="space-y-3">
                {highRiskTxs.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => navigate(`/tx/${tx.tx_hash}`)}
                    className="p-3 bg-sentinel-bg rounded-lg border border-sentinel-border hover:border-sentinel-high/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-500 truncate max-w-[120px]">{tx.tx_hash}</span>
                      <RiskBadge level={tx.risk_level} score={tx.risk_score} />
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {tx.value_native.toFixed(4)} ETH
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-5">
            <h3 className="font-semibold text-sm tracking-wide mb-4">CONNECTION STATUS</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Provider</span>
                <span className="font-mono text-slate-300">{connectionState.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Network</span>
                <span className="font-mono text-slate-300">{connectionState.network}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Events Received</span>
                <span className="font-mono text-slate-300">{connectionState.events_received.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Latency</span>
                <span className="font-mono text-slate-300">{connectionState.latency_ms}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
