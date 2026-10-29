import React from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';
import { SoundFX } from '../utils/audio';

interface PauseModalProps {
  score: number;
  soundEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onReturnToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  score,
  soundEnabled,
  onResume,
  onRestart,
  onReturnToMenu,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="w-full max-w-xs bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-2xl font-black font-display text-white mb-1">
          Paused
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Current Score: <strong className="text-amber-400 font-mono text-sm">{score}</strong>
        </p>

        <div className="w-full space-y-2.5">
          {/* Resume */}
          <button
            onClick={() => {
              SoundFX.playClick(soundEnabled);
              onResume();
            }}
            type="button"
            className="w-full py-3 px-4 rounded-xl font-bold font-display text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume</span>
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              SoundFX.playClick(soundEnabled);
              onRestart();
            }}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart Run</span>
          </button>

          {/* Return to menu */}
          <button
            onClick={() => {
              SoundFX.playClick(soundEnabled);
              onReturnToMenu();
            }}
            type="button"
            className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
