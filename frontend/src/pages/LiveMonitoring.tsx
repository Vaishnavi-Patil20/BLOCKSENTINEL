import { motion } from "framer-motion";
import { Radio, Zap } from "lucide-react";
import { TransactionFeed } from "../components/TransactionFeed";
import { LiveNetworkGraph3D } from "../components/LiveNetworkGraph3D";
import { useBlockchain } from "../context/BlockchainContext";

export const LiveMonitoring: React.FC = () => {
  const { connectionState, transactions } = useBlockchain();
  const tps = transactions.length > 0 ? (transactions.length / 60).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Radio className="w-6 h-6 text-sentinel-critical mr-3 animate-pulse" />
            Live Transaction Monitoring
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time Ethereum Mainnet ingestion</p>
        </div>
        <div className="flex items-center space-x-6 text-sm font-mono">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-sentinel-accent" />
            <span className="text-slate-400">TX/s:</span>
            <span className="text-slate-100">{tps}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Analyzed:</span>
            <span className="text-slate-100">{connectionState.events_processed.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <LiveNetworkGraph3D />
      </motion.div>

      <TransactionFeed limit={100} />
    </div>
  );
};
