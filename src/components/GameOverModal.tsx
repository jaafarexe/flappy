import React, { useEffect } from 'react';
import { RotateCcw, Trophy, Award, Home } from 'lucide-react';
import { MedalType } from '../types';
import { SoundFX } from '../utils/audio';

interface GameOverModalProps {
  score: number;
  bestScore: number;
  isNewBest: boolean;
  medal: MedalType;
  pipesPassed: number;
  flapsThisRound: number;
  soundEnabled: boolean;
  onRestart: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  bestScore,
  isNewBest,
  medal,
  pipesPassed,
  flapsThisRound,
  soundEnabled,
  onRestart,
  onReturnToMenu,
}) => {
  // Play triumphant sound if new record!
  useEffect(() => {
    if (isNewBest && score > 0) {
      SoundFX.playHighScore(soundEnabled);
    }
  }, [isNewBest, score, soundEnabled]);

  // Spacebar to restart instantly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  const medalConfig = {
    platinum: { label: 'Platinum Ace', color: 'from-cyan-300 to-sky-400', textColor: 'text-cyan-300', bg: 'bg-cyan-950/60 border-cyan-500/40' },
    gold: { label: 'Golden Falcon', color: 'from-amber-300 to-amber-500', textColor: 'text-amber-300', bg: 'bg-amber-950/60 border-amber-500/40' },
    silver: { label: 'Silver Wing', color: 'from-slate-200 to-slate-400', textColor: 'text-slate-200', bg: 'bg-slate-800/60 border-slate-500/40' },
    bronze: { label: 'Bronze Fledgling', color: 'from-amber-600 to-orange-700', textColor: 'text-amber-500', bg: 'bg-orange-950/60 border-orange-500/40' },
    none: { label: 'Keep Soaring!', color: 'from-slate-600 to-slate-700', textColor: 'text-slate-400', bg: 'bg-slate-900/60 border-slate-700/40' },
  }[medal];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* New Best Banner */}
        {isNewBest ? (
          <div className="mb-2 text-xs font-bold tracking-widest uppercase text-amber-400 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 animate-bounce" /> New Best Record!
          </div>
        ) : (
          <span className="mb-2 text-xs font-semibold tracking-wider uppercase text-slate-400">
            Flight Finished
          </span>
        )}

        <h2 className="text-3xl font-black font-display text-white tracking-tight">
          Game Over
        </h2>

        {/* Score & Best Score Cards */}
        <div className="w-full grid grid-cols-2 gap-3 my-5">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col items-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Score</span>
            <span className="text-3xl font-extrabold font-display text-white tabular-nums mt-0.5">
              {score}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col items-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Best</span>
            <span className="text-3xl font-extrabold font-display text-amber-400 tabular-nums mt-0.5">
              {bestScore}
            </span>
          </div>
        </div>

        {/* Medal Badge */}
        <div className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-between mb-4 ${medalConfig.bg}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <Award className={`w-4 h-4 ${medalConfig.textColor}`} />
            </div>
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Tier Medal</div>
              <div className={`text-xs font-bold ${medalConfig.textColor}`}>
                {medalConfig.label}
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {medal === 'none' ? '5+ for Bronze' : 'Earned!'}
          </span>
        </div>

        {/* Flight Stats */}
        <div className="w-full text-xs text-slate-400 flex items-center justify-around py-2 border-t border-slate-800/80 mb-5">
          <span>Pipes Cleared: <strong className="text-white font-mono">{pipesPassed}</strong></span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>Flaps: <strong className="text-white font-mono">{flapsThisRound}</strong></span>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          {/* Easy Restart Button */}
          <button
            onClick={() => {
              SoundFX.playClick(soundEnabled);
              onRestart();
            }}
            type="button"
            className="w-full py-3.5 px-5 rounded-xl font-bold font-display text-base text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-lg shadow-amber-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          {/* Return to Menu Button */}
          <button
            onClick={() => {
              SoundFX.playClick(soundEnabled);
              onReturnToMenu();
            }}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Title Menu & Skins</span>
          </button>
        </div>
      </div>
    </div>
  );
};
