import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

export interface ToastPayload {
  id: string;
  type: 'xp' | 'achievement' | 'flag';
  label: string;
  detail?: string;
  icon?: string;
  xp?: number;
}

interface Props {
  toasts: ToastPayload[];
  onDismiss: (id: string) => void;
}

export function AchievementToast({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastPayload; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 400);
    }, 3200);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
    };
  }, [toast.id, onDismiss]);

  const borderColor =
    toast.type === 'flag'
      ? 'border-amber-500/60'
      : toast.type === 'achievement'
      ? 'border-cyan-500/60'
      : 'border-green-500/40';

  const glowColor =
    toast.type === 'flag'
      ? 'shadow-amber-500/20'
      : toast.type === 'achievement'
      ? 'shadow-cyan-500/20'
      : 'shadow-green-500/20';

  return (
    <div
      className={`pointer-events-auto bg-[#0d1117] border ${borderColor} rounded-xl px-4 py-3 shadow-lg ${glowColor} shadow-md
        flex items-center gap-3 min-w-[240px] max-w-xs
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
    >
      {toast.icon ? (
        <span className="text-xl leading-none">{toast.icon}</span>
      ) : (
        <Zap size={18} className="text-green-400 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-white terminal-text truncate">{toast.label}</div>
        {toast.detail && (
          <div className="text-[10px] text-slate-400 terminal-text truncate">{toast.detail}</div>
        )}
      </div>
      {toast.xp !== undefined && (
        <div className="text-xs font-bold text-green-400 terminal-text shrink-0">
          +{toast.xp} XP
        </div>
      )}
    </div>
  );
}
