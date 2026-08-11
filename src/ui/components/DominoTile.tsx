/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Tile } from '../../domain/tile';

interface DominoTileProps {
  tile: Tile;
  isPlayable?: boolean;
  isSelected?: boolean;
  isVertical?: boolean;
  onClick?: () => void;
  small?: boolean;
  flipped?: boolean;
  width?: number;
  height?: number;
}

export const DominoTile: React.FC<DominoTileProps> = ({
  tile,
  isPlayable = false,
  isSelected = false,
  isVertical = true,
  onClick,
  small = false,
  flipped = false,
  width,
  height,
}) => {
  const renderPips = (count: number) => {
    // Standard 3x3 pip positions for 0..6
    const positions: Record<number, number[]> = {
      0: [],
      1: [4], // center
      2: [0, 8], // top-left, bottom-right
      3: [0, 4, 8], // top-left, center, bottom-right
      4: [0, 2, 6, 8], // 4 corners
      5: [0, 2, 4, 6, 8], // 4 corners + center
      6: [0, 2, 3, 5, 6, 8], // 2 columns of 3
    };

    const activeIndices = new Set(positions[count] || []);

    // Determine pip dot size based on tile width
    const currentWidth = width || (small ? 36 : 48);
    const pipSize = currentWidth < 30 ? 'w-0.5 h-0.5' : currentWidth < 40 ? 'w-1 h-1' : 'w-2 h-2';
    const paddingSize = currentWidth < 30 ? 'p-0.5' : 'p-1';
    const gapSize = currentWidth < 30 ? 'gap-[1px]' : 'gap-0.5';

    return (
      <div className={`grid grid-cols-3 grid-rows-3 ${gapSize} w-full h-full ${paddingSize} place-items-center`}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
          <div
            key={idx}
            className={`rounded-full transition-all duration-200 ${
              activeIndices.has(idx)
                ? 'bg-[#2D241E] shadow-inner'
                : 'bg-transparent'
            } ${pipSize}`}
          />
        ))}
      </div>
    );
  };

  const sideTop = tile.sideA;
  const sideBottom = tile.sideB;

  if (flipped) {
    return (
      <div
        className={`relative select-none flex flex-col items-center justify-center rounded-lg bg-white border-2 border-slate-200 shadow-md overflow-hidden`}
        style={width && height ? { width, height } : { width: small ? 36 : 48, height: small ? 64 : 80 }}
      />
    );
  }

  // Set style object if width/height are provided
  const styleObj = width && height ? { width, height } : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={styleObj}
      className={`relative select-none flex transition-all duration-200 rounded-lg shadow-xl border ${
        isVertical ? 'flex-col' : 'flex-row'
      } ${
        isSelected
          ? 'ring-4 ring-[#D4A373] scale-105 shadow-[#D4A373]/50 -translate-y-2 border-[#FEFAE0] z-20'
          : isPlayable
          ? 'ring-2 ring-[#CCD5AE] hover:-translate-y-1 hover:shadow-2xl cursor-pointer shadow-[#CCD5AE]/20 border-[#CCD5AE]'
          : onClick
          ? 'opacity-50 grayscale-[20%] cursor-not-allowed border-[#3D322A]'
          : 'border-slate-300 shadow-md'
      } ${
        styleObj
          ? '' // size handled by inline styles
          : small
          ? isVertical
            ? 'w-9 h-16'
            : 'w-16 h-9'
          : isVertical
          ? 'w-12 h-22'
          : 'w-22 h-12'
      } bg-white text-slate-900`}
    >
      {/* Top / Left Half */}
      <div className="flex-1 flex items-center justify-center relative w-full h-full">
        {renderPips(sideTop)}
      </div>

      {/* Center Divider */}
      <div
        className={`bg-slate-300 ${
          isVertical ? 'w-full h-0.5 my-0' : 'h-full w-0.5 mx-0'
        }`}
      />

      {/* Bottom / Right Half */}
      <div className="flex-1 flex items-center justify-center relative w-full h-full">
        {renderPips(sideBottom)}
      </div>

      {/* Playable Indicator Glow */}
      {isPlayable && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#CCD5AE] rounded-full animate-ping" />
      )}
    </button>
  );
};
