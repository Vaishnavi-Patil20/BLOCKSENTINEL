import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Database, Bell, Shield, Search, FileSearch } from 'lucide-react';

const steps = [
  { title: 'Connect blockchain data', icon: Database, desc: 'Ethereum Mainnet connected automatically' },
  { title: 'Configure monitoring', icon: Search, desc: 'Real-time transaction monitoring active' },
  { title: 'Set risk thresholds', icon: Shield, desc: 'Default thresholds applied' },
  { title: 'Configure alerts', icon: Bell, desc: 'Alert system ready' },
  { title: 'Create your first investigation', icon: FileSearch, desc: 'Workspace ready' },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const next = () => { if (current < steps.length - 1) setCurrent(current + 1); else navigate('/dashboard'); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sentinel-900 p-8">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-2">Welcome to BlockSentinel</h1>
        <p className="text-gray-500 text-center mb-10">Let's configure your intelligence workspace.</p>
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((_, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${i <= current ? 'bg-sentinel-accent' : 'bg-sentinel-600'}`}></div>
              {i < steps.length - 1 && <div className={`w-full h-0.5 ${i < current ? 'bg-sentinel-accent' : 'bg-sentinel-600'} flex-1 min-w-[40px]`}></div>}
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card text-center py-12">
            {current > 0 && steps.slice(0, current).map((s, i) => (
              <div key={i} className="flex items-center gap-3 mb-3 text-green-400 justify-center"><Check size={16} /> <span className="text-sm">{s.title}</span></div>
            ))}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-sentinel-accent/10 rounded-full mb-4">
              {(() => { const Icon = steps[current].icon; return <Icon size={28} className="text-sentinel-accent" />; })()}
            </div>
            <h3 className="text-xl font-bold mb-2">{steps[current].title}</h3>
            <p className="text-gray-400 mb-6">{steps[current].desc}</p>
            <button onClick={next} className="btn-primary px-8">{current < steps.length - 1 ? 'Continue' : 'Enter Command Center'}</button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
