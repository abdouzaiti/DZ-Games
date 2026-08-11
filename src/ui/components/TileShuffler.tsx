import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { audioController } from '../utils/audio';
import { getTranslation, Language } from '../translations';
import { Tile, createTile } from '../../domain/tile';
import { DominoTile } from './DominoTile';
import leatherPouchImg from '../../assets/images/leather_domino_pouch_1786418367291.jpg';

interface TileShufflerProps {
  language: Language;
  soundEffects: boolean;
  vibration: boolean;
  playerCount?: number;
  playerNames?: string[];
  playerAvatars?: string[];
  humanHand?: Tile[];
  allPlayersHands?: Tile[][];
  sachetStock?: Tile[];
  onComplete: () => void;
}

interface TileState {
  id: string;
  index: number;
  tileObj?: Tile;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
  zIndex: number;
  isPickedByHuman: boolean;
  pickedSlotIndex?: number;
  isDealtToOther: boolean;
  isFlipped: boolean;
}

export const TileShuffler: React.FC<TileShufflerProps> = ({
  language,
  soundEffects,
  vibration,
  playerCount = 2,
  playerNames = ['Vous', 'Joueur 2', 'Joueur 3', 'Joueur 4'],
  playerAvatars = ['🇩🇿', '🤖', '🤖', '🤖'],
  humanHand = [],
  allPlayersHands = [],
  sachetStock = [],
  onComplete,
}) => {
  const isAr = language === 'ar';

  const numPlayers = Math.min(Math.max(playerCount, 2), 4);
  const targetHumanTileCount = numPlayers === 3 ? 6 : 7;

  // Flow phases: 'AUTO_SHUFFLE' -> 'DISTRIBUTING' -> 'FINISHED'
  const [phase, setPhase] = useState<'AUTO_SHUFFLE' | 'DISTRIBUTING' | 'FINISHED'>('AUTO_SHUFFLE');

  // Track human picked count for UI progress
  const [humanPickedCount, setHumanPickedCount] = useState(0);
  
  // Track visual counters
  const [sachetCount, setSachetCount] = useState<number>(0);
  const [isSachetPulsing, setIsSachetPulsing] = useState<boolean>(false);

  // Initialize 28 face-down tiles on the board
  const [tiles, setTiles] = useState<TileState[]>(() => {
    const initial: TileState[] = [];
    const cols = 7;
    for (let i = 0; i < 28; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      // Scatter in a center cluster on board
      const x = (col - 3) * 32 + (Math.random() * 20 - 10);
      const y = (row - 1.5) * 42 + (Math.random() * 20 - 10);
      const rotate = Math.random() * 60 - 30;

      initial.push({
        id: `domino_board_${i}`,
        index: i,
        x,
        y,
        rotate,
        scale: 1,
        opacity: 1,
        zIndex: i + 10,
        isPickedByHuman: false,
        isDealtToOther: false,
        isFlipped: false,
      });
    }
    return initial;
  });

  // Action: Melange (Shuffle) tiles on board
  const handleShuffle = () => {
    if (soundEffects) {
      audioController.playShuffleSound(true);
    }
    audioController.triggerVibration(vibration, 80);

    setTiles((prev) =>
      prev.map((tile) => {
        if (tile.isPickedByHuman || tile.isDealtToOther) return tile;
        const angle = Math.random() * Math.PI * 2;
        const radius = 25 + Math.random() * 120;
        return {
          ...tile,
          x: Math.cos(angle) * radius + (Math.random() * 20 - 10),
          y: Math.sin(angle) * radius + (Math.random() * 20 - 10),
          rotate: Math.random() * 720 - 360,
          zIndex: Math.floor(Math.random() * 50) + 10,
        };
      })
    );
  };

  // Auto sequence control
  useEffect(() => {
    let isMounted = true;

    const runSequence = async () => {
      // 1. Initial wait
      await new Promise(r => setTimeout(r, 800));
      if (!isMounted) return;

      // 2. Shuffle 3 times
      for (let i = 0; i < 3; i++) {
        handleShuffle();
        await new Promise(r => setTimeout(r, 600));
        if (!isMounted) return;
      }

      // 3. Transition to Distributing
      setPhase('DISTRIBUTING');
      await new Promise(r => setTimeout(r, 400));
      if (!isMounted) return;

      // 4. Round-robin distribution
      const allTilesToDistribute = [...tiles].sort(() => Math.random() - 0.5);
      const tilesPerPlayer = targetHumanTileCount;
      let currentTileIndex = 0;

      // Helper to compute opponent slot target
      const getSlotCoordinates = (pIdx: number, sIdx: number) => {
        if (pIdx === 0) {
          // Human
          return { x: (sIdx - (targetHumanTileCount - 1) / 2) * 44, y: 175 };
        }
        if (pIdx === 1) {
          if (numPlayers === 2) return { x: (sIdx - 3) * 40, y: -165 }; // North
          return { x: -205, y: (sIdx - 3) * 26 }; // West
        }
        if (pIdx === 2) {
          if (numPlayers === 3) return { x: 205, y: (sIdx - 3) * 26 }; // East
          return { x: (sIdx - 3) * 40, y: -165 }; // North
        }
        return { x: 205, y: (sIdx - 3) * 26 }; // East
      };

      // Deal logic
      for (let slotIdx = 0; slotIdx < tilesPerPlayer; slotIdx++) {
        for (let playerIdx = 0; playerIdx < numPlayers; playerIdx++) {
          if (currentTileIndex < allTilesToDistribute.length) {
            const tileToDealId = allTilesToDistribute[currentTileIndex].id;
            const targetCoords = getSlotCoordinates(playerIdx, slotIdx);
            const realTile = (allPlayersHands[playerIdx] && allPlayersHands[playerIdx][slotIdx]);

            if (soundEffects) audioController.playTileClick(true);
            audioController.triggerVibration(vibration, 15);

            setTiles(prev => prev.map(t => t.id === tileToDealId ? {
              ...t,
              isPickedByHuman: playerIdx === 0,
              isDealtToOther: playerIdx > 0,
              x: targetCoords.x,
              y: targetCoords.y,
              rotate: playerIdx === 0 ? 0 : 360,
              scale: playerIdx === 0 ? 1 : 0.8,
              tileObj: realTile,
              zIndex: 200 + currentTileIndex,
              isFlipped: playerIdx === 0, // reveal human's tiles
            } : t));

            if (playerIdx === 0) setHumanPickedCount(prev => prev + 1);

            currentTileIndex++;
            await new Promise(r => setTimeout(r, 120));
            if (!isMounted) return;
          }
        }
      }

      // 5. Send remaining to Stock Pile (Right Side)
      let stockIdx = 0;
      while (currentTileIndex < allTilesToDistribute.length) {
        const tileToStockId = allTilesToDistribute[currentTileIndex].id;
        
        // Stack them slightly staggered on the right
        const stockCoords = { 
          x: 280 + (stockIdx % 3) * 2, 
          y: -120 + (stockIdx * 6) 
        };

        if (soundEffects) audioController.playTileClick(true);
        audioController.triggerVibration(vibration, 10);

        setTiles(prev => prev.map(t => t.id === tileToStockId ? {
          ...t,
          isDealtToOther: true,
          x: stockCoords.x,
          y: stockCoords.y,
          rotate: 90 + (Math.random() * 10 - 5), // Rotate them sideways
          scale: 0.8,
          zIndex: 50 + stockIdx,
        } : t));

        currentTileIndex++;
        stockIdx++;
        await new Promise(r => setTimeout(r, 60));
        if (!isMounted) return;
      }

      // 6. Finished
      await new Promise(r => setTimeout(r, 500));
      if (isMounted) {
        setPhase('FINISHED');
        onComplete();
      }
    };

    runSequence();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-between z-50 select-none p-2 overflow-hidden pointer-events-auto">
      
      {/* --- TOP ACTION BAR --- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50 px-4">
        {phase === 'AUTO_SHUFFLE' && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-2 bg-slate-950/80 border border-amber-500/40 shadow-2xl rounded-full px-5 py-2 backdrop-blur-md"
          >
            <div className="text-amber-300 font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="animate-spin">🔀</span>
              <span>{isAr ? 'جاري خلط القطع...' : 'Mélange des dominos...'}</span>
            </div>
          </motion.div>
        )}

        {phase === 'DISTRIBUTING' && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3 bg-slate-950/80 border border-emerald-500/40 shadow-2xl rounded-full px-5 py-2 backdrop-blur-md text-center"
          >
            <span className="text-emerald-300 font-extrabold text-sm flex items-center gap-2">
              <span className="animate-pulse">✋</span>
              {isAr ? 'توزيع القطع...' : 'Distribution...'}
            </span>
            <div className="w-px h-4 bg-slate-700" />
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-xs">
              {humanPickedCount} / {targetHumanTileCount}
            </span>
          </motion.div>
        )}
      </div>

      {/* --- SACHET ICON AT TOP-LEFT FOR STOCK --- */}
      {sachetCount > 0 && (
        <div
          className={`absolute top-4 left-4 z-40 flex items-center gap-2 transition-transform ${
            isSachetPulsing ? 'scale-125' : 'scale-100'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl border-2 border-amber-600/80 shadow-2xl overflow-hidden relative bg-amber-950/60">
            <img src={leatherPouchImg} alt="Sachet" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[10px] text-amber-300 text-center font-bold">
              {sachetCount}
            </div>
          </div>
        </div>
      )}

      {/* --- 28 DOMINO TILES ON THE BOARD --- */}
      <div className="absolute inset-0 flex items-center justify-center z-40">
        {tiles.map((tile) => {
          return (
            <motion.div
              key={tile.id}
              animate={{
                x: tile.x,
                y: tile.y,
                rotate: tile.rotate,
                scale: tile.scale,
                opacity: tile.opacity,
              }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              style={{
                position: 'absolute',
                zIndex: tile.zIndex,
              }}
              className="shrink-0 select-none cursor-default"
            >
              {tile.isPickedByHuman && tile.isFlipped && tile.tileObj ? (
                /* HUMAN REVEALED FACE-UP TILE IN RACK */
                <div className="transform scale-100 shadow-2xl transition-transform border-2 border-slate-200 rounded-lg overflow-hidden">
                  <DominoTile
                    tile={tile.tileObj}
                    small={true}
                    width={38}
                    height={68}
                  />
                </div>
              ) : (
                /* FACE-DOWN WHITE TILE BACK */
                <div className="transition-all">
                  <DominoTile
                    tile={{ ...createTile(0, 0), id: `back_${tile.id}` }}
                    flipped={true}
                    small={true}
                    width={36}
                    height={60}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>


    </div>
  );
};
