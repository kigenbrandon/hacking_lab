import { useState } from 'react';
import type { Lab, ModuleWithStatus, Lesson } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useCurriculum } from '@/lib/useCurriculum';
import { Markdown } from '@/components/Markdown';
import { Terminal } from '@/components/Terminal';
import {
  ArrowLeft, Target, ListChecks, Lightbulb, Eye, EyeOff,
  CheckCircle2, Circle, Lock, FlaskConical, Award,
  ChevronRight, ChevronLeft, TerminalSquare, PartyPopper,
} from 'lucide-react';

interface LabViewProps {
  lab: Lab;
  module: ModuleWithStatus;
  onBack: () => void;
  onNavigate?: (item: Lesson | Lab, isLab: boolean) => void;
  currentIndex?: number;
  totalItems?: number;
  items?: { item: Lesson | Lab; isLab: boolean }[];
}

export function LabView({
  lab,
  module,
  onBack,
  onNavigate,
  currentIndex,
  totalItems,
  items,
}: LabViewProps) {
  const { user } = useAuth();
  const { labCompletions, toggleLabCompletion } = useCurriculum();
  const isCompleted = labCompletions.has(lab.id);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set());
  const [showCompleteMsg, setShowCompleteMsg] = useState(false);

  const hasPrev = currentIndex !== undefined && currentIndex > 0;
  const hasNext = currentIndex !== undefined && totalItems !== undefined && currentIndex < totalItems - 1;

  const toggleTask = (idx: number) => {
    setCheckedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleCompleteAndNext = async () => {
    if (!isCompleted) {
      await toggleLabCompletion(lab.id);
    }
    if (hasNext && items && onNavigate && currentIndex !== undefined) {
      const next = items[currentIndex + 1];
      onNavigate(next.item, next.isLab);
    } else {
      setShowCompleteMsg(true);
    }
  };

  const handlePrev = () => {
    if (hasPrev && items && onNavigate && currentIndex !== undefined) {
      const prev = items[currentIndex - 1];
      onNavigate(prev.item, prev.isLab);
    }
  };

  const handleLabProgress = async (completedConditions: string[]) => {
    if (completedConditions.length > 0 && !isCompleted) {
      await toggleLabCompletion(lab.id);
    }
  };

  return (
    <div className="h-full overflow-y-auto animate-fade-in">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6 terminal-text"
        >
          <ArrowLeft size={16} /> cd ../{module.slug}
        </button>

        {/* Lab header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical size={14} className="text-amber-400" />
            <span className="text-xs terminal-text text-slate-500 uppercase tracking-wider">
              {module.title} / Lab {currentIndex !== undefined && totalItems ? `(${currentIndex + 1}/${totalItems})` : ''}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{lab.title}</h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < lab.difficulty ? 'bg-amber-400' : 'bg-slate-700'}`}
                />
              ))}
            </div>
            <span className="text-xs terminal-text text-slate-500">
              difficulty: {'★'.repeat(lab.difficulty)}{'☆'.repeat(5 - lab.difficulty)}
            </span>
          </div>
        </div>

        {/* Scenario */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-400 terminal-text mb-2 uppercase tracking-wider">
            <Target size={16} /> Scenario
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">{lab.scenario}</p>
        </div>

        {/* Objective */}
        <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-5 mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300 terminal-text mb-2 uppercase tracking-wider">
            <Target size={16} /> Objective
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">{lab.objective}</p>
        </div>

        {/* Tasks */}
        <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-5 mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300 terminal-text mb-3 uppercase tracking-wider">
            <ListChecks size={16} /> Tasks
          </h2>
          <div className="space-y-2">
            {lab.tasks.map((task, idx) => (
              <button
                key={idx}
                onClick={() => toggleTask(idx)}
                className="w-full flex items-start gap-3 text-left group"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {checkedTasks.has(idx) ? (
                    <CheckCircle2 className="text-green-400" size={18} />
                  ) : (
                    <Circle className="text-slate-600 group-hover:text-slate-500" size={18} />
                  )}
                </div>
                <span
                  className={`text-sm leading-relaxed ${
                    checkedTasks.has(idx) ? 'text-slate-500 line-through' : 'text-slate-300'
                  }`}
                >
                  {task}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Hints */}
        <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-5 mb-4">
          <button
            onClick={() => setShowHints(!showHints)}
            className="w-full flex items-center justify-between text-sm font-semibold text-slate-300 terminal-text uppercase tracking-wider"
          >
            <span className="flex items-center gap-2">
              <Lightbulb size={16} className="text-yellow-400" /> Hints
            </span>
            {showHints ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {showHints && (
            <div className="mt-3 space-y-2 animate-fade-in">
              {lab.hints.map((hint, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-sm text-slate-400 bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-3 py-2"
                >
                  <span className="text-yellow-400 terminal-text text-xs mt-0.5">{idx + 1}.</span>
                  <span className="terminal-text text-xs leading-relaxed">{hint}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Solution */}
        <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-5 mb-4">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="w-full flex items-center justify-between text-sm font-semibold text-slate-300 terminal-text uppercase tracking-wider"
          >
            <span className="flex items-center gap-2">
              <FlaskConical size={16} className="text-red-400" /> Solution
            </span>
            {showSolution ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {showSolution && (
            <div className="mt-3 animate-fade-in">
              <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4">
                <Markdown content={lab.solution} />
              </div>
            </div>
          )}
        </div>

        {/* Terminal toggle */}
        <button
          onClick={() => setShowTerminal(!showTerminal)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#1c2839] bg-[#0d1117] text-slate-400 hover:text-green-400 hover:border-green-500/30 transition-all terminal-text text-sm mb-4"
        >
          <TerminalSquare size={16} />
          {showTerminal ? '$ hide_terminal' : '$ open_terminal'}
        </button>

        {showTerminal && (
          <div className="mb-4 animate-fade-in">
            <Terminal module={module} lab={lab} onLabProgress={handleLabProgress} />
          </div>
        )}

        {/* Completion celebration */}
        {showCompleteMsg && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mb-4 text-center animate-fade-in">
            <PartyPopper className="text-green-400 mx-auto mb-3" size={32} />
            <h3 className="text-lg font-bold text-white mb-1">Module Complete!</h3>
            <p className="text-sm text-slate-400 mb-4">
              You finished all items in {module.title}. Head back to the skill tree to unlock new modules.
            </p>
            <button
              onClick={onBack}
              className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 px-6 py-2 rounded-lg terminal-text text-sm transition-all"
            >
              $ return_to_skill_tree
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        {!showCompleteMsg && (
          <>
            {/* Complete button */}
            {user ? (
              <button
                onClick={() => toggleLabCompletion(lab.id)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all terminal-text text-sm font-medium mb-3 ${
                  isCompleted
                    ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                    : 'bg-[#0d1117] border-[#1c2839] text-slate-300 hover:border-green-500/30 hover:text-green-400'
                }`}
              >
                {isCompleted ? (
                  <><Award size={18} /> $ lab_incomplete</>
                ) : (
                  <><Circle size={18} /> $ lab_complete</>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#1c2839] text-slate-500 terminal-text text-sm mb-3">
                <Lock size={16} /> sign in to track progress
              </div>
            )}

            {/* Prev / Next navigation */}
            {onNavigate && items && (
              <div className="flex gap-3">
                <button
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1c2839] bg-[#0d1117] text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all terminal-text text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} /> prev
                </button>
                <button
                  onClick={handleCompleteAndNext}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 transition-all terminal-text text-sm font-medium"
                >
                  {hasNext ? (
                    <>$ complete_and_continue <ChevronRight size={16} /></>
                  ) : (
                    <><CheckCircle2 size={16} /> $ finish_module</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
