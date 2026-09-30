import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, Download, Search } from "lucide-react";
import { useBlockchain } from "../context/BlockchainContext";
import { RiskBadge } from "../components/RiskBadge";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export const Transactions: React.FC = () => {
  const { transactions } = useBlockchain();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [search, setSearch] = useState("");

  const exportCsv = () => {
    const headers = ["timestamp", "tx_hash", "network", "block_number", "from_address", "to_address", "value_eth", "gas_limit", "gas_price_wei", "nonce", "status", "risk_score", "risk_level", "risk_model", "risk_factors"];
    const escapeCell = (value: unknown) => {
      const text = value == null ? "" : String(value);
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
    };
    const rows = filtered.map((tx) => [
      tx.first_seen_at, tx.tx_hash, tx.network, tx.block_number, tx.from_address, tx.to_address ?? "",
      tx.value_native, tx.gas_limit, tx.gas_price ?? "", tx.nonce, tx.status, tx.risk_score ?? "",
      tx.risk_level ?? "", tx.risk?.model_name ?? "", (tx.risk?.factors ?? []).map((f) => `${f.name}:${f.weight}`).join(" | ")
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `blocksentinel-transactions-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  };

  const filtered = transactions.filter((t) => {
    if (filter !== "ALL" && t.risk_level !== filter) return false;
    if (search) { const query = search.toLowerCase(); if (!t.tx_hash.toLowerCase().includes(query) && !t.from_address.toLowerCase().includes(query) && !t.to_address?.toLowerCase().includes(query)) return false; }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transaction Explorer</h1>
          <p className="text-sm text-slate-500 mt-1">Browse and filter all ingested transactions</p>
        </div>
        <button type="button" onClick={exportCsv} disabled={filtered.length === 0} className="flex items-center px-4 py-2 bg-sentinel-surface border border-sentinel-border rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hash, from, or to address..."
            className="w-full bg-sentinel-surface border border-sentinel-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-sentinel-accent/50"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-sentinel-accent/15 text-sentinel-accent border border-sentinel-accent/30"
                  : "bg-sentinel-surface border border-sentinel-border text-slate-400 hover:text-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-sentinel-surface border border-sentinel-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sentinel-border text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Hash</th>
                <th className="px-5 py-3 font-medium">From</th>
                <th className="px-5 py-3 font-medium">To</th>
                <th className="px-5 py-3 font-medium text-right">Value</th>
                <th className="px-5 py-3 font-medium text-center">Risk</th>
                <th className="px-5 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((tx, i) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.01, 0.5) }}
                  onClick={() => navigate(`/tx/${tx.tx_hash}`)}
                  className="border-b border-sentinel-border/50 hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                    {tx.first_seen_at ? formatDistanceToNow(new Date(tx.first_seen_at), { addSuffix: true }) : "—"}
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-300 truncate max-w-[140px]">{tx.tx_hash}</td>
                  <td className="px-5 py-3 font-mono text-slate-300 truncate max-w-[120px]">{tx.from_address}</td>
                  <td className="px-5 py-3 font-mono text-slate-300 truncate max-w-[120px]">{tx.to_address || "—"}</td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-slate-100">{tx.value_native.toFixed(4)} ETH</td>
                  <td className="px-5 py-3 text-center"><RiskBadge level={tx.risk_level} score={tx.risk_score} /></td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs font-medium ${tx.status === "MINED" ? "text-sentinel-low" : "text-sentinel-medium"}`}>
                      {tx.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-600 text-sm">
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
