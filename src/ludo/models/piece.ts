import { LudoColor } from './color';
import { LudoPosition } from './position';

export type LudoPieceState = 'home' | 'on board' | 'finished';

export interface LudoPiece {
  id: string; // e.g., "red-0", "red-1", etc.
  playerId: string; // Owner/Player ID
  color: LudoColor;
  tokenIndex: number; // Index 0-3 for the player's 4 pieces
  position: LudoPosition;
  state: LudoPieceState;
  stepsMoved: number; // 0 = base/home, 1-51 = track, 52-56 = home path, 57 = finished/home triangle
}
