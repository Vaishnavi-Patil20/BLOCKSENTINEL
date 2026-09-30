import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, FileCode } from "lucide-react";
import { useBlockchain } from "../context/BlockchainContext";
import { RiskBadge } from "./RiskBadge";
import { formatDistanceToNow } from "date-fns";

export const TransactionFeed: React.FC<{ limit?: number; showHeader?: boolean }> = ({
  limit = 50,
  showHeader = true,
}) => {
  const { transactions, setSelectedTx } = useBlockchain();
  const display = transactions.slice(0, limit);

  return (
    <div className="bg-sentinel-surface border border-sentinel-border rounded-xl overflow-hidden">
      {showHeader && (
        <div className="px-5 py-4 border-b border-sentinel-border flex items-center justify-between">
          <h3 className="font-semibold text-sm tracking-wide">LIVE TRANSACTION FEED</h3>
          <span className="text-xs text-slate-500 font-mono">{transactions.length.toLocaleString()} ingested</span>
        </div>
      )}
      <div className="max-h-[600px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {display.length === 0 ? (
            <div className="p-8 text-center text-slate-600 text-sm">
              <div className="w-2 h-2 bg-sentinel-muted rounded-full mx-auto mb-3 animate-pulse" />
              Waiting for live transactions...
              <div className="mt-2 text-xs text-slate-700">Ensure backend WebSocket is running on :8080</div>
            </div>
          ) : (
            display.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                className="px-5 py-3 border-b border-sentinel-border/50 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                onClick={() => setSelectedTx(tx)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                    <span>{tx.first_seen_at ? formatDistanceToNow(new Date(tx.first_seen_at), { addSuffix: true }) : "—"}</span>
                    {tx.is_contract_interaction && <FileCode className="w-3 h-3 text-sentinel-accent" />}
                    <span className={tx.status === "MINED" ? "text-sentinel-low" : "text-sentinel-medium"}>
                      {tx.status}
                    </span>
                  </div>
                  <RiskBadge level={tx.risk_level} score={tx.risk_score} />
                </div>
                <div className="flex items-center text-sm">
                  <span className="font-mono text-slate-300 truncate max-w-[140px]">{tx.from_address}</span>
                  <ArrowRight className="w-3 h-3 mx-2 text-slate-600" />
                  <span className="font-mono text-slate-300 truncate max-w-[140px]">
                    {tx.to_address || "Contract Creation"}
                  </span>
                  <span className="ml-auto font-mono font-semibold text-slate-100">
                    {tx.value_native.toFixed(4)} ETH
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-600 font-mono truncate">{tx.tx_hash}</div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
