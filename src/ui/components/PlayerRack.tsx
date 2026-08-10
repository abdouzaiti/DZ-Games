/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '../../domain/player';
import { Tile } from '../../domain/tile';
import { DominoTile } from './DominoTile';

interface PlayerRackProps {
  player: Player;
  userAvatar?: string;
  isCurrentTurn: boolean;
  selectedTileId: string | null;
  playableTileIds: string[];
  canDraw?: boolean;
  canPass?: boolean;
  stockCount?: number;
  requiredOpeningTileId?: string | null;
  logs?: string[];
  onSelectTile: (tile: Tile) => void;
  onOpenDrawingTable?: () => void;
  onPass?: () => void;
  language?: string;
}

export const PlayerRack: React.FC<PlayerRackProps> = ({
  player,
  userAvatar = '🇩🇿',
  isCurrentTurn,
  selectedTileId,
  playableTileIds,
  canDraw,
  canPass,
  stockCount = 0,
  requiredOpeningTileId,
  logs = [],
  onSelectTile,
  onOpenDrawingTable,
  onPass,
  language = 'fr',
}) => {
  const [showLog, setShowLog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const count = player.hand.length;
  // Dynamic scale factor based on hand size
  // 7 tiles is standard. As the player draws, we shrink the tiles to fit on the screen.
  const scale = count <= 7 ? 1.0 : Math.max(0.55, 1.0 - (count - 7) * 0.055);

  const baseW = isMobile ? 38 : 48;
  const baseH = isMobile ? 70 : 88;

  const tileW = Math.round(baseW * scale);
  const tileH = Math.round(baseH * scale);

  const isAr = language === 'ar';

  return (
    <div className="w-full flex flex-col items-center gap-3.5 relative select-none">
      {/* Actions and Status Center */}
      {isCurrentTurn && (
        <div className="flex flex-col items-center gap-2 mb-1">
          {canPass && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onPass}
                className="h-9 px-5 bg-[#A98467] hover:bg-[#8d6c52] active:scale-95 text-[#FEFAE0] font-black rounded-xl text-xs uppercase tracking-wider shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#3D322A]"
              >
                <span>⏭️</span> {isAr ? 'تخطي الدور' : 'Sauter le Tour'}
              </button>
            </div>
          )}

          {canDraw && (
            <p className="text-[10px] text-[#A98467] font-black uppercase tracking-widest animate-pulse mt-1">
              {isAr ? 'لا توجد حركات متاحة • انقر على السلة أعلاه لتسحب !' : 'Aucun coup possible • Cliquez sur le sachet ci-dessus pour piocher !'}
            </p>
          )}
        </div>
      )}

      {/* Tiles Displayed Directly on the Main Board Base */}
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap max-w-full py-2">
        <AnimatePresence mode="popLayout">
          {player.hand.map((tile) => {
            const isPlayable = playableTileIds.includes(tile.id);
            const isSelected = selectedTileId === tile.id;

            return (
              <motion.div
                key={tile.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 15 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: isSelected ? -10 : 0,
                }}
                exit={{ opacity: 0, scale: 0.5, y: -15 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`relative shrink-0 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isCurrentTurn && isPlayable
                    ? 'ring-2 ring-[#D4A373] ring-offset-2 ring-offset-[#1B1410] shadow-[0_0_12px_rgba(212,163,115,0.3)]'
                    : 'opacity-90'
                }`}
                style={{ width: tileW, height: tileH }}
              >
                <DominoTile
                  tile={tile}
                  isPlayable={isCurrentTurn && isPlayable}
                  isSelected={isSelected}
                  width={tileW}
                  height={tileH}
                  onClick={
                    isCurrentTurn ? () => onSelectTile(tile) : undefined
                  }
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};


