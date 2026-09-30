import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Bell, Database, Users, Key } from "lucide-react";

const tabs = [
  { id: "account", label: "Account", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "blockchain", label: "Blockchain Sources", icon: Database },
  { id: "users", label: "User Management", icon: Users },
  { id: "api", label: "API Configuration", icon: Key },
];

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("account");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your BlockSentinel workspace</p>
      </div>

      <div className="flex space-x-1 bg-sentinel-surface border border-sentinel-border rounded-lg p-1 w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === t.id ? "bg-sentinel-accent/15 text-sentinel-accent" : "text-slate-400 hover:text-slate-200"}`}>
              <Icon className="w-4 h-4 mr-2" />{t.label}
            </button>
          );
        })}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-sentinel-surface border border-sentinel-border rounded-xl p-6 space-y-6">
        {activeTab === "account" && (
          <>
            <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label><input defaultValue="Security Analyst" className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-sentinel-accent/50" /></div>
            <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Organization</label><input defaultValue="BlockSentinel Ops" className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-sentinel-accent/50" /></div>
            <div><label className="block text-sm font-medium text-slate-400 mb-1.5">Role</label><select className="w-full bg-sentinel-bg border border-sentinel-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-sentinel-accent/50"><option>Analyst</option><option>Investigator</option><option>Compliance Officer</option><option>Administrator</option></select></div>
          </>
        )}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            {["Critical Alerts", "High Risk Transactions", "System Downtime", "Daily Digest"].map((n) => (
              <label key={n} className="flex items-center justify-between p-3 bg-sentinel-bg rounded-lg border border-sentinel-border cursor-pointer">
                <span className="text-sm text-slate-300">{n}</span><input type="checkbox" defaultChecked className="accent-sentinel-accent" />
              </label>
            ))}
          </div>
        )}
        {activeTab === "blockchain" && (
          <div className="space-y-4">
            <div className="p-4 bg-sentinel-bg rounded-lg border border-sentinel-border">
              <div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">Ethereum Mainnet</span><span className="text-xs bg-sentinel-low/15 text-sentinel-low px-2 py-0.5 rounded border border-sentinel-low/30">CONNECTED</span></div>
              <div className="text-xs text-slate-500 font-mono">wss://eth-mainnet.g.alchemy.com/...</div>
            </div>
            <div className="p-4 bg-sentinel-bg rounded-lg border border-sentinel-border opacity-50">
              <div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">Polygon PoS</span><span className="text-xs bg-sentinel-muted/15 text-sentinel-muted px-2 py-0.5 rounded border border-sentinel-muted/30">OFFLINE</span></div>
            </div>
          </div>
        )}
        {activeTab === "users" && <div className="text-sm text-slate-500 text-center py-8">User management requires Administrator privileges.</div>}
        {activeTab === "api" && (
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-400 mb-1.5">API Key</label><div className="flex"><input defaultValue="bs_live_xxxxxxxxxxxxxxxx" readOnly className="flex-1 bg-sentinel-bg border border-sentinel-border rounded-l-lg px-4 py-2 text-sm font-mono text-slate-500" /><button className="px-4 py-2 bg-sentinel-accent text-sentinel-bg text-sm font-medium rounded-r-lg hover:bg-sentinel-accent-dim">Regenerate</button></div></div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
