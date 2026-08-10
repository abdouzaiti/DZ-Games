import { PlacementEnd } from '../../domain/board';
import { GameSnapshot } from '../../domain/gameState';
import { Tile, tileHasPip } from '../../domain/tile';
import { MostaganemRulesEngine } from '../rules/mostaganemRules';

export interface AIMoveChoice {
  tileId: string;
  end: PlacementEnd;
}

interface EvaluatedCandidate {
  choice: AIMoveChoice;
  tile: Tile;
  score: number;
}

export class AIEngine {
  /**
   * Selects the best valid move for an AI player based on current snapshot state.
   * Returns null if no valid move exists.
   *
   * AI uses strictly public information (board, AI's own hand, stock length, game config/scores).
   * It NEVER accesses hidden opponent or teammate hands.
   */
  static selectBestMove(snapshot: GameSnapshot, aiPlayerId: string): AIMoveChoice | null {
    const player = snapshot.players.find((p) => p.id === aiPlayerId);
    if (!player) return null;

    // Get valid moves respecting required opening tile rule if present
    const validMoves = MostaganemRulesEngine.getValidMoves(
      player.hand,
      snapshot.board,
      snapshot.requiredOpeningTileId
    );
    if (validMoves.length === 0) return null;

    // Evaluate each candidate move choice
    const candidates: EvaluatedCandidate[] = [];

    for (const move of validMoves) {
      for (const end of move.validEnds) {
        const score = this.evaluateMove(move.tile, end, player, snapshot);
        candidates.push({
          choice: { tileId: move.tile.id, end },
          tile: move.tile,
          score,
        });
      }
    }

    if (candidates.length === 0) return null;

    // Deterministic sorting: sort by score descending; break ties by sideA, sideB, then end ('LEFT' < 'RIGHT')
    candidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (a.tile.sideA !== b.tile.sideA) {
        return a.tile.sideA - b.tile.sideA;
      }
      if (a.tile.sideB !== b.tile.sideB) {
        return a.tile.sideB - b.tile.sideB;
      }
      return a.choice.end === 'LEFT' ? -1 : 1;
    });

    return candidates[0].choice;
  }

  /**
   * Scores a candidate move for Medium difficulty AI. Higher score = better move.
   */
  private static evaluateMove(
    tile: Tile,
    end: PlacementEnd,
    aiPlayer: { id: string; hand: Tile[]; teamId: number },
    snapshot: GameSnapshot
  ): number {
    let score = 0;
    const hand = aiPlayer.hand;
    const board = snapshot.board;

    // 1. Heavy Pips Priority: Shed high-pip dominoes early to minimize points lost in Ghallaq/Sortie
    score += tile.totalPips * 1.5;

    // 2. Double Tile Priority: Doubles are harder to play because they only match one pip
    if (tile.isDouble) {
      score += 12 + tile.totalPips * 0.5;
    }

    // 3. Board Placement Analysis (if board is not empty)
    if (board.chain.length > 0) {
      const openPipOnConnectedEnd = end === 'LEFT' ? board.leftEndPip! : board.rightEndPip!;
      const newOpenPip = tile.sideA === openPipOnConnectedEnd ? tile.sideB : tile.sideA;

      // Count remaining tiles in AI's hand holding 'newOpenPip'
      const remainingHandWithNewOpen = hand.filter(
        (t) => t.id !== tile.id && tileHasPip(t, newOpenPip)
      ).length;

      // A. Hand Flexibility: Reward creating an open end that matches tiles remaining in AI's hand
      score += remainingHandWithNewOpen * 4.0;

      // B. Suit Dominance: If AI holds 3+ tiles of 'newOpenPip', AI controls this suit!
      if (remainingHandWithNewOpen >= 3) {
        score += 8.0;
      }

      // C. Public Tile Tracking (AI infers how many tiles of 'newOpenPip' remain in unknown domain)
      const playedCountForSuit = this.countPlayedSuit(board.chain, newOpenPip);
      const handCountForSuit = hand.filter((t) => tileHasPip(t, newOpenPip)).length;
      const totalSeen = playedCountForSuit + handCountForSuit;
      const unplayedUnknown = 7 - totalSeen; // Total 7 tiles per suit in double-six set

      // If AI knows ALL remaining tiles of 'newOpenPip' are in AI's hand, AI can lock the board!
      if (unplayedUnknown === 0 && remainingHandWithNewOpen > 0) {
        score += 10.0;
      }

      // D. 2v2 Teammate Synergy
      if (snapshot.config.mode === '2v2') {
        const isTeammateTeam = aiPlayer.teamId;
        // Favor opening ends that match tiles previously played by teammate
        const teammatePlacedTiles = board.chain.filter(
          (pt) => pt.placedByPlayerId !== aiPlayer.id &&
            snapshot.players.find((p) => p.id === pt.placedByPlayerId)?.teamId === isTeammateTeam
        );
        const teammatePips = teammatePlacedTiles.map((pt) => [pt.leftPip, pt.rightPip]).flat();
        if (teammatePips.includes(newOpenPip)) {
          score += 3.0;
        }
      }

      // E. End Game / Low Stock Pip Reduction Strategy
      if (snapshot.stock.length <= 3) {
        // In endgame, prioritize emptying hand and shedding maximum pips
        score += tile.totalPips * 1.0;
      }
    } else {
      // First tile on empty board: Prefer playing doubles or highest pip tile
      if (tile.isDouble) {
        score += 20;
      }
    }

    return score;
  }

  /**
   * Counts how many tiles containing a specific pip value have been played on the public board chain.
   */
  private static countPlayedSuit(chain: Array<{ leftPip: number; rightPip: number }>, pip: number): number {
    return chain.filter((pt) => pt.leftPip === pip || pt.rightPip === pip).length;
  }
}

