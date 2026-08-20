import { Piece, PieceType } from './piece';
import { Position, isValidPosition } from './position';

export type Square = Piece | null;
export type BoardState = Square[][]; // 8x8 grid

export const createEmptyBoard = (): BoardState => {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
};

export const getPieceAt = (board: BoardState, pos: Position): Piece | null => {
  if (!isValidPosition(pos)) return null;
  return board[pos.row][pos.col];
};

export const placePiece = (board: BoardState, pos: Position, piece: Piece): BoardState => {
  if (!isValidPosition(pos)) return board;
  const newBoard = board.map(row => [...row]);
  newBoard[pos.row][pos.col] = { ...piece, position: pos };
  return newBoard;
};

export const removePiece = (board: BoardState, pos: Position): BoardState => {
  if (!isValidPosition(pos)) return board;
  const newBoard = board.map(row => [...row]);
  newBoard[pos.row][pos.col] = null;
  return newBoard;
};

export const movePiece = (board: BoardState, from: Position, to: Position): BoardState => {
  const piece = getPieceAt(board, from);
  if (!piece) return board;
  let newBoard = removePiece(board, from);
  const movedPiece = { ...piece, hasMoved: true, position: to };
  newBoard = placePiece(newBoard, to, movedPiece);
  return newBoard;
};

export const initializeStandardBoard = (): BoardState => {
  let board = createEmptyBoard();
  let idCounter = 1;
  const generateId = (color: string, type: string) => `${color}_${type}_${idCounter++}`;

  const placeRow = (row: number, color: 'white' | 'black', types: PieceType[]) => {
    types.forEach((type, col) => {
      const pos = { row, col };
      board = placePiece(board, pos, {
        id: generateId(color, type),
        type,
        color,
        hasMoved: false,
        position: pos
      });
    });
  };

  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  const pawnRow: PieceType[] = Array(8).fill('pawn');

  placeRow(0, 'black', backRow);
  placeRow(1, 'black', pawnRow);
  placeRow(6, 'white', pawnRow);
  placeRow(7, 'white', backRow);

  return board;
};
