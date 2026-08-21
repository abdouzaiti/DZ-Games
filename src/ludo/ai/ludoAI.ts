import { LudoGameState } from '../state/gameState';
import { LudoMove } from '../moves/move';
import { LudoRulesEngine } from '../rules/rulesEngine';
import { LudoColor } from '../models/color';
import { DEFAULT_LUDO_POLICIES } from '../rules/policies';

export type LudoAIDifficulty = 'easy' | 'medium' | 'hard';

export class LudoAI {
  /**
   * Main entry point to select the best move for the active player based on difficulty.
   */
  static selectBestMove(state: LudoGameState, difficulty: LudoAIDifficulty = 'medium'): LudoMove | null {
    const legalMoves = LudoRulesEngine.getLegalMoves(state);
    if (legalMoves.length === 0) return null;

    switch (difficulty) {
      case 'easy':
        return this.selectEasyMove(state, legalMoves);
      case 'medium':
        return this.selectMediumMove(state, legalMoves);
      case 'hard':
        return this.selectHardMove(state, legalMoves);
      default:
        return this.selectMediumMove(state, legalMoves);
    }
  }

  /**
   * Easy difficulty:
   * Mostly random (80% random), but 20% of the time chooses a capturing or finishing move if available.
   */
  private static selectEasyMove(state: LudoGameState, legalMoves: LudoMove[]): LudoMove {
    if (Math.random() > 0.2) {
      const randomIndex = Math.floor(Math.random() * legalMoves.length);
      return legalMoves[randomIndex];
    }

    // Capture or finish
    const captureOrFinishMoves = legalMoves.filter(m => this.isCaptureMove(state, m) || m.to.type === 'home');
    if (captureOrFinishMoves.length > 0) {
      const randomIndex = Math.floor(Math.random() * captureOrFinishMoves.length);
      return captureOrFinishMoves[randomIndex];
    }

    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[randomIndex];
  }

  /**
   * Medium difficulty:
   * Evaluates each move using a heuristic scoring function and selects the highest scoring move.
   * If there are ties, chooses randomly among the highest scorers.
   */
  private static selectMediumMove(state: LudoGameState, legalMoves: LudoMove[]): LudoMove {
    let bestScore = -Infinity;
    let bestMoves: LudoMove[] = [];

    for (const move of legalMoves) {
      const score = this.evaluateMove(state, move, 'medium');
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }

    const randomIndex = Math.floor(Math.random() * bestMoves.length);
    return bestMoves[randomIndex];
  }

  /**
   * Hard difficulty:
   * Uses deeper heuristic weights, actively models opponent positions, and tries to form blockades
   * and optimize exact distance calculations to minimize opponent threat of capture.
   */
  private static selectHardMove(state: LudoGameState, legalMoves: LudoMove[]): LudoMove {
    let bestScore = -Infinity;
    let bestMoves: LudoMove[] = [];

    for (const move of legalMoves) {
      const score = this.evaluateMove(state, move, 'hard');
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }

    const randomIndex = Math.floor(Math.random() * bestMoves.length);
    return bestMoves[randomIndex];
  }

  /**
   * Helper to check if a move captures any opponent piece.
   */
  private static isCaptureMove(state: LudoGameState, move: LudoMove): boolean {
    if (move.to.type !== 'track') return false;
    const targetIdx = move.to.index!;
    
    // Check standard safe zones
    const policies = state.policies || DEFAULT_LUDO_POLICIES;
    if (policies.safeSquaresEnabled && LudoRulesEngine.isSafeTrackIndex(targetIdx)) {
      return false;
    }

    // Check double piece safety
    if (policies.doublePieceSafety) {
      const opponentColors = state.players.map(p => p.color).filter(c => c !== move.playerColor);
      for (const col of opponentColors) {
        const piecesAtTile = state.pieces.filter(
          p => p.color === col && p.position.type === 'track' && p.position.index === targetIdx
        );
        if (piecesAtTile.length >= 2) {
          return false;
        }
      }
    }

    // Check if there's any opponent piece on target
    return state.pieces.some(
      p => p.color !== move.playerColor && p.position.type === 'track' && p.position.index === targetIdx
    );
  }

  /**
   * Heuristic evaluation function for a single candidate move.
   */
  private static evaluateMove(state: LudoGameState, move: LudoMove, level: 'medium' | 'hard'): number {
    let score = 0;

    const piece = state.pieces.find(p => p.id === move.pieceId);
    if (!piece) return 0;

    const fromPos = move.from;
    const toPos = move.to;
    const startSteps = piece.stepsMoved;

    // 1. COMPLETION BONUS
    // Reaching home is the ultimate goal
    if (toPos.type === 'home') {
      score += (level === 'hard' ? 350 : 250);
    }

    // 2. CAPTURE BONUS
    // Capturing an opponent is highly valuable as it resets their progress
    if (this.isCaptureMove(state, move)) {
      score += (level === 'hard' ? 180 : 120);
    }

    // 3. LEAVING BASE
    // It's usually extremely beneficial to exit the base yard to increase board presence
    if (fromPos.type === 'base' && toPos.type === 'track') {
      score += 60;
    }

    // 4. LANDING ON SAFE TILE
    // Protect piece on star or starting square
    if (toPos.type === 'track' && LudoRulesEngine.isSafeTrackIndex(toPos.index!)) {
      score += (level === 'hard' ? 45 : 30);
    }

    // 5. MOVING OUT OF SAFE TILE (Unfavorable unless necessary)
    if (fromPos.type === 'track' && LudoRulesEngine.isSafeTrackIndex(fromPos.index!)) {
      score -= 15;
    }

    // 6. HOME PATH PROGRESS
    // Safe zone path advancement
    if (toPos.type === 'home_path') {
      score += 20 + toPos.index!; // slightly prefer further home path progress
    }

    // 7. BOARD ADVANCEMENT
    // Moving pieces forward is naturally positive. We weight this by steps already moved
    // so that pieces closer to home are prioritized (reduces vulnerability of advanced pieces)
    if (fromPos.type !== 'base' && toPos.type !== 'home') {
      // General progression value
      score += move.rollValue * 0.5;
      // Seniority bonus: prioritize moving pieces that have traveled further
      score += startSteps * 0.2;
    }

    // 8. ESCAPING DANGER / AVOIDING RISK (Threat Analysis)
    if (toPos.type === 'track') {
      const dangerScore = this.calculateDangerScore(state, toPos.index!, move.playerColor);
      score -= dangerScore * (level === 'hard' ? 1.5 : 1.0);
    }

    // If starting position was under threat, escaping it gets a positive reward
    if (fromPos.type === 'track') {
      const initialDanger = this.calculateDangerScore(state, fromPos.index!, move.playerColor);
      if (initialDanger > 0) {
        score += initialDanger * (level === 'hard' ? 1.2 : 0.8);
      }
    }

    // 9. BLOCKADE CREATION / DOUBLE PIECE STRATEGY (If enabled)
    const policies = state.policies || { doublePieceSafety: false, blockingEnabled: false };
    if (policies.doublePieceSafety || policies.blockingEnabled) {
      if (toPos.type === 'track') {
        const ownPiecesOnTarget = state.pieces.filter(
          p => p.color === move.playerColor && p.id !== move.pieceId && p.position.type === 'track' && p.position.index === toPos.index
        );
        if (ownPiecesOnTarget.length === 1) {
          // Forming a pair / blockade
          score += (level === 'hard' ? 35 : 20);
        }
      }
    }

    return score;
  }

  /**
   * Threat assessment helper: Calculates how "dangerous" a track index is.
   * Scans behind the tile to see if there are active opponent pieces within 1 to 6 steps.
   */
  private static calculateDangerScore(state: LudoGameState, trackIndex: number, ownColor: LudoColor): number {
    let danger = 0;
    const opponentPieces = state.pieces.filter(p => p.color !== ownColor && p.state === 'on board' && p.position.type === 'track');

    for (const opponent of opponentPieces) {
      const oppIdx = opponent.position.index!;
      // Calculate how many steps the opponent is behind trackIndex.
      // Track is circular (0..51)
      const distanceBehind = (trackIndex - oppIdx + 52) % 52;
      
      if (distanceBehind >= 1 && distanceBehind <= 6) {
        // Opponent is close enough to potentially roll a dice and capture us next turn!
        danger += (7 - distanceBehind) * 10; // Closer opponents are exponentially more dangerous
      }
    }

    return danger;
  }
}
