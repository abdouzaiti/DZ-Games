import { ChessEngine } from '../engine/chessEngine';
import { getPieceAt } from '../models/board';
import { positionToAlgebraic } from '../models/position';
import { Piece } from '../models/piece';

function runPhase1Tests() {
  console.log("Running Phase 1 Tests...");
  
  const engine = new ChessEngine();
  const state = engine.getSnapshot();
  const board = state.board;

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

  // 1. Board is 8x8
  assert(board.length === 8 && board.every(row => row.length === 8), "Board is exactly 8x8");

  // 2. White starts
  assert(state.turn === 'white', "White moves first");

  // Count pieces and collect IDs
  let whitePieces = 0;
  let blackPieces = 0;
  let emptySquares = 0;
  const pieceIds = new Set<string>();
  const pieces: Piece[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = getPieceAt(board, { row, col });
      if (piece) {
        if (piece.color === 'white') whitePieces++;
        if (piece.color === 'black') blackPieces++;
        pieceIds.add(piece.id);
        pieces.push(piece);
        
        // Check if piece position matches board position
        assert(piece.position.row === row && piece.position.col === col, `Piece ${piece.id} position matches board coordinates at ${positionToAlgebraic({row, col})}`);
      } else {
        emptySquares++;
      }
    }
  }

  // 3. 32 pieces total, 16 White, 16 Black
  assert(whitePieces === 16, "16 White pieces on board");
  assert(blackPieces === 16, "16 Black pieces on board");
  assert(emptySquares === 32, "32 empty squares on board");

  // 4. No duplicate IDs
  assert(pieceIds.size === 32, "All 32 pieces have unique IDs");

  // 5. Correct starting positions
  // Check Black back row (row 0)
  const expectedBackRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  let backRowCorrect = true;
  for (let col = 0; col < 8; col++) {
    const piece = getPieceAt(board, { row: 0, col });
    if (!piece || piece.color !== 'black' || piece.type !== expectedBackRow[col]) backRowCorrect = false;
  }
  assert(backRowCorrect, "Black major pieces are in correct starting positions");

  // Check Black pawns (row 1)
  let blackPawnsCorrect = true;
  for (let col = 0; col < 8; col++) {
    const piece = getPieceAt(board, { row: 1, col });
    if (!piece || piece.color !== 'black' || piece.type !== 'pawn') blackPawnsCorrect = false;
  }
  assert(blackPawnsCorrect, "Black pawns are in correct starting positions");

  // Check White pawns (row 6)
  let whitePawnsCorrect = true;
  for (let col = 0; col < 8; col++) {
    const piece = getPieceAt(board, { row: 6, col });
    if (!piece || piece.color !== 'white' || piece.type !== 'pawn') whitePawnsCorrect = false;
  }
  assert(whitePawnsCorrect, "White pawns are in correct starting positions");

  // Check White back row (row 7)
  let whiteBackRowCorrect = true;
  for (let col = 0; col < 8; col++) {
    const piece = getPieceAt(board, { row: 7, col });
    if (!piece || piece.color !== 'white' || piece.type !== expectedBackRow[col]) whiteBackRowCorrect = false;
  }
  assert(whiteBackRowCorrect, "White major pieces are in correct starting positions");

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runPhase1Tests();
