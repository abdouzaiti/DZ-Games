import { LudoColor } from '../models/color';
import { LudoPosition } from '../models/position';
import { LudoPiece, LudoPieceState } from '../models/piece';
import { LudoMove } from '../moves/move';
import { LudoGameState } from '../state/gameState';
import { LudoRulePolicies, DEFAULT_LUDO_POLICIES } from './policies';

export class LudoRulesEngine {
  /**
   * Return the index on the 52-square common track where a color's path starts.
   */
  static getStartingTrackIndex(color: LudoColor): number {
    switch (color) {
      case 'red': return 0;
      case 'green': return 13;
      case 'yellow': return 26;
      case 'blue': return 39;
    }
  }

  /**
   * Return whether a given track index is a safe star or starting square.
   */
  static isSafeTrackIndex(index: number): boolean {
    const safeIndices = [0, 8, 13, 21, 26, 34, 39, 47];
    return safeIndices.includes(index);
  }

  /**
   * Helper to map stepsMoved to the explicit LudoPieceState.
   */
  static determinePieceState(stepsMoved: number): LudoPieceState {
    if (stepsMoved === 0) return 'home';
    if (stepsMoved === 57) return 'finished';
    return 'on board';
  }

  /**
   * Helper to structurally compare two LudoPositions for deep equality.
   */
  static arePositionsEqual(p1: LudoPosition, p2: LudoPosition): boolean {
    if (!p1 || !p2) return false;
    if (p1.type !== p2.type) return false;
    
    switch (p1.type) {
      case 'base':
        return p1.playerColor === p2.playerColor && p1.index === p2.index;
      case 'track':
        return p1.index === p2.index;
      case 'home_path':
        return p1.playerColor === p2.playerColor && p1.index === p2.index;
      case 'home':
        return p1.playerColor === p2.playerColor;
      default:
        return false;
    }
  }

  /**
   * Helper to resolve the exact logical board coordinate/position from steps moved.
   */
  static getPositionFromSteps(color: LudoColor, steps: number): LudoPosition {
    if (steps <= 0) {
      return { type: 'base', playerColor: color, index: 0 };
    }
    if (steps <= 51) {
      const startIdx = this.getStartingTrackIndex(color);
      const trackIdx = (startIdx + steps - 1) % 52;
      return { type: 'track', index: trackIdx };
    }
    if (steps <= 56) {
      return { type: 'home_path', playerColor: color, index: steps - 52 };
    }
    return { type: 'home', playerColor: color };
  }

  /**
   * Helper to check if a specific board position is blockaded by another color.
   */
  static isTileBlockaded(state: LudoGameState, pos: LudoPosition, playerColor: LudoColor): boolean {
    const policies = state.policies || DEFAULT_LUDO_POLICIES;
    if (!policies.blockingEnabled) return false;

    // Blockades are formed on track or home_path
    if (pos.type !== 'track' && pos.type !== 'home_path') {
      return false;
    }

    const opponentColors = state.players.map(p => p.color).filter(c => c !== playerColor);
    for (const color of opponentColors) {
      const piecesAtTile = state.pieces.filter(
        p => p.color === color && this.arePositionsEqual(p.position, pos)
      );
      if (piecesAtTile.length >= 2) {
        return true;
      }
    }
    return false;
  }

  /**
   * Predict the next position and steps count for a piece if moved by roll value.
   * Returns null if the move is invalid or overshoots.
   */
  static calculateNextPosition(
    piece: LudoPiece,
    roll: number,
    policies: LudoRulePolicies = DEFAULT_LUDO_POLICIES
  ): { position: LudoPosition; stepsMoved: number } | null {
    if (piece.stepsMoved === 0) {
      // Must roll the configured leave-home value to enter track (usually 6)
      if (roll === policies.rollToLeaveHome) {
        const startIdx = this.getStartingTrackIndex(piece.color);
        return {
          position: { type: 'track', index: startIdx },
          stepsMoved: 1,
        };
      }
      return null;
    }

    if (piece.stepsMoved === 57) {
      // Piece is already finished
      return null;
    }

    const newSteps = piece.stepsMoved + roll;
    if (newSteps > 57) {
      // Overshot the Home square (requires exact roll to land on 57)
      return null;
    }

    if (newSteps <= 51) {
      // Moving along the general circular track
      const startIdx = this.getStartingTrackIndex(piece.color);
      const trackIdx = (startIdx + newSteps - 1) % 52;
      return {
        position: { type: 'track', index: trackIdx },
        stepsMoved: newSteps,
      };
    }

    if (newSteps <= 56) {
      // Moving along the colored home path
      return {
        position: {
          type: 'home_path',
          playerColor: piece.color,
          index: newSteps - 52, // 0 to 4
        },
        stepsMoved: newSteps,
      };
    }

    if (newSteps === 57) {
      // Arrives exactly at Home
      return {
        position: {
          type: 'home',
          playerColor: piece.color,
        },
        stepsMoved: 57,
      };
    }

    return null;
  }

  /**
   * Determine all legal moves for the current active player given their rolled value.
   */
  static getLegalMoves(state: LudoGameState): LudoMove[] {
    if (state.status !== 'active' && state.status !== 'playing') {
      return [];
    }

    const roll = state.dice.value;
    if (roll === null || state.dice.state !== 'rolled') {
      return [];
    }

    const activeColor = state.currentPlayer;
    const policies = state.policies || DEFAULT_LUDO_POLICIES;
    const moves: LudoMove[] = [];

    // Find active player's pieces
    const playerPieces = state.pieces.filter(p => p.color === activeColor);

    for (const piece of playerPieces) {
      const outcome = this.calculateNextPosition(piece, roll, policies);
      if (outcome) {
        const moveAttempt: LudoMove = {
          pieceId: piece.id,
          tokenId: piece.id, // compatibility alias
          playerColor: activeColor,
          from: { ...piece.position },
          to: outcome.position,
          rollValue: roll,
        };

        // Validate through the thorough check
        if (this.isLegalMove(state, moveAttempt)) {
          moves.push(moveAttempt);
        }
      }
    }

    return moves;
  }

  /**
   * Fully validates a movement attempt against all logical rules, including blocking.
   */
  static isLegalMove(state: LudoGameState, move: LudoMove): boolean {
    // 1. Validate game is active
    if (state.status !== 'active' && state.status !== 'playing') {
      return false;
    }

    // 2. Validate current player turn
    if (state.currentPlayer !== move.playerColor) {
      return false;
    }

    // 3. Validate dice state and values match the action
    if (state.dice.state !== 'rolled' || state.dice.value !== move.rollValue) {
      return false;
    }

    // 4. Validate piece existence and ownership
    const piece = state.pieces.find(p => p.id === move.pieceId);
    if (!piece || piece.color !== move.playerColor) {
      return false;
    }

    // 5. Validate starting position
    if (!this.arePositionsEqual(piece.position, move.from)) {
      return false;
    }

    // 6. Validate movement outcome & destination
    const policies = state.policies || DEFAULT_LUDO_POLICIES;
    const outcome = this.calculateNextPosition(piece, move.rollValue, policies);
    if (!outcome) {
      return false;
    }

    // 7. Validate that target destination matches calculated position exactly
    if (!this.arePositionsEqual(outcome.position, move.to)) {
      return false;
    }

    // --- Phase 5: Blocking / blockade barrier validation ---
    if (policies.blockingEnabled && piece.stepsMoved > 0) {
      const startSteps = piece.stepsMoved;
      const endSteps = outcome.stepsMoved;

      // Check intermediate positions for blockades
      if (policies.blocksPreventPassing) {
        for (let s = startSteps + 1; s < endSteps; s++) {
          const interPos = this.getPositionFromSteps(piece.color, s);
          if (this.isTileBlockaded(state, interPos, piece.color)) {
            return false;
          }
        }
      }

      // Check landing position for blockade
      if (policies.blocksPreventLanding) {
        if (this.isTileBlockaded(state, outcome.position, piece.color)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if a player has successfully gotten all 4 pieces to the finished state.
   */
  static hasPlayerFinished(state: LudoGameState, color: LudoColor): boolean {
    const pieces = state.pieces.filter(p => p.color === color);
    return pieces.length === 4 && pieces.every(p => p.stepsMoved === 57);
  }

  /**
   * Find the next player color in the turn rotation.
   */
  static getNextPlayer(players: LudoColor[], current: LudoColor): LudoColor {
    const idx = players.indexOf(current);
    const nextIdx = (idx + 1) % players.length;
    return players[nextIdx];
  }

  /**
   * Execute a move on the state, handle captures, check game completion, and transition turns.
   */
  static executeMove(state: LudoGameState, move: LudoMove): LudoGameState {
    const policies = state.policies || DEFAULT_LUDO_POLICIES;

    // Clone pieces to preserve state immutability
    let updatedPieces = state.pieces.map(p => ({ ...p, position: { ...p.position } }));

    // Find the piece to move
    const pieceIdx = updatedPieces.findIndex(p => p.id === move.pieceId);
    if (pieceIdx === -1) return state;

    const piece = updatedPieces[pieceIdx];
    const outcome = this.calculateNextPosition(piece, move.rollValue, policies);
    if (!outcome) return state;

    // Apply movement & state updates
    piece.position = outcome.position;
    piece.stepsMoved = outcome.stepsMoved;
    piece.state = this.determinePieceState(outcome.stepsMoved);

    let hasCaptured = false;
    let reachedHomeBonus = false;

    if (outcome.stepsMoved === 57) {
      reachedHomeBonus = true;
    }

    // Capture logic (only on general track, outside safe indices)
    if (outcome.position.type === 'track') {
      const targetIdx = outcome.position.index!;
      
      const isStandardSafe = policies.safeSquaresEnabled && this.isSafeTrackIndex(targetIdx);
      
      // Double piece safety check: count opponent pieces already at targetIdx
      const opponentColors = state.players.map(p => p.color).filter(c => c !== piece.color);
      let isDoublePieceSafe = false;

      if (policies.doublePieceSafety) {
        for (const col of opponentColors) {
          const piecesAtTile = updatedPieces.filter(
            p => p.color === col && p.position.type === 'track' && p.position.index === targetIdx
          );
          if (piecesAtTile.length >= 2) {
            isDoublePieceSafe = true;
            break;
          }
        }
      }

      const captureAllowed = !isStandardSafe && !isDoublePieceSafe;

      if (captureAllowed) {
        // Find other colors' pieces on the same track square
        for (let i = 0; i < updatedPieces.length; i++) {
          const other = updatedPieces[i];
          if (
            other.color !== piece.color &&
            other.position.type === 'track' &&
            other.position.index === targetIdx
          ) {
            // Capture opponent's piece!
            other.stepsMoved = 0;
            other.position = {
              type: 'base',
              playerColor: other.color,
              index: other.tokenIndex,
            };
            other.state = 'home';
            hasCaptured = true;
          }
        }
      }
    }

    // Clone players array and update pieces within LudoPlayer references to keep everything synchronized
    const updatedPlayers = state.players.map(player => {
      const playerPieces = updatedPieces.filter(p => p.playerId === player.id);
      return {
        ...player,
        pieces: playerPieces,
      };
    });

    const tempStateForCheck: LudoGameState = {
      ...state,
      pieces: updatedPieces,
      players: updatedPlayers,
    };

    // Check if current player won
    const hasWon = this.hasPlayerFinished(tempStateForCheck, piece.color);
    
    let nextStatus = state.status;
    let nextWinner = state.winner;
    let lastEvent: 'piece_finished' | 'player_won' | 'game_over' | null = null;

    if (reachedHomeBonus) {
      lastEvent = 'piece_finished';
    }

    if (hasWon) {
      if (state.status === 'playing') {
        nextStatus = 'gameOver'; // or we can use 'playerWon'
        lastEvent = 'game_over';
      } else {
        nextStatus = 'finished';
        lastEvent = 'player_won';
      }
      nextWinner = piece.color;
    }

    let nextPlayer = state.currentPlayer;
    let nextStreak = state.rollStreak6;
    let nextTurnState: 'roll' | 'move' | 'finished' = 'roll';

    const isActiveGame = nextStatus === 'active' || nextStatus === 'playing';

    if (isActiveGame) {
      const gotBonusTurn = 
        (move.rollValue === 6 && policies.extraTurnOnSix && (policies.maxConsecutiveSixes === 0 || nextStreak < policies.maxConsecutiveSixes)) || 
        (hasCaptured && policies.captureGrantsBonus) || 
        (reachedHomeBonus && policies.reachedHomeGrantsBonus);
      
      if (!gotBonusTurn) {
        const activeColors = state.players.map(p => p.color);
        nextPlayer = this.getNextPlayer(activeColors, state.currentPlayer);
        nextStreak = 0;
      }
    } else {
      nextTurnState = 'finished';
    }

    const finalState: LudoGameState = {
      ...state,
      players: updatedPlayers,
      pieces: updatedPieces,
      currentPlayer: nextPlayer,
      status: nextStatus,
      winner: nextWinner,
      dice: {
        value: null,
        state: 'idle',
      },
      turnState: nextTurnState,
      rollStreak6: nextStreak,
      moveHistory: [...state.moveHistory, { ...move, isCapture: hasCaptured, isFinished: reachedHomeBonus }],
      lastEvent,
    };

    // Set compatibility aliases
    finalState.tokens = finalState.pieces;
    finalState.turn = finalState.currentPlayer;
    finalState.diceRoll = null;
    finalState.hasRolled = false;

    return finalState;
  }
}
