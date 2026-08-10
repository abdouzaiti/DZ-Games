/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = '1v1' | '2v2' | '3player_ffa' | '4player_ffa';

export interface GameConfig {
  mode: GameMode;
  targetScore: number; // e.g., 100 or 150 points to win the match
  tilesPerPlayer: number; // 7 tiles for 2/4 players
  allowDrawFromStock: boolean; // True for 1v1 with stock
  ruleset: 'mostaganem'; // Specifically Mostaganem Café Rules
}

export function getDefaultConfig(mode: GameMode = '1v1'): GameConfig {
  switch (mode) {
    case '1v1':
      return {
        mode: '1v1',
        targetScore: 100,
        tilesPerPlayer: 7,
        allowDrawFromStock: true,
        ruleset: 'mostaganem',
      };
    case '2v2':
      return {
        mode: '2v2',
        targetScore: 100,
        tilesPerPlayer: 7,
        allowDrawFromStock: false, // 4 players x 7 tiles = 28 tiles (No stock)
        ruleset: 'mostaganem',
      };
    case '3player_ffa':
      return {
        mode: '3player_ffa',
        targetScore: 100,
        tilesPerPlayer: 7, // 3 x 7 = 21 tiles dealt, 7 in pioche
        allowDrawFromStock: true,
        ruleset: 'mostaganem',
      };
    case '4player_ffa':
      return {
        mode: '4player_ffa',
        targetScore: 100,
        tilesPerPlayer: 7, // 4 x 7 = 28 tiles dealt (No stock)
        allowDrawFromStock: false,
        ruleset: 'mostaganem',
      };
    default:
      return {
        mode: '1v1',
        targetScore: 100,
        tilesPerPlayer: 7,
        allowDrawFromStock: true,
        ruleset: 'mostaganem',
      };
  }
}
