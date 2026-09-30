import { motion } from "framer-motion";
import { FolderKanban, FileText, CheckCircle, Plus, ExternalLink, X, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { InvestigationCase } from "../types";
import { createCase, getGeneratedReportCount, incrementGeneratedReportCount, loadCases } from "../lib/caseStore";
import { downloadCasePdf } from "../lib/pdf";
import { useBlockchain } from "../context/BlockchainContext";

const ETH_TX = /^0x[a-fA-F0-9]{64}$/;
const ETH_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export const Cases: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { transactions, alerts } = useBlockchain();
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [selected, setSelected] = useState<InvestigationCase | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<InvestigationCase["priority"]>("MEDIUM");
  const [txHash, setTxHash] = useState("");
  const [wallet, setWallet] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [reportCount, setReportCount] = useState(getGeneratedReportCount());
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeRisk, setIncludeRisk] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);

  const refresh = () => {
    const next = loadCases();
    setCases(next);
    if (selected) setSelected(next.find((item) => item.id === selected.id) || null);
  };
  useEffect(() => { refresh(); if (searchParams.get("new") === "1") setShowNew(true); }, []);

  const realAlertCount = alerts.length;
  const active = useMemo(() => cases.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED").length, [cases]);
  const resolved = useMemo(() => cases.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length, [cases]);

  const submit = () => {
    setError("");
    if (!title.trim()) return setError("Case title is required.");
    if (txHash && !ETH_TX.test(txHash.trim())) return setError("Transaction hash must be 0x + 64 hexadecimal characters.");
    if (wallet && !ETH_ADDRESS.test(wallet.trim())) return setError("Wallet address must be 0x + 40 hexadecimal characters.");
    const created = createCase({ title: title.trim(), priority, status: "OPEN", assigned_to: "", transactions: txHash ? [txHash.trim()] : [], wallets: wallet ? [wallet.trim().toLowerCase()] : [], notes: notes.trim() });
    setTitle(""); setTxHash(""); setWallet(""); setNotes(""); setShowNew(false); setSelected(created); refresh();
  };

  const generatePdf = () => {
    if (!selected) return;
    const relatedTx = selected.transactions.map((hash) => transactions.find((tx) => tx.tx_hash.toLowerCase() === hash.toLowerCase())).filter(Boolean);
    const relatedAlerts = relatedTx.map((tx) => alerts.find((a) => a.tx_hash === tx?.tx_hash)).filter(Boolean);
    const sections: { heading: string; lines: string[] }[] = [
      { heading: "Case", lines: [`ID: ${selected.id}`, `Title: ${selected.title}`, `Priority: ${selected.priority}`, `Status: ${selected.status}`, `Created: ${selected.created_at}`, `Assigned to: ${selected.assigned_to || "Unassigned"}`] },
    ];
    if (includeEvidence) sections.push({ heading: "Linked Evidence", lines: [...selected.transactions.map((hash) => `Transaction: ${hash}`), ...selected.wallets.map((value) => `Wallet: ${value}`), `Live alert records linked in current session: ${relatedAlerts.length}`, `Transaction records currently available in dashboard buffer: ${relatedTx.length}`] });
    if (includeRisk) sections.push({ heading: "Risk Analysis", lines: relatedTx.flatMap((tx) => tx ? [`${tx.tx_hash}: ${tx.risk_level || "Not assessed"} (${typeof tx.risk_score === "number" ? `${tx.risk_score}/100` : "score unavailable"})`, tx.risk?.explanation || "Risk explanation unavailable for this transaction."] : []) });
    if (includeNotes) sections.push({ heading: "Investigation Notes", lines: [selected.notes || "No notes recorded."] });
    downloadCasePdf(selected.title, sections, `${selected.id}-investigation-report.pdf`);
    setReportCount(incrementGeneratedReportCount());
  };

  return <div className="space-y-6">
    <div className="flex items-end justify-between gap-4"><div><h1 className="text-2xl font-bold">Case Management</h1><p className="text-sm text-slate-500 mt-1">Analyst-created cases backed by observed evidence. No seed cases are included.</p></div><button onClick={() => setShowNew(true)} className="flex items-center px-4 py-2 bg-sentinel-accent text-sentinel-bg font-semibold rounded-lg text-sm"><Plus className="w-4 h-4 mr-2" /> New Case</button></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Stat label="Active Cases" value={active} icon={FolderKanban} />
      <Stat label="Resolved / Closed" value={resolved} icon={CheckCircle} />
      <Stat label="Reports Generated" value={reportCount} icon={FileText} />
    </div>

    <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6">
      <div className="flex items-center justify-between gap-4 mb-4"><div><h3 className="font-semibold">Investigation Report</h3><p className="text-xs text-slate-500 mt-1">Generate a PDF only from the selected case and data currently available to BlockSentinel.</p></div><span className="text-xs text-slate-600">Live alerts: {realAlertCount}</span></div>
      {!selected ? <div className="text-sm text-slate-600 py-5">Select a case below to generate a report.</div> : <><div className="flex flex-wrap gap-4 text-sm text-slate-400">{[["Transaction evidence",includeEvidence,setIncludeEvidence],["Risk analysis",includeRisk,setIncludeRisk],["Investigation notes",includeNotes,setIncludeNotes]].map(([label,checked,setter]) => <label key={String(label)} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(checked)} onChange={(e) => (setter as (v:boolean)=>void)(e.target.checked)} className="accent-sentinel-accent" />{String(label)}</label>)}</div><button onClick={generatePdf} className="mt-5 flex items-center px-5 py-2.5 bg-sentinel-accent text-sentinel-bg font-semibold rounded-lg text-sm"><Download className="w-4 h-4 mr-2" /> Generate PDF for {selected.id}</button></>}
    </div>

    {cases.length === 0 ? <div className="bg-sentinel-surface border border-sentinel-border rounded-xl p-10 text-center text-sm text-slate-500">No cases exist yet. Create a case from real evidence or from an actual alert.</div> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">{cases.map((c) => <motion.div key={c.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`bg-sentinel-surface border rounded-xl p-5 ${selected?.id===c.id ? "border-sentinel-accent/50" : "border-sentinel-border"}`}><button onClick={() => setSelected(c)} className="w-full text-left"><div className="flex justify-between text-xs"><span className="font-mono text-slate-500">{c.id}</span><span className="text-sentinel-accent">{c.status}</span></div><h3 className="font-semibold mt-3">{c.title}</h3><p className="text-xs text-slate-500 mt-2">Priority: {c.priority}</p><p className="text-xs text-slate-600 mt-2">{c.transactions.length} linked transaction(s) · {c.wallets.length} linked wallet(s)</p></button><div className="flex gap-2 mt-4"><button onClick={() => navigate(`/investigations?case=${encodeURIComponent(c.id)}`)} className="text-xs px-3 py-2 border border-sentinel-border rounded-lg hover:border-sentinel-accent/40"><ExternalLink className="w-3 h-3 inline mr-1" />Investigate</button><button onClick={() => setSelected(c)} className="text-xs px-3 py-2 border border-sentinel-border rounded-lg hover:border-sentinel-accent/40">Select</button></div></motion.div>)}</div>}

    {showNew && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"><div className="w-full max-w-2xl bg-sentinel-surface border border-sentinel-border rounded-2xl p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Create Case</h2><button onClick={() => setShowNew(false)}><X className="w-5 h-5 text-slate-500" /></button></div><p className="text-xs text-slate-500 mt-1">All evidence fields are optional, but when supplied they must be valid Ethereum identifiers.</p>{error && <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300">{error}</div>}<div className="grid md:grid-cols-2 gap-4 mt-5"><input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Case title" className="md:col-span-2 bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2.5 text-sm" /><select value={priority} onChange={(e)=>setPriority(e.target.value as InvestigationCase["priority"])} className="bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2.5 text-sm"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select><input value={txHash} onChange={(e)=>setTxHash(e.target.value)} placeholder="Real tx hash (optional)" className="bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2.5 text-sm font-mono" /><input value={wallet} onChange={(e)=>setWallet(e.target.value)} placeholder="Real wallet address (optional)" className="md:col-span-2 bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2.5 text-sm font-mono" /><textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Investigation note (optional)" rows={4} className="md:col-span-2 bg-sentinel-bg border border-sentinel-border rounded-lg px-3 py-2.5 text-sm" /></div><div className="flex justify-end gap-2 mt-5"><button onClick={()=>setShowNew(false)} className="px-4 py-2 border border-sentinel-border rounded-lg text-sm">Cancel</button><button onClick={submit} className="px-4 py-2 bg-sentinel-accent text-sentinel-bg rounded-lg font-semibold text-sm">Create Case</button></div></div></div>}
  </div>;
};

const Stat: React.FC<{label:string;value:number;icon:React.ElementType}> = ({label,value,icon:Icon}) => <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6"><Icon className="w-6 h-6 text-sentinel-accent mb-3"/><div className="text-3xl font-bold font-mono">{value}</div><div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{label}</div></motion.div>;
