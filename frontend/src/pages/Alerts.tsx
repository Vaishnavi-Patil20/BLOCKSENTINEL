import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCircle, AlertTriangle, ShieldAlert, Shield } from "lucide-react";
import { useBlockchain } from "../context/BlockchainContext";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export const Alerts: React.FC = () => {
  const { alerts, acknowledgeAlert } = useBlockchain();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "ACKNOWLEDGED" | "RESOLVED">("ALL");

  const filtered = alerts.filter((a) => (filter === "ALL" ? true : a.status === filter));

  const counts = {
    CRITICAL: alerts.filter((a) => a.severity === "CRITICAL" && a.status === "OPEN").length,
    HIGH: alerts.filter((a) => a.severity === "HIGH" && a.status === "OPEN").length,
    MEDIUM: alerts.filter((a) => a.severity === "MEDIUM" && a.status === "OPEN").length,
    LOW: alerts.filter((a) => a.severity === "LOW" && a.status === "OPEN").length,
  };

  const severityConfig = {
    CRITICAL: { icon: ShieldAlert, color: "text-sentinel-critical", bg: "bg-sentinel-critical/10 border-sentinel-critical/20" },
    HIGH: { icon: AlertTriangle, color: "text-sentinel-high", bg: "bg-sentinel-high/10 border-sentinel-high/20" },
    MEDIUM: { icon: Bell, color: "text-sentinel-medium", bg: "bg-sentinel-medium/10 border-sentinel-medium/20" },
    LOW: { icon: Shield, color: "text-sentinel-low", bg: "bg-sentinel-low/10 border-sentinel-low/20" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alert Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">Risk-triggered alerts from live monitoring</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.entries(counts) as [keyof typeof counts, number][]).map(([sev, count]) => {
          const cfg = severityConfig[sev];
          const Icon = cfg.icon;
          return (
            <motion.div key={sev} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-5 rounded-xl border ${cfg.bg}`}>
              <Icon className={`w-6 h-6 ${cfg.color} mb-3`} />
              <div className="text-3xl font-bold font-mono">{count}</div>
              <div className={`text-xs font-medium uppercase tracking-wider mt-1 ${cfg.color}`}>{sev}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center space-x-2">
        {(["ALL", "OPEN", "ACKNOWLEDGED", "RESOLVED"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === f ? "bg-sentinel-accent/15 text-sentinel-accent border border-sentinel-accent/30" : "bg-sentinel-surface border border-sentinel-border text-slate-400 hover:text-slate-200"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((alert, i) => {
          const cfg = severityConfig[alert.severity];
          const Icon = cfg.icon;
          return (
            <motion.div key={alert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-sentinel-surface border border-sentinel-border rounded-xl p-5 hover:border-sentinel-accent/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${cfg.bg}`}><Icon className={`w-5 h-5 ${cfg.color}`} /></div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-sm">{alert.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>{alert.severity}</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{alert.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500 font-mono">
                      <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
                      {alert.tx_hash && <button onClick={() => navigate(`/tx/${alert.tx_hash}`)} className="text-sentinel-accent hover:underline">View Transaction</button>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {alert.status === "OPEN" && (
                    <>
                      <button onClick={() => acknowledgeAlert(alert.id)} className="px-3 py-1.5 text-xs bg-sentinel-accent/15 text-sentinel-accent rounded-md border border-sentinel-accent/30 hover:bg-sentinel-accent/25 transition-colors">Acknowledge</button>
                      <button onClick={() => navigate("/investigations")} className="px-3 py-1.5 text-xs bg-sentinel-critical/15 text-sentinel-critical rounded-md border border-sentinel-critical/30 hover:bg-sentinel-critical/25 transition-colors">Investigate</button>
                    </>
                  )}
                  {alert.status !== "OPEN" && <span className="flex items-center text-xs text-slate-500"><CheckCircle className="w-3 h-3 mr-1" /> {alert.status}</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12 text-slate-600 text-sm">No alerts in this category.</div>}
      </div>
    </div>
  );
};
