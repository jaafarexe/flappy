export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type Difficulty = 'breeze' | 'classic' | 'turbo';

export interface BirdSkin {
  id: string;
  name: string;
  bodyColor: string;
  bellyColor: string;
  wingColor: string;
  beakColor: string;
  eyeColor: string;
  cheekColor: string;
  unlockScore: number;
}

export interface PipePair {
  x: number;
  topHeight: number;
  bottomHeight: number;
  width: number;
  gap: number;
  passed: boolean;
  starCollected?: boolean;
  hasStar?: boolean;
  starY?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation?: number;
  vRot?: number;
  type?: 'feather' | 'sparkle' | 'smoke' | 'impact';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  opacity: number;
  layer: number; // 0: far, 1: mid, 2: close
}

export interface GameStats {
  bestScore: number;
  gamesPlayed: number;
  totalFlaps: number;
  pipesPassed: number;
  selectedSkin: string;
  difficulty: Difficulty;
  soundEnabled: boolean;
}

export type MedalType = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
