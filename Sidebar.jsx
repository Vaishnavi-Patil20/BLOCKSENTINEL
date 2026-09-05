import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useStore';
import {
  LayoutDashboard, Zap, Search, Wallet, Brain, Network, AlertTriangle,
  Microscope, Bot, BarChart3, BookOpen, ScrollText, Settings, Activity,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Command Center' },
  { path: '/live', icon: Zap, label: 'Live Monitoring' },
  { path: '/transactions', icon: Search, label: 'Transactions' },
  { path: '/wallets', icon: Wallet, label: 'Wallet Intelligence' },
  { path: '/risk', icon: Brain, label: 'Risk Intelligence' },
  { path: '/graph', icon: Network, label: 'Transaction Graph' },
  { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
  { path: '/investigations', icon: Microscope, label: 'Investigations' },
  { path: '/ai', icon: Bot, label: 'AI Intelligence' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/cases', icon: BookOpen, label: 'Cases' },
  { path: '/audit', icon: ScrollText, label: 'Audit Trail' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-sentinel-800 border-r border-sentinel-600/20 flex flex-col transition-all duration-300 h-screen sticky top-0`}>
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button key={item.path} onClick={() => navigate(item.path)} className={`nav-item w-full ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center' : ''}`} title={item.label}>
                <Icon size={20} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-sentinel-600/20">
        <button onClick={toggleSidebar} className="w-full flex items-center justify-center p-2 hover:bg-sentinel-700 rounded-lg text-gray-400">
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
        <div className={`mt-3 flex items-center gap-2 px-3 py-2 ${!sidebarOpen ? 'justify-center' : ''}`}>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          {sidebarOpen && (
            <div className="text-xs">
              <div className="text-gray-300 font-medium">Ethereum Mainnet</div>
              <div className="text-gray-500">CONNECTED</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
