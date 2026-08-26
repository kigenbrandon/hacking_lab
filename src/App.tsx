import { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthProvider } from '@/lib/auth';
import { useCurriculum } from '@/lib/useCurriculum';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { HexTree } from '@/components/HexTree';
import { Dashboard } from '@/components/Dashboard';
import { ModuleView } from '@/components/ModuleView';
import { LessonView } from '@/components/LessonView';
import { LabView } from '@/components/LabView';
import type { ModuleWithStatus, Lesson, Lab } from '@/lib/types';
import { Terminal } from 'lucide-react';
import type { AchievementId } from '@/lib/xp';

type View =
  | { type: 'dashboard' }
  | { type: 'tree' }
  | { type: 'module'; module: ModuleWithStatus }
  | { type: 'lesson'; lesson: Lesson; module: ModuleWithStatus }
  | { type: 'lab'; lab: Lab; module: ModuleWithStatus };

function AppContent() {
  const { loading } = useCurriculum();
  const [view, setView] = useState<View>({ type: 'dashboard' });
  const [authOpen, setAuthOpen] = useState(false);
  const [booting, setBooting] = useState(true);
  const [xp, setXp] = useState(() => {
    const stored = localStorage.getItem('hexhack_xp');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('hexhack_achievements');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const handleXP = useCallback((amount: number) => {
    setXp((prev) => {
      const next = prev + amount;
      localStorage.setItem('hexhack_xp', String(next));
      return next;
    });
  }, []);

  const handleAchievement = useCallback((id: AchievementId) => {
    setUnlockedAchievements((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('hexhack_achievements', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (booting) {
    return <BootScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0e14] hex-grid-bg">
      <Header
        onAuthClick={() => setAuthOpen(true)}
        onLogoClick={() => setView({ type: 'dashboard' })}
      />

      <main className="flex-1 overflow-hidden relative">
        {view.type === 'dashboard' && (
          <DashboardWrapper
            onModuleClick={(mod) => setView({ type: 'module', module: mod })}
            onExploreClick={() => setView({ type: 'tree' })}
          />
        )}

        {view.type === 'tree' && (
          <TreeWrapper
            onModuleClick={(mod) => setView({ type: 'module', module: mod })}
          />
        )}

        {view.type === 'module' && (
          <ModuleView
            module={view.module}
            onBack={() => setView({ type: 'tree' })}
            onLessonClick={(lesson) => setView({ type: 'lesson', lesson, module: view.module })}
            onLabClick={(lab) => setView({ type: 'lab', lab, module: view.module })}
          />
        )}

        {view.type === 'lesson' && (
          <LessonViewWrapper
            lesson={view.lesson}
            module={view.module}
            onBack={() => setView({ type: 'module', module: view.module })}
            onNavigate={(item, isLab) => {
              if (isLab) {
                setView({ type: 'lab', lab: item as Lab, module: view.module });
              } else {
                setView({ type: 'lesson', lesson: item as Lesson, module: view.module });
              }
            }}
          />
        )}

        {view.type === 'lab' && (
          <LabViewWrapper
            lab={view.lab}
            module={view.module}
            onBack={() => setView({ type: 'module', module: view.module })}
            onNavigate={(item, isLab) => {
              if (isLab) {
                setView({ type: 'lab', lab: item as Lab, module: view.module });
              } else {
                setView({ type: 'lesson', lesson: item as Lesson, module: view.module });
              }
            }}
          />
        )}
      </main>

      {/* Bottom nav bar */}
      <nav className="border-t border-[#1c2839] bg-[#0a0e14]/80 backdrop-blur-md px-6 py-2 flex items-center justify-center gap-2">
        <NavButton
          active={view.type === 'dashboard'}
          onClick={() => setView({ type: 'dashboard' })}
          label="dashboard"
        />
        <NavButton
          active={view.type === 'tree'}
          onClick={() => setView({ type: 'tree' })}
          label="skill_tree"
        />
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

function NavButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-xs terminal-text transition-all ${
        active
          ? 'bg-green-500/10 text-green-400 border border-green-500/30'
          : 'text-slate-500 hover:text-slate-300 border border-transparent'
      }`}
    >
      $ {label}
    </button>
  );
}

type NavItem = { item: Lesson | Lab; isLab: boolean };

function LessonViewWrapper({
  lesson,
  module,
  onBack,
  onNavigate,
}: {
  lesson: Lesson;
  module: ModuleWithStatus;
  onBack: () => void;
  onNavigate: (item: Lesson | Lab, isLab: boolean) => void;
}) {
  const items = useMemo<NavItem[]>(() => {
    const result: NavItem[] = [];
    module.lessons.forEach((l) => result.push({ item: l, isLab: false }));
    module.labs.forEach((l) => result.push({ item: l, isLab: true }));
    return result;
  }, [module]);

  const currentIndex = items.findIndex(
    (i) => !i.isLab && (i.item as Lesson).id === lesson.id
  );

  return (
    <LessonView
      lesson={lesson}
      module={module}
      onBack={onBack}
      onNavigate={onNavigate}
      currentIndex={currentIndex}
      totalItems={items.length}
      items={items}
    />
  );
}

function LabViewWrapper({
  lab,
  module,
  onBack,
  onNavigate,
}: {
  lab: Lab;
  module: ModuleWithStatus;
  onBack: () => void;
  onNavigate: (item: Lesson | Lab, isLab: boolean) => void;
}) {
  const items = useMemo<NavItem[]>(() => {
    const result: NavItem[] = [];
    module.lessons.forEach((l) => result.push({ item: l, isLab: false }));
    module.labs.forEach((l) => result.push({ item: l, isLab: true }));
    return result;
  }, [module]);

  const currentIndex = items.findIndex(
    (i) => i.isLab && (i.item as Lab).id === lab.id
  );

  return (
    <LabView
      lab={lab}
      module={module}
      onBack={onBack}
      onNavigate={onNavigate}
      currentIndex={currentIndex}
      totalItems={items.length}
      items={items}
    />
  );
}

function DashboardWrapper({
  onModuleClick,
  onExploreClick,
}: {
  onModuleClick: (mod: ModuleWithStatus) => void;
  onExploreClick: () => void;
}) {
  const { modules, loading } = useCurriculum();

  if (loading) return <LoadingScreen />;
  return <Dashboard modules={modules} onModuleClick={onModuleClick} onExploreClick={onExploreClick} />;
}

function TreeWrapper({ onModuleClick }: { onModuleClick: (mod: ModuleWithStatus) => void }) {
  const { modules, prerequisites, rawModules, loading } = useCurriculum();

  if (loading) return <LoadingScreen />;
  return (
    <HexTree
      modules={modules}
      prerequisites={prerequisites}
      rawModules={rawModules}
      onModuleClick={onModuleClick}
    />
  );
}

function BootScreen() {
  const lines = [
    '> initializing hexhack_os...',
    '> loading curriculum modules...',
    '> establishing secure connection...',
    '> decrypting skill tree...',
    '> access granted.',
  ];

  return (
    <div className="h-screen bg-[#0a0e14] flex items-center justify-center">
      <div className="text-left">
        <div className="flex items-center gap-3 mb-6">
          <Terminal className="text-green-400 animate-pulse" size={28} />
          <span className="text-green-400 terminal-text text-lg font-bold">
            hex<span className="text-cyan-400">hack</span>
          </span>
        </div>
        <div className="space-y-1">
          {lines.map((line, i) => (
            <div
              key={i}
              className="text-sm terminal-text text-slate-500 animate-fade-in"
              style={{ animationDelay: `${i * 200}ms`, opacity: 0 }}
            >
              {line}
              {i === lines.length - 1 && (
                <span className="animate-blink text-green-400">_</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Terminal className="text-green-400 animate-spin-slow mx-auto mb-3" size={32} />
        <p className="text-sm terminal-text text-slate-500">loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
