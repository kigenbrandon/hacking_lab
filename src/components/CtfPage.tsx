import { useState, useMemo } from 'react';
import { useCtfChallenges } from '@/lib/usePlatform';
import { useAuth } from '@/lib/auth';
import {
  CTF_CATEGORIES, CTF_DIFFICULTY_LABELS, CTF_DIFFICULTY_COLORS,
} from '@/lib/ranks';
import type { CtfChallenge, CtfSolve } from '@/lib/types';
import {
  Flag, Lock, CheckCircle2, ChevronLeft, Lightbulb, Eye, EyeOff,
  Trophy, Terminal as TermIcon, Star, Filter, Zap,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export function CtfPage() {
  const { challenges, solves, loading } = useCtfChallenges();
  const { user } = useAuth();
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<CtfChallenge | null>(null);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <TermIcon className="text-green-400 animate-spin-slow" size={32} />
      </div>
    );
  }

  if (selected) {
    return <ChallengeDetail challenge={selected} solves={solves} onBack={() => setSelected(null)} />;
  }

  const mySolves = user ? solves.filter((s) => s.user_id === user.id) : [];
  const mySolvedIds = new Set(mySolves.map((s) => s.challenge_id));

  const filtered = category === 'all' ? challenges : challenges.filter((c) => c.category === category);

  return (
    <div className="h-full overflow-y-auto animate-fade-in">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="text-amber-400" size={16} />
            <span className="text-xs terminal-text text-slate-500 uppercase tracking-wider">ctf_challenges</span>
          </div>
          <h1 className="text-3xl font-bold text-white">CTF Challenges</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Test your skills across Web, Crypto, Forensics, Pwn, Reverse, and AI/LLM categories. Submit flags to earn points.
          </p>
        </div>

        {user && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#0d1117] border border-amber-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-amber-400 terminal-text">{mySolvedIds.size}</div>
              <div className="text-xs text-slate-500 mt-1">Solved</div>
            </div>
            <div className="bg-[#0d1117] border border-cyan-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400 terminal-text">{challenges.length}</div>
              <div className="text-xs text-slate-500 mt-1">Total</div>
            </div>
            <div className="bg-[#0d1117] border border-green-500/20 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400 terminal-text">
                {mySolves.reduce((sum, s) => {
                  const c = challenges.find((c) => c.id === s.challenge_id);
                  return sum + (c?.points || 0);
                }, 0)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Points</div>
            </div>
          </div>
        )}

        {/* Category filter */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <Filter size={14} className="text-slate-500 shrink-0" />
          {CTF_CATEGORIES.map((cat) => {
            const Icon = (LucideIcons as any)[cat.icon] || TermIcon;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs terminal-text border transition-all shrink-0 ${
                  active
                    ? 'border-green-500/40 bg-green-500/10 text-green-400'
                    : 'border-[#1c2839] text-slate-500 hover:text-slate-300 hover:border-slate-600'
                }`}
              >
                <Icon size={12} /> {cat.label}
              </button>
            );
          })}
        </div>

        {/* Challenge list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((ch) => {
            const chSolves = solves.filter((s) => s.challenge_id === ch.id);
            const solveCount = new Set(chSolves.map((s) => s.user_id)).size;
            const mySolve = mySolvedIds.has(ch.id);
            const diffColor = CTF_DIFFICULTY_COLORS[ch.difficulty - 1];

            return (
              <button
                key={ch.id}
                onClick={() => setSelected(ch)}
                className="text-left bg-[#0d1117] border border-[#1c2839] rounded-xl p-4 hover:border-slate-600 hover:bg-[#111821] transition-all group hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {ch.title}
                    </h3>
                    <span className="text-xs terminal-text text-slate-500 capitalize">{ch.category}</span>
                  </div>
                  {mySolve ? (
                    <CheckCircle2 className="text-green-400" size={18} />
                  ) : (
                    <Lock className="text-slate-600" size={18} />
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{ch.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: i < ch.difficulty ? diffColor : '#334155' }}
                      />
                    ))}
                    <span className="text-xs terminal-text text-slate-500 ml-1">{CTF_DIFFICULTY_LABELS[ch.difficulty - 1]}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs terminal-text text-slate-500">
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-amber-400" /> {ch.points}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap size={11} className="text-cyan-400" /> {solveCount}
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

function ChallengeDetail({ challenge, solves, onBack }: { challenge: CtfChallenge; solves: CtfSolve[]; onBack: () => void }) {
  const { user } = useAuth();
  const { submitFlag } = useCtfChallenges();
  const [flagInput, setFlagInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ success: boolean; message: string } | null>(null);

  const mySolve = solves.some((s) => s.challenge_id === challenge.id && s.user_id === user?.id);
  const solveCount = new Set(solves.filter((s) => s.challenge_id === challenge.id).map((s) => s.user_id)).size;
  const diffColor = CTF_DIFFICULTY_COLORS[challenge.difficulty - 1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagInput.trim()) return;
    const result = await submitFlag(challenge, flagInput);
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
          <ChevronLeft size={16} /> cd ../ctf
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs terminal-text text-slate-500 uppercase tracking-wider capitalize">{challenge.category}</span>
            <span className="text-xs terminal-text" style={{ color: diffColor }}>
              {CTF_DIFFICULTY_LABELS[challenge.difficulty - 1]}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{challenge.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs terminal-text text-amber-400 flex items-center gap-1">
              <Star size={11} /> {challenge.points} pts
            </span>
            <span className="text-xs terminal-text text-slate-500 flex items-center gap-1">
              <Zap size={11} /> {solveCount} solves
            </span>
            {mySolve && (
              <span className="text-xs terminal-text text-green-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Solved
              </span>
            )}
          </div>
        </div>

        <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-5 mb-4">
          <h3 className="text-xs terminal-text text-slate-500 uppercase tracking-wider mb-2">description</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{challenge.description}</p>
        </div>

        <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-5 mb-4">
          <button
            onClick={() => setShowHint(!showHint)}
            className="w-full flex items-center justify-between text-sm font-semibold text-slate-300 terminal-text uppercase tracking-wider"
          >
            <span className="flex items-center gap-2">
              <Lightbulb size={16} className="text-yellow-400" /> Hint
            </span>
            {showHint ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {showHint && (
            <div className="mt-3 animate-fade-in">
              <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3">
                <p className="text-sm text-slate-400 terminal-text">{challenge.hint}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-5 mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300 terminal-text mb-3 uppercase tracking-wider">
            <Flag size={16} className="text-amber-400" /> Submit Flag
          </h3>
          {user ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              {mySolve ? (
                <div className="flex items-center gap-2 text-sm text-green-400 terminal-text">
                  <Trophy size={16} /> You already solved this challenge!
                </div>
              ) : (
                <>
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
                </>
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
