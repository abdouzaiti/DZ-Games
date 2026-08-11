import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audioController } from '../utils/audio';
import { getTranslation, Language } from '../translations';

interface TileShufflerProps {
  language: Language;
  soundEffects: boolean;
  vibration: boolean;
  playerCount?: number;
  onComplete: () => void;
}

interface ShufflerTile {
  id: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
}

const HandIcon: React.FC<{ isLeft?: boolean }> = ({ isLeft = false }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#FFFFFF"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-24 h-24 text-white opacity-90"
    style={{ transform: isLeft ? 'scaleX(-1)' : 'none' }}
  >
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M10 10.5V5.5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v9" />
    <path d="M6 13V9a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6c0 5.5 4.5 10 10 10h1a4 4 0 0 0 4-4v-5" />
    <path d="M18 11a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1" />
  </svg>
);

export const TileShuffler: React.FC<TileShufflerProps> = ({
  language,
  soundEffects,
  vibration,
  playerCount = 2,
  onComplete,
}) => {
  const t = getTranslation(language);
  const [tiles, setTiles] = useState<ShufflerTile[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDealing, setIsDealing] = useState(false);
  const hasStartedSeq = useRef(false);

  // Initialize and run the shuffle & fast sequential deal sequence once on mount
  useEffect(() => {
    if (hasStartedSeq.current) return;
    hasStartedSeq.current = true;

    const numPlayers = playerCount || 2;
    const tilesPerPlayer = 7;
    const totalPlayerTiles = Math.min(numPlayers * tilesPerPlayer, 28);

    // 1. Generate 28 initial tiles in neat grid at center
    const initialTiles: ShufflerTile[] = [];
    const cols = 7;
    for (let i = 0; i < 28; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - 3) * 48 + (Math.random() * 4 - 2);
      const y = (row - 1.5) * 72 + (Math.random() * 4 - 2);
      initialTiles.push({
        id: i,
        x,
        y,
        rotate: Math.random() * 16 - 8,
        scale: 1,
        opacity: 1,
      });
    }
    setTiles(initialTiles);

    const activeTimers: NodeJS.Timeout[] = [];
    const activeIntervals: NodeJS.Timeout[] = [];

    // Phase 1: Shuffle
    const shuffleTimer = setTimeout(() => {
      setShuffling(true);
      audioController.triggerVibration(vibration, 100);

      const shuffleDuration = 2200; // 2.2 seconds of mixing
      const intervalTime = 90;
      const totalSteps = shuffleDuration / intervalTime;

      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + (100 / totalSteps), 100));

        if (soundEffects) {
          audioController.playShuffleSound(true);
          if (Math.random() > 0.4) {
            const extraSoundTimer = setTimeout(() => {
              audioController.playShuffleSound(true);
            }, 35);
            activeTimers.push(extraSoundTimer);
          }
        }

        // Swirling chaotic motion
        setTiles((prevTiles) =>
          prevTiles.map((tile) => {
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 110;
            return {
              ...tile,
              x: Math.cos(angle) * radius + (Math.random() * 10 - 5),
              y: Math.sin(angle) * radius + (Math.random() * 10 - 5),
              rotate: Math.random() * 360 - 180,
            };
          })
        );
      }, intervalTime);
      activeIntervals.push(interval);

      // Phase 2: Gather tiles and start fast distribution
      const dealDelayTimer = setTimeout(() => {
        clearInterval(interval);
        setShuffling(false);
        setProgress(100);

        // Gather tiles into stack
        setTiles((prevTiles) =>
          prevTiles.map((tile, idx) => ({
            ...tile,
            x: (idx % 7 - 3) * 10 + (Math.random() * 4 - 2),
            y: (Math.floor(idx / 7) - 1.5) * 10 + (Math.random() * 4 - 2),
            rotate: (idx % 2 === 0 ? 1 : -1) * (Math.random() * 6),
            scale: 1,
            opacity: 1,
          }))
        );

        // Fast Distribution Phase
        const dealStartTimer = setTimeout(() => {
          setIsDealing(true);

          const getPlayerTarget = (pIdx: number) => {
            if (numPlayers === 2) {
              if (pIdx === 0) return { x: 0, y: 480 }; // South
              return { x: 0, y: -480 }; // North
            } else if (numPlayers === 3) {
              if (pIdx === 0) return { x: 0, y: 480 }; // South
              if (pIdx === 1) return { x: -580, y: 0 }; // West
              return { x: 580, y: 0 }; // East
            } else {
              if (pIdx === 0) return { x: 0, y: 480 }; // South
              if (pIdx === 1) return { x: -580, y: 0 }; // West
              if (pIdx === 2) return { x: 0, y: -480 }; // North
              return { x: 580, y: 0 }; // East
            }
          };

          const sachetTarget = { x: -360, y: -360 }; // Sachet bag at top-left

          let currentDealIndex = 0;
          const dealStepInterval = 55; // Fast 55ms per tile deal

          const dealInterval = setInterval(() => {
            if (currentDealIndex >= totalPlayerTiles) {
              clearInterval(dealInterval);

              // Rush remaining tiles into Sachet
              if (totalPlayerTiles < 28) {
                let sachetIndex = totalPlayerTiles;
                const sachetInterval = setInterval(() => {
                  if (sachetIndex >= 28) {
                    clearInterval(sachetInterval);

                    const finishTimer = setTimeout(() => {
                      onComplete();
                    }, 400);
                    activeTimers.push(finishTimer);
                    return;
                  }

                  const tileId = sachetIndex;
                  if (soundEffects) {
                    audioController.playTileClick(true);
                  }
                  audioController.triggerVibration(vibration, 15);

                  setTiles((prevTiles) =>
                    prevTiles.map((tile) => {
                      if (tile.id === tileId) {
                        return {
                          ...tile,
                          x: sachetTarget.x,
                          y: sachetTarget.y,
                          rotate: 720,
                          scale: 0.15,
                          opacity: 0,
                        };
                      }
                      return tile;
                    })
                  );

                  sachetIndex++;
                }, 35);
                activeIntervals.push(sachetInterval);
              } else {
                const finishTimer = setTimeout(() => {
                  onComplete();
                }, 400);
                activeTimers.push(finishTimer);
              }
              return;
            }

            // Deal next tile to player
            const tileId = currentDealIndex;
            const targetPlayer = currentDealIndex % numPlayers;
            const target = getPlayerTarget(targetPlayer);

            if (soundEffects) {
              audioController.playTileClick(true);
            }
            audioController.triggerVibration(vibration, 20);

            setTiles((prevTiles) =>
              prevTiles.map((tile) => {
                if (tile.id === tileId) {
                  return {
                    ...tile,
                    x: target.x,
                    y: target.y,
                    rotate: tile.rotate + 360,
                    scale: 0.15,
                    opacity: 0,
                  };
                }
                return tile;
              })
            );

            currentDealIndex++;
          }, dealStepInterval);

          activeIntervals.push(dealInterval);

        }, 350);
        activeTimers.push(dealStartTimer);

      }, shuffleDuration);
      activeTimers.push(dealDelayTimer);

    }, 400);
    activeTimers.push(shuffleTimer);

    return () => {
      hasStartedSeq.current = false;
      activeTimers.forEach(clearTimeout);
      activeIntervals.forEach(clearInterval);
    };
  }, [soundEffects, vibration, playerCount, onComplete]);

  const isAr = language === 'ar';

  return (
    <div className="w-full flex-1 min-h-[440px] flex flex-col items-center justify-between relative overflow-hidden bg-transparent select-none">
      
      {/* Shuffling Table Sandbox Area */}
      <div className="flex-1 w-full relative flex items-center justify-center min-h-[280px] sm:min-h-[320px] my-2">
        
        {/* Transparent table container */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Shuffling Hands overlay */}
          <AnimatePresence>
            {shuffling && (
              <>
                {/* Left Hand */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -160, y: 60, rotate: -25 }}
                  animate={{
                    opacity: 0.75,
                    scale: 1.05,
                    x: [-120, -40, -100, -160, -60, -120],
                    y: [-40, 20, -60, 40, -10, -40],
                    rotate: [-15, 10, -25, 5, -15, -15],
                  }}
                  exit={{ opacity: 0, scale: 0.8, x: -160, y: 60, transition: { duration: 0.3 } }}
                  transition={{
                    x: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
                    y: { repeat: Infinity, duration: 1.8, ease: "easeInOut" },
                    rotate: { repeat: Infinity, duration: 1.6, ease: "easeInOut" },
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 }
                  }}
                  className="absolute pointer-events-none z-30 filter drop-shadow-[0_15px_18px_rgba(0,0,0,0.7)]"
                >
                  <HandIcon isLeft={true} />
                </motion.div>

                {/* Right Hand */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 160, y: -60, rotate: 25 }}
                  animate={{
                    opacity: 0.75,
                    scale: 1.05,
                    x: [120, 40, 100, 160, 60, 120],
                    y: [40, -20, 60, -40, 10, 40],
                    rotate: [15, -10, 25, -5, 15, 15],
                  }}
                  exit={{ opacity: 0, scale: 0.8, x: 160, y: -60, transition: { duration: 0.3 } }}
                  transition={{
                    x: { repeat: Infinity, duration: 2.4, ease: "easeInOut" },
                    y: { repeat: Infinity, duration: 1.9, ease: "easeInOut" },
                    rotate: { repeat: Infinity, duration: 1.7, ease: "easeInOut" },
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 }
                  }}
                  className="absolute pointer-events-none z-30 filter drop-shadow-[0_15px_18px_rgba(0,0,0,0.7)]"
                >
                  <HandIcon isLeft={false} />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {tiles.map((tile) => (
            <motion.div
              key={tile.id}
              animate={{
                x: tile.x,
                y: tile.y,
                rotate: tile.rotate,
                scale: tile.scale,
                opacity: tile.opacity,
              }}
              transition={
                shuffling
                  ? { type: 'spring', stiffness: 220, damping: 15 }
                  : { type: 'spring', stiffness: 260, damping: 22 }
              }
              style={{ x: tile.x, y: tile.y, rotate: tile.rotate }}
              className="absolute w-10 h-16 sm:w-11 sm:h-18 rounded-lg shrink-0 select-none flex items-center justify-center bg-white border-2 border-slate-300 shadow-lg z-20"
            />
          ))}
        </div>
      </div>

      {/* Controller / Progress Status at Bottom */}
      <div className="w-full max-w-sm flex flex-col items-center gap-3 pb-6 z-10 select-none px-4">
        {/* Progress label */}
        <div className="text-blue-200 text-xs font-semibold tracking-wider uppercase animate-pulse">
          {shuffling 
            ? (isAr ? 'جاري خلط القطع...' : 'Mélange des dominos...') 
            : isDealing 
            ? (isAr ? 'جاري توزيع القطع...' : 'Distribution...') 
            : (isAr ? 'تجهيز اللعبة...' : 'Préparation du jeu...')}
        </div>

        {/* Shuffling progress bar */}
        <div className="w-full">
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-white"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
