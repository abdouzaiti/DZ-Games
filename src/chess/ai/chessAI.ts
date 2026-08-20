import { ChessGameState } from '../state/gameState';
import { Move } from '../moves/move';
import { ChessRulesEngine } from '../rules/rulesEngine';
import { evaluatePosition } from './evaluator';

export class ChessAI {
  private static MAX_DEPTH = 3;
  private static nodesEvaluated = 0;
  public difficulty: number;

  constructor(difficulty: number = 3) {
    this.difficulty = difficulty;
  }

  public getBestMove(state: ChessGameState): Move | null {
    return ChessAI.getBestMove(state, this.difficulty);
  }

  static getBestMove(state: ChessGameState, depth: number = 3): Move | null {
    this.MAX_DEPTH = depth;
    this.nodesEvaluated = 0;
    const isWhite = state.turn === 'white';
    
    const legalMoves = ChessRulesEngine.getLegalMoves(state);
    if (legalMoves.length === 0) return null;

    // Move ordering: captures and promotions first for better alpha-beta pruning
    legalMoves.sort((a, b) => {
        let scoreA = (a.type === 'capture' || a.type === 'en_passant') ? 10 : 0;
        let scoreB = (b.type === 'capture' || b.type === 'en_passant') ? 10 : 0;
        if (a.type === 'promotion') scoreA += 5;
        if (b.type === 'promotion') scoreB += 5;
        return scoreB - scoreA;
    });

    let bestMove: Move | null = null;
    let bestScore = isWhite ? -Infinity : Infinity;

    for (const move of legalMoves) {
      const nextState = ChessRulesEngine.executeMove(state, move, false);
      const score = this.minimax(nextState, depth - 1, -Infinity, Infinity, !isWhite);
      
      if (isWhite) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    console.log(`[ChessAI] Depth: ${depth} | Nodes Evaluated: ${this.nodesEvaluated} | Best Score: ${bestScore}`);
    return bestMove || legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  private static minimax(state: ChessGameState, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number {
    this.nodesEvaluated++;

    const legalMoves = ChessRulesEngine.getLegalMoves(state);
    
    if (depth === 0 || legalMoves.length === 0) {
      if (legalMoves.length === 0) {
          const isCheck = ChessRulesEngine.isKingInCheck(state.board, state.turn);
          if (isCheck) {
              return state.turn === 'white' ? -99999 + (this.MAX_DEPTH - depth) : 99999 - (this.MAX_DEPTH - depth);
          } else {
              return 0; // Stalemate
          }
      }
      return evaluatePosition(state);
    }

    legalMoves.sort((a, b) => {
        let scoreA = (a.type === 'capture' || a.type === 'en_passant') ? 10 : 0;
        let scoreB = (b.type === 'capture' || b.type === 'en_passant') ? 10 : 0;
        if (a.type === 'promotion') scoreA += 5;
        if (b.type === 'promotion') scoreB += 5;
        return scoreB - scoreA;
    });

    if (isMaximizingPlayer) {
      let maxEval = -Infinity;
      for (const move of legalMoves) {
        const nextState = ChessRulesEngine.executeMove(state, move, false);
        const ev = this.minimax(nextState, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of legalMoves) {
        const nextState = ChessRulesEngine.executeMove(state, move, false);
        const ev = this.minimax(nextState, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
}
