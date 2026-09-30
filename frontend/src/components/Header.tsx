import { Search, Bell, Command } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBlockchain } from "../context/BlockchainContext";

export const Header: React.FC<{ onOpenCommand: () => void }> = ({ onOpenCommand }) => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { alerts } = useBlockchain();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.startsWith("0x") && search.length === 66) {
      navigate(`/tx/${search}`);
    } else if (search.startsWith("0x") && search.length === 42) {
      navigate(`/wallet/${search}`);
    }
    setSearch("");
  };

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL" && a.status === "OPEN").length;

  return (
    <header className="h-16 bg-sentinel-surface/80 backdrop-blur border-b border-sentinel-border flex items-center justify-between px-6 sticky top-0 z-40">
      <form onSubmit={handleSearch} className="flex-1 max-w-xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transaction, wallet, block, case..."
          className="w-full bg-sentinel-bg border border-sentinel-border rounded-md pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sentinel-accent/50 focus:ring-1 focus:ring-sentinel-accent/50"
        />
        <button
          type="button"
          onClick={onOpenCommand}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-xs text-slate-600 border border-sentinel-border rounded px-1.5 py-0.5"
        >
          <Command className="w-3 h-3 mr-1" />K
        </button>
      </form>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          {criticalCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-sentinel-critical rounded-full animate-pulse" />
          )}
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-sentinel-accent/20 border border-sentinel-accent/30 flex items-center justify-center text-xs font-bold text-sentinel-accent">
            AS
          </div>
          <div className="text-sm">
            <div className="font-medium">Analyst</div>
            <div className="text-xs text-slate-500">Security Operations</div>
          </div>
        </div>
      </div>
    </header>
  );
};
