import { ChessGameState, GameStatus, DrawReason, MoveRecord } from '../state/gameState';
import { Move } from '../moves/move';
import { getPseudoLegalMoves } from './movement';
import { Position } from '../models/position';
import { BoardState, movePiece } from '../models/board';
import { isSquareAttacked, findKing } from './attacks';
import { PieceColor, Piece } from '../models/piece';

export class ChessRulesEngine {
  static getPseudoLegalMovesForSquare(state: ChessGameState, pos: Position): Move[] {
    return getPseudoLegalMoves(state, pos);
  }
  
  static isKingInCheck(board: BoardState, color: PieceColor): boolean {
    const kingPos = findKing(board, color);
    if (!kingPos) return false;
    const opponentColor = color === 'white' ? 'black' : 'white';
    return isSquareAttacked(board, kingPos, opponentColor);
  }

  static generateStateHash(state: ChessGameState): string {
    let boardStr = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = state.board[r][c];
        if (p) {
          boardStr += `${p.color[0]}${p.type[0]}`;
        } else {
          boardStr += '1';
        }
      }
    }
    const cr = state.castlingRights;
    const castlingStr = `${cr.whiteKingSide ? 'K' : ''}${cr.whiteQueenSide ? 'Q' : ''}${cr.blackKingSide ? 'k' : ''}${cr.blackQueenSide ? 'q' : ''}`;
    const epStr = state.enPassantTarget ? `${state.enPassantTarget.row},${state.enPassantTarget.col}` : '-';
    
    return `${boardStr}|${state.turn}|${castlingStr}|${epStr}`;
  }

  static isInsufficientMaterial(board: BoardState): boolean {
    const pieces: Piece[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) pieces.push(p);
      }
    }

    const kings = pieces.filter(p => p.type === 'king');
    if (kings.length !== 2) return false;

    if (pieces.length === 2) return true; // K vs K
    
    if (pieces.length === 3) {
      const nonKing = pieces.find(p => p.type !== 'king');
      if (nonKing && (nonKing.type === 'knight' || nonKing.type === 'bishop')) {
        return true; // K+N vs K or K+B vs K
      }
    }

    if (pieces.length === 4) {
      const bishops = pieces.filter(p => p.type === 'bishop');
      if (bishops.length === 2) {
        const b1Pos = bishops[0].position;
        const b2Pos = bishops[1].position;
        const b1Color = (b1Pos.row + b1Pos.col) % 2;
        const b2Color = (b2Pos.row + b2Pos.col) % 2;
        if (b1Color === b2Color) return true; // K+B vs K+B same colors
      }
    }

    return false;
  }

  static evaluateGameStatus(state: ChessGameState): { status: GameStatus, isCheck: boolean, winner?: PieceColor | null, drawReason?: DrawReason | null } {
    const isCheck = this.isKingInCheck(state.board, state.turn);
    const legalMoves = this.getLegalMoves(state);

    if (legalMoves.length === 0) {
      if (isCheck) {
        const winner = state.turn === 'white' ? 'black' : 'white';
        return { status: 'checkmate', isCheck: true, winner };
      } else {
        return { status: 'stalemate', isCheck: false, winner: null, drawReason: 'stalemate' };
      }
    }

    if (state.halfMoveClock >= 100) {
      return { status: 'draw', isCheck, winner: null, drawReason: 'fifty_move_rule' };
    }

    if (this.isInsufficientMaterial(state.board)) {
      return { status: 'draw', isCheck, winner: null, drawReason: 'insufficient_material' };
    }

    for (const count of Object.values(state.positionCounts || {})) {
      if (count >= 3) {
        return { status: 'draw', isCheck, winner: null, drawReason: 'threefold_repetition' };
      }
    }

    return { status: 'active', isCheck, winner: null };
  }

  static executeMove(state: ChessGameState, move: Move, evaluateStatus: boolean = true): ChessGameState {
    let newBoard = state.board.map(r => [...r]);
    const piece = newBoard[move.from.row][move.from.col];
    if (!piece) return state; // Should not happen

    let capturedPiece = newBoard[move.to.row][move.to.col];

    // Move main piece
    newBoard[move.from.row][move.from.col] = null;
    let movedPiece = { ...piece, hasMoved: true, position: move.to };

    // Handle Promotion
    if (move.type === 'promotion' && move.promotionTo) {
        movedPiece.type = move.promotionTo;
    }

    newBoard[move.to.row][move.to.col] = movedPiece;

    // Handle En Passant removal
    if (move.type === 'en_passant') {
        const capturedPawnRow = move.from.row;
        const capturedPawnCol = move.to.col;
        capturedPiece = newBoard[capturedPawnRow][capturedPawnCol];
        newBoard[capturedPawnRow][capturedPawnCol] = null;
    }

    // Handle Castling Rook move
    if (move.type === 'castling') {
        const isKingside = move.to.col === 6;
        const rookFromCol = isKingside ? 7 : 0;
        const rookToCol = isKingside ? 5 : 3;
        const rook = newBoard[move.from.row][rookFromCol];
        if (rook) {
            newBoard[move.from.row][rookFromCol] = null;
            newBoard[move.from.row][rookToCol] = { ...rook, hasMoved: true, position: { row: move.from.row, col: rookToCol } };
        }
    }

    // Update Castling Rights
    const newCastlingRights = { ...state.castlingRights };
    if (movedPiece.type === 'king') {
        if (movedPiece.color === 'white') {
            newCastlingRights.whiteKingSide = false;
            newCastlingRights.whiteQueenSide = false;
        } else {
            newCastlingRights.blackKingSide = false;
            newCastlingRights.blackQueenSide = false;
        }
    }
    if (movedPiece.type === 'rook') {
        if (move.from.row === 7 && move.from.col === 0) newCastlingRights.whiteQueenSide = false;
        if (move.from.row === 7 && move.from.col === 7) newCastlingRights.whiteKingSide = false;
        if (move.from.row === 0 && move.from.col === 0) newCastlingRights.blackQueenSide = false;
        if (move.from.row === 0 && move.from.col === 7) newCastlingRights.blackKingSide = false;
    }
    // If a rook is captured on its starting square, rights are lost
    if (move.to.row === 7 && move.to.col === 0) newCastlingRights.whiteQueenSide = false;
    if (move.to.row === 7 && move.to.col === 7) newCastlingRights.whiteKingSide = false;
    if (move.to.row === 0 && move.to.col === 0) newCastlingRights.blackQueenSide = false;
    if (move.to.row === 0 && move.to.col === 7) newCastlingRights.blackKingSide = false;

    // En Passant Target
    let newEnPassantTarget = null;
    if (movedPiece.type === 'pawn' && Math.abs(move.from.row - move.to.row) === 2) {
        const direction = movedPiece.color === 'white' ? -1 : 1;
        newEnPassantTarget = { row: move.from.row + direction, col: move.from.col };
    }

    let newHalfMoveClock = state.halfMoveClock + 1;
    if (movedPiece.type === 'pawn' || capturedPiece) {
        newHalfMoveClock = 0;
    }

    const moveRecord: MoveRecord = {
        ...move,
        piece,
        capturedPiece,
        previousCastlingRights: { ...state.castlingRights },
        previousEnPassantTarget: state.enPassantTarget,
        previousHalfMoveClock: state.halfMoveClock,
    };

    const newCapturedWhite = [...state.capturedWhitePieces];
    const newCapturedBlack = [...state.capturedBlackPieces];
    if (capturedPiece) {
        if (capturedPiece.color === 'white') newCapturedWhite.push(capturedPiece);
        else newCapturedBlack.push(capturedPiece);
    }

    const newState: ChessGameState = {
        ...state,
        board: newBoard,
        turn: state.turn === 'white' ? 'black' : 'white',
        moveHistory: [...state.moveHistory, moveRecord],
        capturedWhitePieces: newCapturedWhite,
        capturedBlackPieces: newCapturedBlack,
        fullMoveNumber: state.turn === 'black' ? state.fullMoveNumber + 1 : state.fullMoveNumber,
        castlingRights: newCastlingRights,
        enPassantTarget: newEnPassantTarget,
        halfMoveClock: newHalfMoveClock,
        positionCounts: { ...(state.positionCounts || {}) },
    };

    if (newHalfMoveClock === 0) {
        newState.positionCounts = {};
    }
    const newHash = this.generateStateHash(newState);
    newState.positionCounts[newHash] = (newState.positionCounts[newHash] || 0) + 1;

    if (evaluateStatus) {
        const statusEval = this.evaluateGameStatus(newState);
        newState.status = statusEval.status;
        newState.isCheck = statusEval.isCheck;
        newState.winner = statusEval.winner;
        newState.drawReason = statusEval.drawReason;
    } else {
        newState.isCheck = false; // dummy for simulation
    }

    return newState;
  }
  
  static getLegalMoves(state: ChessGameState): Move[] {
    const legalMoves: Move[] = [];
    const activeColor = state.turn;
    const isCurrentlyInCheck = this.isKingInCheck(state.board, activeColor);
    const opponentColor = activeColor === 'white' ? 'black' : 'white';

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const pos = { row, col };
        const piece = state.board[row][col];
        
        if (piece && piece.color === activeColor) {
          const pseudoMoves = getPseudoLegalMoves(state, pos);
          
          for (const move of pseudoMoves) {
            // Specific castling checks
            if (move.type === 'castling') {
              if (isCurrentlyInCheck) continue; // Cannot castle out of check

              const direction = move.to.col > move.from.col ? 1 : -1;
              const passThroughSquare = { row: move.from.row, col: move.from.col + direction };
              
              if (isSquareAttacked(state.board, passThroughSquare, opponentColor)) {
                continue; // Cannot castle through check
              }
            }

            // Simulate the move
            const simulatedState = this.executeMove(state, move, false);
            
            // Check if the own king is in check after the move
            if (!this.isKingInCheck(simulatedState.board, activeColor)) {
              legalMoves.push(move);
            }
          }
        }
      }
    }

    return legalMoves;
  }
}
