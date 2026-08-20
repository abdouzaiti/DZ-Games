import { ChessGameState } from '../state/gameState';
import { initializeStandardBoard } from '../models/board';
import { ChessRulesEngine } from '../rules/rulesEngine';
import { Move } from '../moves/move';

export class ChessEngine {
  private state: ChessGameState;
  private listeners: Set<(state: ChessGameState) => void>;

  constructor() {
    this.listeners = new Set();
    this.state = this.getInitialState();
  }

  private getInitialState(): ChessGameState {
    const initialState: ChessGameState = {
      board: initializeStandardBoard(),
      turn: 'white',
      status: 'active',
      isCheck: false,
      moveHistory: [],
      capturedWhitePieces: [],
      capturedBlackPieces: [],
      halfMoveClock: 0,
      fullMoveNumber: 1,
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true,
      },
      enPassantTarget: null,
      positionCounts: {},
    };
    
    const hash = ChessRulesEngine.generateStateHash(initialState);
    initialState.positionCounts[hash] = 1;
    return initialState;
  }

  public getSnapshot(): ChessGameState {
    return { ...this.state };
  }

  public makeMove(move: Move): ChessGameState {
    this.state = ChessRulesEngine.executeMove(this.state, move);
    this.notifyListeners();
    return this.getSnapshot();
  }

  public reset(): ChessGameState {
    this.state = this.getInitialState();
    this.notifyListeners();
    return this.getSnapshot();
  }

  public subscribe(listener: (state: ChessGameState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
