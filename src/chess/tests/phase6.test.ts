import { ChessRulesEngine } from '../rules/rulesEngine';
import { createEmptyBoard, placePiece, initializeStandardBoard } from '../models/board';
import { Piece } from '../models/piece';
import { Position, algebraicToPosition } from '../models/position';
import { ChessGameState } from '../state/gameState';
import { Move } from '../moves/move';

const runPhase6Tests = () => {
  console.log("Running Phase 6 Draw Rules & Move History Tests...");
  
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

  // --- 1. Move History Storage ---
  console.log("\n--- Move History Tests ---");
  let state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e2')!, createPiece('pawn', 'white', algebraicToPosition('e2')!));
  state.board = placePiece(state.board, algebraicToPosition('e7')!, createPiece('pawn', 'black', algebraicToPosition('e7')!));
  
  state = ChessRulesEngine.executeMove(state, { from: algebraicToPosition('e2')!, to: algebraicToPosition('e4')!, type: 'normal' });
  assert(state.moveHistory.length === 1, "Move correctly recorded in history");
  const lastMove = state.moveHistory[0];
  assert(lastMove.piece.type === 'pawn' && lastMove.piece.color === 'white', "Move piece accurately recorded");
  assert(lastMove.previousHalfMoveClock === 0, "Previous half-move clock recorded");
  assert(state.halfMoveClock === 0, "Pawn move reset half-move clock"); // because pawn move

  // --- 2. Insufficient Material ---
  console.log("\n--- Insufficient Material Tests ---");
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('e8')!, createPiece('king', 'black', algebraicToPosition('e8')!));
  let status = ChessRulesEngine.evaluateGameStatus(state);
  assert(status.status === 'draw' && status.drawReason === 'insufficient_material', "K vs K is a draw");

  state.board = placePiece(state.board, algebraicToPosition('c1')!, createPiece('knight', 'white', algebraicToPosition('c1')!));
  status = ChessRulesEngine.evaluateGameStatus(state);
  assert(status.status === 'draw' && status.drawReason === 'insufficient_material', "K+N vs K is a draw");

  state.board = placePiece(state.board, algebraicToPosition('c2')!, createPiece('knight', 'white', algebraicToPosition('c2')!));
  status = ChessRulesEngine.evaluateGameStatus(state);
  assert(status.status === 'active', "K+N+N vs K is active");

  // K+B vs K+B (Same colors)
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('e8')!, createPiece('king', 'black', algebraicToPosition('e8')!));
  // White bishop on light square (e.g., f1 - row 7, col 5 -> 7+5 = 12 % 2 = 0)
  state.board = placePiece(state.board, algebraicToPosition('f1')!, createPiece('bishop', 'white', algebraicToPosition('f1')!));
  // Black bishop on light square (e.g., c8 - row 0, col 2 -> 0+2 = 2 % 2 = 0)
  state.board = placePiece(state.board, algebraicToPosition('c8')!, createPiece('bishop', 'black', algebraicToPosition('c8')!));
  status = ChessRulesEngine.evaluateGameStatus(state);
  assert(status.status === 'draw' && status.drawReason === 'insufficient_material', "K+B vs K+B (same colors) is a draw");


  // --- 3. Fifty-Move Rule ---
  console.log("\n--- Fifty-Move Rule Tests ---");
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('e8')!, createPiece('king', 'black', algebraicToPosition('e8')!));
  state.board = placePiece(state.board, algebraicToPosition('a1')!, createPiece('rook', 'white', algebraicToPosition('a1')!)); // To avoid insufficient material draw
  state.halfMoveClock = 99;
  
  // A non-pawn, non-capturing move
  state = ChessRulesEngine.executeMove(state, { from: algebraicToPosition('a1')!, to: algebraicToPosition('a2')!, type: 'normal' });
  assert(state.halfMoveClock === 100, "Half move clock reached 100");
  assert(state.status === 'draw' && state.drawReason === 'fifty_move_rule', "50-move rule enforced");

  // Pawn move resets clock
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('e8')!, createPiece('king', 'black', algebraicToPosition('e8')!));
  state.board = placePiece(state.board, algebraicToPosition('a2')!, createPiece('pawn', 'white', algebraicToPosition('a2')!)); 
  state.halfMoveClock = 99;
  state = ChessRulesEngine.executeMove(state, { from: algebraicToPosition('a2')!, to: algebraicToPosition('a3')!, type: 'normal' });
  assert(state.halfMoveClock === 0, "Pawn move resets 50-move clock");


  // --- 4. Threefold Repetition ---
  console.log("\n--- Threefold Repetition Tests ---");
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('e8')!, createPiece('king', 'black', algebraicToPosition('e8')!));
  state.board = placePiece(state.board, algebraicToPosition('a1')!, createPiece('rook', 'white', algebraicToPosition('a1')!));
  const initialHash = ChessRulesEngine.generateStateHash(state);
  state.positionCounts[initialHash] = 1;

  // Move Rook a1 -> a2 -> a1
  const move1: Move = { from: algebraicToPosition('a1')!, to: algebraicToPosition('a2')!, type: 'normal' };
  const move2: Move = { from: algebraicToPosition('e8')!, to: algebraicToPosition('d8')!, type: 'normal' };
  const move3: Move = { from: algebraicToPosition('a2')!, to: algebraicToPosition('a1')!, type: 'normal' };
  const move4: Move = { from: algebraicToPosition('d8')!, to: algebraicToPosition('e8')!, type: 'normal' };

  // Cycle 1 ends here (2nd repetition of initial state)
  state = ChessRulesEngine.executeMove(state, move1);
  state = ChessRulesEngine.executeMove(state, move2);
  state = ChessRulesEngine.executeMove(state, move3);
  state = ChessRulesEngine.executeMove(state, move4);
  assert(state.status === 'active', "Active after 2 repetitions");
  
  // Cycle 2 ends here (3rd repetition of initial state)
  state = ChessRulesEngine.executeMove(state, move1);
  state = ChessRulesEngine.executeMove(state, move2);
  state = ChessRulesEngine.executeMove(state, move3);
  state = ChessRulesEngine.executeMove(state, move4);
  
  assert(state.status === 'draw' && state.drawReason === 'threefold_repetition', "Draw by threefold repetition");


  console.log(`\nPhase 6 Tests completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
};

runPhase6Tests();
