/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameAction } from '../../domain/actions';
import { createEmptyBoard } from '../../domain/board';
import { GameConfig, getDefaultConfig } from '../../domain/gameConfig';
import { GameSnapshot, RoundResult } from '../../domain/gameState';
import { Player, createPlayer } from '../../domain/player';
import { AIEngine } from '../ai/aiEngine';
import { BoardPlacementEngine } from '../board/boardPlacementEngine';

import { MostaganemRulesEngine } from '../rules/mostaganemRules';
import { ScoreManager } from '../score/scoreManager';
import { StockManager } from '../stock/stockManager';
import { TurnManager } from '../turn/turnManager';

export type StateChangeListener = (snapshot: GameSnapshot) => void;

export class GameEngine {
  private snapshot: GameSnapshot;
  private listeners: Set<StateChangeListener> = new Set();

  constructor(initialConfig: GameConfig = getDefaultConfig('1v1')) {
    this.snapshot = this.createInitialSnapshot(initialConfig);
  }

  public getSnapshot(): GameSnapshot {
    return this.snapshot;
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    // Emit current state immediately
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.snapshot);
    }
  }

  private createInitialSnapshot(config: GameConfig): GameSnapshot {
    // Default 2 players for 1v1
    const playerCount = config.mode === '2v2' || config.mode === '4player_ffa' ? 4 : config.mode === '3player_ffa' ? 3 : 2;
    const is2v2 = config.mode === '2v2';

    const defaultNames = ['Player 1 (You)', 'AI Café Master 1', 'AI Partner', 'AI Café Master 2'];
    const players: Player[] = [];

    for (let i = 0; i < playerCount; i++) {
      players.push(createPlayer(`p${i + 1}`, defaultNames[i] || `Player ${i + 1}`, i > 0, is2v2 ? i % 2 : i));
    }

    return {
      config,
      matchScores: ScoreManager.createInitialScores(players, is2v2),
      roundNumber: 0,
      roundStatus: 'NOT_STARTED',
      board: createEmptyBoard(),
      players,
      stock: [],
      currentPlayerIndex: 0,
      lastPlayedTileId: null,
      consecutivePassesCount: 0,
      roundHistory: [],
      latestResult: null,
      lastActionDescription: 'Match initialized. Press Start Round.',
      openerPlayerId: null,
    };
  }

  /**
   * Primary entry point: Receives a GameAction intent and applies pure state transition.
   * Fulfills clean architecture & future network compatibility requirement!
   */
  public dispatch(action: GameAction): void {
    switch (action.type) {
      case 'START_MATCH':
        this.handleStartMatch(action.config, action.playerNames, action.aiFlags);
        break;

      case 'START_NEW_ROUND':
        this.handleStartNewRound();
        break;

      case 'PLAY_TILE':
        this.handlePlayTile(action.playerId, action.tileId, action.end);
        break;

      case 'DRAW_TILE':
        this.handleDrawTile(action.playerId);
        break;

      case 'AUTO_DRAW':
        this.handleAutoDraw(action.playerId);
        break;

      case 'PASS_TURN':
        this.handlePassTurn(action.playerId);
        break;

      case 'AI_STEP':
        this.handleAIStep();
        break;

      case 'RESTART_MATCH':
        this.snapshot = this.createInitialSnapshot(this.snapshot.config);
        this.notifyListeners();
        break;

      default:
        console.warn('Unknown action type', action);
    }
  }

  private handleStartMatch(config: GameConfig, playerNames?: string[], aiFlags?: boolean[]): void {
    const playerCount = config.mode === '2v2' || config.mode === '4player_ffa' ? 4 : config.mode === '3player_ffa' ? 3 : 2;
    const is2v2 = config.mode === '2v2';

    const defaultNames = ['Player 1 (You)', 'Café Master 1', 'Café Partner', 'Café Master 2'];
    const players: Player[] = [];

    for (let i = 0; i < playerCount; i++) {
      const name = playerNames?.[i] || defaultNames[i] || `Player ${i + 1}`;
      const isAI = aiFlags?.[i] !== undefined ? aiFlags[i] : i > 0;
      players.push(createPlayer(`p${i + 1}`, name, isAI, is2v2 ? i % 2 : i));
    }

    this.snapshot = {
      ...this.snapshot,
      config,
      matchScores: ScoreManager.createInitialScores(players, is2v2),
      roundNumber: 0,
      roundStatus: 'NOT_STARTED',
      board: createEmptyBoard(),
      players,
      stock: [],
      currentPlayerIndex: 0,
      roundHistory: [],
      latestResult: null,
      lastActionDescription: `Match configured for ${config.mode.toUpperCase()} Mostaganem Dominoes.`,
    };

    this.notifyListeners();
    this.handleStartNewRound();
  }

  private handleStartNewRound(): void {
    if (this.snapshot.matchScores.matchWinnerId !== null || this.snapshot.matchScores.matchWinnerTeamId !== null) {
      return; // Match ended
    }

    const roundNumber = this.snapshot.roundNumber + 1;
    const { players: dealtPlayers, stock } = StockManager.dealHands(
      this.snapshot.players,
      this.snapshot.config.tilesPerPlayer
    );

    let starterIndex = 0;
    let openerId = dealtPlayers[0].id;
    let requiredOpeningTileId: string | null = null;
    let startMsg = '';

    const prevResult = this.snapshot.latestResult;
    const isFirstRound = roundNumber === 1;
    const isAfterBurnedRound = prevResult?.reason === 'EGALITE';

    if (isFirstRound || isAfterBurnedRound) {
      // Round 1 or after a burned round (block tie): Must open with [6|6] (or highest double/highest tile)
      const { playerIndex, openingTile } = MostaganemRulesEngine.findFirstRoundOpener(dealtPlayers);
      starterIndex = playerIndex;
      openerId = dealtPlayers[starterIndex].id;
      requiredOpeningTileId = openingTile.id;
      startMsg = isFirstRound
        ? `Round 1 started! ${dealtPlayers[starterIndex].name} opens with ${openingTile.id}.`
        : `Round ${roundNumber} started (burned round replay)! ${dealtPlayers[starterIndex].name} opens with ${openingTile.id}.`;
    } else {
      // Round 2+ after a win: Winner of previous round opens with ANY tile
      if (prevResult && prevResult.winnerPlayerId) {
        const foundIdx = dealtPlayers.findIndex((p) => p.id === prevResult.winnerPlayerId);
        if (foundIdx >= 0) starterIndex = foundIdx;
      }
      openerId = dealtPlayers[starterIndex].id;
      requiredOpeningTileId = null;
      startMsg = `Round ${roundNumber} started! ${dealtPlayers[starterIndex].name} has first move.`;
    }

    this.snapshot = {
      ...this.snapshot,
      roundNumber,
      roundStatus: 'PLAYING',
      board: createEmptyBoard(),
      players: dealtPlayers,
      stock,
      currentPlayerIndex: starterIndex,
      lastPlayedTileId: null,
      consecutivePassesCount: 0,
      latestResult: null,
      lastActionDescription: startMsg,
      openerPlayerId: openerId,
      requiredOpeningTileId,
    };

    this.notifyListeners();
  }

  private handlePlayTile(playerId: string, tileId: string, end: 'LEFT' | 'RIGHT'): void {
    if (this.snapshot.roundStatus !== 'PLAYING') return;

    const activePlayer = TurnManager.getActivePlayer(this.snapshot.players, this.snapshot.currentPlayerIndex);
    if (activePlayer.id !== playerId) {
      console.warn(`Not player ${playerId}'s turn! Current turn: ${activePlayer.id}`);
      return;
    }

    const tileToPlay = activePlayer.hand.find((t) => t.id === tileId);
    if (!tileToPlay) {
      console.warn(`Tile ${tileId} not in player ${playerId}'s hand!`);
      return;
    }

    // Validate placement against rules and required opening tile
    const isValid = MostaganemRulesEngine.isValidMove(
      tileToPlay,
      end,
      this.snapshot.board,
      this.snapshot.requiredOpeningTileId
    );
    if (!isValid) {
      console.warn(`Tile ${tileId} invalid placement on ${end}`);
      return;
    }

    // Place tile
    const newBoard = BoardPlacementEngine.placeTile(
      this.snapshot.board,
      tileToPlay,
      end,
      playerId
    );

    // Remove tile from hand
    const updatedHand = activePlayer.hand.filter((t) => t.id !== tileId);
    const updatedPlayers = this.snapshot.players.map((p) =>
      p.id === playerId ? { ...p, hand: updatedHand } : p
    );

    const desc = `${activePlayer.name} played [${tileToPlay.sideA}|${tileToPlay.sideB}] on ${end}.`;

    // Check Sortie (Player emptied hand)
    if (updatedHand.length === 0) {
      this.endRoundWithSortie(activePlayer, updatedPlayers, newBoard, tileId, desc);
      return;
    }

    // Advance turn
    const nextTurnIndex = TurnManager.getNextTurnIndex(
      this.snapshot.currentPlayerIndex,
      this.snapshot.players.length
    );

    this.snapshot = {
      ...this.snapshot,
      board: newBoard,
      players: updatedPlayers,
      currentPlayerIndex: nextTurnIndex,
      lastPlayedTileId: tileId,
      consecutivePassesCount: 0, // Reset passes on valid play
      lastActionDescription: desc,
      requiredOpeningTileId: null, // Opening tile has been placed
    };

    this.notifyListeners();
  }

  private handleDrawTile(playerId: string): void {
    if (this.snapshot.roundStatus !== 'PLAYING') return;

    const activePlayer = TurnManager.getActivePlayer(this.snapshot.players, this.snapshot.currentPlayerIndex);
    if (activePlayer.id !== playerId) return;

    // Check draw rule
    if (
      !MostaganemRulesEngine.canPlayerDraw(
        activePlayer.hand,
        this.snapshot.board,
        this.snapshot.stock.length,
        this.snapshot.requiredOpeningTileId
      )
    ) {
      console.warn(`Player ${playerId} cannot draw (either has valid moves or stock empty)`);
      return;
    }

    const { player: updatedPlayer, stock: newStock, drawnTile } = StockManager.drawFromStock(
      activePlayer,
      this.snapshot.stock
    );

    if (!drawnTile) return;

    const updatedPlayers = this.snapshot.players.map((p) => (p.id === playerId ? updatedPlayer : p));
    const desc = `${activePlayer.name} drew [${drawnTile.sideA}|${drawnTile.sideB}] from Pioche.`;

    this.snapshot = {
      ...this.snapshot,
      players: updatedPlayers,
      stock: newStock,
      lastActionDescription: desc,
    };

    this.notifyListeners();
  }

  private handleAutoDraw(playerId: string): void {
    if (this.snapshot.roundStatus !== 'PLAYING') return;

    const activePlayer = TurnManager.getActivePlayer(this.snapshot.players, this.snapshot.currentPlayerIndex);
    if (activePlayer.id !== playerId) return;

    if (!TurnManager.canDraw(activePlayer, this.snapshot.board, this.snapshot.stock.length, this.snapshot.requiredOpeningTileId)) {
      console.warn(`Player ${playerId} cannot draw`);
      return;
    }

    const { updatedPlayer, updatedStock, drawnTiles } = TurnManager.drawUntilPlayableOrEmpty(
      activePlayer,
      this.snapshot.stock,
      this.snapshot.board,
      this.snapshot.requiredOpeningTileId
    );

    if (drawnTiles.length === 0) return;

    const updatedPlayers = this.snapshot.players.map((p) => (p.id === playerId ? updatedPlayer : p));
    const desc = `${activePlayer.name} drew ${drawnTiles.length} tile(s) from Pioche.`;

    this.snapshot = {
      ...this.snapshot,
      players: updatedPlayers,
      stock: updatedStock,
      lastActionDescription: desc,
    };

    this.notifyListeners();
  }

  private handlePassTurn(playerId: string): void {
    if (this.snapshot.roundStatus !== 'PLAYING') return;

    const activePlayer = TurnManager.getActivePlayer(this.snapshot.players, this.snapshot.currentPlayerIndex);
    if (activePlayer.id !== playerId) return;

    // Check pass rule
    if (
      !MostaganemRulesEngine.canPlayerPass(
        activePlayer.hand,
        this.snapshot.board,
        this.snapshot.stock.length,
        this.snapshot.requiredOpeningTileId
      )
    ) {
      console.warn(`Player ${playerId} cannot pass (holds valid moves or stock not empty)`);
      return;
    }

    const newPasses = this.snapshot.consecutivePassesCount + 1;
    const desc = `${activePlayer.name} passed (Sauter).`;

    // Check Ghallaq (Blocked Game)
    if (MostaganemRulesEngine.isGameBlocked(this.snapshot.players, this.snapshot.board, this.snapshot.stock.length, newPasses)) {
      this.endRoundWithGhallaq(desc);
      return;
    }

    const nextTurnIndex = TurnManager.getNextTurnIndex(
      this.snapshot.currentPlayerIndex,
      this.snapshot.players.length
    );

    this.snapshot = {
      ...this.snapshot,
      currentPlayerIndex: nextTurnIndex,
      consecutivePassesCount: newPasses,
      lastActionDescription: desc,
    };

    this.notifyListeners();
  }

  public handleAIStep(): void {
    if (this.snapshot.roundStatus !== 'PLAYING') return;

    const activePlayer = TurnManager.getActivePlayer(this.snapshot.players, this.snapshot.currentPlayerIndex);
    if (!activePlayer.isAI) return;

    // Check if AI can play directly
    const bestMove = AIEngine.selectBestMove(this.snapshot, activePlayer.id);

    if (bestMove) {
      this.handlePlayTile(activePlayer.id, bestMove.tileId, bestMove.end);
      return;
    }

    // If no valid move, check if AI must draw from stock
    if (
      MostaganemRulesEngine.canPlayerDraw(
        activePlayer.hand,
        this.snapshot.board,
        this.snapshot.stock.length,
        this.snapshot.requiredOpeningTileId
      )
    ) {
      this.handleDrawTile(activePlayer.id);
      return;
    }

    // If no valid move and stock empty, pass turn
    if (
      MostaganemRulesEngine.canPlayerPass(
        activePlayer.hand,
        this.snapshot.board,
        this.snapshot.stock.length,
        this.snapshot.requiredOpeningTileId
      )
    ) {
      this.handlePassTurn(activePlayer.id);
      return;
    }
  }

  private endRoundWithSortie(
    winner: Player,
    finalPlayers: Player[],
    finalBoard: any,
    lastTileId: string,
    actionDesc: string
  ): void {
    const roundResult = ScoreManager.calculateSortieResult(
      this.snapshot.roundNumber,
      winner,
      finalPlayers,
      this.snapshot.config
    );

    const updatedMatchScores = ScoreManager.applyRoundResultToMatch(
      this.snapshot.matchScores,
      roundResult,
      this.snapshot.config
    );

    const matchEnded =
      updatedMatchScores.matchWinnerId !== null || updatedMatchScores.matchWinnerTeamId !== null;

    const statusMsg = `${actionDesc} ${winner.name} won the round (Sortie!) +${roundResult.pointsAwarded} pts.`;

    this.snapshot = {
      ...this.snapshot,
      board: finalBoard,
      players: finalPlayers,
      roundStatus: matchEnded ? 'MATCH_ENDED' : 'ROUND_ENDED_SORTIE',
      matchScores: updatedMatchScores,
      lastPlayedTileId: lastTileId,
      roundHistory: [...this.snapshot.roundHistory, roundResult],
      latestResult: roundResult,
      lastActionDescription: statusMsg,
    };

    this.notifyListeners();
  }

  private endRoundWithGhallaq(actionDesc: string): void {
    const roundResult = ScoreManager.calculateGhallaqResult(
      this.snapshot.roundNumber,
      this.snapshot.players,
      this.snapshot.config
    );

    const updatedMatchScores = ScoreManager.applyRoundResultToMatch(
      this.snapshot.matchScores,
      roundResult,
      this.snapshot.config
    );

    const matchEnded =
      updatedMatchScores.matchWinnerId !== null || updatedMatchScores.matchWinnerTeamId !== null;

    let statusMsg = `${actionDesc} Game Blocked (Ghallaq!).`;
    if (roundResult.reason === 'EGALITE') {
      statusMsg += ` Tie game (Egalité) - 0 points awarded.`;
    } else {
      const winnerName = this.snapshot.players.find((p) => p.id === roundResult.winnerPlayerId)?.name || 'Winner';
      statusMsg += ` ${winnerName} won with lowest pips (+${roundResult.pointsAwarded} pts).`;
    }

    this.snapshot = {
      ...this.snapshot,
      roundStatus: matchEnded ? 'MATCH_ENDED' : 'ROUND_ENDED_GHALLAQ',
      matchScores: updatedMatchScores,
      roundHistory: [...this.snapshot.roundHistory, roundResult],
      latestResult: roundResult,
      lastActionDescription: statusMsg,
    };

    this.notifyListeners();
  }
}
