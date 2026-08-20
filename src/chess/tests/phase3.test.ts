import { ChessRulesEngine } from '../rules/rulesEngine';
import { createEmptyBoard, placePiece } from '../models/board';
import { Piece } from '../models/piece';
import { Position, positionToAlgebraic, algebraicToPosition } from '../models/position';
import { ChessGameState } from '../state/gameState';

const runPhase3Tests = () => {
  console.log("Running Phase 3 Legal Moves & Check Detection Tests...");

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

  const getEmptyState = (turn: 'white' | 'black' = 'white'): ChessGameState => ({
    board: createEmptyBoard(),
    turn,
    status: 'active',
    isCheck: false,
    moveHistory: [],
    capturedWhitePieces: [],
    capturedBlackPieces: [],
    halfMoveClock: 0,
    fullMoveNumber: 1,
    castlingRights: { whiteKingSide: false, whiteQueenSide: false, blackKingSide: false, blackQueenSide: false },
    enPassantTarget: null,
    positionCounts: {}
  });

  const checkLegalMoves = (state: ChessGameState, startAlg: string, expectedAlg: string[], message: string) => {
    const pos = algebraicToPosition(startAlg);
    if (!pos) throw new Error("Invalid algebraic start");

    const allLegal = ChessRulesEngine.getLegalMoves(state);
    const pieceLegalMoves = allLegal.filter(m => m.from.row === pos.row && m.from.col === pos.col);
    
    const generated = pieceLegalMoves.map(m => positionToAlgebraic(m.to)).sort();
    const expected = [...expectedAlg].sort();

    const isMatch = generated.length === expected.length && 
                    generated.every((val, idx) => val === expected[idx]);
    
    if (!isMatch) {
      console.error(`[${message}] Expected: ${expected.join(', ')}`);
      console.error(`[${message}] Got: ${generated.join(', ')}`);
    }
    assert(isMatch, message);
  };

  // --- 1. King in Rook Check ---
  console.log("\n--- King in Rook Check ---");
  let state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('e8')!, createPiece('rook', 'black', algebraicToPosition('e8')!));
  
  assert(ChessRulesEngine.isKingInCheck(state.board, 'white'), "White King is in check by Black Rook");
  
  // King must step off the e-file
  checkLegalMoves(state, 'e1', ['d1', 'f1', 'd2', 'f2'], "King moves out of Rook check");


  // --- 2. Blocking a Check ---
  console.log("\n--- Blocking a Check ---");
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('e8')!, createPiece('rook', 'black', algebraicToPosition('e8')!));
  // White rook on a2 can move to e2 to block
  state.board = placePiece(state.board, algebraicToPosition('a2')!, createPiece('rook', 'white', algebraicToPosition('a2')!));
  
  checkLegalMoves(state, 'a2', ['e2'], "White Rook can only move to e2 to block the check");


  // --- 3. Capturing the Checking Piece ---
  console.log("\n--- Capturing the Checking Piece ---");
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('h4')!, createPiece('bishop', 'black', algebraicToPosition('h4')!)); // Checks along h4-e1
  // White knight on f3 can capture on h4
  state.board = placePiece(state.board, algebraicToPosition('f3')!, createPiece('knight', 'white', algebraicToPosition('f3')!));
  
  assert(ChessRulesEngine.isKingInCheck(state.board, 'white'), "White King is in check by Black Bishop");
  checkLegalMoves(state, 'f3', ['h4'], "White Knight can only capture the checking Bishop on h4");


  // --- 4. Pinned Pieces ---
  console.log("\n--- Pinned Pieces ---");
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('e4')!, createPiece('knight', 'white', algebraicToPosition('e4')!));
  state.board = placePiece(state.board, algebraicToPosition('e8')!, createPiece('rook', 'black', algebraicToPosition('e8')!));
  
  assert(!ChessRulesEngine.isKingInCheck(state.board, 'white'), "White King is NOT in check");
  checkLegalMoves(state, 'e4', [], "White Knight is pinned and cannot move at all");

  // Pinned piece can slide along the pin line
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('e4')!, createPiece('rook', 'white', algebraicToPosition('e4')!));
  state.board = placePiece(state.board, algebraicToPosition('e8')!, createPiece('rook', 'black', algebraicToPosition('e8')!));
  
  checkLegalMoves(state, 'e4', ['e2', 'e3', 'e5', 'e6', 'e7', 'e8'], "Pinned White Rook can move along the pin file and capture the pinner");


  // --- 5. King cannot move into an attacked square ---
  console.log("\n--- King Attacked Squares Restriction ---");
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  // Black pawn on d3 attacks c2 and e2
  state.board = placePiece(state.board, algebraicToPosition('d3')!, createPiece('pawn', 'black', algebraicToPosition('d3')!));
  
  // Pseudo moves: d1, f1, d2, e2, f2
  // e2 is attacked by d3 pawn.
  // c2 is also attacked by d3 pawn (but king doesn't reach c2 anyway)
  checkLegalMoves(state, 'e1', ['d1', 'f1', 'd2', 'f2'], "King cannot move to e2 because it is attacked by Black Pawn");

  console.log(`\nPhase 3 Tests completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
};

runPhase3Tests();
