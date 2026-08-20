import { ChessRulesEngine } from '../rules/rulesEngine';
import { createEmptyBoard, placePiece } from '../models/board';
import { Piece } from '../models/piece';
import { Position, algebraicToPosition } from '../models/position';
import { ChessGameState } from '../state/gameState';

const runPhase5Tests = () => {
  console.log("Running Phase 5 Special Moves Tests...");
  
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

  const createPiece = (type: any, color: any, pos: Position, hasMoved = false): Piece => ({
    id: `${color}_${type}_test`,
    type,
    color,
    hasMoved,
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
    castlingRights: { whiteKingSide: true, whiteQueenSide: true, blackKingSide: true, blackQueenSide: true },
    enPassantTarget: null,
    positionCounts: {}
  });

  // --- 1. Castling ---
  console.log("\n--- Castling Tests ---");
  let state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('h1')!, createPiece('rook', 'white', algebraicToPosition('h1')!));
  state.board = placePiece(state.board, algebraicToPosition('a1')!, createPiece('rook', 'white', algebraicToPosition('a1')!));
  
  let moves = ChessRulesEngine.getLegalMoves(state).filter(m => m.from.row === 7 && m.from.col === 4);
  let castlingMoves = moves.filter(m => m.type === 'castling');
  assert(castlingMoves.length === 2, "White can castle both sides legally when path is clear");

  // Blocked Castling
  state.board = placePiece(state.board, algebraicToPosition('f1')!, createPiece('bishop', 'white', algebraicToPosition('f1')!));
  moves = ChessRulesEngine.getLegalMoves(state).filter(m => m.from.row === 7 && m.from.col === 4);
  assert(!moves.some(m => m.to.col === 6), "Cannot castle kingside if blocked");

  // Castling through check
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('h1')!, createPiece('rook', 'white', algebraicToPosition('h1')!));
  state.board = placePiece(state.board, algebraicToPosition('f8')!, createPiece('rook', 'black', algebraicToPosition('f8')!)); // attacks f1
  moves = ChessRulesEngine.getLegalMoves(state).filter(m => m.from.row === 7 && m.from.col === 4);
  assert(!moves.some(m => m.to.col === 6), "Cannot castle kingside through check");

  // Castling while in check
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!));
  state.board = placePiece(state.board, algebraicToPosition('h1')!, createPiece('rook', 'white', algebraicToPosition('h1')!));
  state.board = placePiece(state.board, algebraicToPosition('e8')!, createPiece('rook', 'black', algebraicToPosition('e8')!)); // checks e1
  moves = ChessRulesEngine.getLegalMoves(state).filter(m => m.from.row === 7 && m.from.col === 4);
  assert(!moves.some(m => m.type === 'castling'), "Cannot castle while in check");
  
  // Castling after King moved
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e1')!, createPiece('king', 'white', algebraicToPosition('e1')!, true)); // hasMoved = true
  state.board = placePiece(state.board, algebraicToPosition('h1')!, createPiece('rook', 'white', algebraicToPosition('h1')!));
  moves = ChessRulesEngine.getLegalMoves(state).filter(m => m.from.row === 7 && m.from.col === 4);
  assert(!moves.some(m => m.type === 'castling'), "Cannot castle if king has moved");


  // --- 2. En Passant ---
  console.log("\n--- En Passant Tests ---");
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('e5')!, createPiece('pawn', 'white', algebraicToPosition('e5')!));
  state.board = placePiece(state.board, algebraicToPosition('f5')!, createPiece('pawn', 'black', algebraicToPosition('f5')!));
  state.enPassantTarget = algebraicToPosition('f6'); // Black pawn just double moved to f5, target is f6
  moves = ChessRulesEngine.getLegalMoves(state).filter(m => m.from.row === 3 && m.from.col === 4); // White pawn at e5
  let epMove = moves.find(m => m.type === 'en_passant');
  assert(!!epMove && epMove.to.col === 5 && epMove.to.row === 2, "White pawn can capture en passant");
  
  // Expired En Passant
  state.enPassantTarget = null;
  moves = ChessRulesEngine.getLegalMoves(state).filter(m => m.from.row === 3 && m.from.col === 4);
  assert(!moves.some(m => m.type === 'en_passant'), "Cannot capture en passant if expired");


  // --- 3. Promotion ---
  console.log("\n--- Promotion Tests ---");
  state = getEmptyState('white');
  state.board = placePiece(state.board, algebraicToPosition('a7')!, createPiece('pawn', 'white', algebraicToPosition('a7')!));
  moves = ChessRulesEngine.getLegalMoves(state).filter(m => m.from.row === 1 && m.from.col === 0);
  let promos = moves.filter(m => m.type === 'promotion');
  assert(promos.length === 4, "Pawn advancing to last rank generates 4 promotion moves");
  assert(promos.some(m => m.promotionTo === 'queen'), "Can promote to Queen");
  assert(promos.some(m => m.promotionTo === 'rook'), "Can promote to Rook");
  assert(promos.some(m => m.promotionTo === 'bishop'), "Can promote to Bishop");
  assert(promos.some(m => m.promotionTo === 'knight'), "Can promote to Knight");

  console.log(`\nPhase 5 Tests completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
};

runPhase5Tests();
