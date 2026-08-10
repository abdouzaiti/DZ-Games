/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Board, PlacedTile, PlacementEnd } from '../../domain/board';
import { Tile, getOtherPip } from '../../domain/tile';

export interface OrientationDetails {
  leftPip: number;
  rightPip: number;
  isFlipped: boolean;
  connectionPip: number;
  openPip: number;
}

export class BoardPlacementEngine {
  /**
   * Determines whether a tile can be placed on the LEFT end of the board.
   */
  static canPlaceLeft(board: Board, tile: Tile): boolean {
    if (board.chain.length === 0) return true;
    return tile.sideA === board.leftEndPip || tile.sideB === board.leftEndPip;
  }

  /**
   * Determines whether a tile can be placed on the RIGHT end of the board.
   */
  static canPlaceRight(board: Board, tile: Tile): boolean {
    if (board.chain.length === 0) return true;
    return tile.sideA === board.rightEndPip || tile.sideB === board.rightEndPip;
  }

  /**
   * Returns all legal placement ends ('LEFT', 'RIGHT', both, or empty) for a given tile.
   */
  static getLegalPlacements(board: Board, tile: Tile): PlacementEnd[] {
    if (board.chain.length === 0) {
      return ['LEFT', 'RIGHT'];
    }

    const ends: PlacementEnd[] = [];
    if (this.canPlaceLeft(board, tile)) ends.push('LEFT');
    if (this.canPlaceRight(board, tile)) ends.push('RIGHT');
    return ends;
  }

  /**
   * Automatically calculates required orientation (leftPip, rightPip, isFlipped, connectionPip, openPip)
   * for playing a tile at a specific board end.
   */
  static calculateOrientation(
    tile: Tile,
    end: PlacementEnd,
    board: Board
  ): OrientationDetails {
    if (board.chain.length === 0) {
      // First tile on board
      return {
        leftPip: tile.sideA,
        rightPip: tile.sideB,
        isFlipped: false,
        connectionPip: tile.sideA,
        openPip: tile.sideB,
      };
    }

    if (end === 'LEFT') {
      const targetPip = board.leftEndPip!;
      if (tile.sideA !== targetPip && tile.sideB !== targetPip) {
        throw new Error(
          `Tile [${tile.sideA}|${tile.sideB}] cannot connect to LEFT end pip ${targetPip}`
        );
      }
      const openPip = getOtherPip(tile, targetPip);
      const leftPip = openPip;
      const rightPip = targetPip; // connects facing existing board
      const isFlipped = leftPip === tile.sideB && rightPip === tile.sideA;

      return {
        leftPip,
        rightPip,
        isFlipped,
        connectionPip: targetPip,
        openPip,
      };
    }

    if (end === 'RIGHT') {
      const targetPip = board.rightEndPip!;
      if (tile.sideA !== targetPip && tile.sideB !== targetPip) {
        throw new Error(
          `Tile [${tile.sideA}|${tile.sideB}] cannot connect to RIGHT end pip ${targetPip}`
        );
      }
      const openPip = getOtherPip(tile, targetPip);
      const leftPip = targetPip; // connects facing existing board
      const rightPip = openPip;
      const isFlipped = leftPip === tile.sideB && rightPip === tile.sideA;

      return {
        leftPip,
        rightPip,
        isFlipped,
        connectionPip: targetPip,
        openPip,
      };
    }

    throw new Error(`Invalid placement end: ${end}`);
  }

  /**
   * Places a tile onto the board at the specified end ('LEFT' or 'RIGHT').
   * Produces a new immutable Board state with full placement orientation metadata.
   */
  static placeTile(
    board: Board,
    tile: Tile,
    end: PlacementEnd,
    playerId: string
  ): Board {
    const legalEnds = this.getLegalPlacements(board, tile);
    if (!legalEnds.includes(end)) {
      throw new Error(
        `Illegal placement: Tile [${tile.sideA}|${tile.sideB}] cannot be placed on ${end} end. Board left: ${board.leftEndPip}, right: ${board.rightEndPip}`
      );
    }

    const orientation = this.calculateOrientation(tile, end, board);
    const chain = [...board.chain];
    const stepIndex = chain.length;

    // Case 1: First tile on empty board
    if (chain.length === 0) {
      const placedTile: PlacedTile = {
        tile,
        placedByPlayerId: playerId,
        leftPip: orientation.leftPip,
        rightPip: orientation.rightPip,
        isFlipped: orientation.isFlipped,
        isDouble: tile.isDouble,
        placedEnd: end,
        connectionPip: orientation.connectionPip,
        openPip: orientation.openPip,
        stepIndex,
        gridX: 0,
        gridY: 0,
        rotation: tile.isDouble ? 90 : 0,
      };

      return {
        chain: [placedTile],
        leftEndPip: orientation.leftPip,
        rightEndPip: orientation.rightPip,
        tileCount: 1,
      };
    }

    // Case 2: Placed on LEFT end
    if (end === 'LEFT') {
      const leftmostPlaced = chain[0];
      const gridX = leftmostPlaced.gridX - 1;
      const gridY = leftmostPlaced.gridY;

      const placedTile: PlacedTile = {
        tile,
        placedByPlayerId: playerId,
        leftPip: orientation.leftPip,
        rightPip: orientation.rightPip,
        isFlipped: orientation.isFlipped,
        isDouble: tile.isDouble,
        placedEnd: 'LEFT',
        connectionPip: orientation.connectionPip,
        openPip: orientation.openPip,
        stepIndex,
        gridX,
        gridY,
        rotation: tile.isDouble ? 90 : orientation.isFlipped ? 180 : 0,
      };

      return {
        chain: [placedTile, ...chain],
        leftEndPip: orientation.openPip,
        rightEndPip: board.rightEndPip,
        tileCount: chain.length + 1,
      };
    }

    // Case 3: Placed on RIGHT end
    if (end === 'RIGHT') {
      const rightmostPlaced = chain[chain.length - 1];
      const gridX = rightmostPlaced.gridX + 1;
      const gridY = rightmostPlaced.gridY;

      const placedTile: PlacedTile = {
        tile,
        placedByPlayerId: playerId,
        leftPip: orientation.leftPip,
        rightPip: orientation.rightPip,
        isFlipped: orientation.isFlipped,
        isDouble: tile.isDouble,
        placedEnd: 'RIGHT',
        connectionPip: orientation.connectionPip,
        openPip: orientation.openPip,
        stepIndex,
        gridX,
        gridY,
        rotation: tile.isDouble ? 90 : orientation.isFlipped ? 180 : 0,
      };

      return {
        chain: [...chain, placedTile],
        leftEndPip: board.leftEndPip,
        rightEndPip: orientation.openPip,
        tileCount: chain.length + 1,
      };
    }

    throw new Error(`Invalid placement end: ${end}`);
  }
}

