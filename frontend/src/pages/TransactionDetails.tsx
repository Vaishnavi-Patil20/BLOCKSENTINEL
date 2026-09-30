import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useBlockchain } from "../context/BlockchainContext";
import { RiskScoreGauge } from "../components/RiskScoreGauge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export const TransactionDetails: React.FC = () => {
  const { hash } = useParams();
  const { transactions } = useBlockchain();
  const navigate = useNavigate();

  const [remoteTx, setRemoteTx] = useState<typeof transactions[number] | null>(null);
  useEffect(() => {
    if (!hash || transactions.some((item) => item.tx_hash === hash)) return;
    const api = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
    fetch(`${api}/api/v1/transactions/${hash}`).then((r) => r.ok ? r.json() : null).then((data) => { if (data) setRemoteTx(data); }).catch(() => undefined);
  }, [hash, transactions]);

  const tx = transactions.find((t) => t.tx_hash === hash) || remoteTx;

  if (!tx) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-600">
        <p>Transaction data is not available.</p>
        <p className="text-sm mt-2">BlockSentinel did not return this transaction from its current backend data source.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sentinel-accent flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </button>
      </div>
    );
  }

  const riskFactors = tx.risk?.factors || [];
  const riskScore = tx.risk?.score ?? tx.risk_score ?? 0;
  const confidence = tx.risk?.confidence;
  const modelName = tx.risk?.model_name;


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-400 hover:text-slate-100 flex items-center mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transaction Intelligence</h1>
          <div className="flex items-center mt-2 font-mono text-sm text-slate-500">
            <span className="truncate max-w-md">{tx.tx_hash}</span>
            <button type="button" onClick={() => window.open(`https://etherscan.io/tx/${tx.tx_hash}`, "_blank", "noopener,noreferrer")} title="Open transaction on Etherscan" className="ml-2 text-slate-500 hover:text-sentinel-accent"><ExternalLink className="w-3 h-3" /></button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-md text-xs font-bold border ${
            tx.status === "MINED" ? "bg-sentinel-low/15 text-sentinel-low border-sentinel-low/30" : "bg-sentinel-medium/15 text-sentinel-medium border-sentinel-medium/30"
          }`}>
            {tx.status}
          </div>
          <RiskScoreGauge score={riskScore} size={100} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
          <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-4">TRANSACTION INFORMATION</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-sentinel-border/50 pb-3">
              <span className="text-slate-500">From</span>
              <span className="font-mono text-slate-300 truncate max-w-[200px]">{tx.from_address}</span>
            </div>
            <div className="flex justify-between border-b border-sentinel-border/50 pb-3">
              <span className="text-slate-500">To</span>
              <span className="font-mono text-slate-300 truncate max-w-[200px]">{tx.to_address || "Contract Creation"}</span>
            </div>
            <div className="flex justify-between border-b border-sentinel-border/50 pb-3">
              <span className="text-slate-500">Value</span>
              <span className="font-mono font-semibold text-slate-100">{tx.value_native.toFixed(6)} ETH</span>
            </div>
            <div className="flex justify-between border-b border-sentinel-border/50 pb-3">
              <span className="text-slate-500">Gas Limit</span>
              <span className="font-mono text-slate-300">{tx.gas_limit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-sentinel-border/50 pb-3">
              <span className="text-slate-500">Gas Price</span>
              <span className="font-mono text-slate-300">{tx.gas_price || "Not provided by source"}</span>
            </div>
            <div className="flex justify-between border-b border-sentinel-border/50 pb-3">
              <span className="text-slate-500">Nonce</span>
              <span className="font-mono text-slate-300">{tx.nonce}</span>
            </div>
            <div className="flex justify-between border-b border-sentinel-border/50 pb-3">
              <span className="text-slate-500">Block</span>
              <span className="font-mono text-slate-300">{tx.block_number?.toLocaleString() || "Not mined / unavailable"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Type</span>
              <span className="font-mono text-slate-300">{tx.is_contract_interaction ? "Contract Call" : "Transfer"}</span>
            </div>
          </div>
        </div>

        <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
          <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-4">RISK BREAKDOWN</h3>
          {riskFactors.length === 0 ? (
            <p className="text-sm text-slate-600">Low risk transaction. No significant contributing factors.</p>
          ) : (
            <div className="space-y-4">
              {riskFactors.map((f) => (
                <div key={`${f.name}-${f.weight}`}>
                  <div className="flex justify-between text-sm mb-1 gap-4">
                    <span className="text-slate-300">{f.name}</span>
                    <span className="font-mono text-sentinel-high shrink-0">+{f.weight}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{f.description}</p>
                  <div className="h-1.5 bg-sentinel-bg rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (f.weight / 25) * 100)}%` }}
                      className="h-full bg-sentinel-high rounded-full"
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-sentinel-border/50">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-200">Total Risk Score</span>
                  <span className="font-mono text-sentinel-critical">{riskScore}/100</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
        <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-4">CHAIN METADATA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {[
            ["Network", tx.network], ["Chain ID", String(tx.chain_id)], ["Block Hash", tx.block_hash || "Not available"],
            ["Transaction Index", tx.transaction_index != null ? String(tx.transaction_index) : "Not available"],
            ["Value (wei)", tx.value_wei], ["Transaction Type", String(tx.transaction_type)],
            ["First Seen", tx.first_seen_at ? new Date(tx.first_seen_at).toLocaleString() : "Not available"],
            ["Mined At", tx.mined_at ? new Date(tx.mined_at).toLocaleString() : "Not mined / unavailable"],
            ["Source Provider", tx.source_provider], ["Subscription", tx.source_subscription],
            ["Ingestion Latency", `${tx.ingestion_latency_ms} ms`], ["Processing Latency", `${tx.processing_latency_ms} ms`],
          ].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-sentinel-border/40 pb-2"><span className="text-slate-500">{label}</span><span className="font-mono text-slate-300 text-right break-all">{value}</span></div>)}
        </div>
        <p className="mt-4 text-xs text-slate-600">All fields above are values carried by the observed transaction record; unavailable fields are shown as unavailable rather than inferred.</p>
      </div>

      <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
        <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-2">INPUT DATA</h3>
        <div className="bg-sentinel-bg border border-sentinel-border rounded-lg p-4 font-mono text-xs text-slate-500 break-all max-h-48 overflow-y-auto">
          {tx.input_data}
        </div>
      </div>

      <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
        <h3 className="text-sm font-semibold tracking-wide text-slate-400 mb-4">EXPLAINABLE AI</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold font-mono text-sentinel-accent mb-1">{confidence != null ? `${Math.round(confidence * 100)}%` : "—"}</div>
            <div className="text-xs text-slate-500">Reported Engine Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold font-mono text-slate-300 mb-1">{riskFactors.length}</div>
            <div className="text-xs text-slate-500">Risk Factors Triggered</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold font-mono text-sentinel-low mb-1">{modelName || "—"}</div>
            <div className="text-xs text-slate-500">Risk Model</div>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-600">
          Risk analysis uses only observable transaction data. Wallet age, identity labels, and other unavailable off-chain attributes are not invented. Reported confidence is engine metadata, not a calibrated probability of fraud.
          {tx.risk?.explanation ? ` ${tx.risk.explanation}` : " Risk analysis is not available for this record yet."}
        </p>
      </div>
    </motion.div>
  );
};
