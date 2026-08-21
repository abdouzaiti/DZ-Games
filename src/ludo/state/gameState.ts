import { LudoColor } from '../models/color';
import { LudoPlayer } from '../models/player';
import { LudoPiece } from '../models/piece';
import { LudoBoard } from '../models/board';
import { LudoDice } from '../models/dice';
import { LudoMove } from '../moves/move';
import { LudoRulePolicies } from '../rules/policies';

export type LudoGameStatus = 'lobby' | 'active' | 'finished' | 'waiting' | 'playing' | 'playerWon' | 'gameOver';
export type LudoTurnState = 'roll' | 'move' | 'finished';

export interface LudoGameState {
  players: LudoPlayer[];           // All participating players
  pieces: LudoPiece[];             // All pieces on the board
  board: LudoBoard;                // Logical board configuration
  currentPlayer: LudoColor;        // Active player's color
  dice: LudoDice;                  // Current dice value and roll state
  turnState: LudoTurnState;        // Sub-turn state ('roll' or 'move' or 'finished')
  winner: LudoColor | null;        // Winner color if finished
  status: LudoGameStatus;          // Overall game status ('lobby', 'active', 'finished', 'waiting', 'playing', 'playerWon', 'gameOver')
  rollStreak6: number;             // Count of consecutive six rolls
  moveHistory: LudoMove[];         // List of all moves made in the game
  policies?: LudoRulePolicies;     // Optional rule policies
  lastEvent?: 'piece_finished' | 'player_won' | 'game_over' | null; // Tracks significant events from the last move



  // --- Backward compatibility aliases ---
  tokens?: LudoPiece[];            // Matches 'tokens' alias in rules/engine
  turn?: LudoColor;                // Matches 'turn' alias in rules/engine
  diceRoll?: number | null;        // Matches 'diceRoll' alias in rules/engine
  hasRolled?: boolean;             // Matches 'hasRolled' alias in rules/engine
}
