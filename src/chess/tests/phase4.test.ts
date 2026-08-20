import { ChessRulesEngine } from '../rules/rulesEngine';
import { createEmptyBoard, placePiece, initializeStandardBoard } from '../models/board';
import { Piece } from '../models/piece';
import { Position, algebraicToPosition } from '../models/position';
import { ChessGameState } from '../state/gameState';

const runPhase4Tests = () => {
  console.log("Running Phase 4 Checkmate & Stalemate Tests...");

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

  const checkStatus = (state: ChessGameState, expectedStatus: string, expectedWinner: string | null, message: string) => {
    const result = ChessRulesEngine.evaluateGameStatus(state);
    const isMatch = result.status === expectedStatus && result.winner === expectedWinner;
    
    if (!isMatch) {
      console.error(`[${message}] Expected status=${expectedStatus}, winner=${expectedWinner}`);
      console.error(`[${message}] Got status=${result.status}, winner=${result.winner}`);
    }
    assert(isMatch, message);
  };

  // --- 1. Simple Checkmate (Rook mate) ---
  console.log("\n--- Simple Checkmate ---");
  let state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('a1')!, createPiece('king', 'white', algebraicToPosition('a1')!));
  state.board = placePiece(state.board, algebraicToPosition('a8')!, createPiece('rook', 'black', algebraicToPosition('a8')!));
  state.board = placePiece(state.board, algebraicToPosition('b8')!, createPiece('rook', 'black', algebraicToPosition('b8')!));
  
  checkStatus(state, 'checkmate', 'black', "White King is checkmated by two Black Rooks on a8 and b8");


  // --- 2. Checkmate by Queen with Protected Attacker ---
  console.log("\n--- Checkmate with Protected Attacker ---");
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('e2')!, createPiece('queen', 'black', algebraicToPosition('e2')!));
  state.board = placePiece(state.board, algebraicToPosition('e3')!, createPiece('king', 'black', algebraicToPosition('e3')!)); // Protects queen
  
  checkStatus(state, 'checkmate', 'black', "White King is checkmated by Black Queen protected by Black King");


  // --- 3. Escape from check (Not checkmate) ---
  console.log("\n--- Escape from check ---");
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('e8')!, createPiece('rook', 'black', algebraicToPosition('e8')!));
  
  checkStatus(state, 'active', null, "White King is in check but can escape (not checkmate)");


  // --- 4. Stalemate ---
  console.log("\n--- Stalemate ---");
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('h8')!, createPiece('king', 'white', algebraicToPosition('h8')!));
  state.board = placePiece(state.board, algebraicToPosition('f7')!, createPiece('king', 'black', algebraicToPosition('f7')!));
  state.board = placePiece(state.board, algebraicToPosition('g6')!, createPiece('queen', 'black', algebraicToPosition('g6')!));
  
  checkStatus(state, 'stalemate', null, "White King is stalemated (no legal moves, not in check)");


  // --- 5. Positions with legal moves (Active game) ---
  console.log("\n--- Active Game ---");
  state = getEmptyState('white');
  state.board = initializeStandardBoard();
  
  checkStatus(state, 'active', null, "Standard starting board is active with no checkmate/stalemate");

  console.log(`\nPhase 4 Tests completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
};

runPhase4Tests();
