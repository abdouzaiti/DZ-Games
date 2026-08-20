import { BoardState } from '../models/board';
import { PieceColor, Piece } from '../models/piece';
import { Move } from '../moves/move';
import { Position } from '../models/position';

export type GameStatus = 'active' | 'checkmate' | 'stalemate' | 'draw';
export type DrawReason = 'stalemate' | 'threefold_repetition' | 'fifty_move_rule' | 'insufficient_material' | 'agreement';

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export interface MoveRecord extends Move {
  piece: Piece;
  capturedPiece?: Piece | null;
  previousCastlingRights: CastlingRights;
  previousEnPassantTarget: Position | null;
  previousHalfMoveClock: number;
}

export interface ChessGameState {
  board: BoardState;
  turn: PieceColor;
  status: GameStatus;
  winner?: PieceColor | null;
  drawReason?: DrawReason | null;
  isCheck: boolean;
  moveHistory: MoveRecord[];
  capturedWhitePieces: Piece[];
  capturedBlackPieces: Piece[];
  halfMoveClock: number; // For 50-move rule
  fullMoveNumber: number; // Increments after Black moves
  castlingRights: CastlingRights;
  enPassantTarget: Position | null; // Square behind the pawn that just double-moved
  positionCounts: Record<string, number>;
}
