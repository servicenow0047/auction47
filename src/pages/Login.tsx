import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function Login() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError('');

    try {
      // Temporarily store it to test the API
      localStorage.setItem('admin_password', password);

      await api.checkPassword();

      // If successful, redirect to dashboard
      navigate('/');
    } catch (err: any) {
      localStorage.removeItem('admin_password');
      setError(err.message || 'Invalid Password');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden">

      {/* Massive Background Watermark */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
        <div className="text-white/[0.03] font-black text-[15rem] md:text-[25rem] leading-none tracking-tighter -rotate-12 select-none whitespace-nowrap">
          AUCTION 47
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 flex items-center justify-center rounded-2xl shadow-inner">
            <Lock size={32} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Portal</h1>
          <p className="text-slate-500 font-medium mt-1">Enter master password to continue</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 mb-6 text-sm font-bold border border-red-100">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:bg-white outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Enter Dashboard'}
          </button>
        </form>
      </div>

      {/* Promotional Footer */}
      <div className="absolute bottom-8 left-0 w-full flex flex-col items-center justify-center z-10 opacity-60 hover:opacity-100 transition-opacity">
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Powered By</p>
        <p className="text-white text-xl font-black tracking-widest mb-1">AUCTION 47</p>
        <a href="mailto:auction047@gmail.com" className="text-purple-400 text-xs font-mono hover:text-purple-300 hover:underline transition-colors flex items-center gap-2">
          Support: auction047@gmail.com
        </a>
      </div>
    </div>
  );
}
