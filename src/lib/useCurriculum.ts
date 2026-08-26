import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type {
  Module,
  ModulePrerequisite,
  Lesson,
  Lab,
  ModuleWithStatus,
  ModuleStatus,
} from '@/lib/types';

export function useCurriculum() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [prerequisites, setPrerequisites] = useState<ModulePrerequisite[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [lessonCompletions, setLessonCompletions] = useState<Set<string>>(new Set());
  const [labCompletions, setLabCompletions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCurriculum() {
      const [modRes, prereqRes, lessonRes, labRes] = await Promise.all([
        supabase.from('modules').select('*').order('sort_order'),
        supabase.from('module_prerequisites').select('*'),
        supabase.from('lessons').select('*').order('sort_order'),
        supabase.from('labs').select('*').order('sort_order'),
      ]);

      if (modRes.data) setModules(modRes.data);
      if (prereqRes.data) setPrerequisites(prereqRes.data);
      if (lessonRes.data) setLessons(lessonRes.data);
      if (labRes.data) setLabs(labRes.data);
      setLoading(false);
    }

    fetchCurriculum();
  }, []);

  useEffect(() => {
    if (!user) {
      setLessonCompletions(new Set());
      setLabCompletions(new Set());
      return;
    }

    async function fetchProgress() {
      const [lessonCompRes, labCompRes] = await Promise.all([
        supabase.from('lesson_completions').select('lesson_id'),
        supabase.from('lab_completions').select('lab_id'),
      ]);

      if (lessonCompRes.data) {
        setLessonCompletions(new Set(lessonCompRes.data.map((c: { lesson_id: string }) => c.lesson_id)));
      }
      if (labCompRes.data) {
        setLabCompletions(new Set(labCompRes.data.map((c: { lab_id: string }) => c.lab_id)));
      }
    }

    fetchProgress();
  }, [user]);

  const toggleLessonCompletion = useCallback(
    async (lessonId: string) => {
      if (!user) return;
      const isCompleted = lessonCompletions.has(lessonId);

      if (isCompleted) {
        setLessonCompletions((prev) => {
          const next = new Set(prev);
          next.delete(lessonId);
          return next;
        });
        await supabase.from('lesson_completions').delete().eq('lesson_id', lessonId);
      } else {
        setLessonCompletions((prev) => new Set(prev).add(lessonId));
        await supabase.from('lesson_completions').insert({ lesson_id: lessonId });
      }
    },
    [user, lessonCompletions]
  );

  const toggleLabCompletion = useCallback(
    async (labId: string) => {
      if (!user) return;
      const isCompleted = labCompletions.has(labId);

      if (isCompleted) {
        setLabCompletions((prev) => {
          const next = new Set(prev);
          next.delete(labId);
          return next;
        });
        await supabase.from('lab_completions').delete().eq('lab_id', labId);
      } else {
        setLabCompletions((prev) => new Set(prev).add(labId));
        await supabase.from('lab_completions').insert({ lab_id: labId });
      }
    },
    [user, labCompletions]
  );

  const modulesWithStatus: ModuleWithStatus[] = modules.map((mod) => {
    const modLessons = lessons.filter((l) => l.module_id === mod.id);
    const modLabs = labs.filter((l) => l.module_id === mod.id);
    const completedLessons = modLessons.filter((l) => lessonCompletions.has(l.id)).length;
    const completedLabs = modLabs.filter((l) => labCompletions.has(l.id)).length;
    const totalItems = modLessons.length + modLabs.length;
    const completedItems = completedLessons + completedLabs;

    const modPrereqs = prerequisites.filter((p) => p.module_id === mod.id);
    const allPrereqsMet = modPrereqs.every((p) => {
      const prereqMod = modules.find((m) => m.id === p.prerequisite_id);
      if (!prereqMod) return true;
      const prereqLessons = lessons.filter((l) => l.module_id === prereqMod.id);
      const prereqLabs = labs.filter((l) => l.module_id === prereqMod.id);
      const prereqCompletedLessons = prereqLessons.filter((l) => lessonCompletions.has(l.id)).length;
      const prereqCompletedLabs = prereqLabs.filter((l) => labCompletions.has(l.id)).length;
      return (
        prereqCompletedLessons === prereqLessons.length &&
        prereqCompletedLabs === prereqLabs.length &&
        prereqLessons.length + prereqLabs.length > 0
      );
    });

    let status: ModuleStatus = 'locked';
    if (modPrereqs.length === 0 || allPrereqsMet) {
      if (totalItems > 0 && completedItems === totalItems) {
        status = 'completed';
      } else if (completedItems > 0) {
        status = 'in_progress';
      } else {
        status = 'unlocked';
      }
    }

    return {
      ...mod,
      status,
      lessons: modLessons,
      labs: modLabs,
      completedLessons,
      completedLabs,
      totalLessons: modLessons.length,
      totalLabs: modLabs.length,
    };
  });

  return {
    modules: modulesWithStatus,
    rawModules: modules,
    prerequisites,
    lessons,
    labs,
    lessonCompletions,
    labCompletions,
    loading,
    toggleLessonCompletion,
    toggleLabCompletion,
  };
}
