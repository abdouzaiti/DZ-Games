import { LudoColor } from './color';

export type PositionType = 'base' | 'track' | 'home_path' | 'home';

export interface LudoPosition {
  type: PositionType;
  playerColor?: LudoColor; // Relevant for base, home_path, home
  index?: number;          // index for base (0-3), track (0-51), home_path (0-4)
}
