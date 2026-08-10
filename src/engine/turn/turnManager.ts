import { Board, PlacementEnd } from '../../domain/board';
import { Player } from '../../domain/player';
import { Tile } from '../../domain/tile';
import { MostaganemRulesEngine } from '../rules/mostaganemRules';
import { StockManager } from '../stock/stockManager';

export interface DrawResult {
  updatedPlayer: Player;
  updatedStock: Tile[];
  drawnTiles: Tile[];
  hasPlayableMove: boolean;
}

export class TurnManager {
  /**
   * Advances turn index clockwise (0 -> 1 -> 2 -> 3 -> 0).
   * Supports 2, 3, and 4 players.
   */
  static getNextTurnIndex(currentIndex: number, playerCount: number): number {
    if (playerCount <= 0) {
      throw new Error(`Player count must be greater than 0, received ${playerCount}`);
    }
    return (currentIndex + 1) % playerCount;
  }

  /**
   * Gets the active player object.
   */
  static getActivePlayer(players: Player[], currentIndex: number): Player {
    if (currentIndex < 0 || currentIndex >= players.length) {
      throw new Error(`Invalid turn index ${currentIndex} for ${players.length} players`);
    }
    return players[currentIndex];
  }

  /**
   * Determines team assignment based on mode.
   * In 2v2:
   * Player 0 & Player 2 = Team 0
   * Player 1 & Player 3 = Team 1
   */
  static assignTeams(players: Player[], is2v2: boolean): Player[] {
    return players.map((player, idx) => ({
      ...player,
      teamId: is2v2 ? idx % 2 : idx, // In FFA, teamId is player index
    }));
  }

  /**
   * Gets all legal moves for a player.
   */
  static getLegalMoves(
    player: Player,
    board: Board,
    requiredOpeningTileId?: string | null
  ): Array<{ tile: Tile; validEnds: PlacementEnd[] }> {
    return MostaganemRulesEngine.getValidMoves(player.hand, board, requiredOpeningTileId);
  }

  /**
   * Determines if a player is allowed to draw from stock.
   * Forbidden if player holds at least one legal move OR if stock is empty.
   */
  static canDraw(
    player: Player,
    board: Board,
    stockLength: number,
    requiredOpeningTileId?: string | null
  ): boolean {
    return MostaganemRulesEngine.canPlayerDraw(player.hand, board, stockLength, requiredOpeningTileId);
  }

  /**
   * Determines if a player is allowed to pass turn.
   * Pass is legal ONLY when player has NO legal move AND stock is empty.
   */
  static canPass(
    player: Player,
    board: Board,
    stockLength: number,
    requiredOpeningTileId?: string | null
  ): boolean {
    return MostaganemRulesEngine.canPlayerPass(player.hand, board, stockLength, requiredOpeningTileId);
  }

  /**
   * Draws tiles one by one from stock into player's hand until:
   * 1. A playable tile is obtained, OR
   * 2. The stock becomes empty.
   *
   * Preserves tile identity and hand/stock consistency.
   */
  static drawUntilPlayableOrEmpty(
    player: Player,
    stock: Tile[],
    board: Board,
    requiredOpeningTileId?: string | null
  ): DrawResult {
    let currentHand = [...player.hand];
    let currentStock = [...stock];
    const drawnTiles: Tile[] = [];

    // Check if player already has a legal move
    if (MostaganemRulesEngine.hasAnyValidMove(currentHand, board, requiredOpeningTileId)) {
      return {
        updatedPlayer: { ...player, hand: currentHand },
        updatedStock: currentStock,
        drawnTiles: [],
        hasPlayableMove: true,
      };
    }

    // Draw loop until playable tile found or stock depleted
    while (
      currentStock.length > 0 &&
      !MostaganemRulesEngine.hasAnyValidMove(currentHand, board, requiredOpeningTileId)
    ) {
      const { player: tempP, stock: tempStock, drawnTile } = StockManager.drawFromStock(
        { ...player, hand: currentHand },
        currentStock
      );

      if (!drawnTile) break;

      currentHand = tempP.hand;
      currentStock = tempStock;
      drawnTiles.push(drawnTile);
    }

    const hasPlayableMove = MostaganemRulesEngine.hasAnyValidMove(
      currentHand,
      board,
      requiredOpeningTileId
    );

    return {
      updatedPlayer: { ...player, hand: currentHand },
      updatedStock: currentStock,
      drawnTiles,
      hasPlayableMove,
    };
  }

  /**
   * Validates mathematical consistency of tile accounting across players, stock, and board.
   * Total tiles across all hands + stock + board must equal expected total (default 28).
   * Ensures no tiles are duplicated or lost during turns and draws.
   */
  static validateTileStateIntegrity(
    players: Player[],
    stock: Tile[],
    board: Board,
    expectedTotal = 28
  ): { isValid: boolean; totalFound: number; details: string } {
    const tileIds = new Set<string>();
    let duplicatesFound = false;

    // Helper to track tile ID
    const addTile = (id: string) => {
      if (tileIds.has(id)) {
        duplicatesFound = true;
      } else {
        tileIds.add(id);
      }
    };

    // Check players' hands
    for (const player of players) {
      for (const tile of player.hand) {
        addTile(tile.id);
      }
    }

    // Check stock
    for (const tile of stock) {
      addTile(tile.id);
    }

    // Check board chain
    for (const placed of board.chain) {
      addTile(placed.tile.id);
    }

    const totalFound = tileIds.size;
    const isValid = !duplicatesFound && totalFound === expectedTotal;

    const details = `Total unique tiles: ${totalFound}/${expectedTotal}, Duplicates: ${duplicatesFound}`;
    return { isValid, totalFound, details };
  }
}

