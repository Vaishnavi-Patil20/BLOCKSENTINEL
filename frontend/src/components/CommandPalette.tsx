import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRightLeft, Wallet, Bell, Microscope, Activity, LayoutDashboard } from "lucide-react";

const commands = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, shortcut: "G D" },
  { label: "Live Monitoring", path: "/live", icon: Activity, shortcut: "G L" },
  { label: "Transactions", path: "/transactions", icon: ArrowRightLeft, shortcut: "G T" },
  { label: "Wallets", path: "/wallets", icon: Wallet, shortcut: "G W" },
  { label: "Alerts", path: "/alerts", icon: Bell, shortcut: "G A" },
  { label: "Investigations", path: "/investigations", icon: Microscope, shortcut: "G I" },
];

export const CommandPalette: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        open ? onClose() : undefined;
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-sentinel-surface border border-sentinel-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center px-4 py-3 border-b border-sentinel-border">
              <Search className="w-5 h-5 text-slate-500 mr-3" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search AegisChain..."
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 outline-none"
              />
              <span className="text-xs text-slate-600 border border-sentinel-border rounded px-1.5">ESC</span>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.path}
                    onClick={() => handleSelect(cmd.path)}
                    className="w-full flex items-center px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                  >
                    <Icon className="w-4 h-4 text-slate-400 mr-3" />
                    <span className="flex-1 text-sm text-slate-200">{cmd.label}</span>
                    <span className="text-xs text-slate-600 font-mono">{cmd.shortcut}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
