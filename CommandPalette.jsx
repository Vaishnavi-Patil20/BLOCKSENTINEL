import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useStore';
import { Search, FileText, Wallet, AlertTriangle, Microscope, Zap, BarChart3 } from 'lucide-react';

const commands = [
  { label: 'Go to Dashboard', icon: Zap, action: (n) => n('/dashboard') },
  { label: 'Live Monitoring', icon: Zap, action: (n) => n('/live') },
  { label: 'View Alerts', icon: AlertTriangle, action: (n) => n('/alerts') },
  { label: 'Create Investigation', icon: Microscope, action: (n) => n('/investigations') },
  { label: 'View Analytics', icon: BarChart3, action: (n) => n('/analytics') },
  { label: 'Wallet Search', icon: Wallet, action: (n) => n('/wallets') },
  { label: 'Transaction Search', icon: FileText, action: (n) => n('/transactions') },
];

export const CommandPalette = () => {
  const { commandPaletteOpen, setCommandPalette } = useAppStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPalette(!commandPaletteOpen);
      }
      if (e.key === 'Escape') setCommandPalette(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm" onClick={() => setCommandPalette(false)}>
      <div className="w-full max-w-lg bg-sentinel-800 border border-sentinel-600/30 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-sentinel-600/20">
          <Search size={18} className="text-gray-400" />
          <input autoFocus type="text" placeholder="Type a command..." className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-500" value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="text-xs text-gray-500 bg-sentinel-700 px-2 py-1 rounded">ESC</span>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <button key={i} onClick={() => { cmd.action(navigate); setCommandPalette(false); setQuery(''); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sentinel-700/50 text-left">
                <Icon size={18} className="text-gray-400" />
                <span className="text-sm text-gray-200">{cmd.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
