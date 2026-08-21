import { LudoColor } from '../models/color';
import { LudoPosition } from '../models/position';

export interface GridCoordinate {
  row: number; // 0 to 14
  col: number; // 0 to 14
}

/**
 * Static mapping table defining the circular loop track coordinates
 * in a standard 15x15 Ludo board grid.
 */
export const LUDO_GRID_TRACK: GridCoordinate[] = [
  // Left arm going right (Row 6, cols 1 to 5)
  { row: 6, col: 1 },  // 0: Red Start
  { row: 6, col: 2 },  // 1
  { row: 6, col: 3 },  // 2
  { row: 6, col: 4 },  // 3
  { row: 6, col: 5 },  // 4
  
  // Top arm going up (rows 5 down to 0, col 6)
  { row: 5, col: 6 },  // 5
  { row: 4, col: 6 },  // 6
  { row: 3, col: 6 },  // 7
  { row: 2, col: 6 },  // 8
  { row: 1, col: 6 },  // 9
  { row: 0, col: 6 },  // 10
  
  // Top loop cross
  { row: 0, col: 7 },  // 11
  
  // Top arm going down (rows 0 up to 5, col 8)
  { row: 0, col: 8 },  // 12
  { row: 1, col: 8 },  // 13: Green Start
  { row: 2, col: 8 },  // 14
  { row: 3, col: 8 },  // 15
  { row: 4, col: 8 },  // 16
  { row: 5, col: 8 },  // 17
  
  // Right arm going right (row 6, cols 9 to 14)
  { row: 6, col: 9 },  // 18
  { row: 6, col: 10 }, // 19
  { row: 6, col: 11 }, // 20
  { row: 6, col: 12 }, // 21
  { row: 6, col: 13 }, // 22
  { row: 6, col: 14 }, // 23
  
  // Right loop cross
  { row: 7, col: 14 }, // 24
  
  // Right arm going left (row 8, cols 14 down to 9)
  { row: 8, col: 14 }, // 25
  { row: 8, col: 13 }, // 26: Yellow Start
  { row: 8, col: 12 }, // 27
  { row: 8, col: 11 }, // 28
  { row: 8, col: 10 }, // 29
  { row: 8, col: 9 },  // 30
  
  // Bottom arm going down (rows 9 to 14, col 8)
  { row: 9, col: 8 },  // 31
  { row: 10, col: 8 }, // 32
  { row: 11, col: 8 }, // 33
  { row: 12, col: 8 }, // 34
  { row: 13, col: 8 }, // 35
  { row: 14, col: 8 }, // 36
  
  // Bottom loop cross
  { row: 14, col: 7 }, // 37
  
  // Bottom arm going up (rows 14 down to 9, col 6)
  { row: 14, col: 6 }, // 38
  { row: 13, col: 6 }, // 39: Blue Start
  { row: 12, col: 6 }, // 40
  { row: 11, col: 6 }, // 41
  { row: 10, col: 6 }, // 42
  { row: 9, col: 6 },  // 43
  
  // Left arm going left (row 8, cols 5 down to 0)
  { row: 8, col: 5 },  // 44
  { row: 8, col: 4 },  // 45
  { row: 8, col: 3 },  // 46
  { row: 8, col: 2 },  // 47
  { row: 8, col: 1 },  // 48
  { row: 8, col: 0 },  // 49
  
  // Left loop cross
  { row: 7, col: 0 },  // 50
  
  // Left arm start square (Row 6, col 0)
  { row: 6, col: 0 },  // 51
];

export class LudoPositionMapper {
  /**
   * Translates any LogicalPosition to 15x15 cell coordinates.
   * This decoupled presentation mapping enables rendering the board
   * cleanly across phone/tablet and portrait/landscape devices.
   */
  static toGrid(pos: LudoPosition): GridCoordinate {
    switch (pos.type) {
      case 'base': {
        const color = pos.playerColor || 'red';
        const index = pos.index ?? 0;
        // Map pieces to 4 quadrants in their respective base yards
        switch (color) {
          case 'red':
            return [
              { row: 2, col: 2 },
              { row: 2, col: 3 },
              { row: 3, col: 2 },
              { row: 3, col: 3 },
            ][index] || { row: 2, col: 2 };
          case 'green':
            return [
              { row: 2, col: 11 },
              { row: 2, col: 12 },
              { row: 3, col: 11 },
              { row: 3, col: 12 },
            ][index] || { row: 2, col: 11 };
          case 'yellow':
            return [
              { row: 11, col: 11 },
              { row: 11, col: 12 },
              { row: 12, col: 11 },
              { row: 12, col: 12 },
            ][index] || { row: 11, col: 11 };
          case 'blue':
            return [
              { row: 11, col: 2 },
              { row: 11, col: 3 },
              { row: 12, col: 2 },
              { row: 12, col: 3 },
            ][index] || { row: 11, col: 2 };
        }
      }

      case 'track': {
        const index = pos.index ?? 0;
        return LUDO_GRID_TRACK[index % 52] || { row: 6, col: 1 };
      }

      case 'home_path': {
        const color = pos.playerColor || 'red';
        const index = pos.index ?? 0;
        switch (color) {
          case 'red':
            return { row: 7, col: 1 + index };
          case 'green':
            return { row: 1 + index, col: 7 };
          case 'yellow':
            return { row: 7, col: 13 - index };
          case 'blue':
            return { row: 13 - index, col: 7 };
        }
      }

      case 'home': {
        const color = pos.playerColor || 'red';
        switch (color) {
          case 'red':
            return { row: 7, col: 6 };
          case 'green':
            return { row: 6, col: 7 };
          case 'yellow':
            return { row: 7, col: 8 };
          case 'blue':
            return { row: 8, col: 7 };
        }
      }
    }
  }
}
