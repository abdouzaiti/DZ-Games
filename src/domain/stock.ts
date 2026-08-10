/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateDoubleSixSet, Tile } from './tile';

export interface Stock {
  tiles: Tile[];
  remainingCount: number;
}

export function createStock(tiles?: Tile[]): Stock {
  const stockTiles = tiles ? [...tiles] : generateDoubleSixSet();
  return {
    tiles: stockTiles,
    remainingCount: stockTiles.length,
  };
}

/**
 * Shuffles tiles in place using Fisher-Yates algorithm.
 */
export function shuffleStock(stock: Stock, rng: () => number = Math.random): Stock {
  const tiles = [...stock.tiles];
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return {
    tiles,
    remainingCount: tiles.length,
  };
}

/**
 * Draws a tile from stock.
 */
export function drawFromStock(stock: Stock): { tile: Tile | null; updatedStock: Stock } {
  if (stock.tiles.length === 0) {
    return { tile: null, updatedStock: stock };
  }
  const tiles = [...stock.tiles];
  const tile = tiles.pop()!;
  return {
    tile,
    updatedStock: {
      tiles,
      remainingCount: tiles.length,
    },
  };
}
