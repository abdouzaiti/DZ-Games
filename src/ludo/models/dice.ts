export type LudoDiceRollState = 'idle' | 'rolling' | 'rolled';

export interface LudoDice {
  value: number | null; // 1 to 6, or null if not yet rolled
  state: LudoDiceRollState;
}
