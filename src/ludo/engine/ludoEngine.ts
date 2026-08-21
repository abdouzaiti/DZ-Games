import { LudoColor } from '../models/color';
import { LudoPlayer, LudoPlayerType } from '../models/player';
import { LudoPiece } from '../models/piece';
import { LudoBoard, DEFAULT_LUDO_BOARD } from '../models/board';
import { LudoDice } from '../models/dice';
import { LudoGameState, LudoTurnState } from '../state/gameState';
import { LudoRulesEngine } from '../rules/rulesEngine';
import { LudoMove } from '../moves/move';
import { LudoRulePolicies, DEFAULT_LUDO_POLICIES } from '../rules/policies';

export interface LudoPlayerSetupConfig {
  color: LudoColor;
  type: LudoPlayerType;
}

export class LudoEngine {
  /**
   * Delegate method to fetch all valid legal moves for current game state.
   */
  static getLegalMoves(state: LudoGameState): LudoMove[] {
    return LudoRulesEngine.getLegalMoves(state);
  }

  /**
   * Delegate method to validate any given move structurally and logically.
   */
  static isLegalMove(state: LudoGameState, move: LudoMove): boolean {
    return LudoRulesEngine.isLegalMove(state, move);
  }

  /**
   * Initialize a fresh Ludo offline match state with detailed player objects, pieces, and custom policies.
   */
  static initializeGame(
    playerConfigs: (LudoColor | LudoPlayerSetupConfig)[] = ['red', 'green', 'yellow', 'blue'],
    policies: LudoRulePolicies = DEFAULT_LUDO_POLICIES
  ): LudoGameState {
    if (playerConfigs.length < 2) {
      throw new Error('At least 2 players are required to start Ludo.');
    }

    const players: LudoPlayer[] = [];
    const allPieces: LudoPiece[] = [];

    // Map configuration to LudoPlayer models
    playerConfigs.forEach((config, idx) => {
      const color = typeof config === 'string' ? config : config.color;
      const type = typeof config === 'string' ? 'human' : config.type;
      const playerId = `player-${color}`;

      const pieces: LudoPiece[] = [];
      for (let i = 0; i < 4; i++) {
        const piece: LudoPiece = {
          id: `${color}-${i}`,
          playerId,
          color,
          tokenIndex: i,
          position: {
            type: 'base',
            playerColor: color,
            index: i,
          },
          state: 'home',
          stepsMoved: 0,
        };
        pieces.push(piece);
        allPieces.push(piece);
      }

      players.push({
        id: playerId,
        color,
        type,
        pieces,
        order: idx,
      });
    });

    const activeColor = players[0].color;

    const state: LudoGameState = {
      players,
      pieces: allPieces,
      board: DEFAULT_LUDO_BOARD,
      currentPlayer: activeColor,
      dice: {
        value: null,
        state: 'idle',
      },
      turnState: 'roll',
      winner: null,
      status: 'active',
      rollStreak6: 0,
      moveHistory: [],
      policies,

      // --- Backward compatibility aliases ---
      tokens: allPieces,
      turn: activeColor,
      diceRoll: null,
      hasRolled: false,
    };

    return state;
  }

  /**
   * Perform a dice roll for the current active player.
   * Handles consecutive 6s rules and automatically passes the turn if no moves are available.
   */
  static rollDice(state: LudoGameState, forceRoll?: number): LudoGameState {
    if ((state.status !== 'active' && state.status !== 'playing') || state.dice.state === 'rolled') {
      return state;
    }

    const policies = state.policies || DEFAULT_LUDO_POLICIES;
    const roll = forceRoll !== undefined ? forceRoll : Math.floor(Math.random() * 6) + 1;
    let streak = state.rollStreak6;

    if (roll === 6) {
      streak += 1;
    } else {
      streak = 0;
    }

    // Consecutive 6s penalty: Turn is voided, passes to next player
    if (policies.maxConsecutiveSixes > 0 && streak === policies.maxConsecutiveSixes) {
      const activeColors = state.players.map(p => p.color);
      const nextPlayer = LudoRulesEngine.getNextPlayer(activeColors, state.currentPlayer);
      
      const voidedState: LudoGameState = {
        ...state,
        currentPlayer: nextPlayer,
        dice: {
          value: null,
          state: 'idle',
        },
        turnState: 'roll',
        rollStreak6: 0,
      };

      // Set aliases
      voidedState.turn = nextPlayer;
      voidedState.diceRoll = null;
      voidedState.hasRolled = false;

      return voidedState;
    }

    // Create intermediate state with rolled dice values
    const rolledState: LudoGameState = {
      ...state,
      dice: {
        value: roll,
        state: 'rolled',
      },
      turnState: 'move',
      rollStreak6: streak,
    };

    // Set aliases
    rolledState.diceRoll = roll;
    rolledState.hasRolled = true;

    // Calculate legal moves
    const legalMoves = LudoRulesEngine.getLegalMoves(rolledState);

    // If no moves can be made
    if (legalMoves.length === 0) {
      // If they rolled a 6 and policies.extraTurnOnSix is true, they retain turn to roll again
      if (roll === 6 && policies.extraTurnOnSix) {
        const rolled6State: LudoGameState = {
          ...rolledState,
          dice: {
            value: null,
            state: 'idle',
          },
          turnState: 'roll',
        };
        rolled6State.diceRoll = null;
        rolled6State.hasRolled = false;
        return rolled6State;
      } else {
        // Pass turn to next player
        const activeColors = state.players.map(p => p.color);
        const nextPlayer = LudoRulesEngine.getNextPlayer(activeColors, state.currentPlayer);
        
        const passedState: LudoGameState = {
          ...rolledState,
          currentPlayer: nextPlayer,
          dice: {
            value: null,
            state: 'idle',
          },
          turnState: 'roll',
          rollStreak6: 0,
        };
        passedState.turn = nextPlayer;
        passedState.diceRoll = null;
        passedState.hasRolled = false;

        return passedState;
      }
    }

    return rolledState;
  }

  /**
   * Apply a chosen move to the current active state.
   */
  static makeMove(state: LudoGameState, move: LudoMove): LudoGameState {
    // 1. Validate Game State is active
    if (state.status !== 'active' && state.status !== 'playing') {
      throw new Error('Cannot make a move in an inactive game.');
    }

    // 2. Validate current player turn
    if (state.currentPlayer !== move.playerColor) {
      throw new Error(`Current player is ${state.currentPlayer}, but move was requested for player ${move.playerColor}.`);
    }

    // 3. Validate dice rolled state and face value matching the move
    if (state.dice.state !== 'rolled' || state.dice.value === null) {
      throw new Error('Dice must be rolled before selecting a piece to move.');
    }
    if (state.dice.value !== move.rollValue) {
      throw new Error(`Dice shows a face value of ${state.dice.value}, but move requests distance of ${move.rollValue}.`);
    }

    // 4. Validate piece ownership
    const piece = state.pieces.find(p => p.id === move.pieceId);
    if (!piece) {
      throw new Error(`Piece with ID ${move.pieceId} not found.`);
    }
    if (piece.color !== state.currentPlayer) {
      throw new Error(`Piece ${move.pieceId} is owned by ${piece.color}, but it is ${state.currentPlayer}'s turn.`);
    }

    // 5. Validate starting position structure matches
    if (!LudoRulesEngine.arePositionsEqual(piece.position, move.from)) {
      throw new Error('Starting position mismatch between requested move and actual piece location.');
    }

    // 6. Validate movement distance and destination on the board path
    const policies = state.policies || DEFAULT_LUDO_POLICIES;
    const outcome = LudoRulesEngine.calculateNextPosition(piece, move.rollValue, policies);
    if (!outcome) {
      throw new Error('The piece cannot move by this dice value (e.g., overshoot or missing exit roll).');
    }

    // 7. Validate that destination coordinates/index match exactly
    if (!LudoRulesEngine.arePositionsEqual(outcome.position, move.to)) {
      throw new Error('Requested target position does not match the computed target path position.');
    }

    // Since validation passed, execute and return the modified state
    return LudoRulesEngine.executeMove(state, move);
  }

  /**
   * Transition the game status from 'waiting' or 'lobby' to 'playing'.
   */
  static startGame(state: LudoGameState): LudoGameState {
    if (state.status !== 'waiting' && state.status !== 'lobby') {
      return state;
    }
    return {
      ...state,
      status: 'playing',
    };
  }

  /**
   * Completely reset the game state to play a new round with the same player configurations and policies.
   */
  static restartGame(state: LudoGameState): LudoGameState {
    const configs: LudoPlayerSetupConfig[] = state.players.map(p => ({
      color: p.color,
      type: p.type,
    }));
    const policies = state.policies || DEFAULT_LUDO_POLICIES;
    
    const freshGame = this.initializeGame(configs, policies);
    return {
      ...freshGame,
      status: 'playing',
    };
  }

  /**
   * Reset game alias for restartGame.
   */
  static resetGame(state: LudoGameState): LudoGameState {
    return this.restartGame(state);
  }
}
