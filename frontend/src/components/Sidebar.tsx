import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Activity, ArrowRightLeft, Wallet, Brain,
  GitGraph, Bell, Microscope, BarChart3, FolderKanban,
  Settings, Shield, Radio,
} from "lucide-react";
import { useBlockchain } from "../context/BlockchainContext";

const navItems = [
  { label: "Command Center", path: "/dashboard", icon: LayoutDashboard },
  { label: "Live Monitoring", path: "/live", icon: Activity },
  { label: "Transactions", path: "/transactions", icon: ArrowRightLeft },
  { label: "Wallet Intelligence", path: "/wallets", icon: Wallet },
  { label: "Risk Intelligence", path: "/risk", icon: Brain },
  { label: "Transaction Graph", path: "/graph", icon: GitGraph },
  { label: "Alerts", path: "/alerts", icon: Bell },
  { label: "Investigations", path: "/investigations", icon: Microscope },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Cases", path: "/cases", icon: FolderKanban },
  { label: "Settings", path: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { connectionState, metrics } = useBlockchain();
  const location = useLocation();

  return (
    <aside className="w-64 bg-sentinel-surface border-r border-sentinel-border flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-sentinel-border">
        <Shield className="w-6 h-6 text-sentinel-accent mr-3" />
        <span className="font-bold tracking-wider text-sm">BLOCKSENTINEL</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sentinel-accent/10 text-sentinel-accent border border-sentinel-accent/20"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.label}
              {item.label === "Alerts" && metrics.alerts_open > 0 && (
                <span className="ml-auto bg-sentinel-critical/20 text-sentinel-critical text-xs px-2 py-0.5 rounded-full">
                  {metrics.alerts_open > 99 ? "99+" : metrics.alerts_open}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sentinel-border">
        <div className="flex items-center text-xs text-slate-400">
          <Radio
            className={`w-3 h-3 mr-2 ${
              connectionState.status === "LIVE" ? "text-sentinel-low" : "text-sentinel-muted"
            }`}
          />
          <span className="uppercase tracking-wider">{connectionState.network}</span>
          <span
            className={`ml-auto ${
              connectionState.status === "LIVE" ? "text-sentinel-low" : "text-sentinel-high"
            }`}
          >
            {connectionState.status === "LIVE" ? "CONNECTED" : connectionState.status}
          </span>
        </div>
        {connectionState.last_block && (
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            Block #{parseInt(connectionState.last_block).toLocaleString()}
          </div>
        )}
      </div>
    </aside>
  );
};
