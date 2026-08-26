export interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: number;
  category: string;
  position_x: number;
  position_y: number;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface ModulePrerequisite {
  module_id: string;
  prerequisite_id: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  content: string;
  sort_order: number;
  duration_minutes: number;
  created_at: string;
}

export interface Lab {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  scenario: string;
  objective: string;
  tasks: string[];
  hints: string[];
  solution: string;
  sort_order: number;
  difficulty: number;
  created_at: string;
}

export interface LessonCompletion {
  user_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface LabCompletion {
  user_id: string;
  lab_id: string;
  completed_at: string;
}

export interface UserTerminalState {
  id: string;
  user_id: string;
  lab_id: string;
  filesystem: string;
  installed_tools: string[];
  cwd: string;
  created_at: string;
  updated_at: string;
}

export interface UserCommandLog {
  id: string;
  user_id: string;
  lab_id: string;
  command: string;
  created_at: string;
}

export type ModuleStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed';

export interface ModuleWithStatus extends Module {
  status: ModuleStatus;
  lessons: Lesson[];
  labs: Lab[];
  completedLessons: number;
  completedLabs: number;
  totalLessons: number;
  totalLabs: number;
}

export interface Machine {
  id: string;
  slug: string;
  title: string;
  os: string;
  difficulty: number;
  points: number;
  ip: string;
  environment: string;
  user_flag: string;
  system_flag: string;
  created_at: string;
}

export interface MachineSolve {
  id: string;
  user_id: string;
  machine_id: string;
  tier: 'user' | 'system';
  solved_at: string;
}

export interface CtfChallenge {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: number;
  points: number;
  description: string;
  hint: string;
  flag_hash: string;
  created_at: string;
}

export interface CtfSolve {
  id: string;
  user_id: string;
  challenge_id: string;
  solved_at: string;
}

export interface UserProfile {
  id: string;
  total_points: number;
  rank_title: string;
  bio: string;
  country: string;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  total_points: number;
  rank_title: string;
  bio: string;
  country: string;
  created_at: string;
  rank_position: number;
}
