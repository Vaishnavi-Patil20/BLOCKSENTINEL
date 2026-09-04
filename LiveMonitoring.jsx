import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Radio, Clock } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { useNavigate } from 'react-router-dom';
import { txAPI } from '../services/api';

const LiveMonitoring = () => {
  const { liveTransactions, wsStatus, addLiveTx } = useAppStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useWebSocket();

  useEffect(() => {
    txAPI.latest(10).then(res => {
      const txs = res.data || [];
      txs.forEach(tx => addLiveTx(tx));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio size={24} className={wsStatus.connected ? 'text-green-400 animate-pulse' : 'text-gray-500'} />
            Live Transaction Monitoring
          </h1>
          <p className="text-gray-500 text-sm mt-1">Real-time Ethereum Mainnet feed</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-400"><Activity size={16} /><span>Source: {wsStatus.source || 'polling'}</span></div>
          <div className={`flex items-center gap-2 ${wsStatus.connected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${wsStatus.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            {wsStatus.connected ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-sentinel-600/20">
          <h3 className="font-bold flex items-center gap-2"><Clock size={18} className="text-sentinel-accent" />Live Transaction Feed</h3>
          <span className="text-xs text-gray-500">{liveTransactions.length} transactions in session</span>
        </div>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          <AnimatePresence>
            {liveTransactions.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">Waiting for transactions...<br/><span className="text-xs">Connect your Alchemy API key for real-time data</span></div>
            )}
            {liveTransactions.map((tx, i) => (
              <motion.div key={tx.hash || tx.tx_hash || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                onClick={() => navigate(`/transactions/${tx.hash || tx.tx_hash}`)}
                className="flex items-center justify-between p-4 bg-sentinel-900/50 rounded-lg hover:bg-sentinel-700/30 cursor-pointer transition-all border-l-2 border-transparent hover:border-sentinel-accent">
                <div className="flex items-center gap-4">
                  <div className="text-xs text-gray-500 font-mono w-20">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                  <div>
                    <div className="font-mono text-sm text-gray-300">{(tx.from || tx.from_address || '0x...').slice(0, 12)}... → {(tx.to || tx.to_address || '0x...').slice(0, 12)}...</div>
                    <div className="text-xs text-gray-500 mt-0.5">Block #{tx.blockNumber || tx.block_number || '...'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-white">{parseFloat(tx.value || tx.value_eth || 0).toFixed(4)} ETH</div>
                  <div className={`badge badge-${(tx.riskLevel || tx.risk_level || 'low').toLowerCase()} mt-1`}>Risk: {tx.riskScore || tx.risk_score || 0}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;
