/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Tile {
  id: string; // e.g., "6-6", "0-5"
  sideA: number; // 0..6
  sideB: number; // 0..6
  isDouble: boolean;
  totalPips: number;
}

/**
 * Creates a standard Double-Six domino tile.
 * Normalizes tile so sideA <= sideB for consistent ID generation.
 */
export function createTile(a: number, b: number): Tile {
  const sideA = Math.min(a, b);
  const sideB = Math.max(a, b);
  return {
    id: `${sideA}-${sideB}`,
    sideA,
    sideB,
    isDouble: sideA === sideB,
    totalPips: sideA + sideB,
  };
}

/**
 * Generates the standard 28 Double-Six domino set.
 */
export function generateDoubleSixSet(): Tile[] {
  const set: Tile[] = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      set.push(createTile(a, b));
    }
  }
  return set;
}

/**
 * Checks if two tiles represent the same physical domino tile.
 * e.g., createTile(6, 5) and createTile(5, 6) represent the same physical tile.
 */
export function areTilesEqual(t1: Tile, t2: Tile): boolean {
  if (!t1 || !t2) return false;
  return (
    (t1.sideA === t2.sideA && t1.sideB === t2.sideB) ||
    (t1.sideA === t2.sideB && t1.sideB === t2.sideA)
  );
}

/**
 * Returns a unique hash string representing the physical tile.
 */
export function getTileHash(tile: Tile): string {
  const min = Math.min(tile.sideA, tile.sideB);
  const max = Math.max(tile.sideA, tile.sideB);
  return `tile_${min}_${max}`;
}

/**
 * Serializes a tile for state storage/networking.
 */
export function serializeTile(tile: Tile): { sideA: number; sideB: number; id: string } {
  return {
    id: tile.id,
    sideA: tile.sideA,
    sideB: tile.sideB,
  };
}

/**
 * Deserializes a tile from JSON data.
 */
export function deserializeTile(data: { sideA: number; sideB: number }): Tile {
  return createTile(data.sideA, data.sideB);
}

/**
 * Formats a tile for display/logging e.g. "[6|6]" or "[0|5]".
 */
export function formatTile(tile: Tile): string {
  return `[${tile.sideA}|${tile.sideB}]`;
}

/**
 * Checks if tile has a specific pip value on either side.
 */
export function tileHasPip(tile: Tile, pip: number): boolean {
  return tile.sideA === pip || tile.sideB === pip;
}

/**
 * Given one side matching an open pip, returns the other side's pip value.
 */
export function getOtherPip(tile: Tile, matchingPip: number): number {
  if (tile.sideA === matchingPip) return tile.sideB;
  if (tile.sideB === matchingPip) return tile.sideA;
  throw new Error(`Tile ${tile.id} does not contain pip ${matchingPip}`);
}
