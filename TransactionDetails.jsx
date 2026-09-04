import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, Copy, CheckCircle, AlertTriangle, Brain } from 'lucide-react';
import { txAPI } from '../services/api';

const TransactionDetails = () => {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchHash, setSearchHash] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (hash && hash.startsWith('0x')) loadTx(hash); }, [hash]);

  const loadTx = async (h) => {
    setLoading(true);
    try {
      const res = await txAPI.get(h);
      setTx(res.data);
    } catch (err) {
      try { const analyzeRes = await txAPI.analyze(h); setTx({ ...analyzeRes.data.transaction, ...analyzeRes.data.risk, factors: analyzeRes.data.factors }); }
      catch (e) { setTx(null); }
    } finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); if (searchHash.startsWith('0x')) navigate(`/transactions/${searchHash}`); };
  const copyHash = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-sentinel-700 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">Transaction Intelligence</h1>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input type="text" placeholder="Enter transaction hash (0x...)" className="input-field flex-1" value={searchHash} onChange={(e) => setSearchHash(e.target.value)} />
        <button type="submit" className="btn-primary"><Search size={18} /></button>
      </form>
      {loading && <div className="text-center py-12 text-gray-500">Analyzing transaction on blockchain...</div>}
      {!loading && !tx && hash && <div className="card text-center py-12"><AlertTriangle size={48} className="mx-auto mb-4 text-yellow-500" /><h3 className="text-lg font-bold mb-2">Transaction Not Found</h3><p className="text-gray-500">This transaction may not exist or the hash is invalid.</p></div>}
      {tx && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Transaction Hash</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg text-white">{tx.tx_hash || tx.hash}</span>
                  <button onClick={() => copyHash(tx.tx_hash || tx.hash)} className="p-1 hover:bg-sentinel-700 rounded">{copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-500" />}</button>
                </div>
              </div>
              <div className="text-right"><div className={`badge badge-${(tx.risk_level || 'low').toLowerCase()} text-sm`}>{tx.status || 'Confirmed'}</div></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div><div className="text-xs text-gray-500 mb-1">RISK SCORE</div><div className={`text-3xl font-bold risk-${(tx.risk_level || 'low').toLowerCase()}`}>{tx.risk_score || 0}<span className="text-lg text-gray-500">/100</span></div><div className={`badge badge-${(tx.risk_level || 'low').toLowerCase()} mt-2`}>{tx.risk_level || 'LOW'}</div></div>
              <div><div className="text-xs text-gray-500 mb-1">VALUE</div><div className="text-xl font-mono text-white">{parseFloat(tx.value_eth || tx.value || 0).toFixed(4)} ETH</div></div>
              <div><div className="text-xs text-gray-500 mb-1">BLOCK</div><div className="text-xl font-mono text-white">#{tx.block_number || tx.blockNumber}</div></div>
              <div><div className="text-xs text-gray-500 mb-1">GAS PRICE</div><div className="text-xl font-mono text-white">{parseFloat(tx.gas_price || tx.gasPrice || 0).toFixed(2)} Gwei</div></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold mb-4">Transaction Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-sentinel-600/10"><span className="text-gray-500 text-sm">From</span><span className="font-mono text-sm text-gray-300">{(tx.from_address || tx.from || '').slice(0, 24)}...</span></div>
                <div className="flex justify-between py-2 border-b border-sentinel-600/10"><span className="text-gray-500 text-sm">To</span><span className="font-mono text-sm text-gray-300">{(tx.to_address || tx.to || '').slice(0, 24)}...</span></div>
                <div className="flex justify-between py-2 border-b border-sentinel-600/10"><span className="text-gray-500 text-sm">Gas Used</span><span className="font-mono text-sm text-gray-300">{tx.gas_used || tx.gasUsed || 'N/A'}</span></div>
                <div className="flex justify-between py-2 border-b border-sentinel-600/10"><span className="text-gray-500 text-sm">Gas Limit</span><span className="font-mono text-sm text-gray-300">{tx.gas_limit || tx.gasLimit || 'N/A'}</span></div>
                <div className="flex justify-between py-2"><span className="text-gray-500 text-sm">Nonce</span><span className="font-mono text-sm text-gray-300">{tx.nonce || 'N/A'}</span></div>
              </div>
            </div>
            <div className="card">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Brain size={18} className="text-sentinel-accent" />Risk Breakdown</h3>
              {(!tx.factors || tx.factors.length === 0) ? <div className="text-gray-500 text-sm py-4">No risk factors recorded</div> : (
                <div className="space-y-3">
                  {tx.factors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-sentinel-900/50 rounded-lg">
                      <div><div className="text-sm text-gray-300">{f.factor_name || f.name}</div><div className="text-xs text-gray-500">{f.description || f.desc}</div></div>
                      <div className="text-sm font-bold text-sentinel-high">+{f.contribution}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TransactionDetails;
