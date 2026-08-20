import { Position, isValidPosition } from '../models/position';
import { BoardState, getPieceAt } from '../models/board';
import { Move, MoveType } from '../moves/move';
import { Piece } from '../models/piece';
import { ChessGameState } from '../state/gameState';

export const getPseudoLegalMoves = (state: ChessGameState, pos: Position): Move[] => {
  const piece = getPieceAt(state.board, pos);
  if (!piece) return [];

  switch (piece.type) {
    case 'pawn': return getPawnMoves(state, piece, pos);
    case 'knight': return getKnightMoves(state.board, piece, pos);
    case 'bishop': return getSlidingMoves(state.board, piece, pos, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
    case 'rook': return getSlidingMoves(state.board, piece, pos, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
    case 'queen': return getSlidingMoves(state.board, piece, pos, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
    case 'king': return getKingMoves(state, piece, pos);
    default: return [];
  }
};

const getPawnMoves = (state: ChessGameState, piece: Piece, pos: Position): Move[] => {
  const moves: Move[] = [];
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;
  const promotionRow = piece.color === 'white' ? 0 : 7;
  const board = state.board;

  const addPawnMove = (to: Position, type: MoveType = 'normal') => {
    if (to.row === promotionRow) {
      (['queen', 'rook', 'bishop', 'knight'] as const).forEach(promo => {
        moves.push({ from: pos, to, type: 'promotion', promotionTo: promo });
      });
    } else {
      moves.push({ from: pos, to, type });
    }
  };

  // 1 square forward
  const forward1: Position = { row: pos.row + direction, col: pos.col };
  if (isValidPosition(forward1) && getPieceAt(board, forward1) === null) {
    addPawnMove(forward1, 'normal');

    // 2 squares forward
    const forward2: Position = { row: pos.row + direction * 2, col: pos.col };
    if (pos.row === startRow && isValidPosition(forward2) && getPieceAt(board, forward2) === null) {
      moves.push({ from: pos, to: forward2, type: 'normal' }); // Cannot promote on 2-square move
    }
  }

  // Captures
  const captures = [
    { row: pos.row + direction, col: pos.col - 1 },
    { row: pos.row + direction, col: pos.col + 1 }
  ];
  
  captures.forEach(target => {
    if (isValidPosition(target)) {
      const targetPiece = getPieceAt(board, target);
      if (targetPiece && targetPiece.color !== piece.color) {
        addPawnMove(target, 'capture');
      } else if (state.enPassantTarget && state.enPassantTarget.row === target.row && state.enPassantTarget.col === target.col) {
        moves.push({ from: pos, to: target, type: 'en_passant' });
      }
    }
  });

  return moves;
};

const getKnightMoves = (board: BoardState, piece: Piece, pos: Position): Move[] => {
  const moves: Move[] = [];
  const jumps = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];

  jumps.forEach(([dRow, dCol]) => {
    const target: Position = { row: pos.row + dRow, col: pos.col + dCol };
    if (isValidPosition(target)) {
      const targetPiece = getPieceAt(board, target);
      if (!targetPiece) {
        moves.push({ from: pos, to: target, type: 'normal' });
      } else if (targetPiece.color !== piece.color) {
        moves.push({ from: pos, to: target, type: 'capture' });
      }
    }
  });

  return moves;
};

const getKingMoves = (state: ChessGameState, piece: Piece, pos: Position): Move[] => {
  const moves: Move[] = [];
  const board = state.board;
  const steps = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  steps.forEach(([dRow, dCol]) => {
    const target: Position = { row: pos.row + dRow, col: pos.col + dCol };
    if (isValidPosition(target)) {
      const targetPiece = getPieceAt(board, target);
      if (!targetPiece) {
        moves.push({ from: pos, to: target, type: 'normal' });
      } else if (targetPiece.color !== piece.color) {
        moves.push({ from: pos, to: target, type: 'capture' });
      }
    }
  });

  // Castling
  const row = piece.color === 'white' ? 7 : 0;
  if (pos.row === row && pos.col === 4 && !piece.hasMoved) {
    const kingside = piece.color === 'white' ? state.castlingRights.whiteKingSide : state.castlingRights.blackKingSide;
    const queenside = piece.color === 'white' ? state.castlingRights.whiteQueenSide : state.castlingRights.blackQueenSide;

    if (kingside) {
      const f = getPieceAt(board, {row, col: 5});
      const g = getPieceAt(board, {row, col: 6});
      const h = getPieceAt(board, {row, col: 7}); // Rook
      if (!f && !g && h && h.type === 'rook' && !h.hasMoved) {
        moves.push({ from: pos, to: { row, col: 6 }, type: 'castling' });
      }
    }

    if (queenside) {
      const d = getPieceAt(board, {row, col: 3});
      const c = getPieceAt(board, {row, col: 2});
      const b = getPieceAt(board, {row, col: 1});
      const a = getPieceAt(board, {row, col: 0}); // Rook
      if (!d && !c && !b && a && a.type === 'rook' && !a.hasMoved) {
        moves.push({ from: pos, to: { row, col: 2 }, type: 'castling' });
      }
    }
  }

  return moves;
};

const getSlidingMoves = (board: BoardState, piece: Piece, pos: Position, directions: number[][]): Move[] => {
  const moves: Move[] = [];

  directions.forEach(([dRow, dCol]) => {
    let currentPos = { row: pos.row + dRow, col: pos.col + dCol };
    
    while (isValidPosition(currentPos)) {
      const targetPiece = getPieceAt(board, currentPos);
      
      if (!targetPiece) {
        moves.push({ from: pos, to: currentPos, type: 'normal' });
      } else {
        if (targetPiece.color !== piece.color) {
          moves.push({ from: pos, to: currentPos, type: 'capture' });
        }
        break; // Blocked by piece (own or enemy)
      }
      
      currentPos = { row: currentPos.row + dRow, col: currentPos.col + dCol };
    }
  });

  return moves;
};
