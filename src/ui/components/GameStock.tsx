/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tile, createTile } from '../../domain/tile';
import { DominoTile } from './DominoTile';

interface GameStockProps {
  stock: Tile[];
  canDraw: boolean;
  onDraw: () => void;
  language?: string;
}

export const GameStock: React.FC<GameStockProps> = ({
  stock,
  canDraw,
  onDraw,
  language = 'fr',
}) => {
  const isAr = language === 'ar';

  if (stock.length === 0) return null;

  return (
    <div className="absolute right-2 md:right-6 top-[40%] md:top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 md:gap-6 z-30 scale-75 md:scale-100 origin-right">
      {/* Soft Glow Background */}
      <AnimatePresence>
        {canDraw && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 -m-8 bg-amber-400/20 blur-3xl rounded-full animate-pulse pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="relative w-10 md:w-12 h-40 md:h-48">
        <AnimatePresence>
          {stock.map((tile, index) => (
            <motion.div
              key={tile.id}
              initial={{ opacity: 0, x: 100, rotate: 90 }}
              animate={{
                opacity: 1,
                x: (index % 3) * 2,
                y: index * 5,
                rotate: 90 + (Math.random() * 4 - 2),
                zIndex: index,
              }}
              exit={{ opacity: 0, scale: 0.5, x: -50 }}
              className="absolute top-0 left-0"
              style={{
                cursor: canDraw ? 'pointer' : 'default',
              }}
              onClick={canDraw ? onDraw : undefined}
            >
              <div className={`transition-all duration-300 ${canDraw ? 'hover:brightness-125 hover:-translate-x-2' : ''}`}>
                <DominoTile
                  tile={createTile(0, 0)} // Dummy tile for back side
                  flipped={true}
                  width={30}
                  height={58}
                  small={true}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
};
