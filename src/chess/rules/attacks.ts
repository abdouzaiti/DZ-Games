import { BoardState, getPieceAt } from '../models/board';
import { Position, isValidPosition } from '../models/position';
import { PieceColor } from '../models/piece';

export const isSquareAttacked = (board: BoardState, pos: Position, attackerColor: PieceColor): boolean => {
  // Pawn attacks
  // If attacker is white, they move towards row 0 (up). So they attack from row + 1 to row.
  // If attacker is black, they move towards row 7 (down). So they attack from row - 1 to row.
  const pawnRowOffset = attackerColor === 'white' ? 1 : -1;
  const leftPawnPos = { row: pos.row + pawnRowOffset, col: pos.col - 1 };
  const rightPawnPos = { row: pos.row + pawnRowOffset, col: pos.col + 1 };
  
  if (isValidPosition(leftPawnPos)) {
    const p = getPieceAt(board, leftPawnPos);
    if (p && p.type === 'pawn' && p.color === attackerColor) return true;
  }
  if (isValidPosition(rightPawnPos)) {
    const p = getPieceAt(board, rightPawnPos);
    if (p && p.type === 'pawn' && p.color === attackerColor) return true;
  }

  // Knight attacks
  const knightJumps = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  for (const [dRow, dCol] of knightJumps) {
    const target = { row: pos.row + dRow, col: pos.col + dCol };
    if (isValidPosition(target)) {
      const p = getPieceAt(board, target);
      if (p && p.type === 'knight' && p.color === attackerColor) return true;
    }
  }

  // King attacks
  const kingSteps = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  for (const [dRow, dCol] of kingSteps) {
    const target = { row: pos.row + dRow, col: pos.col + dCol };
    if (isValidPosition(target)) {
      const p = getPieceAt(board, target);
      if (p && p.type === 'king' && p.color === attackerColor) return true;
    }
  }

  // Sliding attacks (Rook/Queen)
  const orthogonal = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dRow, dCol] of orthogonal) {
    let current = { row: pos.row + dRow, col: pos.col + dCol };
    while (isValidPosition(current)) {
      const p = getPieceAt(board, current);
      if (p) {
        if (p.color === attackerColor && (p.type === 'rook' || p.type === 'queen')) return true;
        break; // blocked by something else
      }
      current = { row: current.row + dRow, col: current.col + dCol };
    }
  }

  // Sliding attacks (Bishop/Queen)
  const diagonal = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dRow, dCol] of diagonal) {
    let current = { row: pos.row + dRow, col: pos.col + dCol };
    while (isValidPosition(current)) {
      const p = getPieceAt(board, current);
      if (p) {
        if (p.color === attackerColor && (p.type === 'bishop' || p.type === 'queen')) return true;
        break;
      }
      current = { row: current.row + dRow, col: current.col + dCol };
    }
  }

  return false;
};

export const findKing = (board: BoardState, color: PieceColor): Position | null => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const p = getPieceAt(board, { row, col });
      if (p && p.type === 'king' && p.color === color) {
        return { row, col };
      }
    }
  }
  return null;
};
