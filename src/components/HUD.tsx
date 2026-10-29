import React from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { Difficulty } from '../types';

interface HUDProps {
  score: number;
  bestScore: number;
  difficulty: Difficulty;
  soundEnabled: boolean;
  isPaused: boolean;
  onToggleSound: () => void;
  onTogglePause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  bestScore,
  difficulty,
  soundEnabled,
  isPaused,
  onToggleSound,
  onTogglePause,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-4 flex items-center justify-between">
      {/* Left zone: Difficulty and Best Score */}
      <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-lg text-xs text-slate-300">
        <span className="capitalize font-semibold text-amber-400">{difficulty}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="font-mono tabular-nums text-slate-200">
          Best <strong className="text-white font-bold">{bestScore}</strong>
        </span>
      </div>

      {/* Center zone: Live Score Counter */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-4 flex flex-col items-center">
        <div className="text-5xl md:text-6xl font-black font-display text-white tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] tabular-nums">
          {score}
        </div>
      </div>

      {/* Right zone: Audio & Pause Controls */}
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          onClick={onToggleSound}
          type="button"
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          className="w-10 h-10 rounded-xl bg-slate-900/80 hover:bg-slate-850 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white flex items-center justify-center transition-colors active:scale-95 shadow-lg"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
        </button>

        <button
          onClick={onTogglePause}
          type="button"
          aria-label={isPaused ? 'Resume game' : 'Pause game'}
          className="w-10 h-10 rounded-xl bg-slate-900/80 hover:bg-slate-850 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white flex items-center justify-center transition-colors active:scale-95 shadow-lg"
        >
          {isPaused ? <Play className="w-5 h-5 fill-current text-emerald-400" /> : <Pause className="w-5 h-5 fill-current text-slate-300" />}
        </button>
      </div>
    </div>
  );
};
