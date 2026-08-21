import { LudoPosition } from '../models/position';
import { LudoColor } from '../models/color';

export interface LudoMove {
  pieceId: string; // The ID of the piece being moved
  tokenId?: string; // Alias for backward compatibility
  playerColor: LudoColor;
  from: LudoPosition;
  to: LudoPosition;
  rollValue: number;
  isCapture?: boolean;
  isFinished?: boolean;
}
