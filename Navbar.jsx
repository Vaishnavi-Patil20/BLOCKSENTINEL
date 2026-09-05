import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Command, Menu, X, User, LogOut } from 'lucide-react';
import { useAppStore, useAuthStore } from '../store/useStore';
import { searchAPI } from '../services/api';

export const Navbar = () => {
  const { sidebarOpen, toggleSidebar, setCommandPalette } = useAppStore();
  const { user, logout } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (q) => {
    setQuery(q);
    if (q.length < 3) { setSearchResults([]); return; }
    try {
      const res = await searchAPI.search(q);
      setSearchResults(res.data.results || []);
    } catch (e) { setSearchResults([]); }
  };

  const handleResultClick = (result) => {
    setSearchOpen(false); setQuery(''); setSearchResults([]);
    if (result.type === 'transaction') navigate(`/transactions/${result.id}`);
    else if (result.type === 'wallet') navigate(`/wallets/${result.id}`);
    else if (result.type === 'case') navigate(`/investigations/${result.id}`);
    else if (result.type === 'alert') navigate('/alerts');
  };

  return (
    <nav className="h-16 bg-sentinel-800/80 backdrop-blur-md border-b border-sentinel-600/20 flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 hover:bg-sentinel-700 rounded-lg lg:hidden">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sentinel-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BS</span>
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">BlockSentinel</span>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input type="text" placeholder="Search transaction, wallet, block, case..." className="w-full bg-sentinel-900 border border-sentinel-600/30 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-sentinel-accent"
            onFocus={() => setSearchOpen(true)} onChange={(e) => handleSearch(e.target.value)} value={query} />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-500 bg-sentinel-700 px-1.5 py-0.5 rounded">
            <Command size={10} />K
          </div>
        </div>
        {searchOpen && (query.length >= 3 || searchResults.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-sentinel-800 border border-sentinel-600/30 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50">
            {searchResults.length === 0 ? <div className="p-4 text-gray-500 text-sm">No results found</div> : (
              searchResults.map((r, i) => (
                <button key={i} onClick={() => handleResultClick(r)} className="w-full text-left px-4 py-3 hover:bg-sentinel-700/50 border-b border-sentinel-600/10 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-200">{r.title}</span>
                    <span className="text-xs text-gray-500 capitalize">{r.type}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.subtitle}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setCommandPalette(true)} className="p-2 hover:bg-sentinel-700 rounded-lg hidden md:block">
          <Command size={18} className="text-gray-400" />
        </button>
        <button className="p-2 hover:bg-sentinel-700 rounded-lg relative">
          <Bell size={18} className="text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sentinel-critical rounded-full"></span>
        </button>
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-2 hover:bg-sentinel-700 rounded-lg">
            <div className="w-8 h-8 bg-sentinel-600 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <span className="text-sm font-medium hidden md:block">{user?.fullName || 'User'}</span>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-sentinel-800 border border-sentinel-600/30 rounded-xl shadow-2xl z-50 py-1">
              <div className="px-4 py-2 border-b border-sentinel-600/20">
                <div className="text-sm font-medium">{user?.fullName}</div>
                <div className="text-xs text-gray-500">{user?.role}</div>
              </div>
              <button onClick={() => { setShowUserMenu(false); navigate('/settings'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-sentinel-700/50">Settings</button>
              <button onClick={() => { logout(); window.location.href = '/login'; }} className="w-full text-left px-4 py-2 text-sm hover:bg-sentinel-700/50 text-red-400 flex items-center gap-2">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
