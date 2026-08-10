/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player } from '../../domain/player';
import { Tile, generateDoubleSixSet, getTileHash } from '../../domain/tile';

export class StockManager {
  /**
   * Generates a standard double-6 set of 28 tiles.
   */
  static generateSet(): Tile[] {
    return generateDoubleSixSet();
  }

  /**
   * Shuffles an array of tiles using Fisher-Yates algorithm.
   * Accepts an optional RNG function for deterministic shuffling.
   */
  static shuffleSet(tiles: Tile[], rng: () => number = Math.random): Tile[] {
    const arr = [...tiles];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Validates that the distribution across all players and remaining stock
   * mathematically accounts for all 28 unique physical double-6 tiles without duplicates.
   */
  static validateDistribution(
    players: Player[],
    stock: Tile[],
    expectedHandSize: number = 7
  ): { valid: boolean; error?: string } {
    const totalTilesInHands = players.reduce((sum, p) => sum + p.hand.length, 0);
    const totalTilesInStock = stock.length;
    const totalTiles = totalTilesInHands + totalTilesInStock;

    if (totalTiles !== 28) {
      return {
        valid: false,
        error: `Total tile count is ${totalTiles}, expected 28.`,
      };
    }

    // Verify hand sizes
    for (const player of players) {
      if (player.hand.length !== expectedHandSize) {
        return {
          valid: false,
          error: `Player ${player.name} (${player.id}) has ${player.hand.length} tiles, expected ${expectedHandSize}.`,
        };
      }
    }

    // Verify expected stock size based on player count
    const expectedStockSize = 28 - players.length * expectedHandSize;
    if (totalTilesInStock !== expectedStockSize) {
      return {
        valid: false,
        error: `Stock size is ${totalTilesInStock}, expected ${expectedStockSize} for ${players.length} players.`,
      };
    }

    // Verify uniqueness of all physical tiles
    const seenHashes = new Set<string>();
    const allTiles = [...players.flatMap((p) => p.hand), ...stock];

    for (const tile of allTiles) {
      if (tile.sideA < 0 || tile.sideA > 6 || tile.sideB < 0 || tile.sideB > 6) {
        return {
          valid: false,
          error: `Tile [${tile.sideA}|${tile.sideB}] has invalid pip values outside [0-6].`,
        };
      }

      const hash = getTileHash(tile);
      if (seenHashes.has(hash)) {
        return {
          valid: false,
          error: `Duplicate tile found: [${tile.sideA}|${tile.sideB}].`,
        };
      }
      seenHashes.add(hash);
    }

    if (seenHashes.size !== 28) {
      return {
        valid: false,
        error: `Found ${seenHashes.size} unique physical tiles, expected 28.`,
      };
    }

    return { valid: true };
  }

  /**
   * Deals starting hands to players from a set of tiles.
   * Deterministic when an optional custom RNG or pre-shuffled tiles are provided.
   */
  static dealHands(
    players: Player[],
    tilesPerPlayer: number = 7,
    options?: { tiles?: Tile[]; rng?: () => number }
  ): { players: Player[]; stock: Tile[] } {
    if (players.length < 2 || players.length > 4) {
      throw new Error(`Player count must be between 2 and 4, got ${players.length}`);
    }

    const baseSet = options?.tiles ?? generateDoubleSixSet();
    const shuffledSet = options?.rng
      ? this.shuffleSet(baseSet, options.rng)
      : options?.tiles
      ? baseSet
      : this.shuffleSet(baseSet);

    let currentOffset = 0;

    const updatedPlayers = players.map((player) => {
      const hand = shuffledSet.slice(currentOffset, currentOffset + tilesPerPlayer);
      currentOffset += tilesPerPlayer;
      return {
        ...player,
        hand,
      };
    });

    const stock = shuffledSet.slice(currentOffset);

    // Validate math distribution guarantee
    const validation = this.validateDistribution(updatedPlayers, stock, tilesPerPlayer);
    if (!validation.valid) {
      throw new Error(`Distribution validation failed: ${validation.error}`);
    }

    return {
      players: updatedPlayers,
      stock,
    };
  }

  /**
   * Safely peeks at top tile from stock without removing it.
   */
  static peekStock(stock: Tile[]): Tile | null {
    return stock.length > 0 ? stock[0] : null;
  }

  /**
   * Safely draws top tile from stock pioche into a player's hand.
   */
  static drawFromStock(
    player: Player,
    stock: Tile[]
  ): { player: Player; stock: Tile[]; drawnTile: Tile | null } {
    if (stock.length === 0) {
      return { player, stock, drawnTile: null };
    }

    const drawnTile = stock[0];
    const newStock = stock.slice(1);
    const updatedPlayer: Player = {
      ...player,
      hand: [...player.hand, drawnTile],
    };

    return {
      player: updatedPlayer,
      stock: newStock,
      drawnTile,
    };
  }
}

