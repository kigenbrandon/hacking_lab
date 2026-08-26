import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { X, Terminal, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email, password);

    if (error) {
      setError(error);
      setLoading(false);
    } else {
      onClose();
      setEmail('');
      setPassword('');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#0d1117] border border-[#1c2839] rounded-2xl shadow-2xl shadow-green-500/10 overflow-hidden animate-float-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 hex-grid-bg opacity-50" />

        <div className="relative z-10 p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <Terminal className="text-green-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white terminal-text">
                {mode === 'signin' ? 'access_terminal' : 'register_operator'}
              </h2>
              <p className="text-sm text-slate-500 terminal-text">
                {mode === 'signin' ? 'authenticate to continue' : 'create your operator account'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 terminal-text mb-1.5 block">EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="operator@hacker.net"
                  className="w-full bg-[#0a0e14] border border-[#1c2839] rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 terminal-text focus:border-green-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 terminal-text mb-1.5 block">PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full bg-[#0a0e14] border border-[#1c2839] rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-600 terminal-text focus:border-green-500/50 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-400 terminal-text">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 text-green-400 font-medium py-2.5 rounded-lg transition-all terminal-text text-sm disabled:opacity-50"
            >
              {loading ? 'processing...' : mode === 'signin' ? '$ login' : '$ register'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === 'signin' ? (
              <>
                No account?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="text-green-400 hover:text-green-300 terminal-text"
                >
                  register_operator
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  onClick={() => { setMode('signin'); setError(null); }}
                  className="text-green-400 hover:text-green-300 terminal-text"
                >
                  access_terminal
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
