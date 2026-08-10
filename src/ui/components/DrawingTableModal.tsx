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

  if (!isOpen) return null;

  const isAr = language === 'ar';
  const isPlayable = lastDrawnTile ? playableTileIds.includes(lastDrawnTile.id) : false;

  const handleTileClick = (index: number) => {
    if (lastDrawnTile && !isPlayable) return; // Wait for user to dismiss last drawn non-playable tile
    setClickedIndex(index);
    onDrawTile();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="max-w-xl w-full bg-gradient-to-b from-[#143d22] to-[#0d2a17] border-2 border-[#D4A373]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative"
          id="drawing-table-modal"
        >
          {/* Close button - floating top right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-[#CCD5AE]/60 hover:text-[#FEFAE0] font-black text-xs w-6 h-6 flex items-center justify-center rounded-full bg-[#0d2a17]/60 border border-[#1c5430]/40 transition-colors cursor-pointer z-30"
            title={isAr ? 'إغلاق' : 'Fermer'}
          >
            ✕
          </button>

          {/* Table Container with Green Felt Background */}
          <div className="p-4 sm:p-5 relative overflow-hidden flex-1 flex flex-col justify-center min-h-[260px] sm:min-h-[290px]">
            {/* Subtle felt texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#1c5430_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

            {stockCount === 0 ? (
              <div className="text-center space-y-2 py-6 relative z-10">
                <span className="text-3xl">👝</span>
                <p className="font-bold text-[#FEFAE0] text-sm">
                  {isAr ? 'السلة فارغة تماماً!' : 'Le sachet est complètement vide !'}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-[#D4A373] text-[#1B1410] font-black rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transition-all hover:scale-105"
                >
                  {isAr ? 'إغلاق' : 'Fermer'}
                </button>
              </div>
            ) : (
              <div className="relative z-10 w-full flex flex-col justify-between h-full gap-3">
                {/* Top Info Banner Row */}
                <div className="flex items-center justify-between px-1 w-full max-w-sm mx-auto select-none gap-2 z-20">
                  <div className="text-[10px] text-[#CCD5AE] font-bold bg-[#0d2a17]/80 py-1 px-2.5 rounded-full border border-[#1c5430]/40">
                    {isAr ? 'المتبقي:' : 'Restant :'} <span className="font-black text-[#FEFAE0]">{stockCount}</span>
                  </div>

                  <div className="text-[10px] text-[#CCD5AE] font-semibold tracking-wide bg-[#0d2a17]/80 py-1 px-3 rounded-full border border-[#1c5430]/40">
                    {isAr
                      ? 'اسحب قطعة صالحة للعب !'
                      : "Piochez un domino jouable !"}
                  </div>
                </div>

                {/* Sachet facedown cards Flex Wrap (all fit, no scroll) */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-1 py-1 max-h-none overflow-visible">
                  {Array.from({ length: stockCount }).map((_, idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTileClick(idx)}
                      disabled={!!lastDrawnTile}
                      className="w-7 h-12 sm:w-8 sm:h-14 rounded-md bg-[#1B1410] border border-[#D4A373]/30 shadow-md flex flex-col items-center justify-between py-1 px-0.5 cursor-pointer transition-all hover:border-[#D4A373] hover:shadow-[0_0_8px_rgba(212,163,115,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <div className="w-1 h-1 rounded-full bg-[#D4A373]/30" />
                      <div className="text-[10px] text-[#D4A373]/60 font-black">?</div>
                      <div className="w-1 h-1 rounded-full bg-[#D4A373]/30" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Overlay Reveal for Last Drawn Tile */}
            <AnimatePresence>
              {lastDrawnTile && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-[#0d2a17]/95 flex flex-col items-center justify-center p-4 sm:p-5 z-20 text-center"
                >
                  <div className="text-[#FEFAE0] font-bold text-xs sm:text-sm mb-2 sm:mb-3 uppercase tracking-wider">
                    {isAr ? 'لقد سحبت:' : 'Vous avez pioché :'}
                  </div>

                  {/* High Fidelity Domino display */}
                  <motion.div
                    initial={{ rotateY: 180 }}
                    animate={{ rotateY: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-3 sm:mb-4 shadow-2xl rounded-xl ring-4 ring-offset-2 ring-offset-[#0d2a17] ring-transparent"
                  >
                    <DominoTile
                      tile={lastDrawnTile}
                      isPlayable={isPlayable}
                      width={44}
                      height={80}
                    />
                  </motion.div>

                  {/* Verdict Messages */}
                  {isPlayable ? (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="space-y-2.5 sm:space-y-3"
                    >
                      <div className="px-3 py-1 bg-[#CCD5AE]/20 border border-[#CCD5AE] text-[#CCD5AE] rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest animate-bounce">
                        {isAr ? '✨ قطعة صالحة للعب !' : '✨ Domino Jouable !'}
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 bg-[#CCD5AE] hover:bg-[#b5be98] text-[#1B1410] font-black rounded-xl text-xs uppercase tracking-wider shadow-lg hover:scale-105 cursor-pointer transition-all border border-[#FEFAE0]/10"
                      >
                        {isAr ? 'العب الدومينو !' : 'Jouer le domino !'}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="space-y-2.5 sm:space-y-3"
                    >
                      <div className="px-3 py-1 bg-[#E07A5F]/20 border border-[#E07A5F] text-[#E07A5F] rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                        {isAr ? '❌ غير صالحة للعب' : '❌ Non Jouable'}
                      </div>
                      <p className="text-[10px] sm:text-xs text-[#A98467] max-w-xs leading-relaxed">
                        {isAr
                          ? 'هذه القطعة لا تطابق أطراف اللوحة الحالية. اسحب قطعة أخرى!'
                          : "Ce domino ne correspond à aucun bout de la table. Piochez-en un autre !"}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          // Allow picking again by resetting index but keeping the tile in hand
                          // We reset lastDrawnTile status by continuing
                          onDrawTile(); // Draw again instantly if desired, or let them click
                        }}
                        className="hidden"
                      />
                      {/* Let them click on the table to draw another one */}
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={onDrawTile} // Quick draw shortcut
                          className="px-3.5 py-2 bg-[#D4A373]/90 hover:bg-[#D4A373] text-[#1B1410] font-black rounded-xl text-[11px] sm:text-xs uppercase tracking-wider shadow cursor-pointer transition-all hover:scale-105"
                        >
                          {isAr ? 'سحب تلقائي آخر' : 'Piocher un autre'}
                        </button>
                        {onClearLastDrawn && (
                          <button
                            type="button"
                            onClick={onClearLastDrawn}
                            className="px-3.5 py-2 bg-[#2D241E] hover:bg-[#3D322A] text-[#FEFAE0] font-black rounded-xl text-[11px] sm:text-xs uppercase tracking-wider shadow cursor-pointer transition-all border border-[#D4A373]/20 hover:scale-105"
                          >
                            {isAr ? 'اختيار يدوي' : 'Choisir moi-même'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
