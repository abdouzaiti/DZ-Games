import { Position } from '../models/position';
import { PieceType } from '../models/piece';

export type MoveType = 'normal' | 'capture' | 'castling' | 'en_passant' | 'promotion';

export interface Move {
  from: Position;
  to: Position;
  type: MoveType;
  promotionTo?: PieceType; // if pawn promotes
}
