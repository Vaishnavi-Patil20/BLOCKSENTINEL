import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus, RotateCcw, Network, Info } from "lucide-react";
import { useBlockchain } from "../context/BlockchainContext";

type Node = { id: string; x: number; y: number; degree: number; incoming: number; outgoing: number; volume: number; maxRisk: number };
type Edge = { from: string; to: string; count: number; volume: number; risk: number; hash: string };

const NODE_COLORS: Record<string, string> = { critical: "#ef4444", high: "#f59e0b", medium: "#eab308", low: "#22c55e" };

const riskBucket = (score: number) => score >= 80 ? "critical" : score >= 60 ? "high" : score >= 30 ? "medium" : "low";
const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;

export const TransactionGraph: React.FC = () => {
  const { transactions } = useBlockchain();
  const [minRisk, setMinRisk] = useState(0);
  const [scale, setScale] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const graph = useMemo(() => {
    const edgeMap = new Map<string, Edge>();
    const nodeStats = new Map<string, Node>();
    const visible = transactions.filter((t) => (t.risk_score || 0) >= minRisk && t.to_address);

    for (const tx of visible) {
      const from = tx.from_address.toLowerCase();
      const to = tx.to_address!.toLowerCase();
      const key = `${from}->${to}`;
      const existing = edgeMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.volume += tx.value_native;
        existing.risk = Math.max(existing.risk, tx.risk_score || 0);
      } else edgeMap.set(key, { from, to, count: 1, volume: tx.value_native, risk: tx.risk_score || 0, hash: tx.tx_hash });

      const fromNode = nodeStats.get(from) || { id: from, x: 0, y: 0, degree: 0, incoming: 0, outgoing: 0, volume: 0, maxRisk: 0 };
      fromNode.degree += 1; fromNode.outgoing += 1; fromNode.volume += tx.value_native; fromNode.maxRisk = Math.max(fromNode.maxRisk, tx.risk_score || 0); nodeStats.set(from, fromNode);
      const toNode = nodeStats.get(to) || { id: to, x: 0, y: 0, degree: 0, incoming: 0, outgoing: 0, volume: 0, maxRisk: 0 };
      toNode.degree += 1; toNode.incoming += 1; toNode.volume += tx.value_native; toNode.maxRisk = Math.max(toNode.maxRisk, tx.risk_score || 0); nodeStats.set(to, toNode);
    }

    // Keep the visual focused: top 24 addresses by observed degree. This is a display limit only.
    const nodes = Array.from(nodeStats.values()).sort((a, b) => b.degree - a.degree || a.id.localeCompare(b.id)).slice(0, 24);
    const selectedIds = new Set(nodes.map((n) => n.id));
    const edges = Array.from(edgeMap.values()).filter((e) => selectedIds.has(e.from) && selectedIds.has(e.to)).sort((a, b) => b.count - a.count || b.volume - a.volume);
    const centerX = 430, centerY = 270, radiusX = 330, radiusY = 190;
    nodes.forEach((node, index) => {
      const angle = -Math.PI / 2 + (index / Math.max(nodes.length, 1)) * Math.PI * 2;
      node.x = centerX + radiusX * Math.cos(angle);
      node.y = centerY + radiusY * Math.sin(angle);
    });
    return { nodes, edges };
  }, [transactions, minRisk]);

  const selected = graph.nodes.find((node) => node.id === selectedAddress) || null;
  const selectedEdges = selected ? graph.edges.filter((edge) => edge.from === selected.id || edge.to === selected.id) : [];

  return <div className="space-y-6">
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4"><div><h1 className="text-2xl font-bold">Transaction Graph</h1><p className="text-sm text-slate-500 mt-1">Observed wallet-to-wallet relationships from real ingested transactions</p></div><div className="flex items-center gap-2"><span className="text-xs text-slate-500">Minimum risk</span>{[0,30,60,80].map((value)=><button key={value} onClick={()=>setMinRisk(value)} className={`px-2.5 py-1.5 rounded-md text-xs border ${minRisk===value?"border-sentinel-accent/40 text-sentinel-accent bg-sentinel-accent/10":"border-sentinel-border text-slate-500"}`}>{value}</button>)}</div></div>

    <div className="bg-sentinel-surface border border-sentinel-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-sentinel-border flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm text-slate-400"><Network className="w-4 h-4 text-sentinel-accent"/> {graph.nodes.length} addresses · {graph.edges.length} relationships</div><div className="flex gap-2"><button title="Zoom out" onClick={()=>setScale((v)=>Math.max(.7, Number((v-.1).toFixed(1))))} className="p-2 border border-sentinel-border rounded-lg text-slate-500 hover:text-slate-200"><Minus className="w-4 h-4"/></button><button title="Reset zoom" onClick={()=>setScale(1)} className="p-2 border border-sentinel-border rounded-lg text-slate-500 hover:text-slate-200"><RotateCcw className="w-4 h-4"/></button><button title="Zoom in" onClick={()=>setScale((v)=>Math.min(1.5, Number((v+.1).toFixed(1))))} className="p-2 border border-sentinel-border rounded-lg text-slate-500 hover:text-slate-200"><Plus className="w-4 h-4"/></button></div></div>
      {graph.nodes.length === 0 ? <div className="h-[540px] flex items-center justify-center text-sm text-slate-600">No observed transactions match the selected risk filter.</div> : <div className="grid lg:grid-cols-[1fr_300px]">
        <div className="h-[560px] overflow-auto bg-[#090a0f]">
          <svg viewBox="0 0 860 540" className="w-full min-w-[860px] h-full" style={{ transform:`scale(${scale})`, transformOrigin:"center", transition:"transform .2s ease" }} aria-label="Observed Ethereum transaction relationship graph">
            <defs><marker id="tx-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" /></marker></defs>
            {graph.edges.map((edge)=><g key={`${edge.from}-${edge.to}`} opacity={selectedAddress && edge.from!==selectedAddress && edge.to!==selectedAddress ? .18 : 1}><line x1={graph.nodes.find(n=>n.id===edge.from)?.x} y1={graph.nodes.find(n=>n.id===edge.from)?.y} x2={graph.nodes.find(n=>n.id===edge.to)?.x} y2={graph.nodes.find(n=>n.id===edge.to)?.y} stroke="#334155" strokeWidth={Math.min(5,1+edge.count*.6)} markerEnd="url(#tx-arrow)"/><title>{`${edge.count} observed transaction(s) · ${edge.volume.toFixed(6)} ETH · max risk ${edge.risk}/100 · ${edge.hash}`}</title></g>)}
            {graph.nodes.map((node)=>{const color=NODE_COLORS[riskBucket(node.maxRisk)]; const active=selectedAddress===node.id; return <g key={node.id} onClick={()=>setSelectedAddress(node.id)} className="cursor-pointer"><circle cx={node.x} cy={node.y} r={active?24:20} fill="#0b1220" stroke={color} strokeWidth={active?4:2}/><circle cx={node.x} cy={node.y} r="5" fill={color}/><text x={node.x} y={node.y+38} textAnchor="middle" fontSize="11" fill="#cbd5e1">{short(node.id)}</text><title>{`${node.id}\nObserved interactions: ${node.degree}\nIncoming: ${node.incoming}\nOutgoing: ${node.outgoing}\nObserved value: ${node.volume.toFixed(6)} ETH\nMax transaction risk: ${node.maxRisk}/100`}</title></g>})}
          </svg>
        </div>
        <div className="border-l border-sentinel-border p-5 space-y-5"><div><div className="text-xs font-semibold tracking-wider text-slate-500">LEGEND</div><div className="space-y-2 mt-3 text-xs">{Object.entries(NODE_COLORS).map(([key,color])=><div key={key} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:color}}/><span className="text-slate-400 capitalize">{key} risk</span></div>)}<div className="flex items-center gap-2"><span className="w-6 h-px bg-slate-600"/><span className="text-slate-400">Observed transaction</span></div></div></div>{selected ? <div className="border-t border-sentinel-border pt-5"><div className="text-xs font-semibold tracking-wider text-slate-500">SELECTED ADDRESS</div><div className="font-mono text-xs break-all mt-2 text-slate-300">{selected.id}</div><div className="grid grid-cols-2 gap-3 mt-4 text-xs"><div><div className="text-slate-600">Interactions</div><div className="font-mono text-slate-300 mt-1">{selected.degree}</div></div><div><div className="text-slate-600">Max risk</div><div className="font-mono mt-1" style={{color:NODE_COLORS[riskBucket(selected.maxRisk)]}}>{selected.maxRisk}/100</div></div><div><div className="text-slate-600">Incoming</div><div className="font-mono text-slate-300 mt-1">{selected.incoming}</div></div><div><div className="text-slate-600">Outgoing</div><div className="font-mono text-slate-300 mt-1">{selected.outgoing}</div></div></div><div className="text-xs text-slate-500 mt-4">{selectedEdges.length} displayed relationship(s) involve this address.</div></div> : <div className="border-t border-sentinel-border pt-5 text-xs text-slate-600 flex gap-2"><Info className="w-4 h-4 shrink-0"/>Click a node to inspect its observed relationships. No off-chain identity is inferred.</div>}</div>
      </div>}
    </div>
  </div>;
};
