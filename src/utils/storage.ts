import { BirdSkin, GameStats, MedalType } from '../types';

export const BIRD_SKINS: BirdSkin[] = [
  {
    id: 'sunny',
    name: 'Sunny Gold',
    bodyColor: '#FBBF24', // Amber/Yellow
    bellyColor: '#FEF3C7', // Cream
    wingColor: '#F59E0B', // Golden Orange
    beakColor: '#F97316', // Bright Orange
    eyeColor: '#1E293B',
    cheekColor: '#F87171',
    unlockScore: 0,
  },
  {
    id: 'azure',
    name: 'Sky Bluebird',
    bodyColor: '#38BDF8', // Cyan/Sky
    bellyColor: '#E0F2FE', // Light Cyan
    wingColor: '#0284C7', // Deep Azure
    beakColor: '#F59E0B', // Amber
    eyeColor: '#0F172A',
    cheekColor: '#FDA4AF',
    unlockScore: 5,
  },
  {
    id: 'crimson',
    name: 'Ruby Cardinal',
    bodyColor: '#EF4444', // Red
    bellyColor: '#FEE2E2', // Pale Red
    wingColor: '#B91C1C', // Dark Ruby
    beakColor: '#FBBF24', // Gold Beak
    eyeColor: '#1E293B',
    cheekColor: '#FB7185',
    unlockScore: 15,
  },
  {
    id: 'violet',
    name: 'Neon Violet',
    bodyColor: '#A855F7', // Purple
    bellyColor: '#F3E8FF', // Soft Lilac
    wingColor: '#7E22CE', // Deep Purple
    beakColor: '#F43F5E', // Pinkish Coral
    eyeColor: '#0F172A',
    cheekColor: '#F472B6',
    unlockScore: 25,
  },
  {
    id: 'phoenix',
    name: 'Solar Phoenix',
    bodyColor: '#EA580C', // Fiery Orange
    bellyColor: '#FEF08A', // Yellow
    wingColor: '#DC2626', // Flame Red
    beakColor: '#FACC15', // Brilliant Gold
    eyeColor: '#0F172A',
    cheekColor: '#F87171',
    unlockScore: 40,
  },
];

const STORAGE_KEY = 'flappy_sky_arcade_stats_v1';

const DEFAULT_STATS: GameStats = {
  bestScore: 0,
  gamesPlayed: 0,
  totalFlaps: 0,
  pipesPassed: 0,
  selectedSkin: 'sunny',
  difficulty: 'classic',
  soundEnabled: true,
};

export function loadGameStats(): GameStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATS,
      ...parsed,
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveGameStats(stats: GameStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {}
}

export function calculateMedal(score: number): MedalType {
  if (score >= 40) return 'platinum';
  if (score >= 25) return 'gold';
  if (score >= 12) return 'silver';
  if (score >= 5) return 'bronze';
  return 'none';
}
