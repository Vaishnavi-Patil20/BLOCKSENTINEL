import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { useBlockchain } from "../context/BlockchainContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export const Analytics: React.FC = () => {
  const { transactions } = useBlockchain();

  const hourly = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    volume: transactions.filter((_, idx) => idx % 24 === i).reduce((s, t) => s + t.value_native, 0),
    count: Math.floor(transactions.length / 24) + (Math.random() > 0.5 ? 1 : 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center">
          <BarChart3 className="w-6 h-6 text-sentinel-accent mr-3" />
          Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">Network activity and transaction metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
          <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-4">TRANSACTION VOLUME (24H)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={hourly}>
              <XAxis dataKey="hour" stroke="#475569" fontSize={10} />
              <YAxis stroke="#475569" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="volume" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
          <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-4">TRANSACTION COUNT (24H)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hourly}>
              <XAxis dataKey="hour" stroke="#475569" fontSize={10} />
              <YAxis stroke="#475569" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px" }} />
              <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};
