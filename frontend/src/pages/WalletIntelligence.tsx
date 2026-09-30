import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Wallet, ArrowDownLeft, ArrowUpRight, Users, Calendar } from "lucide-react";
import { useBlockchain } from "../context/BlockchainContext";
import { RiskScoreGauge } from "../components/RiskScoreGauge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const mockHistory = Array.from({ length: 14 }, (_, i) => ({
  day: `D-${14 - i}`,
  incoming: Math.random() * 50 + 10,
  outgoing: Math.random() * 30 + 5,
  risk: Math.floor(Math.random() * 40 + 30),
}));

export const WalletIntelligence: React.FC = () => {
  const [address, setAddress] = useState("");
  const [searched, setSearched] = useState(false);
  const { transactions } = useBlockchain();

  const walletTxs = transactions.filter(
    (t) => t.from_address === address || t.to_address === address
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wallet Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">Analyze wallet behavior and risk profile</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter wallet address (0x...)"
            className="w-full bg-sentinel-surface border border-sentinel-border rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:border-sentinel-accent/50"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-2.5 bg-sentinel-accent text-sentinel-bg font-semibold rounded-lg hover:bg-sentinel-accent-dim transition-colors text-sm"
        >
          Analyze
        </button>
      </form>

      {searched && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-5 flex items-center space-x-4">
              <Wallet className="w-8 h-8 text-sentinel-accent" />
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Address</div>
                <div className="font-mono text-sm text-slate-300 truncate max-w-[180px]">{address}</div>
              </div>
            </div>
            <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-5 flex items-center space-x-4">
              <ArrowDownLeft className="w-8 h-8 text-sentinel-low" />
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Incoming</div>
                <div className="text-lg font-bold font-mono">
                  {walletTxs.filter((t) => t.to_address === address).reduce((s, t) => s + t.value_native, 0).toFixed(2)} ETH
                </div>
              </div>
            </div>
            <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-5 flex items-center space-x-4">
              <ArrowUpRight className="w-8 h-8 text-sentinel-high" />
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Outgoing</div>
                <div className="text-lg font-bold font-mono">
                  {walletTxs.filter((t) => t.from_address === address).reduce((s, t) => s + t.value_native, 0).toFixed(2)} ETH
                </div>
              </div>
            </div>
            <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-5 flex items-center space-x-4">
              <Users className="w-8 h-8 text-sentinel-medium" />
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Counterparties</div>
                <div className="text-lg font-bold font-mono">{new Set(walletTxs.map((t) => t.from_address === address ? t.to_address : t.from_address)).size}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6 flex flex-col items-center justify-center">
              <RiskScoreGauge score={Math.floor(Math.random() * 40 + 40)} size={140} />
              <div className="mt-4 text-center">
                <div className="text-sm text-slate-500">Wallet Risk Score</div>
                <div className="text-xs text-slate-600 mt-1 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" /> Age: {Math.floor(Math.random() * 500 + 50)} days
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
              <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-4">ACTIVITY HISTORY</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={mockHistory}>
                  <XAxis dataKey="day" stroke="#475569" fontSize={10} />
                  <YAxis stroke="#475569" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111118", border: "1px solid #1e1e2e", borderRadius: "8px" }}
                    itemStyle={{ fontSize: "12px" }}
                  />
                  <Line type="monotone" dataKey="incoming" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="outgoing" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
