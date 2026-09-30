import { motion } from "framer-motion";
import { Brain, TrendingUp, AlertCircle } from "lucide-react";
import { useBlockchain } from "../context/BlockchainContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export const RiskAnalytics: React.FC = () => {
  const { transactions } = useBlockchain();

  const distribution = [
    { name: "Critical", value: transactions.filter((t) => t.risk_level === "CRITICAL").length, color: "#ef4444" },
    { name: "High", value: transactions.filter((t) => t.risk_level === "HIGH").length, color: "#f97316" },
    { name: "Medium", value: transactions.filter((t) => t.risk_level === "MEDIUM").length, color: "#eab308" },
    { name: "Low", value: transactions.filter((t) => t.risk_level === "LOW").length, color: "#22c55e" },
  ];

  const volumeByRisk = [
    { range: "0-25", count: transactions.filter((t) => (t.risk_score || 0) <= 25).length },
    { range: "26-50", count: transactions.filter((t) => { const s = t.risk_score || 0; return s > 25 && s <= 50; }).length },
    { range: "51-75", count: transactions.filter((t) => { const s = t.risk_score || 0; return s > 50 && s <= 75; }).length },
    { range: "76-100", count: transactions.filter((t) => (t.risk_score || 0) > 75).length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center">
          <Brain className="w-6 h-6 text-sentinel-accent mr-3" />
          Risk Intelligence
        </h1>
        <p className="text-sm text-slate-500 mt-1">AI-driven risk distribution and trend analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-4">RISK DISTRIBUTION</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={distribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                {distribution.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {distribution.map((d) => (
              <div key={d.name} className="flex items-center text-xs">
                <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: d.color }} />
                <span className="text-slate-400">{d.name}</span>
                <span className="ml-1 font-mono text-slate-300">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-sentinel-surface border border-sentinel-border rounded-xl p-6"
        >
          <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-4">RISK SCORE HISTOGRAM</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={volumeByRisk}>
              <XAxis dataKey="range" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px" }} />
              <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
        <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-4 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" /> LIVE RISK ENGINE STATUS
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Risk Analyzed", value: transactions.filter((t) => !!t.risk).length.toLocaleString() },
            { label: "High / Critical", value: transactions.filter((t) => t.risk?.level === "HIGH" || t.risk?.level === "CRITICAL").length.toLocaleString() },
            { label: "Medium", value: transactions.filter((t) => t.risk?.level === "MEDIUM").length.toLocaleString() },
            { label: "Low", value: transactions.filter((t) => t.risk?.level === "LOW").length.toLocaleString() },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-2xl font-bold font-mono text-slate-100">{m.value}</div>
              <div className="text-xs text-slate-500 mt-1">{m.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-600">
          Precision, recall and F1 cannot be truthfully calculated from unlabeled live transactions. Those metrics should be reported only from a labeled evaluation dataset.
        </p>
      </div>

      <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
        <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-4 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" /> DATA QUALITY CENTER
        </h3>
        {(() => {
          const required = [
            "tx_hash", "from_address", "value_wei", "value_native", "gas_limit",
            "nonce", "input_data", "status", "received_at", "source_provider"
          ] as const;
          const analyzed = transactions.length;
          const present = transactions.reduce((sum, tx) => {
            return sum + required.filter((key) => {
              const value = tx[key];
              return value !== null && value !== undefined && value !== "";
            }).length;
          }, 0);
          const totalFields = Math.max(1, analyzed * required.length);
          const health = analyzed ? Math.round((present / totalFields) * 100) : 0;
          const complete = transactions.filter((tx) => required.every((key) => {
            const value = tx[key];
            return value !== null && value !== undefined && value !== "";
          })).length;
          const partial = Math.max(0, analyzed - complete);
          return (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300">Observable Data Health</span>
                  <span className="font-mono text-sentinel-low">{health}%</span>
                </div>
                <div className="h-2 bg-sentinel-bg rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${health}%` }} className="h-full bg-sentinel-low rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-sentinel-bg rounded-lg border border-sentinel-border">
                  <div className="text-slate-500 text-xs mb-1">Transactions In Buffer</div>
                  <div className="font-mono font-semibold">{analyzed.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-sentinel-bg rounded-lg border border-sentinel-border">
                  <div className="text-slate-500 text-xs mb-1">Complete Observable Records</div>
                  <div className="font-mono font-semibold text-sentinel-low">{complete.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-sentinel-bg rounded-lg border border-sentinel-border">
                  <div className="text-slate-500 text-xs mb-1">Partial Observable Records</div>
                  <div className="font-mono font-semibold text-sentinel-medium">{partial.toLocaleString()}</div>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Missing on-chain fields are preserved as unavailable rather than fabricated. Off-chain identity, wallet age and entity labels are not inferred unless an approved data source provides them.
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
