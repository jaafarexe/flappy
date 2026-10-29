import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, Difficulty, BirdSkin, PipePair, Particle, FloatingText, Cloud } from '../types';
import { SoundFX } from '../utils/audio';

interface GameCanvasProps {
  gameState: GameState;
  difficulty: Difficulty;
  currentSkin: BirdSkin;
  soundEnabled: boolean;
  onScoreUpdate: (newScore: number) => void;
  onGameOver: (finalScore: number) => void;
  onFlapCount: () => void;
  onPipesPassedCount: () => void;
  onStartPlay: () => void;
}

// Logical dimensions of the game world
const GAME_WIDTH = 420;
const GAME_HEIGHT = 640;
const GROUND_HEIGHT = 80;
const PLAYABLE_HEIGHT = GAME_HEIGHT - GROUND_HEIGHT;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  difficulty,
  currentSkin,
  soundEnabled,
  onScoreUpdate,
  onGameOver,
  onFlapCount,
  onPipesPassedCount,
  onStartPlay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Difficulty multipliers
  const diffSettings = {
    breeze: { gravity: 0.32, flapPower: -7.0, baseSpeed: 2.1, baseGap: 155, minGap: 125 },
    classic: { gravity: 0.38, flapPower: -7.8, baseSpeed: 2.6, baseGap: 142, minGap: 110 },
    turbo: { gravity: 0.44, flapPower: -8.4, baseSpeed: 3.3, baseGap: 130, minGap: 98 },
  }[difficulty];

  // Game internal state held in refs for 60fps loop performance
  const birdRef = useRef({
    x: 100,
    y: 280,
    vy: 0,
    radius: 17,
    rotation: 0,
    wingAngle: 0,
    wingSpeed: 0.25,
    blinkTimer: 0,
    isBlinking: false,
  });

  const pipesRef = useRef<PipePair[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const groundOffsetRef = useRef<number>(0);
  const starsRef = useRef<{ x: number; y: number; size: number; alpha: number; speed: number }[]>([]);

  const scoreRef = useRef<number>(0);
  const shakeTimerRef = useRef<number>(0);
  const flashAlphaRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const nextPipeSpawnRef = useRef<number>(0);
  const animFrameIdRef = useRef<number>(0);
  const isCrashingRef = useRef<boolean>(false);

  // Initialize clouds and stars
  const initEnvironment = useCallback(() => {
    cloudsRef.current = [
      { x: 30, y: 70, speed: 0.4, scale: 0.9, opacity: 0.85, layer: 0 },
      { x: 190, y: 130, speed: 0.6, scale: 1.2, opacity: 0.9, layer: 1 },
      { x: 340, y: 60, speed: 0.35, scale: 0.8, opacity: 0.75, layer: 0 },
      { x: 450, y: 170, speed: 0.7, scale: 1.1, opacity: 0.95, layer: 2 },
    ];

    starsRef.current = Array.from({ length: 30 }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * (PLAYABLE_HEIGHT * 0.7),
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.05 + 0.02,
    }));
  }, []);

  // Reset bird and entities to start/idle
  const resetGame = useCallback(() => {
    birdRef.current = {
      x: 100,
      y: 260,
      vy: 0,
      radius: 17,
      rotation: 0,
      wingAngle: 0,
      wingSpeed: 0.25,
      blinkTimer: 0,
      isBlinking: false,
    };
    pipesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    scoreRef.current = 0;
    shakeTimerRef.current = 0;
    flashAlphaRef.current = 0;
    isCrashingRef.current = false;
    nextPipeSpawnRef.current = 80;
  }, []);

  // Spawn feather/wind puff particles
  const emitFlapPuff = (x: number, y: number) => {
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x: x - 12 + (Math.random() * 4 - 2),
        y: y + 4 + (Math.random() * 8 - 4),
        vx: -(Math.random() * 2.5 + 1.2),
        vy: Math.random() * 2 - 1,
        radius: Math.random() * 3.5 + 2,
        color: Math.random() > 0.5 ? '#FFFFFF' : currentSkin.bodyColor,
        alpha: 0.85,
        life: 0,
        maxLife: 24,
        type: 'feather',
      });
    }
  };

  // Spawn starburst particles on scoring
  const emitScoreBurst = (x: number, y: number) => {
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.2;
      const speed = Math.random() * 3 + 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3 + 2,
        color: ['#FBBF24', '#F59E0B', '#FDE68A', '#FFFFFF'][Math.floor(Math.random() * 4)],
        alpha: 1,
        life: 0,
        maxLife: 32,
        type: 'sparkle',
      });
    }
  };

  // Spawn crash debris
  const emitCrashBurst = (x: number, y: number) => {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        radius: Math.random() * 4 + 2,
        color: [currentSkin.bodyColor, currentSkin.wingColor, '#FFFFFF', '#EF4444', '#F59E0B'][Math.floor(Math.random() * 5)],
        alpha: 1,
        life: 0,
        maxLife: 40,
        type: 'impact',
      });
    }
  };

  // Add floating "+1" or "+2" feedback text
  const addFloatingText = (x: number, y: number, text: string, color: string = '#FBBF24') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: 1.4,
      vy: -2.2,
    });
  };

  // User Flap Action
  const handleFlap = useCallback(() => {
    if (gameState === 'MENU') {
      onStartPlay();
      birdRef.current.vy = diffSettings.flapPower;
      emitFlapPuff(birdRef.current.x, birdRef.current.y);
      SoundFX.playFlap(soundEnabled);
      onFlapCount();
      return;
    }

    if (gameState === 'PLAYING' && !isCrashingRef.current) {
      birdRef.current.vy = diffSettings.flapPower;
      emitFlapPuff(birdRef.current.x, birdRef.current.y);
      SoundFX.playFlap(soundEnabled);
      onFlapCount();
    }
  }, [gameState, diffSettings.flapPower, soundEnabled, onStartPlay, onFlapCount]);

  // Handle crash collision sequence
  const triggerCrash = useCallback(() => {
    if (isCrashingRef.current) return;
    isCrashingRef.current = true;
    shakeTimerRef.current = 16;
    flashAlphaRef.current = 0.55;

    emitCrashBurst(birdRef.current.x, birdRef.current.y);
    SoundFX.playHit(soundEnabled);

    // Short 400ms delay so player perceives the collision before game over card
    setTimeout(() => {
      onGameOver(scoreRef.current);
    }, 450);
  }, [soundEnabled, onGameOver]);

  // Main canvas click / touch handler
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleFlap();
  };

  // Global key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleFlap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlap]);

  // Reset or initialize on game state change
  useEffect(() => {
    if (gameState === 'MENU') {
      resetGame();
      initEnvironment();
    }
  }, [gameState, resetGame, initEnvironment]);

  // Physics and Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const gameLoop = (timestamp: number) => {
      if (!isRunning) return;

      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 16.666, 2.0); // clamped delta time
      lastTimeRef.current = timestamp;

      // ==========================================
      // 1. UPDATE PHYSICS & ENTITIES
      // ==========================================
      const currentScore = scoreRef.current;

      // Speed scale with score (progression)
      const currentSpeed = diffSettings.baseSpeed + Math.min(currentScore * 0.045, 1.8);
      const currentGap = Math.max(diffSettings.baseGap - currentScore * 0.6, diffSettings.minGap);

      // Environment clouds update
      cloudsRef.current.forEach((cloud) => {
        cloud.x -= cloud.speed * dt * (gameState === 'PLAYING' ? 1.4 : 0.8);
        if (cloud.x < -140) {
          cloud.x = GAME_WIDTH + 80;
          cloud.y = 40 + Math.random() * 160;
        }
      });

      // Stars twinkle update
      starsRef.current.forEach((star) => {
        star.alpha += (Math.random() - 0.5) * 0.04;
        if (star.alpha > 0.9) star.alpha = 0.9;
        if (star.alpha < 0.2) star.alpha = 0.2;
      });

      // Ground scroll
      if (gameState !== 'PAUSED' && !isCrashingRef.current) {
        groundOffsetRef.current = (groundOffsetRef.current + currentSpeed * dt) % 24;
      }

      // Bird eye blinking
      birdRef.current.blinkTimer += dt;
      if (birdRef.current.blinkTimer > 180) {
        birdRef.current.isBlinking = true;
        if (birdRef.current.blinkTimer > 192) {
          birdRef.current.isBlinking = false;
          birdRef.current.blinkTimer = 0;
        }
      }

      if (gameState === 'MENU') {
        // Idle bobbing floating motion
        const hoverOffset = Math.sin(timestamp * 0.005) * 12;
        birdRef.current.y = 260 + hoverOffset;
        birdRef.current.wingAngle = Math.sin(timestamp * 0.015) * 0.5;
        birdRef.current.rotation = Math.sin(timestamp * 0.004) * 0.12;
      } else if (gameState === 'PLAYING') {
        if (!isCrashingRef.current) {
          // Bird gravity & velocity
          birdRef.current.vy += diffSettings.gravity * dt;
          birdRef.current.y += birdRef.current.vy * dt;

          // Rotation dynamics: tilt up on jump, pitch down into dive
          const targetRotation = Math.min(Math.max(birdRef.current.vy * 0.08, -0.45), 1.25);
          birdRef.current.rotation += (targetRotation - birdRef.current.rotation) * 0.18 * dt;

          // Wing flapping cycle
          if (birdRef.current.vy < 0) {
            birdRef.current.wingAngle = Math.sin(timestamp * 0.035) * 0.8;
          } else {
            birdRef.current.wingAngle = Math.sin(timestamp * 0.012) * 0.3;
          }

          // Ceiling check
          if (birdRef.current.y - birdRef.current.radius < 0) {
            birdRef.current.y = birdRef.current.radius;
            birdRef.current.vy = 0;
          }

          // Ground collision check
          if (birdRef.current.y + birdRef.current.radius >= PLAYABLE_HEIGHT) {
            birdRef.current.y = PLAYABLE_HEIGHT - birdRef.current.radius;
            triggerCrash();
          }

          // Pipe spawning logic
          nextPipeSpawnRef.current -= currentSpeed * dt;
          if (nextPipeSpawnRef.current <= 0) {
            const minTop = 60;
            const maxTop = PLAYABLE_HEIGHT - currentGap - 60;
            const topHeight = Math.floor(minTop + Math.random() * (maxTop - minTop));
            const bottomHeight = PLAYABLE_HEIGHT - topHeight - currentGap;
            const hasStar = Math.random() < 0.28; // 28% chance of bonus star in the gap

            pipesRef.current.push({
              x: GAME_WIDTH + 20,
              topHeight,
              bottomHeight,
              width: 58,
              gap: currentGap,
              passed: false,
              hasStar,
              starCollected: false,
              starY: topHeight + currentGap / 2,
            });

            // Distance to next pipe: between 195 and 225 px
            nextPipeSpawnRef.current = 210;
          }

          // Update pipes
          for (let i = pipesRef.current.length - 1; i >= 0; i--) {
            const pipe = pipesRef.current[i];
            pipe.x -= currentSpeed * dt;

            // Score point check
            if (!pipe.passed && pipe.x + pipe.width < birdRef.current.x) {
              pipe.passed = true;
              scoreRef.current += 1;
              onScoreUpdate(scoreRef.current);
              onPipesPassedCount();
              SoundFX.playScore(soundEnabled);
              emitScoreBurst(pipe.x + pipe.width, birdRef.current.y);
              addFloatingText(birdRef.current.x + 10, birdRef.current.y - 15, '+1');
            }

            // Star bonus pickup check
            if (pipe.hasStar && !pipe.starCollected && pipe.starY !== undefined) {
              const starX = pipe.x + pipe.width / 2;
              const dist = Math.hypot(birdRef.current.x - starX, birdRef.current.y - pipe.starY);
              if (dist < birdRef.current.radius + 15) {
                pipe.starCollected = true;
                scoreRef.current += 2;
                onScoreUpdate(scoreRef.current);
                SoundFX.playBonus(soundEnabled);
                emitScoreBurst(starX, pipe.starY);
                addFloatingText(starX, pipe.starY - 10, '+2 ★', '#FDE047');
              }
            }

            // Collision check with pipes (forgiving circular vs rectangular overlap)
            const bx = birdRef.current.x;
            const by = birdRef.current.y;
            const br = birdRef.current.radius * 0.85; // forgiving hitbox

            // Top Pipe bounding box
            const inTopPipeX = bx + br > pipe.x && bx - br < pipe.x + pipe.width;
            const inTopPipeY = by - br < pipe.topHeight;

            // Bottom Pipe bounding box
            const inBottomPipeX = inTopPipeX;
            const inBottomPipeY = by + br > PLAYABLE_HEIGHT - pipe.bottomHeight;

            if ((inTopPipeX && inTopPipeY) || (inBottomPipeX && inBottomPipeY)) {
              triggerCrash();
            }

            // Remove off-screen pipes
            if (pipe.x + pipe.width < -30) {
              pipesRef.current.splice(i, 1);
            }
          }
        } else {
          // Crashing descent
          birdRef.current.vy += diffSettings.gravity * 1.5 * dt;
          birdRef.current.y += birdRef.current.vy * dt;
          birdRef.current.rotation = Math.min(birdRef.current.rotation + 0.15 * dt, Math.PI / 2);
          if (birdRef.current.y + birdRef.current.radius >= PLAYABLE_HEIGHT) {
            birdRef.current.y = PLAYABLE_HEIGHT - birdRef.current.radius;
          }
        }
      }

      // Update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt;
        p.alpha = Math.max(1 - p.life / p.maxLife, 0);
        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Update floating texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y += ft.vy * dt;
        ft.alpha -= 0.025 * dt;
        ft.scale = Math.max(1.0, ft.scale - 0.015 * dt);
        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // Decay screen shake
      if (shakeTimerRef.current > 0) {
        shakeTimerRef.current -= dt;
      }

      // Decay flash alpha
      if (flashAlphaRef.current > 0) {
        flashAlphaRef.current = Math.max(flashAlphaRef.current - 0.04 * dt, 0);
      }

      // ==========================================
      // 2. RENDER STAGE
      // ==========================================
      ctx.save();

      // Screen shake translation
      if (shakeTimerRef.current > 0) {
        const shakeMag = (shakeTimerRef.current / 16) * 7;
        const sx = (Math.random() - 0.5) * shakeMag;
        const sy = (Math.random() - 0.5) * shakeMag;
        ctx.translate(sx, sy);
      }

      // A. Dynamic Sky Background based on score
      const scoreTier = Math.floor(currentScore / 10);
      let skyTop = '#38BDF8';
      let skyBottom = '#BAE6FD';
      let showNightStars = false;

      if (scoreTier === 0) {
        // Morning clear sky
        skyTop = '#38BDF8';
        skyBottom = '#BAE6FD';
      } else if (scoreTier === 1) {
        // Golden afternoon
        skyTop = '#0284C7';
        skyBottom = '#FDE68A';
      } else if (scoreTier === 2) {
        // Sunset twilight
        skyTop = '#EA580C';
        skyBottom = '#7C3AED';
      } else {
        // Midnight celestial
        skyTop = '#0F172A';
        skyBottom = '#1E1B4B';
        showNightStars = true;
      }

      const skyGrad = ctx.createLinearGradient(0, 0, 0, PLAYABLE_HEIGHT);
      skyGrad.addColorStop(0, skyTop);
      skyGrad.addColorStop(1, skyBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Stars in twilight/night
      if (showNightStars || scoreTier === 2) {
        starsRef.current.forEach((star) => {
          ctx.fillStyle = `rgba(255, 255, 255, ${scoreTier === 2 ? star.alpha * 0.4 : star.alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Celestial Sun / Moon
      ctx.save();
      if (!showNightStars) {
        // Warm glowing Sun
        const sunX = GAME_WIDTH - 65;
        const sunY = 70;
        const sunGlow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 48);
        sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
        sunGlow.addColorStop(0.5, 'rgba(253, 224, 71, 0.4)');
        sunGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 48, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 20, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Glowing Crescent Moon
        const moonX = GAME_WIDTH - 65;
        const moonY = 70;
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
        ctx.fill();
        // Cutout for crescent
        ctx.fillStyle = skyTop;
        ctx.beginPath();
        ctx.arc(moonX + 8, moonY - 4, 18, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Distant mountain / hill silhouettes
      ctx.fillStyle = scoreTier >= 2 ? 'rgba(30, 27, 75, 0.35)' : 'rgba(14, 116, 144, 0.18)';
      ctx.beginPath();
      ctx.moveTo(0, PLAYABLE_HEIGHT);
      ctx.lineTo(0, PLAYABLE_HEIGHT - 90);
      ctx.quadraticCurveTo(80, PLAYABLE_HEIGHT - 140, 170, PLAYABLE_HEIGHT - 85);
      ctx.quadraticCurveTo(270, PLAYABLE_HEIGHT - 150, 360, PLAYABLE_HEIGHT - 95);
      ctx.quadraticCurveTo(400, PLAYABLE_HEIGHT - 120, GAME_WIDTH, PLAYABLE_HEIGHT - 85);
      ctx.lineTo(GAME_WIDTH, PLAYABLE_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // Procedural Layered Clouds
      cloudsRef.current.forEach((cloud) => {
        ctx.save();
        ctx.fillStyle = scoreTier >= 2 ? `rgba(243, 232, 255, ${cloud.opacity * 0.45})` : `rgba(255, 255, 255, ${cloud.opacity})`;
        ctx.translate(cloud.x, cloud.y);
        ctx.scale(cloud.scale, cloud.scale);

        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.arc(16, -8, 22, 0, Math.PI * 2);
        ctx.arc(38, -6, 19, 0, Math.PI * 2);
        ctx.arc(54, 2, 16, 0, Math.PI * 2);
        ctx.rect(-6, 2, 64, 16);
        ctx.fill();

        ctx.restore();
      });

      // B. Render Pipes
      pipesRef.current.forEach((pipe) => {
        // Base pipe colors
        const pipeBodyColor1 = '#15803D'; // Green shade
        const pipeBodyColor2 = '#22C55E'; // Green light
        const pipeHighlight = '#86EFAC';
        const pipeLipBorder = '#14532D';

        // --- TOP PIPE ---
        // Top pipe stem
        const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
        topGrad.addColorStop(0, pipeBodyColor1);
        topGrad.addColorStop(0.3, pipeHighlight);
        topGrad.addColorStop(0.7, pipeBodyColor2);
        topGrad.addColorStop(1, pipeLipBorder);
        ctx.fillStyle = topGrad;
        ctx.fillRect(pipe.x + 3, 0, pipe.width - 6, pipe.topHeight - 20);

        // Top pipe cap lip
        ctx.fillStyle = topGrad;
        ctx.fillRect(pipe.x, pipe.topHeight - 22, pipe.width, 22);
        ctx.strokeStyle = pipeLipBorder;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(pipe.x, pipe.topHeight - 22, pipe.width, 22);

        // Highlight stripe on top pipe
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(pipe.x + 8, 0, 4, pipe.topHeight - 22);

        // --- BOTTOM PIPE ---
        const botTop = PLAYABLE_HEIGHT - pipe.bottomHeight;
        // Bottom pipe stem
        ctx.fillStyle = topGrad;
        ctx.fillRect(pipe.x + 3, botTop + 22, pipe.width - 6, pipe.bottomHeight - 22);

        // Bottom pipe cap lip
        ctx.fillRect(pipe.x, botTop, pipe.width, 22);
        ctx.strokeStyle = pipeLipBorder;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(pipe.x, botTop, pipe.width, 22);

        // Highlight stripe on bottom pipe
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(pipe.x + 8, botTop + 22, 4, pipe.bottomHeight - 22);

        // --- BONUS STAR IN GAP ---
        if (pipe.hasStar && !pipe.starCollected && pipe.starY !== undefined) {
          const starX = pipe.x + pipe.width / 2;
          const starY = pipe.starY + Math.sin(timestamp * 0.008) * 6;
          const starPulse = 1 + Math.sin(timestamp * 0.012) * 0.15;

          ctx.save();
          ctx.translate(starX, starY);
          ctx.scale(starPulse, starPulse);

          // Star outer halo glow
          ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();

          // 5-pointed star
          ctx.fillStyle = '#FACC15';
          ctx.strokeStyle = '#CA8A04';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            const rot = (s * Math.PI * 2) / 5 - Math.PI / 2;
            const inRot = rot + Math.PI / 5;
            const rOut = 12;
            const rIn = 5.5;
            if (s === 0) ctx.moveTo(Math.cos(rot) * rOut, Math.sin(rot) * rOut);
            else ctx.lineTo(Math.cos(rot) * rOut, Math.sin(rot) * rOut);
            ctx.lineTo(Math.cos(inRot) * rIn, Math.sin(inRot) * rIn);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        }
      });

      // C. Render Particles (Behind Bird)
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // D. Render Cute Bird Character
      const bird = birdRef.current;
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.rotation);

      // Tail feather
      ctx.fillStyle = currentSkin.wingColor;
      ctx.beginPath();
      ctx.moveTo(-14, 2);
      ctx.lineTo(-24, -2);
      ctx.lineTo(-21, 8);
      ctx.closePath();
      ctx.fill();

      // Main Body (Round & Chubby)
      const bodyGrad = ctx.createRadialGradient(-3, -3, 3, 0, 0, bird.radius);
      bodyGrad.addColorStop(0, '#FFFFFF');
      bodyGrad.addColorStop(0.3, currentSkin.bodyColor);
      bodyGrad.addColorStop(1, currentSkin.wingColor);
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, bird.radius + 2, bird.radius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Belly highlight patch
      ctx.fillStyle = currentSkin.bellyColor;
      ctx.beginPath();
      ctx.ellipse(3, 4, bird.radius * 0.65, bird.radius * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rosy cheek
      ctx.fillStyle = currentSkin.cheekColor;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(7, 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Cute Big Eye
      const eyeX = 7;
      const eyeY = -5;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (bird.isBlinking) {
        // Blinking line
        ctx.strokeStyle = currentSkin.eyeColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(eyeX - 4, eyeY);
        ctx.lineTo(eyeX + 4, eyeY);
        ctx.stroke();
      } else {
        // Pupil
        ctx.fillStyle = currentSkin.eyeColor;
        ctx.beginPath();
        ctx.arc(eyeX + 1.5, eyeY, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Eye glint shine
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(eyeX + 2.5, eyeY - 1.5, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Beak (Cute small triangle/cone)
      ctx.fillStyle = currentSkin.beakColor;
      ctx.beginPath();
      ctx.moveTo(14, -2);
      ctx.lineTo(24, 2);
      ctx.lineTo(13, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Animated Wing with Flapping
      ctx.save();
      ctx.translate(-3, 2);
      ctx.rotate(bird.wingAngle);
      ctx.fillStyle = currentSkin.wingColor;
      ctx.beginPath();
      ctx.ellipse(-1, 0, 9, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Inner wing feather detail
      ctx.fillStyle = currentSkin.bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 3, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore(); // Restore bird matrix

      // E. Floating "+1" score indicators
      floatingTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = Math.max(ft.alpha, 0);
        ctx.font = `bold ${Math.floor(22 * ft.scale)}px 'Outfit', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Dark outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.lineWidth = 4;
        ctx.strokeText(ft.text, ft.x, ft.y);

        // Fill
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // F. Render Ground (Foreground)
      const groundY = PLAYABLE_HEIGHT;

      // Green grass top stripe
      const grassGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 14);
      grassGrad.addColorStop(0, '#4ADE80');
      grassGrad.addColorStop(1, '#16A34A');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, groundY, GAME_WIDTH, 14);

      // Grass border edge
      ctx.fillStyle = '#15803D';
      ctx.fillRect(0, groundY + 12, GAME_WIDTH, 2);

      // Soil layer
      const soilGrad = ctx.createLinearGradient(0, groundY + 14, 0, GAME_HEIGHT);
      soilGrad.addColorStop(0, '#D97706');
      soilGrad.addColorStop(1, '#92400E');
      ctx.fillStyle = soilGrad;
      ctx.fillRect(0, groundY + 14, GAME_WIDTH, GROUND_HEIGHT - 14);

      // Animated diagonal arcade ground stripes
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      const stripeSpacing = 24;
      for (let sx = -stripeSpacing * 2; sx < GAME_WIDTH + stripeSpacing; sx += stripeSpacing) {
        const drawX = sx - groundOffsetRef.current;
        ctx.beginPath();
        ctx.moveTo(drawX, groundY + 14);
        ctx.lineTo(drawX + 12, groundY + 14);
        ctx.lineTo(drawX - 2, GAME_HEIGHT);
        ctx.lineTo(drawX - 14, GAME_HEIGHT);
        ctx.closePath();
        ctx.fill();
      }

      // Ground top highlight line
      ctx.fillStyle = '#BBF7D0';
      ctx.fillRect(0, groundY, GAME_WIDTH, 2.5);

      // G. Red/White Screen Flash on Hit
      if (flashAlphaRef.current > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${flashAlphaRef.current})`;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      }

      ctx.restore(); // Restore shake matrix

      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [gameState, diffSettings, currentSkin, soundEnabled, triggerCrash, onScoreUpdate, onPipesPassedCount]);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        onPointerDown={handlePointerDown}
        className="w-full h-full max-w-[420px] max-h-[640px] aspect-[420/640] object-contain cursor-pointer game-touch-zone shadow-2xl rounded-none md:rounded-2xl border-0 md:border md:border-slate-800"
        style={{
          imageRendering: 'auto',
        }}
      />
    </div>
  );
};
