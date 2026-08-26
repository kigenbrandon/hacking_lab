import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Terminal, LogOut, User, Menu, X } from 'lucide-react';

interface HeaderProps {
  onAuthClick: () => void;
  onLogoClick: () => void;
}

export function Header({ onAuthClick, onLogoClick }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-20 border-b border-[#1c2839] bg-[#0a0e14]/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
            <Terminal className="text-green-400" size={20} />
          </div>
          <div className="text-left">
            <h1 className="text-base font-bold text-white terminal-text leading-none">
              hex<span className="text-green-400">hack</span>
            </h1>
            <p className="text-[10px] text-slate-500 terminal-text leading-none mt-0.5">
              hacking_labs
            </p>
          </div>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-400 terminal-text">
                <User size={14} className="text-green-400" />
                <span className="text-slate-300">{user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-400 transition-colors terminal-text"
              >
                <LogOut size={14} /> logout
              </button>
            </>
          ) : (
            <button
              onClick={onAuthClick}
              className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors terminal-text border border-green-500/30 bg-green-500/5 px-4 py-1.5 rounded-lg hover:bg-green-500/10"
            >
              <Terminal size={14} /> $ access_terminal
            </button>
          )}
        </div>

        {/* Mobile menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-slate-400"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#1c2839] px-6 py-3 animate-fade-in">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-400 terminal-text">
                <User size={14} className="text-green-400" />
                <span>{user.email}</span>
              </div>
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-400 transition-colors terminal-text"
              >
                <LogOut size={14} /> logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => { onAuthClick(); setMenuOpen(false); }}
              className="flex items-center gap-2 text-sm text-green-400 terminal-text"
            >
              <Terminal size={14} /> $ access_terminal
            </button>
          )}
        </div>
      )}
    </header>
  );
}
