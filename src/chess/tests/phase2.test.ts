import { getPseudoLegalMoves } from '../rules/movement';
import { createEmptyBoard, placePiece } from '../models/board';
import { Piece } from '../models/piece';
import { Position, positionToAlgebraic } from '../models/position';

const runPhase2Tests = () => {
  console.log("Running Phase 2 Pseudo-Legal Movement Tests...");

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  };

  const createPiece = (type: any, color: any, pos: Position): Piece => ({
    id: `${color}_${type}_test`,
    type,
    color,
    hasMoved: false,
    position: pos
  });

  const checkMoves = (board: any, pos: Position, expectedAlgebraic: string[], message: string) => {
    const mockState = { board, castlingRights: { whiteKingSide: false, whiteQueenSide: false, blackKingSide: false, blackQueenSide: false }, enPassantTarget: null, positionCounts: {} } as any;
    const moves = getPseudoLegalMoves(mockState, pos);
    const generatedAlgebraic = moves.map(m => positionToAlgebraic(m.to)).sort();
    const expectedSorted = [...expectedAlgebraic].sort();
    
    const isMatch = generatedAlgebraic.length === expectedSorted.length && 
                    generatedAlgebraic.every((alg, idx) => alg === expectedSorted[idx]);
    
    if (!isMatch) {
      console.error(`Expected: ${expectedSorted.join(', ')}`);
      console.error(`Got: ${generatedAlgebraic.join(', ')}`);
    }
    assert(isMatch, message);
  };

  // --- PAWN TESTS ---
  console.log("--- Pawn Tests ---");
  let board = createEmptyBoard();
  let wPawnPos = { row: 6, col: 4 }; // e2
  board = placePiece(board, wPawnPos, createPiece('pawn', 'white', wPawnPos));
  checkMoves(board, wPawnPos, ['e3', 'e4'], "White pawn from start can move 1 or 2 squares forward");

  // Blocked white pawn
  board = placePiece(board, { row: 5, col: 4 }, createPiece('rook', 'black', { row: 5, col: 4 })); // block at e3
  checkMoves(board, wPawnPos, [], "White pawn is blocked from moving forward");

  // Capture
  board = createEmptyBoard();
  board = placePiece(board, wPawnPos, createPiece('pawn', 'white', wPawnPos));
  board = placePiece(board, { row: 5, col: 3 }, createPiece('pawn', 'black', { row: 5, col: 3 })); // d3
  board = placePiece(board, { row: 5, col: 5 }, createPiece('pawn', 'black', { row: 5, col: 5 })); // f3
  checkMoves(board, wPawnPos, ['e3', 'e4', 'd3', 'f3'], "White pawn can capture diagonally");

  // Black pawn testing
  board = createEmptyBoard();
  let bPawnPos = { row: 1, col: 0 }; // a7
  board = placePiece(board, bPawnPos, createPiece('pawn', 'black', bPawnPos));
  checkMoves(board, bPawnPos, ['a6', 'a5'], "Black pawn from start can move 1 or 2 squares forward");


  // --- KNIGHT TESTS ---
  console.log("\n--- Knight Tests ---");
  board = createEmptyBoard();
  let nPos = { row: 4, col: 4 }; // e4
  board = placePiece(board, nPos, createPiece('knight', 'white', nPos));
  checkMoves(board, nPos, ['d6', 'f6', 'c5', 'g5', 'c3', 'g3', 'd2', 'f2'], "Knight in center has 8 moves");
  
  // Knight corner and blocked
  board = createEmptyBoard();
  nPos = { row: 7, col: 0 }; // a1
  board = placePiece(board, nPos, createPiece('knight', 'white', nPos));
  board = placePiece(board, { row: 5, col: 1 }, createPiece('pawn', 'white', { row: 5, col: 1 })); // b3 blocked by own
  checkMoves(board, nPos, ['c2'], "Knight in corner with one own piece blocking");

  // --- BISHOP TESTS ---
  console.log("\n--- Bishop Tests ---");
  board = createEmptyBoard();
  let bPos = { row: 4, col: 4 }; // e4
  board = placePiece(board, bPos, createPiece('bishop', 'black', bPos));
  checkMoves(board, bPos, [
    'd5', 'c6', 'b7', 'a8', // NW
    'f5', 'g6', 'h7',       // NE
    'd3', 'c2', 'b1',       // SW
    'f3', 'g2', 'h1'        // SE
  ], "Bishop open diagonals");
  
  // Bishop blocked
  board = placePiece(board, { row: 3, col: 3 }, createPiece('pawn', 'black', { row: 3, col: 3 })); // d5 (own)
  board = placePiece(board, { row: 5, col: 5 }, createPiece('pawn', 'white', { row: 5, col: 5 })); // f3 (enemy)
  checkMoves(board, bPos, [
    'f5', 'g6', 'h7',       // NE
    'd3', 'c2', 'b1',       // SW
    'f3'                    // SE (captures f3 but stops)
  ], "Bishop path blocked by own piece and enemy piece");

  // --- ROOK TESTS ---
  console.log("\n--- Rook Tests ---");
  board = createEmptyBoard();
  let rPos = { row: 4, col: 4 }; // e4
  board = placePiece(board, rPos, createPiece('rook', 'white', rPos));
  checkMoves(board, rPos, [
    'e5', 'e6', 'e7', 'e8', // N
    'e3', 'e2', 'e1',       // S
    'a4', 'b4', 'c4', 'd4', // W
    'f4', 'g4', 'h4'        // E
  ], "Rook open lines");

  // --- QUEEN TESTS ---
  console.log("\n--- Queen Tests ---");
  board = createEmptyBoard();
  let qPos = { row: 7, col: 3 }; // d1
  board = placePiece(board, qPos, createPiece('queen', 'white', qPos));
  checkMoves(board, qPos, [
    'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', // N
    'a1', 'b1', 'c1', 'e1', 'f1', 'g1', 'h1', // W/E
    'c2', 'b3', 'a4', // NW
    'e2', 'f3', 'g4', 'h5' // NE
  ], "Queen edge of board");

  // --- KING TESTS ---
  console.log("\n--- King Tests ---");
  board = createEmptyBoard();
  let kPos = { row: 0, col: 7 }; // h8
  board = placePiece(board, kPos, createPiece('king', 'black', kPos));
  checkMoves(board, kPos, ['g8', 'g7', 'h7'], "King in corner has 3 moves");

  console.log(`\nPhase 2 Tests completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
};

runPhase2Tests();
