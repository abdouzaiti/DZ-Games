import { LudoColor } from './color';
import { LudoPosition } from './position';

export interface LudoBoard {
  trackLength: number; // typically 52
  safeSquares: number[]; // indices on track that are safe (star squares)
  startOffsets: Record<LudoColor, number>; // track starting index for each color
  homePathLength: number; // typically 5 (steps 52-56)
}

export const DEFAULT_LUDO_BOARD: LudoBoard = {
  trackLength: 52,
  safeSquares: [0, 8, 13, 21, 26, 34, 39, 47],
  startOffsets: {
    red: 0,
    green: 13,
    yellow: 26,
    blue: 39,
  },
  homePathLength: 5,
};

export class LudoBoardHelper {
  /**
   * Check if a specific track index is a safe zone (star square).
   */
  static isSafeSquare(board: LudoBoard, trackIndex: number): boolean {
    return board.safeSquares.includes(trackIndex);
  }

  /**
   * Get the track start index for a color on the board.
   */
  static getStartIndexForColor(board: LudoBoard, color: LudoColor): number {
    return board.startOffsets[color];
  }

  /**
   * Get the track end index for a color before entering the home path.
   * e.g., Red starts at 0, its last track index is 50.
   * Let's calculate: (startIndex + trackLength - 2) % trackLength
   */
  static getEndIndexForColor(board: LudoBoard, color: LudoColor): number {
    const startIdx = board.startOffsets[color];
    return (startIdx + board.trackLength - 2) % board.trackLength;
  }
}
