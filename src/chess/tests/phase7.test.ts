import { ChessRulesEngine } from '../rules/rulesEngine';
import { ChessEngine } from '../engine/chessEngine';
import { ChessGameState } from '../state/gameState';

const validateInvariants = (state: ChessGameState) => {
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
          throw new Error(`Invariant Violation: Duplicate piece ID on board: ${p.id}`);
        }
        pieceIds.add(p.id);
        
        if (p.type === 'king') {
          if (p.color === 'white') whiteKings++;
          else blackKings++;
        }
      }
    }
  }

  if (whiteKings !== 1) throw new Error(`Invariant Violation: Invalid White King count: ${whiteKings}`);
  if (blackKings !== 1) throw new Error(`Invariant Violation: Invalid Black King count: ${blackKings}`);

  const totalWhitePieces = state.capturedWhitePieces.length + Array.from(pieceIds).filter(id => id.startsWith('white_')).length;
  const totalBlackPieces = state.capturedBlackPieces.length + Array.from(pieceIds).filter(id => id.startsWith('black_')).length;

  if (totalWhitePieces > 16) throw new Error(`Invariant Violation: Too many white pieces: ${totalWhitePieces}`);
  if (totalBlackPieces > 16) throw new Error(`Invariant Violation: Too many black pieces: ${totalBlackPieces}`);
};

const runPhase7Tests = () => {
  console.log("Running Phase 7 Complete Engine Validation...");
  
  const MAX_GAMES = 100;
  const MAX_MOVES_PER_GAME = 200;
  
  let checkmates = 0;
  let stalemates = 0;
  let draws = 0;
  let maxMovesReached = 0;
  let totalMovesSimulated = 0;
  
  for (let i = 0; i < MAX_GAMES; i++) {
    const engine = new ChessEngine();
    let state = engine.getSnapshot();
    let moveCount = 0;
    
    try {
      validateInvariants(state);
      
      while (state.status === 'active' && moveCount < MAX_MOVES_PER_GAME) {
        const legalMoves = ChessRulesEngine.getLegalMoves(state);
        
        if (legalMoves.length === 0) {
          throw new Error("Status is active but no legal moves exist!");
        }
        
        // Randomly select a move
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        
        state = ChessRulesEngine.executeMove(state, randomMove);
        moveCount++;
        totalMovesSimulated++;
        
        validateInvariants(state);
      }
      
      if (state.status === 'checkmate') checkmates++;
      else if (state.status === 'stalemate') stalemates++;
      else if (state.status === 'draw') draws++;
      else maxMovesReached++;
      
    } catch (e: any) {
      console.error(`\n❌ Engine crashed or invariant failed during Game ${i + 1} at move ${moveCount}!`);
      console.error(e.message);
      console.error("Move history:", state.moveHistory.map(m => m.type));
      process.exit(1);
    }
  }

  console.log(`\nPhase 7 Tests completed successfully!`);
  console.log(`Total Games Simulated: ${MAX_GAMES}`);
  console.log(`Total Moves Simulated: ${totalMovesSimulated}`);
  console.log(`Checkmates: ${checkmates}`);
  console.log(`Stalemates: ${stalemates}`);
  console.log(`Draws (50-move, 3-fold, insufficient material): ${draws}`);
  console.log(`Games reaching max moves (${MAX_MOVES_PER_GAME}): ${maxMovesReached}`);
  
  process.exit(0);
};

runPhase7Tests();
