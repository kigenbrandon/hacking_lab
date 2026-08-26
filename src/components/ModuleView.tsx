import type { ModuleWithStatus, Lesson, Lab } from '@/lib/types';
import { useCurriculum } from '@/lib/useCurriculum';
import {
  ArrowLeft, Clock, CheckCircle2, Circle, Terminal,
  FlaskConical, ChevronRight, Target, Award, Play,
} from 'lucide-react';

interface ModuleViewProps {
  module: ModuleWithStatus;
  onBack: () => void;
  onLessonClick: (lesson: Lesson) => void;
  onLabClick: (lab: Lab) => void;
}

export function ModuleView({ module, onBack, onLessonClick, onLabClick }: ModuleViewProps) {
  const colorMap: Record<string, string> = {
    green: 'text-green-400 border-green-500/30 bg-green-500/5',
    cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
    blue: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
    red: 'text-red-400 border-red-500/30 bg-red-500/5',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
    purple: 'text-purple-400 border-purple-500/30 bg-purple-500/5',
  };
  const colorClass = colorMap[module.color] ?? colorMap.green;
  const totalItems = module.totalLessons + module.totalLabs;
  const completedItems = module.completedLessons + module.completedLabs;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="h-full overflow-y-auto animate-slide-in-right">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6 terminal-text"
        >
          <ArrowLeft size={16} /> cd ../skill-tree
        </button>

        {/* Module header */}
        <div className={`rounded-2xl border ${colorClass} p-6 mb-6`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="text-xs terminal-text opacity-60 uppercase tracking-wider">
                {module.category}
              </span>
              <h1 className="text-2xl font-bold text-white mt-1">{module.title}</h1>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < module.difficulty ? 'bg-current' : 'bg-slate-700'}`}
                />
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed mb-4">{module.description}</p>

          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-current rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs terminal-text opacity-70">
              {completedItems}/{totalItems}
            </span>
          </div>

          {/* Start / Continue button */}
          <StartContinueButton
            module={module}
            onLessonClick={onLessonClick}
            onLabClick={onLabClick}
          />
        </div>

        {/* Lessons section */}
        {module.lessons.length > 0 && (
          <div className="mb-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300 terminal-text mb-4 uppercase tracking-wider">
              <Terminal size={16} /> Lessons
            </h2>
            <div className="space-y-2">
              {module.lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  module={module}
                  onClick={() => onLessonClick(lesson)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Labs section */}
        {module.labs.length > 0 && (
          <div className="mb-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300 terminal-text mb-4 uppercase tracking-wider">
              <FlaskConical size={16} /> Hands-on Labs
            </h2>
            <div className="space-y-2">
              {module.labs.map((lab) => (
                <LabRow
                  key={lab.id}
                  lab={lab}
                  module={module}
                  onClick={() => onLabClick(lab)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LessonRow({
  lesson,
  module,
  onClick,
}: {
  lesson: Lesson;
  module: ModuleWithStatus;
  onClick: () => void;
}) {
  const { lessonCompletions } = useCurriculum();
  const isCompleted = lessonCompletions.has(lesson.id);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-[#0d1117] border border-[#1c2839] rounded-xl hover:border-slate-600 hover:bg-[#111821] transition-all text-left group"
    >
      <div className="flex-shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="text-green-400" size={22} />
        ) : (
          <Circle className="text-slate-600 group-hover:text-slate-500" size={22} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-medium ${isCompleted ? 'text-slate-500' : 'text-slate-200'}`}>
          {lesson.title}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 terminal-text">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {lesson.duration_minutes} min
          </span>
        </div>
      </div>
      <ChevronRight className="text-slate-600 group-hover:text-slate-400 transition-colors" size={18} />
    </button>
  );
}

function LabRow({
  lab,
  module,
  onClick,
}: {
  lab: Lab;
  module: ModuleWithStatus;
  onClick: () => void;
}) {
  const { labCompletions } = useCurriculum();
  const isCompleted = labCompletions.has(lab.id);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-[#0d1117] border border-[#1c2839] rounded-xl hover:border-slate-600 hover:bg-[#111821] transition-all text-left group"
    >
      <div className="flex-shrink-0">
        {isCompleted ? (
          <Award className="text-green-400" size={22} />
        ) : (
          <FlaskConical className="text-slate-600 group-hover:text-slate-500" size={22} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm font-medium ${isCompleted ? 'text-slate-500' : 'text-slate-200'}`}>
          {lab.title}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 terminal-text">
          <span className="flex items-center gap-1">
            <Target size={12} /> {lab.objective.slice(0, 60)}
            {lab.objective.length > 60 ? '...' : ''}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${i < lab.difficulty ? 'bg-amber-400' : 'bg-slate-700'}`}
          />
        ))}
      </div>
      <ChevronRight className="text-slate-600 group-hover:text-slate-400 transition-colors" size={18} />
    </button>
  );
}

function StartContinueButton({
  module,
  onLessonClick,
  onLabClick,
}: {
  module: ModuleWithStatus;
  onLessonClick: (lesson: Lesson) => void;
  onLabClick: (lab: Lab) => void;
}) {
  const { lessonCompletions, labCompletions } = useCurriculum();

  const allItems: { item: Lesson | Lab; isLab: boolean }[] = [
    ...module.lessons.map((l) => ({ item: l as Lesson | Lab, isLab: false })),
    ...module.labs.map((l) => ({ item: l as Lesson | Lab, isLab: true })),
  ];

  const firstIncomplete = allItems.find((i) => {
    if (i.isLab) return !labCompletions.has((i.item as Lab).id);
    return !lessonCompletions.has((i.item as Lesson).id);
  });

  const isCompleted = module.status === 'completed';

  if (isCompleted || !firstIncomplete) {
    return (
      <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/5 border border-green-500/20 text-green-400 terminal-text text-sm">
        <CheckCircle2 size={16} /> module_complete
      </div>
    );
  }

  const label = firstIncomplete.isLab ? '$ start_lab' : '$ start_lesson';
  const Icon = firstIncomplete.isLab ? FlaskConical : Play;

  return (
    <button
      onClick={() => {
        if (firstIncomplete.isLab) {
          onLabClick(firstIncomplete.item as Lab);
        } else {
          onLessonClick(firstIncomplete.item as Lesson);
        }
      }}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 text-green-400 transition-all terminal-text text-sm font-medium"
    >
      <Icon size={16} /> {label}
    </button>
  );
}
