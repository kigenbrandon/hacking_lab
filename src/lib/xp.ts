export interface XPEvent {
  type: 'tool_install' | 'flag_capture' | 'objective_complete' | 'lab_complete' | 'lesson_complete';
  label: string;
  amount: number;
}

export const XP_VALUES: Record<XPEvent['type'], number> = {
  tool_install: 25,
  flag_capture: 150,
  objective_complete: 75,
  lab_complete: 200,
  lesson_complete: 50,
};

export interface LevelInfo {
  level: number;
  title: string;
  xpMin: number;
  xpMax: number;
  color: string;
}

const LEVELS: LevelInfo[] = [
  { level: 1,  title: 'Script Kiddie',   xpMin: 0,    xpMax: 200,  color: '#94a3b8' },
  { level: 2,  title: 'Recon Rookie',    xpMin: 200,  xpMax: 500,  color: '#22d3ee' },
  { level: 3,  title: 'Packet Sniffer',  xpMin: 500,  xpMax: 1000, color: '#3b82f6' },
  { level: 4,  title: 'Exploit Dev',     xpMin: 1000, xpMax: 2000, color: '#00ff88' },
  { level: 5,  title: 'Pentester',       xpMin: 2000, xpMax: 3500, color: '#f59e0b' },
  { level: 6,  title: 'Red Teamer',      xpMin: 3500, xpMax: 5500, color: '#ef4444' },
  { level: 7,  title: 'Zero Day Hunter', xpMin: 5500, xpMax: 8000, color: '#a855f7' },
  { level: 8,  title: 'Elite Operator',  xpMin: 8000, xpMax: 8000, color: '#fbbf24' },
];

export function getLevelInfo(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpMin) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getXPProgress(xp: number): number {
  const info = getLevelInfo(xp);
  if (info.level === LEVELS[LEVELS.length - 1].level) return 100;
  const range = info.xpMax - info.xpMin;
  return Math.min(100, ((xp - info.xpMin) / range) * 100);
}

export function getNextLevelXP(xp: number): number {
  const info = getLevelInfo(xp);
  return info.xpMax;
}

export const ACHIEVEMENTS = [
  { id: 'first_tool',    label: 'Tool Up',        desc: 'Install your first tool',         icon: '⚡', xpBonus: 50  },
  { id: 'first_flag',    label: 'Flag Captured',   desc: 'Capture your first flag',         icon: '🚩', xpBonus: 100 },
  { id: 'nmap_pro',      label: 'Port Scanner',    desc: 'Use nmap with version detection', icon: '🔍', xpBonus: 50  },
  { id: 'sql_injection', label: 'SQLi Master',     desc: 'Complete a SQL injection lab',    icon: '💉', xpBonus: 75  },
  { id: 'hash_cracker',  label: 'Hash Cracker',    desc: 'Crack your first hash',           icon: '🔓', xpBonus: 75  },
  { id: 'brute_force',   label: 'Brute Forcer',    desc: 'Run a brute force attack',        icon: '🔨', xpBonus: 50  },
  { id: 'all_tools',     label: 'Full Arsenal',    desc: 'Install 5 or more tools',         icon: '🛡️', xpBonus: 150 },
];

export type AchievementId = typeof ACHIEVEMENTS[number]['id'];
