import { useState } from 'react';
import type { Lesson, ModuleWithStatus, Lab } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useCurriculum } from '@/lib/useCurriculum';
import { Markdown } from '@/components/Markdown';
import { Terminal } from '@/components/Terminal';
import {
  ArrowLeft, Clock, CheckCircle2, Circle, Lock,
  ChevronRight, ChevronLeft, TerminalSquare, PartyPopper,
} from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  module: ModuleWithStatus;
  onBack: () => void;
  onNavigate?: (item: Lesson | Lab, isLab: boolean) => void;
  currentIndex?: number;
  totalItems?: number;
  items?: { item: Lesson | Lab; isLab: boolean }[];
}

export function LessonView({
  lesson,
  module,
  onBack,
  onNavigate,
  currentIndex,
  totalItems,
  items,
}: LessonViewProps) {
  const { user } = useAuth();
  const { lessonCompletions, toggleLessonCompletion } = useCurriculum();
  const isCompleted = lessonCompletions.has(lesson.id);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showCompleteMsg, setShowCompleteMsg] = useState(false);

  const hasPrev = currentIndex !== undefined && currentIndex > 0;
  const hasNext = currentIndex !== undefined && totalItems !== undefined && currentIndex < totalItems - 1;

  const handleCompleteAndNext = async () => {
    if (!isCompleted) {
      await toggleLessonCompletion(lesson.id);
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

        {/* Lesson header */}
        <div className="mb-6">
          <span className="text-xs terminal-text text-slate-500 uppercase tracking-wider">
            {module.title} / Lesson {currentIndex !== undefined && totalItems ? `(${currentIndex + 1}/${totalItems})` : ''}
          </span>
          <h1 className="text-2xl font-bold text-white mt-1">{lesson.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 terminal-text">
            <span className="flex items-center gap-1">
              <Clock size={12} /> {lesson.duration_minutes} min
            </span>
            <span className="flex items-center gap-1">
              {isCompleted ? (
                <><CheckCircle2 size={12} className="text-green-400" /> completed</>
              ) : (
                <><Circle size={12} /> in progress</>
              )}
            </span>
          </div>
        </div>

        {/* Lesson content */}
        <div className="bg-[#0d1117] border border-[#1c2839] rounded-2xl p-6 mb-4">
          <Markdown content={lesson.content} />
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
            <Terminal module={module} />
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
                onClick={() => toggleLessonCompletion(lesson.id)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all terminal-text text-sm font-medium mb-3 ${
                  isCompleted
                    ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                    : 'bg-[#0d1117] border-[#1c2839] text-slate-300 hover:border-green-500/30 hover:text-green-400'
                }`}
              >
                {isCompleted ? (
                  <><CheckCircle2 size={18} /> $ mark_incomplete</>
                ) : (
                  <><Circle size={18} /> $ mark_complete</>
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
