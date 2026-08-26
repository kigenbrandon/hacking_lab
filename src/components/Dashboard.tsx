import { useEffect, useRef, useState } from 'react';
import type { ModuleWithStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { getLevelInfo, getXPProgress, getNextLevelXP, ACHIEVEMENTS } from '@/lib/xp';
import {
  Terminal, Lock, Unlock, CheckCircle2, TrendingUp, Award,
  FlaskConical, Zap, Shield, Star, Trophy, ChevronRight,
} from 'lucide-react';

interface DashboardProps {
  modules: ModuleWithStatus[];
  onModuleClick: (module: ModuleWithStatus) => void;
  onExploreClick: () => void;
  xp?: number;
  unlockedAchievements?: Set<string>;
}

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const start = useRef<number | null>(null);
  const raf = useRef<number>(0);
  useEffect(() => {
    start.current = null;
    const step = (ts: number) => {
      if (!start.current) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      setVal(Math.round(p * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

export function Dashboard({
  modules, onModuleClick, onExploreClick, xp = 0, unlockedAchievements = new Set(),
}: DashboardProps) {
  const { user } = useAuth();
  const levelInfo = getLevelInfo(xp);
  const xpProgress = getXPProgress(xp);
  const nextLevelXp = getNextLevelXP(xp);

  const totalLessons = modules.reduce((s, m) => s + m.totalLessons, 0);
  const totalLabs = modules.reduce((s, m) => s + m.totalLabs, 0);
  const completedLessons = modules.reduce((s, m) => s + m.completedLessons, 0);
  const completedLabs = modules.reduce((s, m) => s + m.completedLabs, 0);
  const completedModules = modules.filter((m) => m.status === 'completed').length;
  const totalItems = totalLessons + totalLabs;
  const completedItems = completedLessons + completedLabs;
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const animXp = useCountUp(xp);
  const animProgress = useCountUp(Math.round(overallProgress));
  const animLessons = useCountUp(completedLessons);
  const animLabs = useCountUp(completedLabs);
  const animModules = useCountUp(completedModules);

  const recentModules = modules.filter((m) => m.status !== 'locked').slice(0, 4);
  const inProgress = modules.filter((m) => m.status === 'in_progress').length;

  return (
    <div className="h-full overflow-y-auto animate-fade-in">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="text-green-400" size={16} />
              <span className="text-xs terminal-text text-slate-500 uppercase tracking-wider">operator_dashboard</span>
            </div>
            <h1 className="text-3xl font-bold text-white">
              {user ? `Welcome back, operator` : 'Welcome to HexHack'}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              {user
                ? 'Continue your path through the hacking skill tree.'
                : 'Explore hacking modules. Sign up to track progress and earn XP.'}
            </p>
          </div>

          {/* Level badge */}
          {user && (
            <div
              className="flex-shrink-0 flex items-center gap-3 bg-[#0d1117] border rounded-2xl px-5 py-3"
              style={{ borderColor: levelInfo.color + '40' }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold border-2"
                style={{ borderColor: levelInfo.color, color: levelInfo.color, boxShadow: `0 0 16px ${levelInfo.color}40` }}
              >
                {levelInfo.level}
              </div>
              <div>
                <div className="text-xs text-slate-500 terminal-text">Level {levelInfo.level}</div>
                <div className="text-sm font-semibold" style={{ color: levelInfo.color }}>
                  {levelInfo.title}
                </div>
                <div className="text-xs text-slate-500 terminal-text mt-0.5">
                  {animXp} / {nextLevelXp} XP
                </div>
              </div>
            </div>
          )}
        </div>

        {/* XP + progress bar */}
        {user && (
          <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs terminal-text text-slate-400 flex items-center gap-1.5">
                <Star size={12} className="text-amber-400" /> xp_progress — {levelInfo.title}
              </span>
              <span className="text-xs terminal-text" style={{ color: levelInfo.color }}>
                {Math.round(xpProgress)}%
              </span>
            </div>
            {/* XP bar */}
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${xpProgress}%`, background: `linear-gradient(90deg, ${levelInfo.color}99, ${levelInfo.color})` }}
              >
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            </div>
            {/* Curriculum progress */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs terminal-text text-slate-400">curriculum_progress</span>
              <span className="text-xs terminal-text text-green-400">{completedItems}/{totalItems} items</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats grid */}
        {user && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<TrendingUp size={18} />} label="Progress" value={`${animProgress}%`} color="green" />
            <StatCard icon={<Trophy size={18} />} label="Modules Done" value={`${animModules}/${modules.length}`} color="cyan" />
            <StatCard icon={<Terminal size={18} />} label="Lessons Done" value={`${animLessons}/${totalLessons}`} color="blue" />
            <StatCard icon={<FlaskConical size={18} />} label="Labs Done" value={`${animLabs}/${totalLabs}`} color="amber" />
          </div>
        )}

        {/* Achievements */}
        {user && (
          <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-5 mb-6">
            <h3 className="text-xs terminal-text text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield size={12} className="text-cyan-400" /> achievements
            </h3>
            <div className="flex flex-wrap gap-2">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = unlockedAchievements.has(ach.id);
                return (
                  <div
                    key={ach.id}
                    title={ach.desc}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs terminal-text border transition-all ${
                      unlocked
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                        : 'border-slate-700/50 bg-slate-800/30 text-slate-600'
                    }`}
                  >
                    <span className={unlocked ? '' : 'grayscale opacity-40'}>{ach.icon}</span>
                    <span>{ach.label}</span>
                    {unlocked && <span className="text-amber-400 text-[10px]">+{ach.xpBonus}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-5 mb-6">
          <h3 className="text-xs terminal-text text-slate-500 uppercase tracking-wider mb-3">hex_status_legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <LegendItem icon={<Lock size={14} />}        label="Locked"      color="text-slate-600" />
            <LegendItem icon={<Unlock size={14} />}      label="Available"   color="text-cyan-400" />
            <LegendItem icon={<Zap size={14} />}         label="In Progress" color="text-amber-400" />
            <LegendItem icon={<CheckCircle2 size={14} />} label="Completed" color="text-green-400" />
          </div>
        </div>

        {/* Module cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              {user && inProgress > 0 ? 'Continue Learning' : 'Start Your Journey'}
            </h2>
            <button
              onClick={onExploreClick}
              className="text-xs terminal-text text-slate-400 hover:text-green-400 flex items-center gap-1 transition-colors"
            >
              $ view_skill_tree <ChevronRight size={12} />
            </button>
          </div>

          {recentModules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentModules.map((mod) => (
                <ModuleCard key={mod.id} module={mod} onClick={() => onModuleClick(mod)} />
              ))}
            </div>
          ) : (
            <button
              onClick={onExploreClick}
              className="w-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 text-green-400 font-medium py-4 rounded-xl transition-all terminal-text flex items-center justify-center gap-2"
            >
              <Terminal size={18} /> $ explore_skill_tree
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'text-green-400 border-green-500/20 shadow-green-500/10',
    cyan:  'text-cyan-400  border-cyan-500/20  shadow-cyan-500/10',
    blue:  'text-blue-400  border-blue-500/20  shadow-blue-500/10',
    amber: 'text-amber-400 border-amber-500/20 shadow-amber-500/10',
  };
  const [cls] = colorMap[color].split(' shadow-');
  const shadow = colorMap[color].split(' shadow-')[1];
  return (
    <div className={`bg-[#0d1117] border ${cls} rounded-xl p-4 shadow-md shadow-${shadow} hover:scale-[1.02] transition-transform`}>
      <div className={`flex items-center gap-2 ${cls.split(' ')[0]} mb-2`}>{icon}</div>
      <div className="text-xl font-bold text-white terminal-text">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function LegendItem({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <span className={color}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function ModuleCard({ module, onClick }: { module: ModuleWithStatus; onClick: () => void }) {
  const totalItems = module.totalLessons + module.totalLabs;
  const completedItems = module.completedLessons + module.completedLabs;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const statusColor =
    module.status === 'completed' ? 'border-green-500/30 hover:border-green-500/50' :
    module.status === 'in_progress' ? 'border-amber-500/30 hover:border-amber-500/50' :
    'border-[#1c2839] hover:border-slate-600';

  return (
    <button
      onClick={onClick}
      className={`text-left bg-[#0d1117] border ${statusColor} rounded-xl p-4 transition-all group hover:bg-[#111821] hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
            {module.title}
          </h3>
          <span className="text-xs terminal-text text-slate-500">{module.category}</span>
        </div>
        {module.status === 'completed' ? (
          <Award className="text-green-400" size={18} />
        ) : module.status === 'in_progress' ? (
          <Zap className="text-amber-400 animate-pulse" size={18} />
        ) : (
          <Unlock className="text-cyan-400" size={18} />
        )}
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            module.status === 'completed'
              ? 'bg-gradient-to-r from-green-500 to-cyan-400'
              : 'bg-green-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs terminal-text text-slate-500">{completedItems}/{totalItems} items</span>
        {module.status === 'in_progress' && (
          <span className="text-xs terminal-text text-amber-400">in_progress</span>
        )}
        {module.status === 'completed' && (
          <span className="text-xs terminal-text text-green-400">completed</span>
        )}
      </div>
    </button>
  );
}
