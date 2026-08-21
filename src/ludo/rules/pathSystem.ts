import { LudoColor } from '../models/color';
import { LudoPosition, PositionType } from '../models/position';

export class LudoPathSystem {
  /**
   * Return the starting track index (0-51) for each player.
   */
  static getStartingIndex(color: LudoColor): number {
    switch (color) {
      case 'red': return 0;
      case 'green': return 13;
      case 'yellow': return 26;
      case 'blue': return 39;
    }
  }

  /**
   * Return the track index immediately preceding entering the player's home path.
   * e.g., Red starts at 0, so its path loops around and ends at index 50.
   */
  static getEndIndexBeforeHomePath(color: LudoColor): number {
    const start = this.getStartingIndex(color);
    return (start + 52 - 2) % 52;
  }

  /**
   * Validate if a given position contains structurally valid coordinates.
   */
  static isValidPosition(pos: LudoPosition): boolean {
    if (!pos || !pos.type) return false;

    switch (pos.type) {
      case 'base':
        if (!pos.playerColor) return false;
        if (pos.index === undefined || pos.index < 0 || pos.index > 3) return false;
        return true;

      case 'track':
        if (pos.index === undefined || pos.index < 0 || pos.index > 51) return false;
        return true;

      case 'home_path':
        if (!pos.playerColor) return false;
        if (pos.index === undefined || pos.index < 0 || pos.index > 4) return false;
        return true;

      case 'home':
        if (!pos.playerColor) return false;
        return true;

      default:
        return false;
    }
  }

  /**
   * Calculates the exact distance in steps between two logical board coordinates.
   * Returns -1 if the positions are not sequentially reachable.
   */
  static calculateDistance(from: LudoPosition, to: LudoPosition, color: LudoColor): number {
    if (!this.isValidPosition(from) || !this.isValidPosition(to)) {
      return -1;
    }

    // Step representation:
    // Base: 0
    // Track: 1 to 51
    // Home Path: 52 to 56
    // Home: 57
    const fromSteps = this.getStepsFromPosition(from, color);
    const toSteps = this.getStepsFromPosition(to, color);

    if (fromSteps === -1 || toSteps === -1) {
      return -1;
    }

    return toSteps - fromSteps;
  }

  /**
   * Helper to determine steps moved (0-57) from a given LudoPosition for a player.
   */
  static getStepsFromPosition(pos: LudoPosition, color: LudoColor): number {
    switch (pos.type) {
      case 'base':
        if (pos.playerColor !== color) return -1;
        return 0;

      case 'track': {
        const startIdx = this.getStartingIndex(color);
        const distance = (pos.index! - startIdx + 52) % 52;
        // Steps range on track from starting index (1) to ending index (51)
        return distance + 1;
      }

      case 'home_path':
        if (pos.playerColor !== color) return -1;
        return 52 + pos.index!;

      case 'home':
        if (pos.playerColor !== color) return -1;
        return 57;

      default:
        return -1;
    }
  }
}
