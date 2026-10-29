import React from 'react';
import { Volume2, VolumeX, Trophy, Sparkles, Play, Award, Zap } from 'lucide-react';
import { Difficulty, BirdSkin, GameStats } from '../types';
import { BIRD_SKINS } from '../utils/storage';
import { SoundFX } from '../utils/audio';

interface StartScreenProps {
  stats: GameStats;
  selectedSkin: BirdSkin;
  difficulty: Difficulty;
  soundEnabled: boolean;
  onSelectSkin: (skin: BirdSkin) => void;
  onSelectDifficulty: (diff: Difficulty) => void;
  onToggleSound: () => void;
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  stats,
  selectedSkin,
  difficulty,
  soundEnabled,
  onSelectSkin,
  onSelectDifficulty,
  onToggleSound,
  onStart,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between p-5 md:p-6 bg-slate-950/75 backdrop-blur-md text-white overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Arcade Edition</span>
        </div>

        <button
          onClick={() => {
            onToggleSound();
            SoundFX.playClick(!soundEnabled);
          }}
          type="button"
          aria-label={soundEnabled ? 'Mute' : 'Unmute'}
          className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition-all active:scale-95"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* Hero Brand & Mascot */}
      <div className="flex flex-col items-center text-center my-auto py-2">
        {/* Animated Cute Bird Icon Preview */}
        <div className="relative mb-3 group cursor-pointer" onClick={onStart}>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-sky-400 to-sky-600 shadow-xl shadow-sky-500/25 border-2 border-white/20 flex items-center justify-center p-3 animate-bounce">
            <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-md">
              {/* Bird Tail */}
              <path d="M12 28 L4 25 L8 34 Z" fill={selectedSkin.wingColor} />
              {/* Body */}
              <ellipse cx="24" cy="24" rx="16" ry="14" fill={selectedSkin.bodyColor} />
              {/* Belly */}
              <ellipse cx="28" cy="27" rx="10" ry="8" fill={selectedSkin.bellyColor} />
              {/* Cheek */}
              <circle cx="31" cy="27" r="3.5" fill={selectedSkin.cheekColor} opacity="0.8" />
              {/* Eye */}
              <circle cx="31" cy="18" r="5" fill="#FFFFFF" />
              <circle cx="33" cy="18" r="2.5" fill={selectedSkin.eyeColor} />
              <circle cx="34" cy="16.5" r="1" fill="#FFFFFF" />
              {/* Beak */}
              <path d="M37 20 L46 23 L37 27 Z" fill={selectedSkin.beakColor} />
              {/* Wing */}
              <ellipse cx="20" cy="24" rx="8" ry="5" fill={selectedSkin.wingColor} transform="rotate(-15 20 24)" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-black font-display tracking-tight text-white drop-shadow-lg">
          Flappy Sky
        </h1>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
          <span>Smooth 60FPS</span>
          <span aria-hidden="true">·</span>
          <span>Adaptive Skies</span>
          <span aria-hidden="true">·</span>
          <span>Audio FX</span>
        </div>

        {/* High Score Card */}
        <div className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-inner flex items-center gap-3">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-left">
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Personal Record</span>
            <span className="text-xl font-bold font-display text-white tabular-nums">
              {stats.bestScore} <span className="text-xs font-normal text-slate-400">pts</span>
            </span>
          </div>
        </div>
      </div>

      {/* Game Settings Controls */}
      <div className="space-y-4">
        {/* Difficulty Selector */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Game Pace
            </span>
            <span className="capitalize text-slate-300 font-semibold">{difficulty}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
            {(['breeze', 'classic', 'turbo'] as Difficulty[]).map((mode) => {
              const active = difficulty === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    onSelectDifficulty(mode);
                    SoundFX.playClick(soundEnabled);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all capitalize whitespace-nowrap ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bird Skin Selector */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-sky-400" /> Select Feather Skin
            </span>
            <span className="text-slate-300 font-semibold">{selectedSkin.name}</span>
          </div>
          <div className="flex items-center justify-between gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto">
            {BIRD_SKINS.map((skin) => {
              const isUnlocked = stats.bestScore >= skin.unlockScore;
              const isSelected = selectedSkin.id === skin.id;

              return (
                <button
                  key={skin.id}
                  type="button"
                  onClick={() => {
                    if (isUnlocked) {
                      onSelectSkin(skin);
                      SoundFX.playClick(soundEnabled);
                    }
                  }}
                  disabled={!isUnlocked}
                  title={isUnlocked ? skin.name : `Unlocks at ${skin.unlockScore} pts`}
                  className={`relative flex-1 min-w-[54px] py-2 px-1 flex flex-col items-center gap-1.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/10 shadow-sm'
                      : isUnlocked
                      ? 'border-transparent hover:border-slate-700 bg-slate-800/40'
                      : 'border-transparent opacity-40 cursor-not-allowed bg-slate-900'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border border-black/20 shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: skin.bodyColor }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: skin.wingColor }} />
                  </div>
                  <span className="text-[10px] font-medium truncate max-w-full text-slate-300">
                    {isUnlocked ? skin.name.split(' ')[0] : `${skin.unlockScore}p`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Start Game CTA Button */}
        <button
          onClick={() => {
            SoundFX.playClick(soundEnabled);
            onStart();
          }}
          type="button"
          className="w-full py-4 px-6 rounded-xl font-bold font-display text-base text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group whitespace-nowrap cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
          <span>Start Flight</span>
        </button>

        {/* Controls Hint */}
        <div className="text-center text-[11px] text-slate-400 font-medium">
          Tap screen or press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">Space</kbd> to flap
        </div>
      </div>
    </div>
  );
};
