/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Board, PlacementEnd } from '../../domain/board';
import { Player } from '../../domain/player';
import { Tile, tileHasPip } from '../../domain/tile';

export interface PlayabilityResult {
  canPlayOnLeft: boolean;
  canPlayOnRight: boolean;
  canPlay: boolean;
}

export class MostaganemRulesEngine {
  /**
   * Checks if a tile can be placed on the current board (left and/or right end).
   */
  static checkPlayability(tile: Tile, board: Board): PlayabilityResult {
    // If board is empty, any tile can be placed on either end
    if (board.chain.length === 0 || board.leftEndPip === null || board.rightEndPip === null) {
      return {
        canPlayOnLeft: true,
        canPlayOnRight: true,
        canPlay: true,
      };
    }

    const canPlayOnLeft = tileHasPip(tile, board.leftEndPip);
    const canPlayOnRight = tileHasPip(tile, board.rightEndPip);

    return {
      canPlayOnLeft,
      canPlayOnRight,
      canPlay: canPlayOnLeft || canPlayOnRight,
    };
  }

  /**
   * Validates if a specific placement move is allowed by rules.
   * If board is empty and a requiredOpeningTileId is specified (e.g. Round 1 [6|6] rule or burned round),
   * only that tile can be played as the opening move.
   */
  static isValidMove(
    tile: Tile,
    end: PlacementEnd,
    board: Board,
    requiredOpeningTileId?: string | null
  ): boolean {
    if (board.chain.length === 0) {
      if (requiredOpeningTileId) {
        return tile.id === requiredOpeningTileId;
      }
      return true;
    }
    const playability = this.checkPlayability(tile, board);
    if (end === 'LEFT') return playability.canPlayOnLeft;
    if (end === 'RIGHT') return playability.canPlayOnRight;
    return false;
  }

  /**
   * Returns all playable tiles from a player's hand.
   */
  static getValidMoves(
    hand: Tile[],
    board: Board,
    requiredOpeningTileId?: string | null
  ): Array<{ tile: Tile; validEnds: PlacementEnd[] }> {
    const validMoves: Array<{ tile: Tile; validEnds: PlacementEnd[] }> = [];

    if (board.chain.length === 0) {
      for (const tile of hand) {
        if (!requiredOpeningTileId || tile.id === requiredOpeningTileId) {
          validMoves.push({ tile, validEnds: ['LEFT', 'RIGHT'] });
        }
      }
      return validMoves;
    }

    for (const tile of hand) {
      const playability = this.checkPlayability(tile, board);
      if (playability.canPlay) {
        const validEnds: PlacementEnd[] = [];
        if (playability.canPlayOnLeft) validEnds.push('LEFT');
        if (playability.canPlayOnRight) validEnds.push('RIGHT');
        validMoves.push({ tile, validEnds });
      }
    }

    return validMoves;
  }

  /**
   * Checks if a player has at least one valid move available in hand.
   */
  static hasAnyValidMove(
    hand: Tile[],
    board: Board,
    requiredOpeningTileId?: string | null
  ): boolean {
    if (board.chain.length === 0) {
      if (requiredOpeningTileId) {
        return hand.some((t) => t.id === requiredOpeningTileId);
      }
      return hand.length > 0;
    }
    return hand.some((tile) => this.checkPlayability(tile, board).canPlay);
  }

  /**
   * In Mostaganem rules:
   * If a player has a valid playable tile in hand, they MUST play it.
   * They cannot draw from stock or pass if they have a playable tile.
   */
  static canPlayerDraw(
    hand: Tile[],
    board: Board,
    stockLength: number,
    requiredOpeningTileId?: string | null
  ): boolean {
    if (stockLength === 0) return false;
    // Can only draw if player holds NO playable tile
    return !this.hasAnyValidMove(hand, board, requiredOpeningTileId);
  }

  /**
   * Player must pass if they have no valid move AND stock is empty (or no stock exists).
   */
  static canPlayerPass(
    hand: Tile[],
    board: Board,
    stockLength: number,
    requiredOpeningTileId?: string | null
  ): boolean {
    if (this.hasAnyValidMove(hand, board, requiredOpeningTileId)) return false;
    return stockLength === 0;
  }

  /**
   * Determines the starting player for Round 1 according to Mostaganem rules.
   * In Mostaganem:
   * 1. Player holding [6|6] opens.
   * 2. If no [6|6] in hands (e.g., in 2-player game where 6-6 is in pioche),
   *    player holding highest double opens.
   * 3. If no double in any hand, player holding tile with highest pip sum opens.
   */
  static findFirstRoundOpener(players: Player[]): { playerIndex: number; openingTile: Tile } {
    // 1. Look for Double Six [6|6]
    for (let i = 0; i < players.length; i++) {
      const d6 = players[i].hand.find((t) => t.id === '6-6');
      if (d6) {
        return { playerIndex: i, openingTile: d6 };
      }
    }

    // 2. Look for highest double [5|5], [4|4], etc.
    let highestDoubleTile: Tile | null = null;
    let openerIndex = 0;

    for (let i = 0; i < players.length; i++) {
      for (const tile of players[i].hand) {
        if (tile.isDouble) {
          if (!highestDoubleTile || tile.sideA > highestDoubleTile.sideA) {
            highestDoubleTile = tile;
            openerIndex = i;
          }
        }
      }
    }

    if (highestDoubleTile) {
      return { playerIndex: openerIndex, openingTile: highestDoubleTile };
    }

    // 3. Look for tile with highest pip sum
    let highestPipTile: Tile | null = null;
    for (let i = 0; i < players.length; i++) {
      for (const tile of players[i].hand) {
        if (!highestPipTile || tile.totalPips > highestPipTile.totalPips) {
          highestPipTile = tile;
          openerIndex = i;
        }
      }
    }

    if (highestPipTile) {
      return { playerIndex: openerIndex, openingTile: highestPipTile };
    }

    // Fallback default
    return { playerIndex: 0, openingTile: players[0].hand[0] };
  }

  /**
   * Detects if the game is in a Ghallaq (Blocked) state:
   * Stock is empty AND no player can make a move.
   */
  static isGameBlocked(players: Player[], board: Board, stockLength: number, consecutivePasses: number): boolean {
    if (board.chain.length === 0) return false;
    if (stockLength > 0) return false;
    
    // If consecutive passes equals player count, all players were forced to pass -> Blocked!
    if (consecutivePasses >= players.length) return true;

    // Check if any player has any valid move
    const anyPlayable = players.some((p) => this.hasAnyValidMove(p.hand, board));
    return !anyPlayable;
  }
}
