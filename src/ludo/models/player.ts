import { LudoColor } from './color';
import { LudoPiece } from './piece';

export type LudoPlayerType = 'human' | 'ai';

export interface LudoPlayer {
  id: string; // player ID
  color: LudoColor;
  type: LudoPlayerType;
  pieces: LudoPiece[]; // The 4 pieces owned by this player
  order: number; // Order index for taking turns (e.g., 0, 1, 2, 3)
}
