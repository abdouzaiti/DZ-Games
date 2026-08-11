/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tile } from '../../domain/tile';
import { DominoTile } from './DominoTile';

interface DrawingTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockCount: number;
  onDrawTile: () => void;
  playableTileIds: string[];
  lastDrawnTile: Tile | null;
  language?: string;
  onClearLastDrawn?: () => void;
}

export const DrawingTableModal: React.FC<DrawingTableModalProps> = ({
  isOpen,
  onClose,
  stockCount,
  onDrawTile,
  playableTileIds,
  lastDrawnTile,
  language = 'fr',
  onClearLastDrawn,
}) => {
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  const isAr = language === 'ar';
  const isPlayable = lastDrawnTile ? playableTileIds.includes(lastDrawnTile.id) : false;

  // Automatically return to main gameplay board when a playable tile is found
  React.useEffect(() => {
    if (isOpen && lastDrawnTile && isPlayable) {
      const timer = setTimeout(() => {
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, lastDrawnTile, isPlayable, onClose]);

  if (!isOpen) return null;

  const handleTileClick = (index: number) => {
    if (lastDrawnTile && isPlayable) return; // Wait for user to play the drawn playable tile
    setClickedIndex(index);
    onDrawTile();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-[2px] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="max-w-xl w-full bg-slate-900 border-2 border-blue-400/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
          id="drawing-table-modal"
        >
          {/* Close button - floating top right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white font-black text-xs w-7 h-7 flex items-center justify-center rounded-full bg-slate-800/80 border border-slate-700 transition-colors cursor-pointer z-30"
            title={isAr ? 'إغلاق' : 'Fermer'}
          >
            ✕
          </button>

          {/* Table Container with Blue Felt Background */}
          <div className="p-4 sm:p-5 relative overflow-hidden flex-1 flex flex-col justify-center min-h-[260px] sm:min-h-[290px]">
            {/* Subtle felt texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

            {stockCount === 0 ? (
              <div className="text-center space-y-2 py-6 relative z-10">
                <span className="text-3xl">👝</span>
                <p className="font-bold text-white text-sm">
                  {isAr ? 'السلة فارغة تماماً!' : 'Le sachet est complètement vide !'}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-white text-blue-950 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all hover:scale-105 border-2 border-blue-300"
                >
                  {isAr ? 'إغلاق' : 'Fermer'}
                </button>
              </div>
            ) : (
              <div className="relative z-10 w-full flex flex-col justify-between h-full gap-3">
                {/* Top Info Banner Row */}
                <div className="flex items-center justify-between px-1 w-full max-w-sm mx-auto select-none gap-2 z-20">
                  <div className="text-[10px] text-blue-200 font-bold bg-slate-800/90 py-1 px-2.5 rounded-full border border-slate-700">
                    {isAr ? 'المتبقي:' : 'Restant :'} <span className="font-black text-white">{stockCount}</span>
                  </div>

                  <div className="text-[10px] text-blue-200 font-semibold tracking-wide bg-slate-800/90 py-1 px-3 rounded-full border border-slate-700">
                    {isAr
                      ? 'اسحب قطعة صالحة للعب !'
                      : "Piochez un domino jouable !"}
                  </div>
                </div>

                {/* Sachet facedown cards Flex Wrap */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-1 py-1 max-h-none overflow-visible">
                  {Array.from({ length: stockCount }).map((_, idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTileClick(idx)}
                      disabled={lastDrawnTile !== null && isPlayable}
                      className="w-7 h-12 sm:w-8 sm:h-14 rounded-md bg-white border-2 border-slate-300 shadow-md flex items-center justify-center relative cursor-pointer transition-all hover:border-blue-400 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Overlay Reveal for Last Drawn Tile */}
            <AnimatePresence>
              {lastDrawnTile && isPlayable && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-4 sm:p-5 z-20 text-center"
                >
                  <div className="text-white font-bold text-xs sm:text-sm mb-2 sm:mb-3 uppercase tracking-wider">
                    {isAr ? 'لقد سحبت:' : 'Vous avez pioché :'}
                  </div>

                  {/* High Fidelity Domino display */}
                  <motion.div
                    initial={{ rotateY: 180 }}
                    animate={{ rotateY: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-3 sm:mb-4 shadow-2xl rounded-xl ring-4 ring-offset-2 ring-offset-slate-900 ring-blue-400"
                  >
                    <DominoTile
                      tile={lastDrawnTile}
                      isPlayable={true}
                      width={44}
                      height={80}
                    />
                  </motion.div>

                  {/* Verdict Messages - WHITE TRIGGER BUTTON */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="space-y-2.5 sm:space-y-3"
                  >
                    <div className="px-3 py-1 bg-blue-500/20 border border-blue-400 text-blue-200 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest animate-bounce">
                      {isAr ? '✨ قطعة صالحة للعب !' : '✨ Domino Jouable !'}
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 bg-white hover:bg-blue-50 text-blue-950 font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-lg hover:scale-105 cursor-pointer transition-all border-2 border-blue-300"
                    >
                      {isAr ? 'العب الدومينو !' : 'Jouer le domino !'}
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
