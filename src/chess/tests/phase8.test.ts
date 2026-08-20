import { ChessAI } from '../ai/chessAI';
import { ChessEngine } from '../engine/chessEngine';
import { ChessRulesEngine } from '../rules/rulesEngine';
import { createEmptyBoard, placePiece } from '../models/board';
import { algebraicToPosition } from '../models/position';
import { Piece } from '../models/piece';

const runPhase8Tests = () => {
  console.log("Running Phase 8 Chess AI Tests...");
  
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

  const engine = new ChessEngine();
  let state = engine.getSnapshot();
  
  console.log("\n--- AI vs AI Simulation (Depth 2, 20 Moves) ---");
  let moveCount = 0;
  const DEPTH = 2; // Keep it low for fast testing
  
  try {
    while (state.status === 'active' && moveCount < 20) {
      // White to move
      const aiMove = ChessAI.getBestMove(state, DEPTH);
      if (!aiMove) {
        throw new Error("AI returned null move but game is active");
      }
      
      const legalMoves = ChessRulesEngine.getLegalMoves(state);
      const isLegal = legalMoves.some(m => m.from.row === aiMove.from.row && m.from.col === aiMove.from.col && m.to.row === aiMove.to.row && m.to.col === aiMove.to.col);
      
      if (!isLegal) {
        throw new Error(`AI generated ILLEGAL move: ${JSON.stringify(aiMove)}`);
      }
      
      state = ChessRulesEngine.executeMove(state, aiMove, true); // Evaluate status true to update status accurately
      moveCount++;
      
      if (state.status !== 'active') break;
    }
    
    assert(moveCount > 0, `AI successfully played ${moveCount} valid legal moves without crashing`);
    
  } catch (e: any) {
    console.error(`\n❌ Engine or AI crashed during Simulation!`);
    console.error(e.message);
    process.exit(1);
  }

  // --- 2. Checkmate evaluation ---
  console.log("\n--- Checkmate Avoidance / Seeking ---");
  // Set up a mate in 1 scenario for White
  // White Queen on h6, White Knight on f5. Black King on h8.
  state = new ChessEngine().getSnapshot(); // reset
  
  state.board = createEmptyBoard();
  state.board = placePiece(state.board, algebraicToPosition('h8')!, { id: 'bk', type: 'king', color: 'black', hasMoved: true, position: algebraicToPosition('h8')! });
  state.board = placePiece(state.board, algebraicToPosition('g8')!, { id: 'br', type: 'rook', color: 'black', hasMoved: true, position: algebraicToPosition('g8')! }); // blocker
  
  state.board = placePiece(state.board, algebraicToPosition('h6')!, { id: 'wq', type: 'queen', color: 'white', hasMoved: true, position: algebraicToPosition('h6')! });
  state.board = placePiece(state.board, algebraicToPosition('f5')!, { id: 'wn', type: 'knight', color: 'white', hasMoved: true, position: algebraicToPosition('f5')! });
  state.board = placePiece(state.board, algebraicToPosition('a1')!, { id: 'wk', type: 'king', color: 'white', hasMoved: true, position: algebraicToPosition('a1')! });
  
  state.turn = 'white';
  state.status = 'active';
  
  const mateMove = ChessAI.getBestMove(state, 2);
  console.log("Mate move chosen by AI:", mateMove);
  
  if (mateMove) {
    state = ChessRulesEngine.executeMove(state, mateMove, true);
  }
  
  assert(state.status === 'checkmate', "AI successfully executed a forced mate in 1");

  console.log(`\nPhase 8 Tests completed: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
};

runPhase8Tests();
