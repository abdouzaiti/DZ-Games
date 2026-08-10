/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Board } from './board';
import { GameConfig } from './gameConfig';
import { Player } from './player';
import { Team } from './team';
import { Tile } from './tile';

export type RoundStatus =
  | 'NOT_STARTED'
  | 'PLAYING'
  | 'ROUND_ENDED_SORTIE'  // A player emptied hand
  | 'ROUND_ENDED_GHALLAQ' // Game blocked
  | 'MATCH_ENDED';        // A player/team reached target score

export interface RoundResult {
  roundNumber: number;
  winnerPlayerId: string | null;
  winnerTeamId: number | null;
  reason: 'SORTIE' | 'GHALLAQ' | 'EGALITE';
  pointsAwarded: number;
  losingPips: number;
  playerHandPipsAtEnd: Record<string, number>;
}

export interface MatchScores {
  // Score per player (for FFA) or per team (for 2v2)
  playerScores: Record<string, number>;
  teamScores: Record<number, number>;
  matchWinnerId: string | null;
  matchWinnerTeamId: number | null;
}

export interface GameSnapshot {
  config: GameConfig;
  matchScores: MatchScores;
  roundNumber: number;
  roundStatus: RoundStatus;
  
  board: Board;
  players: Player[];
  teams?: Team[];
  stock: Tile[]; // Stock/Pioche remaining tiles
  
  currentPlayerIndex: number;
  lastPlayedTileId: string | null;
  consecutivePassesCount: number; // To detect ghallaq/blocked state
  
  roundHistory: RoundResult[];
  latestResult: RoundResult | null;
  
  lastActionDescription: string | null;
  openerPlayerId: string | null; // Player who opened current round
  requiredOpeningTileId?: string | null; // Optional required tile for Round 1 / burned round opening move
}

/**
 * Serializes GameSnapshot to a plain JSON object for state saving / transmission.
 */
export function serializeGameState(state: GameSnapshot): string {
  return JSON.stringify(state);
}

/**
 * Deserializes GameSnapshot from a JSON string.
 */
export function deserializeGameState(json: string): GameSnapshot {
  return JSON.parse(json);
}
