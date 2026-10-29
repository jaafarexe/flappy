import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { GameState, Difficulty, BirdSkin, GameStats } from './types';
import { loadGameStats, saveGameStats, BIRD_SKINS, calculateMedal } from './utils/storage';
import { Trophy, HelpCircle, X, Sparkles } from 'lucide-react';
import { SoundFX } from './utils/audio';

export default function App() {
  const [stats, setStats] = useState<GameStats>(() => loadGameStats());
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [liveScore, setLiveScore] = useState<number>(0);
  const [flapsThisRound, setFlapsThisRound] = useState<number>(0);
  const [pipesThisRound, setPipesThisRound] = useState<number>(0);
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Current selected bird skin
  const currentSkin: BirdSkin = useMemo(() => {
    return BIRD_SKINS.find((s) => s.id === stats.selectedSkin) || BIRD_SKINS[0];
  }, [stats.selectedSkin]);

  // Persist stats whenever they change
  useEffect(() => {
    saveGameStats(stats);
  }, [stats]);

  // Keyboard shortcut listener for pause ('p' or 'Escape')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Handler: Start a new game
  const handleStartPlay = useCallback(() => {
    setLiveScore(0);
    setFlapsThisRound(0);
    setPipesThisRound(0);
    setIsNewBest(false);
    setGameState('PLAYING');
  }, []);

  // Handler: Flap counted
  const handleFlapCount = useCallback(() => {
    setFlapsThisRound((prev) => prev + 1);
    setStats((prev) => ({
      ...prev,
      totalFlaps: prev.totalFlaps + 1,
    }));
  }, []);

  // Handler: Pipe passed
  const handlePipesPassedCount = useCallback(() => {
    setPipesThisRound((prev) => prev + 1);
    setStats((prev) => ({
      ...prev,
      pipesPassed: prev.pipesPassed + 1,
    }));
  }, []);

  // Handler: Score update
  const handleScoreUpdate = useCallback((newScore: number) => {
    setLiveScore(newScore);
  }, []);

  // Handler: Game Over
  const handleGameOver = useCallback((finalScore: number) => {
    setGameState('GAMEOVER');
    setStats((prev) => {
      const isNew = finalScore > prev.bestScore;
      setIsNewBest(isNew);
      return {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        bestScore: Math.max(prev.bestScore, finalScore),
      };
    });
  }, []);

  // Handler: Restart immediately
  const handleRestart = useCallback(() => {
    handleStartPlay();
  }, [handleStartPlay]);

  // Handler: Return to title menu
  const handleReturnToMenu = useCallback(() => {
    setGameState('MENU');
    setLiveScore(0);
  }, []);

  // Handler: Toggle sound
  const handleToggleSound = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  }, []);

  // Handler: Select skin
  const handleSelectSkin = useCallback((skin: BirdSkin) => {
    setStats((prev) => ({
      ...prev,
      selectedSkin: skin.id,
    }));
  }, []);

  // Handler: Select difficulty
  const handleSelectDifficulty = useCallback((diff: Difficulty) => {
    setStats((prev) => ({
      ...prev,
      difficulty: diff,
    }));
  }, []);

  const medal = calculateMedal(liveScore);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* ========================================================= */}
      {/* TOP BAR CONTRACT: 3 Zones (Brand, Nav Links, Primary CTA) */}
      {/* ========================================================= */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md shrink-0">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black font-display text-sm">
            FS
          </div>
          <span className="text-base font-extrabold font-display tracking-tight text-white whitespace-nowrap">
            Flappy Sky
          </span>
        </div>

        {/* Zone 2: Navigation Links (single-line, clean unboxed metadata) */}
        <nav className="hidden sm:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => handleReturnToMenu()}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Arcade Main
          </button>
          <div className="flex items-center gap-1.5 text-slate-400 whitespace-nowrap shrink-0">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Best:</span>
            <strong className="text-white font-mono tabular-nums">{stats.bestScore}</strong>
          </div>
          <button
            onClick={() => setShowHelpModal(true)}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            How to Play
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              SoundFX.playClick(stats.soundEnabled);
              setShowHelpModal(true);
            }}
            type="button"
            className="sm:hidden w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center"
            aria-label="How to play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {gameState === 'PLAYING' ? (
            <button
              onClick={() => handleGameOver(liveScore)}
              type="button"
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              End Run
            </button>
          ) : (
            <button
              onClick={() => {
                SoundFX.playClick(stats.soundEnabled);
                handleStartPlay();
              }}
              type="button"
              className="px-4 py-1.5 text-xs font-bold font-display text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-md shadow-amber-400/15 cursor-pointer"
            >
              Play Now
            </button>
          )}
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN VIEWPORT: ARCADE STAGE */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col items-center justify-center p-0 md:p-6 overflow-hidden">
        {/* Arcade Cabinet Frame Container */}
        <div className="relative w-full h-[calc(100vh-61px)] md:h-[640px] md:w-[420px] max-w-full bg-slate-900 md:rounded-3xl shadow-2xl md:ring-1 md:ring-slate-800 overflow-hidden flex flex-col">
          
          {/* Active HUD overlay during gameplay */}
          {gameState === 'PLAYING' && (
            <HUD
              score={liveScore}
              bestScore={stats.bestScore}
              difficulty={stats.difficulty}
              soundEnabled={stats.soundEnabled}
              isPaused={false}
              onToggleSound={handleToggleSound}
              onTogglePause={() => setGameState('PAUSED')}
            />
          )}

          {/* Interactive 60FPS High-DPI Canvas */}
          <GameCanvas
            gameState={gameState}
            difficulty={stats.difficulty}
            currentSkin={currentSkin}
            soundEnabled={stats.soundEnabled}
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onFlapCount={handleFlapCount}
            onPipesPassedCount={handlePipesPassedCount}
            onStartPlay={handleStartPlay}
          />

          {/* Start Screen Overlay */}
          {gameState === 'MENU' && (
            <StartScreen
              stats={stats}
              selectedSkin={currentSkin}
              difficulty={stats.difficulty}
              soundEnabled={stats.soundEnabled}
              onSelectSkin={handleSelectSkin}
              onSelectDifficulty={handleSelectDifficulty}
              onToggleSound={handleToggleSound}
              onStart={handleStartPlay}
            />
          )}

          {/* Pause Modal Overlay */}
          {gameState === 'PAUSED' && (
            <PauseModal
              score={liveScore}
              soundEnabled={stats.soundEnabled}
              onResume={() => setGameState('PLAYING')}
              onRestart={handleRestart}
              onReturnToMenu={handleReturnToMenu}
            />
          )}

          {/* Game Over Modal Overlay */}
          {gameState === 'GAMEOVER' && (
            <GameOverModal
              score={liveScore}
              bestScore={stats.bestScore}
              isNewBest={isNewBest}
              medal={medal}
              pipesPassed={pipesThisRound}
              flapsThisRound={flapsThisRound}
              soundEnabled={stats.soundEnabled}
              onRestart={handleRestart}
              onReturnToMenu={handleReturnToMenu}
            />
          )}
        </div>

        {/* Desktop Quick Guide Bar below the arcade frame */}
        <div className="hidden md:flex items-center gap-6 mt-4 text-xs text-slate-500">
          <span>Controls: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Space</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Click</kbd> to flap</span>
          <span aria-hidden="true">·</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">P</kbd> to pause</span>
          <span aria-hidden="true">·</span>
          <span>Earn 5+ points for medals & skins</span>
        </div>
      </main>

      {/* ========================================================= */}
      {/* HOW TO PLAY & RULES MODAL */}
      {/* ========================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">How to Play</h3>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <strong className="text-white block font-semibold mb-1">1. Flight Mechanics</strong>
                Tap the screen, click your mouse, or press the Spacebar to flap your bird upwards. Release to let gravity pull you down smoothly.
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <strong className="text-white block font-semibold mb-1">2. Pipes & Gaps</strong>
                Navigate cleanly between the green arcade pipes. Each pair passed grants +1 point. Don't hit pipes or the ground!
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <strong className="text-white block font-semibold mb-1">3. Golden Stars & Medals</strong>
                Look out for rotating golden stars floating between pipes for a +2 bonus! Earn Bronze, Silver, Gold, and Platinum medals as your score climbs.
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <strong className="text-white block font-semibold mb-1">4. Unlockable Bird Skins</strong>
                Reach new high scores to unlock fresh feather skins: Sky Bluebird, Ruby Cardinal, Neon Violet, and Solar Phoenix!
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full mt-5 py-3 rounded-xl font-bold font-display text-xs text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors"
            >
              Got It, Let's Fly!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
