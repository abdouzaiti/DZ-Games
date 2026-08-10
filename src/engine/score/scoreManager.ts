/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameConfig } from '../../domain/gameConfig';
import { MatchScores, RoundResult } from '../../domain/gameState';
import { Player, calculateHandPips } from '../../domain/player';

export class ScoreManager {
  /**
   * Initializes clean match scores.
   */
  static createInitialScores(players: Player[], is2v2: boolean): MatchScores {
    const playerScores: Record<string, number> = {};
    const teamScores: Record<number, number> = { 0: 0, 1: 0 };

    players.forEach((p) => {
      playerScores[p.id] = 0;
    });

    return {
      playerScores,
      teamScores,
      matchWinnerId: null,
      matchWinnerTeamId: null,
    };
  }

  /**
   * Calculates round result when a player empties hand ("Sortie").
   */
  static calculateSortieResult(
    roundNumber: number,
    winner: Player,
    players: Player[],
    config: GameConfig
  ): RoundResult {
    const playerHandPipsAtEnd: Record<string, number> = {};
    let totalLosingPips = 0;

    players.forEach((p) => {
      const pips = calculateHandPips(p.hand);
      playerHandPipsAtEnd[p.id] = pips;

      // In Mostaganem: Winner scores pips of all opponents
      if (config.mode === '2v2') {
        if (p.teamId !== winner.teamId) {
          totalLosingPips += pips;
        }
      } else {
        if (p.id !== winner.id) {
          totalLosingPips += pips;
        }
      }
    });

    return {
      roundNumber,
      winnerPlayerId: winner.id,
      winnerTeamId: config.mode === '2v2' ? winner.teamId : null,
      reason: 'SORTIE',
      pointsAwarded: totalLosingPips,
      losingPips: totalLosingPips,
      playerHandPipsAtEnd,
    };
  }

  /**
   * Calculates round result when game is blocked ("Ghallaq").
   * According to Mostaganem rules:
   * 1. Compare EACH PLAYER'S HAND INDIVIDUALLY.
   * 2. Do NOT compare team totals to determine the winner.
   * 3. The player with the LOWEST hand total wins the block.
   * 4. That player's TEAM wins the round.
   * 5. The score awarded is the total pip value of ALL remaining tiles held by the LOSING team/side.
   * 6. BLOCK TIE: If the lowest hand is tied between players, the round is burned (EGALITE, 0 pts).
   */
  static calculateGhallaqResult(
    roundNumber: number,
    players: Player[],
    config: GameConfig
  ): RoundResult {
    const playerHandPipsAtEnd: Record<string, number> = {};
    let minPips = Infinity;

    players.forEach((p) => {
      const pips = calculateHandPips(p.hand);
      playerHandPipsAtEnd[p.id] = pips;
      if (pips < minPips) {
        minPips = pips;
      }
    });

    // Find all players who hold the minimum individual hand pips
    const lowestPlayers = players.filter((p) => playerHandPipsAtEnd[p.id] === minPips);
    const lowestTeams = new Set(lowestPlayers.map((p) => (config.mode === '2v2' ? p.teamId : p.id)));

    // BLOCK TIE: Lowest hand is tied between 2 or more opposing sides -> Burned Round (EGALITE)
    if (lowestTeams.size > 1) {
      return {
        roundNumber,
        winnerPlayerId: null,
        winnerTeamId: null,
        reason: 'EGALITE',
        pointsAwarded: 0,
        losingPips: minPips,
        playerHandPipsAtEnd,
      };
    }

    // Single player with lowest hand wins
    const winnerPlayer = lowestPlayers[0];
    const winnerTeamId = config.mode === '2v2' ? winnerPlayer.teamId : null;

    let pointsAwarded = 0;
    if (config.mode === '2v2') {
      // Score awarded is total pips of losing team (all players on opposite team)
      players.forEach((p) => {
        if (p.teamId !== winnerTeamId) {
          pointsAwarded += playerHandPipsAtEnd[p.id];
        }
      });
    } else {
      // In 1v1 / FFA, score awarded is total pips of all losing opponents
      players.forEach((p) => {
        if (p.id !== winnerPlayer.id) {
          pointsAwarded += playerHandPipsAtEnd[p.id];
        }
      });
    }

    return {
      roundNumber,
      winnerPlayerId: winnerPlayer.id,
      winnerTeamId,
      reason: 'GHALLAQ',
      pointsAwarded,
      losingPips: pointsAwarded,
      playerHandPipsAtEnd,
    };
  }

  /**
   * Updates cumulative match scores with round result and checks if target score reached.
   */
  static applyRoundResultToMatch(
    currentScores: MatchScores,
    roundResult: RoundResult,
    config: GameConfig
  ): MatchScores {
    const updatedPlayerScores = { ...currentScores.playerScores };
    const updatedTeamScores = { ...currentScores.teamScores };

    if (roundResult.reason !== 'EGALITE') {
      if (config.mode === '2v2' && roundResult.winnerTeamId !== null) {
        const tid = roundResult.winnerTeamId;
        updatedTeamScores[tid] = (updatedTeamScores[tid] || 0) + roundResult.pointsAwarded;
      } else if (roundResult.winnerPlayerId !== null) {
        const pid = roundResult.winnerPlayerId;
        updatedPlayerScores[pid] = (updatedPlayerScores[pid] || 0) + roundResult.pointsAwarded;
      }
    }

    let matchWinnerId: string | null = null;
    let matchWinnerTeamId: number | null = null;

    if (config.mode === '2v2') {
      if ((updatedTeamScores[0] || 0) >= config.targetScore) {
        matchWinnerTeamId = 0;
      } else if ((updatedTeamScores[1] || 0) >= config.targetScore) {
        matchWinnerTeamId = 1;
      }
    } else {
      for (const [pid, score] of Object.entries(updatedPlayerScores)) {
        if (score >= config.targetScore) {
          matchWinnerId = pid;
          break;
        }
      }
    }

    return {
      playerScores: updatedPlayerScores,
      teamScores: updatedTeamScores,
      matchWinnerId,
      matchWinnerTeamId,
    };
  }
}
