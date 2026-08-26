import { useState, useMemo } from 'react';
import { useMachines } from '@/lib/usePlatform';
import { useAuth } from '@/lib/auth';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/lib/ranks';
import type { Machine, MachineSolve } from '@/lib/types';
import { Terminal } from '@/components/Terminal';
import { getLabEnvironment } from '@/lib/labEnvironments';
import {
  Server, Lock, CheckCircle2, Trophy, Terminal as TermIcon,
  ChevronLeft, Flag, Cpu, Globe, Zap, Star,
} from 'lucide-react';

export function MachinesPage() {
  const { machines, solves, loading } = useMachines();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Machine | null>(null);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <TermIcon className="text-green-400 animate-spin-slow" size={32} />
      </div>
    );
  }

  if (selected) {
    return <MachineDetail machine={selected} solves={solves} onBack={() => setSelected(null)} />;
  }

  const mySolves = user ? solves.filter((s) => s.user_id === user.id) : [];
  const mySolvedMachineIds = new Set(mySolves.map((s) => s.machine_id));

  return (
    <div className="h-full overflow-y-auto animate-fade-in">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Server className="text-green-400" size={16} />
            <span className="text-xs terminal-text text-slate-500 uppercase tracking-wider">machines</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Target Machines</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Attack simulated vulnerable machines. Capture user and system flags to earn points and climb the leaderboard.
          </p>
        </div>

        {user && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#0d1117] border border-green-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400 terminal-text">{mySolvedMachineIds.size}</div>
              <div className="text-xs text-slate-500 mt-1">Machines Solved</div>
            </div>
            <div className="bg-[#0d1117] border border-cyan-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400 terminal-text">{machines.length}</div>
              <div className="text-xs text-slate-500 mt-1">Total Machines</div>
            </div>
            <div className="bg-[#0d1117] border border-amber-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-400 terminal-text">
                {mySolves.reduce((sum, s) => {
                  const m = machines.find((m) => m.id === s.machine_id);
                  return sum + (m ? (s.tier === 'system' ? m.points * 2 : m.points) : 0);
                }, 0)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Points Earned</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {machines.map((m) => {
            const machineSolves = solves.filter((s) => s.machine_id === m.id);
            const solveCount = new Set(machineSolves.map((s) => s.user_id)).size;
            const mySolve = mySolvedMachineIds.has(m.id);
            const mySystemSolve = machineSolves.some((s) => s.user_id === user?.id && s.tier === 'system');
            const diffColor = DIFFICULTY_COLORS[m.difficulty - 1];

            return (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className="text-left bg-[#0d1117] border border-[#1c2839] rounded-xl p-5 hover:border-slate-600 hover:bg-[#111821] transition-all group hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center border"
                      style={{ borderColor: diffColor + '40', background: diffColor + '10' }}
                    >
                      {m.os === 'Windows' ? (
                        <Cpu size={18} style={{ color: diffColor }} />
                      ) : (
                        <Globe size={18} style={{ color: diffColor }} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {m.title}
                      </h3>
                      <span className="text-xs terminal-text text-slate-500">{m.os}</span>
                    </div>
                  </div>
                  {mySystemSolve ? (
                    <Trophy className="text-amber-400" size={18} />
                  ) : mySolve ? (
                    <CheckCircle2 className="text-green-400" size={18} />
                  ) : (
                    <Lock className="text-slate-600" size={18} />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: i < m.difficulty ? diffColor : '#334155' }}
                      />
                    ))}
                    <span className="text-xs terminal-text text-slate-500 ml-1">{DIFFICULTY_LABELS[m.difficulty - 1]}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs terminal-text text-slate-500">
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-amber-400" /> {m.points}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap size={11} className="text-cyan-400" /> {solveCount} solves
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MachineDetail({ machine, solves, onBack }: { machine: Machine; solves: MachineSolve[]; onBack: () => void }) {
  const { user } = useAuth();
  const { submitFlag } = useMachines();
  const [flagInput, setFlagInput] = useState('');
  const [flagTier, setFlagTier] = useState<'user' | 'system'>('user');
  const [submitMsg, setSubmitMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [showTerminal, setShowTerminal] = useState(true);

  const env = useMemo(() => {
    try {
      const parsed = JSON.parse(machine.environment);
      return getLabEnvironment(machine.slug);
    } catch {
      return getLabEnvironment('default');
    }
  }, [machine.slug]);

  const mySolves = solves.filter((s) => s.machine_id === machine.id && s.user_id === user?.id);
  const hasUserSolve = mySolves.some((s) => s.tier === 'user');
  const hasSystemSolve = mySolves.some((s) => s.tier === 'system');
  const diffColor = DIFFICULTY_COLORS[machine.difficulty - 1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagInput.trim()) return;
    const result = await submitFlag(machine, flagInput, flagTier);
    setSubmitMsg(result);
    if (result.success) setFlagInput('');
  };

  return (
    <div className="h-full overflow-y-auto animate-fade-in">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6 terminal-text"
        >
          <ChevronLeft size={16} /> cd ../machines
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center border-2"
              style={{ borderColor: diffColor + '40', background: diffColor + '10' }}
            >
              {machine.os === 'Windows' ? <Cpu size={22} style={{ color: diffColor }} /> : <Globe size={22} style={{ color: diffColor }} />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{machine.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs terminal-text text-slate-500">{machine.os}</span>
                <span className="text-xs terminal-text" style={{ color: diffColor }}>
                  {DIFFICULTY_LABELS[machine.difficulty - 1]}
                </span>
                <span className="text-xs terminal-text text-amber-400 flex items-center gap-0.5">
                  <Star size={10} /> {machine.points} pts
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            {hasSystemSolve ? (
              <span className="text-xs terminal-text text-amber-400 flex items-center gap-1">
                <Trophy size={12} /> System Owned
              </span>
            ) : hasUserSolve ? (
              <span className="text-xs terminal-text text-green-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> User Owned
              </span>
            ) : (
              <span className="text-xs terminal-text text-slate-500 flex items-center gap-1">
                <Lock size={12} /> Not yet solved
              </span>
            )}
            <span className="text-xs terminal-text text-slate-500">IP: {machine.ip}</span>
          </div>
        </div>

        <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-5 mb-4">
          <h3 className="text-xs terminal-text text-slate-500 uppercase tracking-wider mb-3">machine_info</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">IP Address</span>
              <span className="terminal-text text-cyan-400">{machine.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Operating System</span>
              <span className="terminal-text">{machine.os}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Difficulty</span>
              <span className="terminal-text" style={{ color: diffColor }}>{DIFFICULTY_LABELS[machine.difficulty - 1]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Points</span>
              <span className="terminal-text text-amber-400">{machine.points} (user) / {machine.points * 2} (system)</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowTerminal(!showTerminal)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#1c2839] bg-[#0d1117] text-slate-400 hover:text-green-400 hover:border-green-500/30 transition-all terminal-text text-sm mb-4"
        >
          <TermIcon size={16} />
          {showTerminal ? '$ hide_terminal' : '$ open_terminal'}
        </button>

        {showTerminal && (
          <div className="mb-4 animate-fade-in">
            <Terminal module={{} as any} lab={undefined} />
          </div>
        )}

        <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-5 mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300 terminal-text mb-3 uppercase tracking-wider">
            <Flag size={16} className="text-amber-400" /> Submit Flag
          </h3>
          {user ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFlagTier('user')}
                  className={`px-3 py-1.5 rounded-lg text-xs terminal-text border transition-all ${
                    flagTier === 'user'
                      ? 'border-green-500/40 bg-green-500/10 text-green-400'
                      : 'border-slate-700 text-slate-500'
                  }`}
                >
                  User Flag
                </button>
                <button
                  type="button"
                  onClick={() => setFlagTier('system')}
                  disabled={!hasUserSolve}
                  className={`px-3 py-1.5 rounded-lg text-xs terminal-text border transition-all ${
                    flagTier === 'system'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-slate-700 text-slate-500'
                  } ${!hasUserSolve ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  System Flag
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={flagInput}
                  onChange={(e) => setFlagInput(e.target.value)}
                  placeholder="FLAG{...}"
                  className="flex-1 bg-[#05080d] border border-[#1c2839] rounded-lg px-3 py-2 text-sm terminal-text text-slate-300 outline-none focus:border-green-500/40"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm terminal-text hover:bg-green-500/20 transition-all"
                >
                  Submit
                </button>
              </div>
              {submitMsg && (
                <div className={`text-sm terminal-text ${submitMsg.success ? 'text-green-400' : 'text-red-400'}`}>
                  {submitMsg.message}
                </div>
              )}
            </form>
          ) : (
            <p className="text-sm text-slate-500 terminal-text">Sign in to submit flags and earn points.</p>
          )}
        </div>
      </div>
    </div>
  );
}
