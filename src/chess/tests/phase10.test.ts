import { ChessEngine } from '../engine/chessEngine';
import { ChessRulesEngine } from '../rules/rulesEngine';
import { ChessGameState } from '../state/gameState';
import { ChessAI } from '../ai/chessAI';
import { createEmptyBoard, placePiece, initializeStandardBoard } from '../models/board';
import { algebraicToPosition, positionToAlgebraic, Position } from '../models/position';
import { Piece, PieceColor, PieceType } from '../models/piece';
import { Move } from '../moves/move';

export const runPhase10QATests = () => {
  console.log('🧪 Running Phase 10: Final Offline Chess V1 Master QA Test Suite...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  const validateInvariants = (state: ChessGameState, context: string = '') => {
    let whiteKings = 0;
    let blackKings = 0;
    let piecesOnBoard = 0;
    const pieceIds = new Set<string>();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = state.board[r][c];
        if (p) {
          piecesOnBoard++;
          if (pieceIds.has(p.id)) {
            throw new Error(`[${context}] Invariant Violation: Duplicate piece ID '${p.id}' on board at (${r},${c})`);
          }
          pieceIds.add(p.id);

          if (p.position.row !== r || p.position.col !== c) {
            throw new Error(`[${context}] Invariant Violation: Piece position mismatch for ${p.id}. Stored (${p.position.row},${p.position.col}), Board (${r},${c})`);
          }

          if (p.type === 'king') {
            if (p.color === 'white') whiteKings++;
            else blackKings++;
          }
        }
      }
    }

    if (whiteKings !== 1) throw new Error(`[${context}] Invariant Violation: White king count is ${whiteKings}`);
    if (blackKings !== 1) throw new Error(`[${context}] Invariant Violation: Black king count is ${blackKings}`);

    const whiteBoardCount = Array.from(pieceIds).filter(id => id.startsWith('white_')).length;
    const blackBoardCount = Array.from(pieceIds).filter(id => id.startsWith('black_')).length;

    if (whiteBoardCount + state.capturedWhitePieces.length > 16) {
      throw new Error(`[${context}] Invariant Violation: Total white pieces exceed 16 (${whiteBoardCount} on board, ${state.capturedWhitePieces.length} captured)`);
    }
    if (blackBoardCount + state.capturedBlackPieces.length > 16) {
      throw new Error(`[${context}] Invariant Violation: Total black pieces exceed 16 (${blackBoardCount} on board, ${state.capturedBlackPieces.length} captured)`);
    }
  };

  // =========================================================================
  // TEST GROUP 1: Board, Piece Setup & Coordinate Mappings
  // =========================================================================
  console.log('--- 1. Board & Initial State Setup ---');
  const engine = new ChessEngine();
  const initial = engine.getSnapshot();

  assert(initial.board.length === 8 && initial.board.every(r => r.length === 8), 'Board is an 8x8 grid');
  assert(initial.turn === 'white', 'Initial turn is white');
  assert(initial.status === 'active', 'Initial status is active');
  assert(!initial.isCheck, 'Initial state is not check');
  assert(initial.halfMoveClock === 0 && initial.fullMoveNumber === 1, 'Clocks start at 0 / 1');
  assert(
    initial.castlingRights.whiteKingSide &&
    initial.castlingRights.whiteQueenSide &&
    initial.castlingRights.blackKingSide &&
    initial.castlingRights.blackQueenSide,
    'All 4 castling rights are enabled at start'
  );
  assert(initial.enPassantTarget === null, 'En passant target is null at start');

  let initialPiecesCount = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (initial.board[r][c]) initialPiecesCount++;
    }
  }
  assert(initialPiecesCount === 32, 'Initial board has exactly 32 pieces');
  validateInvariants(initial, 'Initial Board');

  // Coordinate mapping checks
  assert(positionToAlgebraic({ row: 7, col: 0 }) === 'a1', 'Position (7,0) maps to a1');
  assert(positionToAlgebraic({ row: 0, col: 7 }) === 'h8', 'Position (0,7) maps to h8');
  assert(positionToAlgebraic({ row: 4, col: 4 }) === 'e4', 'Position (4,4) maps to e4');
  const posE4 = algebraicToPosition('e4')!;
  assert(posE4.row === 4 && posE4.col === 4, 'Algebraic e4 maps to (4,4)');

  // =========================================================================
  // TEST GROUP 2: Special Moves (Castling, En Passant, Promotion)
  // =========================================================================
  console.log('\n--- 2. Special Rules (Castling, En Passant, Promotion) ---');
  
  // 2.1 Kingside & Queenside Castling
  let castlingBoard = createEmptyBoard();
  castlingBoard = placePiece(castlingBoard, algebraicToPosition('e1')!, { id: 'wk', type: 'king', color: 'white', hasMoved: false, position: algebraicToPosition('e1')! });
  castlingBoard = placePiece(castlingBoard, algebraicToPosition('h1')!, { id: 'wr_k', type: 'rook', color: 'white', hasMoved: false, position: algebraicToPosition('h1')! });
  castlingBoard = placePiece(castlingBoard, algebraicToPosition('a1')!, { id: 'wr_q', type: 'rook', color: 'white', hasMoved: false, position: algebraicToPosition('a1')! });
  castlingBoard = placePiece(castlingBoard, algebraicToPosition('e8')!, { id: 'bk', type: 'king', color: 'black', hasMoved: true, position: algebraicToPosition('e8')! });

  let castlingState: ChessGameState = {
    ...initial,
    board: castlingBoard,
    castlingRights: { whiteKingSide: true, whiteQueenSide: true, blackKingSide: false, blackQueenSide: false }
  };

  const castlingMoves = ChessRulesEngine.getLegalMoves(castlingState);
  const whiteKingside = castlingMoves.find(m => m.type === 'castling' && m.to.col === 6);
  const whiteQueenside = castlingMoves.find(m => m.type === 'castling' && m.to.col === 2);
  assert(!!whiteKingside, 'White kingside castling (O-O) is legal with open files');
  assert(!!whiteQueenside, 'White queenside castling (O-O-O) is legal with open files');

  if (whiteKingside) {
    const afterOO = ChessRulesEngine.executeMove(castlingState, whiteKingside);
    const kingAtG1 = afterOO.board[7][6];
    const rookAtF1 = afterOO.board[7][5];
    assert(kingAtG1?.type === 'king' && rookAtF1?.type === 'rook', 'Kingside castling places King on g1 and Rook on f1');
    assert(!afterOO.castlingRights.whiteKingSide && !afterOO.castlingRights.whiteQueenSide, 'White castling rights revoked after castling');
    validateInvariants(afterOO, 'After O-O');
  }

  // 2.2 En Passant
  let epBoard = createEmptyBoard();
  epBoard = placePiece(epBoard, algebraicToPosition('e5')!, { id: 'wp_e', type: 'pawn', color: 'white', hasMoved: true, position: algebraicToPosition('e5')! });
  epBoard = placePiece(epBoard, algebraicToPosition('d5')!, { id: 'bp_d', type: 'pawn', color: 'black', hasMoved: true, position: algebraicToPosition('d5')! });
  epBoard = placePiece(epBoard, algebraicToPosition('e1')!, { id: 'wk', type: 'king', color: 'white', hasMoved: true, position: algebraicToPosition('e1')! });
  epBoard = placePiece(epBoard, algebraicToPosition('e8')!, { id: 'bk', type: 'king', color: 'black', hasMoved: true, position: algebraicToPosition('e8')! });

  let epState: ChessGameState = {
    ...initial,
    board: epBoard,
    enPassantTarget: { row: 2, col: 3 } // d6 square
  };

  const epMoves = ChessRulesEngine.getLegalMoves(epState);
  const epMove = epMoves.find(m => m.type === 'en_passant');
  assert(!!epMove, 'En passant capture generated correctly');

  if (epMove) {
    const afterEP = ChessRulesEngine.executeMove(epState, epMove);
    assert(afterEP.board[3][3] === null, 'Black pawn on d5 removed after en passant');
    assert(afterEP.board[2][3]?.id === 'wp_e', 'White pawn placed on d6 target square');
    assert(afterEP.capturedBlackPieces.length === 1, 'Black pawn added to captured list');
    validateInvariants(afterEP, 'After En Passant');
  }

  // 2.3 Pawn Promotion
  let promBoard = createEmptyBoard();
  promBoard = placePiece(promBoard, algebraicToPosition('a7')!, { id: 'wp_a', type: 'pawn', color: 'white', hasMoved: true, position: algebraicToPosition('a7')! });
  promBoard = placePiece(promBoard, algebraicToPosition('e1')!, { id: 'wk', type: 'king', color: 'white', hasMoved: true, position: algebraicToPosition('e1')! });
  promBoard = placePiece(promBoard, algebraicToPosition('e8')!, { id: 'bk', type: 'king', color: 'black', hasMoved: true, position: algebraicToPosition('e8')! });

  let promState: ChessGameState = {
    ...initial,
    board: promBoard
  };

  const promMoves = ChessRulesEngine.getLegalMoves(promState);
  const promotions = promMoves.filter(m => m.type === 'promotion');
  assert(promotions.length === 4, 'Pawn advancing to 8th rank generates 4 promotion choices');

  const queenPromo = promotions.find(m => m.promotionTo === 'queen');
  if (queenPromo) {
    const afterPromo = ChessRulesEngine.executeMove(promState, queenPromo);
    assert(afterPromo.board[0][0]?.type === 'queen', 'Pawn successfully promoted to Queen on a8');
    validateInvariants(afterPromo, 'After Promotion');
  }

  // =========================================================================
  // TEST GROUP 3: Check, Checkmate & Stalemate
  // =========================================================================
  console.log('\n--- 3. Check, Checkmate & Stalemate Evaluations ---');

  // Scholar's Mate scenario
  let smEngine = new ChessEngine();
  // 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#
  smEngine.makeMove({ from: algebraicToPosition('e2')!, to: algebraicToPosition('e4')!, type: 'normal' });
  smEngine.makeMove({ from: algebraicToPosition('e7')!, to: algebraicToPosition('e5')!, type: 'normal' });
  smEngine.makeMove({ from: algebraicToPosition('d1')!, to: algebraicToPosition('h5')!, type: 'normal' });
  smEngine.makeMove({ from: algebraicToPosition('b8')!, to: algebraicToPosition('c6')!, type: 'normal' });
  smEngine.makeMove({ from: algebraicToPosition('f1')!, to: algebraicToPosition('c4')!, type: 'normal' });
  smEngine.makeMove({ from: algebraicToPosition('g8')!, to: algebraicToPosition('f6')!, type: 'normal' });
  smEngine.makeMove({ from: algebraicToPosition('h5')!, to: algebraicToPosition('f7')!, type: 'normal' });

  const scholarState = smEngine.getSnapshot();
  assert(scholarState.status === 'checkmate', "Scholar's Mate produces 'checkmate' status");
  assert(scholarState.winner === 'white', "Scholar's Mate correctly awards win to White");
  assert(scholarState.isCheck === true, "Check state is true on checkmate");

  // Stalemate
  let stBoard = createEmptyBoard();
  stBoard = placePiece(stBoard, algebraicToPosition('a8')!, { id: 'wk', type: 'king', color: 'white', hasMoved: true, position: algebraicToPosition('a8')! });
  stBoard = placePiece(stBoard, algebraicToPosition('c7')!, { id: 'bk', type: 'king', color: 'black', hasMoved: true, position: algebraicToPosition('c7')! });
  stBoard = placePiece(stBoard, algebraicToPosition('b6')!, { id: 'bq', type: 'queen', color: 'black', hasMoved: true, position: algebraicToPosition('b6')! });

  let stState: ChessGameState = {
    ...initial,
    board: stBoard,
    turn: 'white'
  };

  const stEval = ChessRulesEngine.evaluateGameStatus(stState);
  assert(stEval.status === 'stalemate', 'Stalemate correctly identified when no legal moves and not in check');
  assert(stEval.winner === null, 'Stalemate winner is null');

  // =========================================================================
  // TEST GROUP 4: Draw Rules (50-move, Threefold Repetition, Insufficient Material)
  // =========================================================================
  console.log('\n--- 4. Draw Rules ---');

  // Fifty-move rule
  let fiftyState: ChessGameState = {
    ...initial,
    halfMoveClock: 100
  };
  const fiftyEval = ChessRulesEngine.evaluateGameStatus(fiftyState);
  assert(fiftyEval.status === 'draw' && fiftyEval.drawReason === 'fifty_move_rule', 'Fifty-move rule triggers draw at 100 half-moves');

  // Threefold repetition
  let repState: ChessGameState = {
    ...initial,
    positionCounts: {
      'test_pos_hash': 3
    }
  };
  const repEval = ChessRulesEngine.evaluateGameStatus(repState);
  assert(repEval.status === 'draw' && repEval.drawReason === 'threefold_repetition', 'Threefold repetition triggers draw on 3rd occurrence');

  // Insufficient Material: K vs K
  let kvkBoard = createEmptyBoard();
  kvkBoard = placePiece(kvkBoard, algebraicToPosition('e1')!, { id: 'wk', type: 'king', color: 'white', hasMoved: true, position: algebraicToPosition('e1')! });
  kvkBoard = placePiece(kvkBoard, algebraicToPosition('e8')!, { id: 'bk', type: 'king', color: 'black', hasMoved: true, position: algebraicToPosition('e8')! });
  assert(ChessRulesEngine.isInsufficientMaterial(kvkBoard), 'K vs K is insufficient material');

  // Insufficient Material: K+N vs K
  let kvknBoard = placePiece(kvkBoard, algebraicToPosition('c3')!, { id: 'wn', type: 'knight', color: 'white', hasMoved: true, position: algebraicToPosition('c3')! });
  assert(ChessRulesEngine.isInsufficientMaterial(kvknBoard), 'K+N vs K is insufficient material');

  // Insufficient Material: K+B vs K
  let kvkbBoard = placePiece(kvkBoard, algebraicToPosition('c3')!, { id: 'wb', type: 'bishop', color: 'white', hasMoved: true, position: algebraicToPosition('c3')! });
  assert(ChessRulesEngine.isInsufficientMaterial(kvkbBoard), 'K+B vs K is insufficient material');

  // Sufficient Material: K+Q vs K
  let kvkqBoard = placePiece(kvkBoard, algebraicToPosition('c3')!, { id: 'wq', type: 'queen', color: 'white', hasMoved: true, position: algebraicToPosition('c3')! });
  assert(!ChessRulesEngine.isInsufficientMaterial(kvkqBoard), 'K+Q vs K is sufficient material');

  // =========================================================================
  // TEST GROUP 5: AI Engine & Search Verification
  // =========================================================================
  console.log('\n--- 5. AI Engine Tests & Move Selection ---');

  // AI instance creation at difficulty 1, 3, 5
  const aiEasy = new ChessAI(1);
  const aiMed = new ChessAI(3);
  const aiHard = new ChessAI(5);
  assert(!!aiEasy && !!aiMed && !!aiHard, 'AI initializes across all difficulties (1, 3, 5)');

  // AI Mate in 1 detection
  let mate1Board = createEmptyBoard();
  mate1Board = placePiece(mate1Board, algebraicToPosition('h8')!, { id: 'bk', type: 'king', color: 'black', hasMoved: true, position: algebraicToPosition('h8')! });
  mate1Board = placePiece(mate1Board, algebraicToPosition('g8')!, { id: 'br', type: 'rook', color: 'black', hasMoved: true, position: algebraicToPosition('g8')! });
  mate1Board = placePiece(mate1Board, algebraicToPosition('h6')!, { id: 'wq', type: 'queen', color: 'white', hasMoved: true, position: algebraicToPosition('h6')! });
  mate1Board = placePiece(mate1Board, algebraicToPosition('f5')!, { id: 'wn', type: 'knight', color: 'white', hasMoved: true, position: algebraicToPosition('f5')! });
  mate1Board = placePiece(mate1Board, algebraicToPosition('a1')!, { id: 'wk', type: 'king', color: 'white', hasMoved: true, position: algebraicToPosition('a1')! });

  const mate1State: ChessGameState = {
    ...initial,
    board: mate1Board,
    turn: 'white'
  };

  const chosenMateMove = aiMed.getBestMove(mate1State);
  assert(
    chosenMateMove !== null &&
    chosenMateMove.from.row === 2 && chosenMateMove.from.col === 7 && // h6
    chosenMateMove.to.row === 3 && chosenMateMove.to.col === 7,       // h7
    'AI finds and executes forced Mate in 1 (Qh6 -> h7#)'
  );

  // =========================================================================
  // TEST GROUP 6: 100 Complete Game Simulations with Invariant Auditing
  // =========================================================================
  console.log('\n--- 6. 100 Random Full Game Simulations (Invariant Auditing) ---');
  let simCheckmates = 0;
  let simStalemates = 0;
  let simDraws = 0;
  let simMaxMoves = 0;
  let totalSimMoves = 0;

  for (let g = 0; g < 100; g++) {
    const simEngine = new ChessEngine();
    let state = simEngine.getSnapshot();
    let moveCount = 0;

    validateInvariants(state, `Game ${g + 1} start`);

    while (state.status === 'active' && moveCount < 150) {
      const legalMoves = ChessRulesEngine.getLegalMoves(state);
      if (legalMoves.length === 0) {
        throw new Error(`Game ${g + 1} move ${moveCount}: Active state has 0 legal moves!`);
      }

      // Pick a random legal move
      const move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      state = ChessRulesEngine.executeMove(state, move);
      moveCount++;
      totalSimMoves++;

      validateInvariants(state, `Game ${g + 1} move ${moveCount}`);
    }

    if (state.status === 'checkmate') simCheckmates++;
    else if (state.status === 'stalemate') simStalemates++;
    else if (state.status === 'draw') simDraws++;
    else simMaxMoves++;
  }

  assert(
    totalSimMoves > 5000,
    `Simulated 100 complete games (${totalSimMoves} total half-moves) with 100% invariant consistency`
  );
  console.log(`     Stats: Checkmates=${simCheckmates}, Stalemates=${simStalemates}, Draws=${simDraws}, MaxMoves=${simMaxMoves}`);

  // =========================================================================
  // TEST GROUP 7: AI vs AI Game Simulation
  // =========================================================================
  console.log('\n--- 7. AI vs AI Match Simulation (Depth 2, 25 moves) ---');
  const aiEngine = new ChessEngine();
  let aiState = aiEngine.getSnapshot();
  let aiMoves = 0;

  while (aiState.status === 'active' && aiMoves < 25) {
    const move = ChessAI.getBestMove(aiState, 2);
    assert(move !== null, `AI generated valid move at turn ${aiMoves + 1} (${aiState.turn})`);
    if (!move) break;

    const legals = ChessRulesEngine.getLegalMoves(aiState);
    const isLegal = legals.some(m => m.from.row === move.from.row && m.from.col === move.from.col && m.to.row === move.to.row && m.to.col === move.to.col);
    if (!isLegal) {
      throw new Error(`AI generated illegal move: ${JSON.stringify(move)}`);
    }

    aiState = ChessRulesEngine.executeMove(aiState, move);
    validateInvariants(aiState, `AI vs AI move ${aiMoves + 1}`);
    aiMoves++;
  }

  assert(aiMoves === 25 || aiState.status !== 'active', `AI vs AI completed ${aiMoves} moves without crashing or desynchronization`);

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`🎉 PHASE 10 QA COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    throw new Error(`${failed} Phase 10 QA test(s) failed.`);
  }
};

if (process.argv[1]?.includes('phase10')) {
  try {
    runPhase10QATests();
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}
