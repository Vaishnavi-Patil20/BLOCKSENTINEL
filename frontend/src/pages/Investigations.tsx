import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, FolderOpen, Clock, User, Save, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { InvestigationCase } from "../types";
import { createCase, getCase, loadCases, updateCase } from "../lib/caseStore";
import { useBlockchain } from "../context/BlockchainContext";

const ETH_TX = /^0x[a-fA-F0-9]{64}$/;
const ETH_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export const Investigations: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { transactions, alerts } = useBlockchain();
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTxHash, setNewTxHash] = useState("");
  const [newWallet, setNewWallet] = useState("");
  const [newPriority, setNewPriority] = useState<InvestigationCase["priority"]>("MEDIUM");

  const refresh = () => {
    const next = loadCases();
    setCases(next);
    if (!selectedId) {
      const requested = params.get("case");
      setSelectedId(next.some((item) => item.id === requested) ? requested! : (next[0]?.id || ""));
    }
  };
  useEffect(() => { refresh(); }, []);

  const selected = useMemo(() => cases.find((item) => item.id === selectedId) || null, [cases, selectedId]);
  const selectedTransactions = selected ? selected.transactions.map((hash) => transactions.find((tx) => tx.tx_hash.toLowerCase() === hash.toLowerCase())).filter(Boolean) : [];
  const selectedAlerts = selected ? alerts.filter((alert) => selected.transactions.includes(alert.tx_hash || "")) : [];

  const addCase = () => {
    setMessage("");
    if (!newTitle.trim()) return setMessage("Case title is required.");
    if (newTxHash && !ETH_TX.test(newTxHash.trim())) return setMessage("Transaction hash must be 0x + 64 hexadecimal characters.");
    if (newWallet && !ETH_ADDRESS.test(newWallet.trim())) return setMessage("Wallet address must be 0x + 40 hexadecimal characters.");
    const created = createCase({ title: newTitle.trim(), priority: newPriority, status: "OPEN", assigned_to: "", transactions: newTxHash ? [newTxHash.trim()] : [], wallets: newWallet ? [newWallet.trim().toLowerCase()] : [], notes: "" });
    setCases(loadCases()); setSelectedId(created.id); setNewTitle(""); setNewTxHash(""); setNewWallet(""); setShowNew(false); setMessage("Case created.");
  };

  const saveNote = () => {
    if (!selected || !note.trim()) return;
    const updated = updateCase(selected.id, { notes: selected.notes ? `${selected.notes}\n${note.trim()}` : note.trim() });
    if (updated) { setCases(loadCases()); setNote(""); setMessage("Investigation note saved."); }
  };

  const updateStatus = (status: InvestigationCase["status"]) => {
    if (!selected) return;
    updateCase(selected.id, { status });
    setCases(loadCases());
  };

  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Investigation Workspace</h1><p className="text-sm text-slate-500 mt-1">Work from real alerts, transactions and analyst-created cases only.</p></div><button onClick={() => setShowNew(true)} className="flex items-center px-4 py-2 bg-sentinel-accent text-sentinel-bg font-semibold rounded-lg text-sm"><Plus className="w-4 h-4 mr-2" /> New Case</button></div>
    {message && <div className="text-sm text-slate-400 bg-sentinel-surface border border-sentinel-border rounded-lg p-3">{message}</div>}
    {cases.length === 0 ? <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-12 text-center"><FolderOpen className="w-10 h-10 mx-auto text-slate-700 mb-3"/><div className="text-slate-400">No investigation cases</div><div className="text-xs text-slate-600 mt-1">Start from a real alert or create an analyst case.</div></div> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-3">{cases.map((c, i) => <motion.button key={c.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*.03}} onClick={()=>setSelectedId(c.id)} className={`w-full text-left bg-sentinel-surface border rounded-xl p-5 ${selected?.id===c.id ? "border-sentinel-accent/50" : "border-sentinel-border"}`}><div className="flex justify-between"><span className="text-[10px] font-bold text-slate-500">{c.priority}</span><span className="text-[10px] text-slate-600">{c.status}</span></div><div className="font-semibold mt-2">{c.title}</div><div className="text-xs text-slate-600 mt-2">{c.id} · {c.transactions.length} tx · {c.wallets.length} wallet</div></motion.button>)}</div>
      {selected && <div className="lg:col-span-2 bg-sentinel-surface border border-sentinel-border rounded-xl p-6 space-y-6">
        <div className="flex items-start justify-between gap-4"><div><div className="text-xs text-slate-600 font-mono">{selected.id}</div><h2 className="text-xl font-semibold mt-1">{selected.title}</h2></div><button onClick={()=>navigate("/cases")} className="text-xs text-slate-500 hover:text-slate-200 flex items-center"><ArrowLeft className="w-3 h-3 mr-1"/>Case Management</button></div>
        <div className="grid md:grid-cols-2 gap-4"><div><label className="block text-xs text-slate-500 mb-1">Status</label><select value={selected.status} onChange={(e)=>updateStatus(e.target.value as InvestigationCase["status"])} className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2 text-sm"><option>OPEN</option><option>UNDER_INVESTIGATION</option><option>RESOLVED</option><option>CLOSED</option></select></div><div><label className="block text-xs text-slate-500 mb-1">Priority</label><select value={selected.priority} onChange={(e)=>{ updateCase(selected.id,{priority:e.target.value as InvestigationCase["priority"]}); setCases(loadCases()); }} className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2 text-sm"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></div></div>
        <div className="grid md:grid-cols-2 gap-4"><div className="bg-sentinel-bg border border-sentinel-border rounded-lg p-4"><div className="text-xs text-slate-500 mb-2">Linked Transactions</div>{selected.transactions.length ? selected.transactions.map((hash)=><button key={hash} onClick={()=>navigate(`/tx/${hash}`)} className="block text-left text-xs font-mono text-sentinel-accent hover:underline break-all mb-2">{hash}</button>) : <div className="text-xs text-slate-600">No transaction evidence linked.</div>}</div><div className="bg-sentinel-bg border border-sentinel-border rounded-lg p-4"><div className="text-xs text-slate-500 mb-2">Linked Wallets</div>{selected.wallets.length ? selected.wallets.map((wallet)=><div key={wallet} className="block text-xs font-mono text-slate-400 break-all mb-2">{wallet}</div>) : <div className="text-xs text-slate-600">No wallet evidence linked.</div>}</div></div>
        <div className="bg-sentinel-bg border border-sentinel-border rounded-lg p-4"><div className="text-xs text-slate-500 mb-2">Observed Evidence Available in Current Session</div><div className="text-xs text-slate-400">Transactions loaded: {selectedTransactions.length} · Alerts loaded: {selectedAlerts.length}</div></div>
        <div><label className="block text-xs text-slate-500 mb-2">Investigation Notes</label><textarea value={note} onChange={(e)=>setNote(e.target.value)} rows={5} placeholder="Record an evidence-based observation..." className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-3 text-sm"/><button onClick={saveNote} disabled={!note.trim()} className="mt-3 flex items-center px-4 py-2 bg-sentinel-accent text-sentinel-bg rounded-lg text-sm font-semibold disabled:opacity-40"><Save className="w-4 h-4 mr-2"/>Save Note</button><div className="mt-4 text-sm text-slate-400 whitespace-pre-wrap">{selected.notes || "No notes recorded."}</div></div>
        <div className="flex items-center justify-between text-xs text-slate-600"><span className="flex items-center"><User className="w-3 h-3 mr-1"/>{selected.assigned_to || "Unassigned"}</span><span className="flex items-center"><Clock className="w-3 h-3 mr-1"/>{new Date(selected.created_at).toLocaleString()}</span><span>{selectedTransactions.length ? <span className="text-sentinel-low">Evidence linked</span> : <span>No evidence linked</span>}</span></div>
      </div>}
    </div>}

    {showNew && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"><div className="w-full max-w-xl bg-sentinel-surface border border-sentinel-border rounded-2xl p-6"><h2 className="text-lg font-semibold">Create Investigation Case</h2>{message && <div className="mt-3 text-sm text-slate-400">{message}</div>}<div className="space-y-4 mt-5"><input value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} placeholder="Case title" className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2.5 text-sm"/><div className="grid md:grid-cols-2 gap-4"><select value={newPriority} onChange={(e)=>setNewPriority(e.target.value as InvestigationCase["priority"])} className="bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2.5 text-sm"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select><input value={newTxHash} onChange={(e)=>setNewTxHash(e.target.value)} placeholder="Real tx hash (optional)" className="bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2.5 text-sm font-mono"/></div><input value={newWallet} onChange={(e)=>setNewWallet(e.target.value)} placeholder="Real wallet address (optional)" className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2.5 text-sm font-mono"/></div><div className="flex justify-end gap-2 mt-6"><button onClick={()=>setShowNew(false)} className="px-4 py-2 border border-sentinel-border rounded-lg text-sm">Cancel</button><button onClick={addCase} className="px-4 py-2 bg-sentinel-accent text-sentinel-bg rounded-lg text-sm font-semibold">Create Case</button></div></div></div>}
  </div>;
};
