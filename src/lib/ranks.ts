export interface RankInfo {
  title: string;
  minPoints: number;
  color: string;
  icon: string;
}

export const RANKS: RankInfo[] = [
  { title: 'Noob',         minPoints: 0,     color: '#94a3b8', icon: 'Sprout' },
  { title: 'Script Kiddie', minPoints: 100,   color: '#64748b', icon: 'Terminal' },
  { title: 'Hacker',        minPoints: 500,   color: '#22d3ee', icon: 'Code' },
  { title: 'Pro Hacker',    minPoints: 1500,  color: '#00ff88', icon: 'Bug' },
  { title: 'Elite',         minPoints: 3500,  color: '#f59e0b', icon: 'Skull' },
  { title: 'Guru',          minPoints: 7000,  color: '#ef4444', icon: 'Crown' },
  { title: 'Legend',        minPoints: 12000, color: '#fbbf24', icon: 'Trophy' },
];

export function getRank(points: number): RankInfo {
  let result = RANKS[0];
  for (const rank of RANKS) {
    if (points >= rank.minPoints) result = rank;
  }
  return result;
}

export function getNextRank(points: number): RankInfo | null {
  for (const rank of RANKS) {
    if (points < rank.minPoints) return rank;
  }
  return null;
}

export function getRankProgress(points: number): number {
  const current = getRank(points);
  const next = getNextRank(points);
  if (!next) return 100;
  const range = next.minPoints - current.minPoints;
  const progress = (points - current.minPoints) / range;
  return Math.min(100, Math.max(0, progress * 100));
}

export const DIFFICULTY_LABELS = ['Easy', 'Medium', 'Hard', 'Insane'];
export const DIFFICULTY_COLORS = ['#00ff88', '#22d3ee', '#f59e0b', '#ef4444'];
export const DIFFICULTY_POINTS = [20, 40, 60, 100];

export const CTF_CATEGORIES = [
  { id: 'all',        label: 'All',        icon: 'List' },
  { id: 'web',        label: 'Web',        icon: 'Globe' },
  { id: 'crypto',     label: 'Crypto',     icon: 'Key' },
  { id: 'forensics',  label: 'Forensics',  icon: 'Search' },
  { id: 'pwn',        label: 'Pwn',        icon: 'Bomb' },
  { id: 'reverse',    label: 'Reverse',    icon: 'Cpu' },
  { id: 'ai',         label: 'AI/LLM',     icon: 'BrainCircuit' },
];

export const CTF_DIFFICULTY_LABELS = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Insane'];
export const CTF_DIFFICULTY_COLORS = ['#22d3ee', '#00ff88', '#f59e0b', '#f97316', '#ef4444'];
