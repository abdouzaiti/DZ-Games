/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tile } from './tile';

export type PlacementEnd = 'LEFT' | 'RIGHT';

export interface PlacedTile {
  /** Original physical tile identity */
  tile: Tile;
  /** ID of player who played this tile */
  placedByPlayerId: string;
  /** Pip value facing LEFT in board chain */
  leftPip: number;
  /** Pip value facing RIGHT in board chain */
  rightPip: number;
  /** True if physical tile was flipped relative to sideA|sideB */
  isFlipped: boolean;
  /** Whether tile is a double */
  isDouble: boolean;
  /** End of board where tile was placed ('LEFT' or 'RIGHT') */
  placedEnd: PlacementEnd;
  /** The pip value that connected to the existing board (or starting value if first tile) */
  connectionPip: number;
  /** The new open pip value extending outward */
  openPip: number;
  /** Order sequence index of placement (0 for opener) */
  stepIndex: number;
  /** Relative 2D grid coordinates for layout engines */
  gridX: number;
  gridY: number;
  /** Rotation in degrees (0 = normal horizontal, 90 = vertical double, 180 = flipped, etc.) */
  rotation: number;
}

export interface Board {
  chain: PlacedTile[];
  leftEndPip: number | null; // null if board is empty
  rightEndPip: number | null; // null if board is empty
  tileCount: number;
}

export function createEmptyBoard(): Board {
  return {
    chain: [],
    leftEndPip: null,
    rightEndPip: null,
    tileCount: 0,
  };
}

export function serializeBoard(board: Board): object {
  return JSON.parse(JSON.stringify(board));
}

export function deserializeBoard(data: any): Board {
  return {
    chain: data.chain || [],
    leftEndPip: data.leftEndPip ?? null,
    rightEndPip: data.rightEndPip ?? null,
    tileCount: data.tileCount ?? (data.chain ? data.chain.length : 0),
  };
}

