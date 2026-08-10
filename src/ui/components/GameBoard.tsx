/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Board, PlacementEnd } from '../../domain/board';
import { BoardLayoutCalculator } from '../../engine/board/boardLayoutCalculator';
import { DominoTile } from './DominoTile';

interface GameBoardProps {
  board: Board;
  selectedTileId: string | null;
  validEndsForSelectedTile: PlacementEnd[];
  onPlaceTile: (end: PlacementEnd) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  selectedTileId,
  validEndsForSelectedTile,
  onPlaceTile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Measure container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      } else if (typeof window !== 'undefined') {
        setContainerWidth(window.innerWidth);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Determine dynamic maxPerRow based on device container width
  const maxPerRow = React.useMemo(() => {
    if (containerWidth < 420) return 3;
    if (containerWidth < 600) return 4;
    if (containerWidth < 800) return 5;
    return 6;
  }, [containerWidth]);

  const isLeftPlayable = validEndsForSelectedTile.includes('LEFT');
  const isRightPlayable = validEndsForSelectedTile.includes('RIGHT');

  const snakeLayout = BoardLayoutCalculator.calculateSnakeLayout(board.chain, maxPerRow, 64, 36, 0);

  const renderSnakeChain = () => {
    if (board.chain.length === 0) return null;

    return (
      <div className="relative py-8 px-4 sm:py-12 sm:px-12 my-auto transition-all">
        <div
          style={{
            width: Math.max(snakeLayout.width + 120, 280),
            height: Math.max(snakeLayout.height + 80, 120),
            position: 'relative',
          }}
          className="mx-auto"
        >
          {/* Render Attached Snake Tiles */}
          {snakeLayout.tiles.map((tile) => {
            const isLeftmost = tile.logicalIndex === 0;
            const isRightmost = tile.logicalIndex === board.chain.length - 1;

            return (
              <motion.div
                key={`${tile.displayTile.id}-${tile.logicalIndex}`}
                layout
                initial={{ scale: 0.5, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                style={{
                  position: 'absolute',
                  left: tile.x + 60,
                  top: tile.y + 40,
                }}
                className="relative group"
              >
                <DominoTile
                  tile={tile.displayTile}
                  isVertical={tile.isVertical}
                  small
                />

                {/* Subtle glowing frame overlay (Cadre lumineux) for leftmost/rightmost tiles */}
                {selectedTileId && board.chain.length > 1 && (
                  <>
                    {isLeftmost && isLeftPlayable && (
                      <button
                        type="button"
                        onClick={() => onPlaceTile('LEFT')}
                        className="absolute -inset-[3px] rounded-lg border-2 border-[#D4A373] shadow-[0_0_12px_rgba(212,163,115,0.7)] animate-pulse cursor-pointer z-30 transition-all hover:border-[#FEFAE0] hover:shadow-[0_0_16px_rgba(255,254,224,0.9)] focus:outline-none"
                        title={`Play Left [${board.leftEndPip}]`}
                      >
                        <span className="absolute inset-0 rounded-[5px] bg-[#D4A373]/10" />
                        <span className="absolute inset-0 rounded-[5px] border border-[#FEFAE0]/30 animate-ping pointer-events-none" />
                      </button>
                    )}
                    {isRightmost && isRightPlayable && (
                      <button
                        type="button"
                        onClick={() => onPlaceTile('RIGHT')}
                        className="absolute -inset-[3px] rounded-lg border-2 border-[#D4A373] shadow-[0_0_12px_rgba(212,163,115,0.7)] animate-pulse cursor-pointer z-30 transition-all hover:border-[#FEFAE0] hover:shadow-[0_0_16px_rgba(255,254,224,0.9)] focus:outline-none"
                        title={`Play Right [${board.rightEndPip}]`}
                      >
                        <span className="absolute inset-0 rounded-[5px] bg-[#D4A373]/10" />
                        <span className="absolute inset-0 rounded-[5px] border border-[#FEFAE0]/30 animate-ping pointer-events-none" />
                      </button>
                    )}
                  </>
                )}

                {/* For 1-tile board, split clickable halves */}
                {selectedTileId && board.chain.length === 1 && (
                  <div className="absolute -inset-[3px] rounded-lg border-2 border-[#D4A373] shadow-[0_0_12px_rgba(212,163,115,0.7)] animate-pulse z-30 flex overflow-hidden">
                    {isLeftPlayable && (
                      <button
                        type="button"
                        onClick={() => onPlaceTile('LEFT')}
                        className="flex-1 h-full bg-[#D4A373]/5 hover:bg-[#D4A373]/20 transition-colors duration-150 flex items-center justify-center text-[10px] font-black text-[#FEFAE0] focus:outline-none"
                        title="Play Left"
                      >
                        L
                      </button>
                    )}
                    {(isLeftPlayable && isRightPlayable) && <div className="w-[1px] h-full bg-[#D4A373]/40" />}
                    {isRightPlayable && (
                      <button
                        type="button"
                        onClick={() => onPlaceTile('RIGHT')}
                        className="flex-1 h-full bg-[#D4A373]/5 hover:bg-[#D4A373]/20 transition-colors duration-150 flex items-center justify-center text-[10px] font-black text-[#FEFAE0] focus:outline-none"
                        title="Play Right"
                      >
                        R
                      </button>
                    )}
                  </div>
                )}


              </motion.div>
            );
          })}

          {/* Placement triggers are now handled directly on the active end dominoes */}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[340px] sm:min-h-[380px] bg-[radial-gradient(circle_at_center,_#3D322A_0%,_#2D241E_100%)] rounded-3xl border border-[#3D322A] shadow-2xl p-3 sm:p-6 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Table Felt Background Pattern */}
      <div className="absolute inset-3 sm:inset-4 border border-dashed border-[#D4A373]/20 rounded-[24px] sm:rounded-[28px] pointer-events-none" />

      {/* Empty Board State */}
      {board.chain.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-[#A98467] space-y-3 z-10 py-12 sm:py-16 px-2">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1B1410] flex items-center justify-center border-2 border-[#D4A373] shadow-lg">
            <span className="text-2xl font-serif italic text-[#D4A373]">🀁</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#FEFAE0] text-center max-w-sm">
            The Mostaganem café table is clear. Select a tile from your hand to open the round!
          </p>
          {selectedTileId && (
            <motion.button
              type="button"
              initial={{ scale: 0.9 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              onClick={() => onPlaceTile('LEFT')}
              className="px-5 py-2 sm:px-6 sm:py-2.5 bg-[#D4A373] hover:bg-[#A98467] text-[#1B1410] font-black text-xs uppercase tracking-wider rounded-xl shadow-xl transition-all cursor-pointer border-2 border-[#FEFAE0]"
            >
              Place Selected Tile on Table
            </motion.button>
          )}
        </div>
      ) : (
        <div
          className="z-10 w-full overflow-x-auto overflow-y-auto max-h-[380px] sm:max-h-[460px] flex justify-center transition-transform duration-200 scrollbar-thin scrollbar-thumb-[#D4A373]/30"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          {renderSnakeChain()}
        </div>
      )}
    </div>
  );
};


