import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';

const roles = ['Analyst', 'Investigator', 'Compliance Officer', 'Administrator'];

const Signup = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ fullName: '', organization: '', email: '', password: '', role: 'Analyst' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authAPI.signup(form);
      setAuth(res.data.user, res.data.token);
      navigate('/onboarding');
    } catch (err) { setError(err.response?.data?.error || 'Signup failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-sentinel-900">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield size={48} className="mx-auto mb-4 text-sentinel-accent" />
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-gray-500">Start your blockchain intelligence journey</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm"><AlertCircle size={16} /> {error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="input-field" placeholder="Full Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
          <input className="input-field" placeholder="Organization" value={form.organization} onChange={e => setForm({...form, organization: e.target.value})} />
          <input required type="email" className="input-field" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input required type="password" className="input-field" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <select className="input-field" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-50">{loading ? 'Creating account...' : 'Create Account'}</button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-500">Already have an account? <Link to="/login" className="text-sentinel-accent hover:underline">Sign in</Link></div>
      </motion.div>
    </div>
  );
};

export default Signup;
