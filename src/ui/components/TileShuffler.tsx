import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audioController } from '../utils/audio';
import { getTranslation, Language } from '../translations';

interface TileShufflerProps {
  language: Language;
  soundEffects: boolean;
  vibration: boolean;
  onComplete: () => void;
}

interface ShufflerTile {
  id: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

export const TileShuffler: React.FC<TileShufflerProps> = ({
  language,
  soundEffects,
  vibration,
  onComplete,
}) => {
  const t = getTranslation(language);
  const [tiles, setTiles] = useState<ShufflerTile[]>([]);
  const [shuffling, setShuffling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasShuffled, setHasShuffled] = useState(false);
  const [isDealing, setIsDealing] = useState(false);

  // Initialize 28 tiles in a neat stack/grid in the center
  useEffect(() => {
    const initialTiles: ShufflerTile[] = [];
    const cols = 7;
    
    for (let i = 0; i < 28; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      // Center them with a slight offset so they overlap nicely like real dominoes
      const x = (col - 3) * 55 + (Math.random() * 8 - 4);
      const y = (row - 1.5) * 85 + (Math.random() * 8 - 4);
      
      initialTiles.push({
        id: i,
        x,
        y,
        rotate: Math.random() * 20 - 10,
        scale: 1,
      });
    }
    setTiles(initialTiles);

    // Automatically trigger the shuffle animation after a brief initial pause (500ms)
    const shuffleTimeout = setTimeout(() => {
      triggerShuffle();
    }, 500);

    return () => clearTimeout(shuffleTimeout);
  }, []);

  // Automatically trigger the deal animation after shuffling is finished
  useEffect(() => {
    if (hasShuffled && !shuffling && !isDealing) {
      const dealTimeout = setTimeout(() => {
        handleDeal();
      }, 700);
      return () => clearTimeout(dealTimeout);
    }
  }, [hasShuffled, shuffling, isDealing]);

  const triggerShuffle = () => {
    setShuffling(true);
    setProgress(0);
    setHasShuffled(true);

    // Trigger rapid vibration to mimic domino feel
    audioController.triggerVibration(vibration, 100);

    let currentProgress = 0;
    const duration = 2000; // 2.0 seconds of shuffle
    const intervalTime = 100; // shuffle step every 100ms
    const steps = duration / intervalTime;

    const interval = setInterval(() => {
      currentProgress += 100 / steps;
      setProgress(Math.min(currentProgress, 100));

      // Play clattering sounds at random intervals during each step
      if (soundEffects) {
        audioController.playShuffleSound(true);
        if (Math.random() > 0.4) {
          setTimeout(() => {
            audioController.playShuffleSound(true);
          }, 35);
        }
      }

      setTiles((prevTiles) =>
        prevTiles.map((tile) => {
          // Circular chaotic movement around center
          const angle = Math.random() * Math.PI * 2;
          const radius = 40 + Math.random() * 110;
          return {
            ...tile,
            x: Math.cos(angle) * radius + (Math.random() * 12 - 6),
            y: Math.sin(angle) * radius + (Math.random() * 12 - 6),
            rotate: Math.random() * 360 - 180,
          };
        })
      );
    }, intervalTime);

    setTimeout(() => {
      clearInterval(interval);
      setShuffling(false);
      setProgress(100);
      audioController.triggerVibration(vibration, 60);
    }, duration);
  };

  const handleTileDrag = (tileId: number) => {
    // Play a wooden click when the player physically stirs or drags a tile
    audioController.playShuffleSound(soundEffects);
    audioController.triggerVibration(vibration, 15);
  };

  const handleDeal = () => {
    if (isDealing) return;
    setIsDealing(true);
    audioController.playButtonClick(soundEffects);
    audioController.triggerVibration(vibration, 40);

    // Play rapid dealing clacks
    if (soundEffects) {
      let delay = 0;
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          audioController.playTileClick(true);
        }, delay);
        delay += 100;
      }
    }

    // Direct tiles to fly off-screen (dealt to players)
    setTiles((prevTiles) =>
      prevTiles.map((tile, idx) => {
        // Fly in 4 main directions based on index
        const dir = idx % 4;
        let targetX = tile.x;
        let targetY = tile.y;
        if (dir === 0) { targetY = 500; } // player (down)
        else if (dir === 1) { targetX = -600; } // left AI
        else if (dir === 2) { targetY = -500; } // partner AI (up)
        else { targetX = 600; } // right AI
        
        return {
          ...tile,
          x: targetX,
          y: targetY,
          rotate: tile.rotate + 360,
          scale: 0.1,
        };
      })
    );

    // Complete transition after dealing animation finishes
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  const isAr = language === 'ar';

  return (
    <div className="w-full flex-1 min-h-[500px] flex flex-col items-center justify-between p-4 relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1C110C] via-[#2D1B12] to-[#120704] border-[3px] border-[#3D251A] shadow-2xl">
      {/* Wood table grains aesthetic overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_80%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.15)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.15)_75%,transparent_75%,transparent)] bg-[length:60px_60px] opacity-10 pointer-events-none" />

      {/* Title Header */}
      <div className="text-center z-10 pt-4 select-none">
        <h2 className="text-2xl sm:text-3xl font-serif text-[#F5EBE6] drop-shadow-md font-bold flex items-center justify-center gap-2">
          <span>🀱</span> {t.shuffleTitle} <span>🀱</span>
        </h2>
        <p className="text-[#C4A484] text-xs sm:text-sm mt-1 font-sans">
          {isAr ? 'اخلط قطع الدومينو الجزائرية في المقهى قبل التوزيع' : 'Mélangez le jeu traditionnel du café algérien'}
        </p>
      </div>

      {/* Shuffling Table Sandbox Area */}
      <div className="flex-1 w-full relative flex items-center justify-center min-h-[320px] sm:min-h-[380px] my-3">
        {/* Felt circular mixing tray background */}
        <div className="absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full border border-[#40291D]/40 bg-[#0E0603]/60 shadow-[inset_0_8px_32px_rgba(0,0,0,0.95)] flex items-center justify-center pointer-events-none">
          <div className="text-[#321C12]/20 text-6xl sm:text-8xl font-bold select-none rotate-12">
            🇩🇿
          </div>
        </div>

        {/* 28 Domino Tiles */}
        <div className="relative w-full h-full flex items-center justify-center">
          {tiles.map((tile) => (
            <motion.div
              key={tile.id}
              drag
              dragMomentum={false}
              dragConstraints={{ left: -180, right: 180, top: -140, bottom: 140 }}
              onDrag={() => handleTileDrag(tile.id)}
              animate={{
                x: tile.x,
                y: tile.y,
                rotate: tile.rotate,
                scale: tile.scale,
              }}
              transition={
                shuffling
                  ? { type: 'spring', stiffness: 220, damping: 15 }
                  : { type: 'spring', stiffness: 150, damping: 20 }
              }
              style={{ x: tile.x, y: tile.y, rotate: tile.rotate }}
              className="absolute w-10 h-16 sm:w-12 sm:h-20 rounded-lg cursor-grab active:cursor-grabbing shrink-0 select-none flex items-center justify-center bg-gradient-to-br from-[#2D1B11] via-[#1B100B] to-[#0D0704] border-2 border-[#4A2F20] shadow-[0_4px_10px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.05)] active:ring-2 active:ring-[#D4A373]/80 transition-shadow duration-150 z-20"
            >
              {/* Back center rivet / brass pin spinner */}
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373] shadow-[0_0_4px_rgba(212,163,115,0.8)] z-10" />

              {/* Elegant corner accents on the tile back */}
              <div className="absolute inset-1 border border-[#3E2417]/30 rounded-md pointer-events-none" />
              <div className="absolute top-1.5 bottom-1.5 left-1/2 w-[1px] bg-[#3E2417]/20 -translate-x-1/2" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Controller Controls at Bottom */}
      <div className="w-full max-w-sm flex flex-col items-center gap-4 pb-6 z-10 select-none px-4">
        {/* Progress Bar / Instructions */}
        <div className="w-full text-center">
          {shuffling ? (
            <div className="space-y-2">
              <p className="text-sm font-sans text-[#E6CCB2] animate-pulse">
                {t.shuffleProgress}
              </p>
              <div className="w-full h-2 bg-[#1B100B] rounded-full overflow-hidden border border-[#3E2417]">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#8B5E3C] to-[#D4A373] shadow-[0_0_8px_rgba(212,163,115,0.6)]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
            </div>
          ) : isDealing ? (
            <p className="text-sm font-sans text-[#CCD5AE] font-bold tracking-wide animate-bounce">
              {isAr ? 'جاري توزيع قطع الدومينو...' : 'Distribution des dominoes...'}
            </p>
          ) : hasShuffled ? (
            <p className="text-sm font-sans text-[#FEFAE0] font-bold tracking-wide animate-pulse">
              {isAr ? 'تجهيز اللعبة...' : 'Préparation de la table...'}
            </p>
          ) : (
            <p className="text-xs text-[#A98467] italic">
              {isAr ? 'تحضير قطع الدومينو...' : 'Préparation des pièces...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
