/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlacementEnd } from './board';
import { GameConfig } from './gameConfig';

export type GameActionType =
  | 'START_MATCH'
  | 'START_NEW_ROUND'
  | 'PLAY_TILE'
  | 'DRAW_TILE'
  | 'AUTO_DRAW'
  | 'PASS_TURN'
  | 'AI_STEP'
  | 'RESTART_MATCH'
  | 'SURRENDER_MATCH';

export interface StartMatchAction {
  type: 'START_MATCH';
  config: GameConfig;
  playerNames?: string[];
  playerAvatars?: string[];
  aiFlags?: boolean[]; // [false, true, true, true] etc.
}

export interface StartNewRoundAction {
  type: 'START_NEW_ROUND';
}

export interface PlayTileAction {
  type: 'PLAY_TILE';
  playerId: string;
  tileId: string;
  end: PlacementEnd; // 'LEFT' or 'RIGHT'
}

export interface DrawTileAction {
  type: 'DRAW_TILE';
  playerId: string;
}

export interface AutoDrawAction {
  type: 'AUTO_DRAW';
  playerId: string;
}

export interface PassTurnAction {
  type: 'PASS_TURN';
  playerId: string;
}

export interface AIStepAction {
  type: 'AI_STEP';
}

export interface RestartMatchAction {
  type: 'RESTART_MATCH';
}

export interface SurrenderMatchAction {
  type: 'SURRENDER_MATCH';
  playerId: string;
}

export type GameAction =
  | StartMatchAction
  | StartNewRoundAction
  | PlayTileAction
  | DrawTileAction
  | AutoDrawAction
  | PassTurnAction
  | AIStepAction
  | RestartMatchAction
  | SurrenderMatchAction;
