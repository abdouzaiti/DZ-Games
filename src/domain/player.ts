/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tile } from './tile';

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  teamId: number; // 0 or 1 for 2v2, or player index for FFA
  position: number; // Order in turn sequence (0, 1, 2, 3)
  score: number; // Individual player cumulative score
  hand: Tile[];
  avatar?: string;
}

export function createPlayer(
  id: string,
  name: string,
  isAI: boolean = false,
  teamId: number = 0,
  position: number = 0,
  score: number = 0,
  avatar?: string
): Player {
  return {
    id,
    name,
    isAI,
    teamId,
    position,
    score,
    hand: [],
    avatar,
  };
}

export function calculateHandPips(hand: Tile[]): number {
  return hand.reduce((sum, tile) => sum + tile.totalPips, 0);
}

export function findTileInHand(hand: Tile[], tileId: string): Tile | undefined {
  return hand.find((t) => t.id === tileId);
}

export function removeTileFromHand(hand: Tile[], tileId: string): Tile[] {
  return hand.filter((t) => t.id !== tileId);
}
