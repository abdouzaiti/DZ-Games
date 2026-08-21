export interface LudoRulePolicies {
  extraTurnOnSix: boolean;          // Does rolling a 6 grant an extra turn?
  maxConsecutiveSixes: number;       // Consecutive 6s penalty limit (e.g., 3). Use 0 for no limit.
  rollToLeaveHome: number;          // Die value required to exit base (typically 6, sometimes 5 or 1).
  captureGrantsBonus: boolean;      // Does capturing opponent piece grant an extra turn?
  reachedHomeGrantsBonus: boolean;  // Does reaching home grant an extra turn?
  
  // Phase 5 Special Rules (Configurable & Represented Independently)
  safeSquaresEnabled: boolean;      // Do standard board safe squares prevent captures?
  doublePieceSafety: boolean;       // Do 2+ pieces of the same color on any tile prevent capture?
  blockingEnabled: boolean;         // Do 2+ pieces of same color on a tile form a blockade?
  blocksPreventPassing: boolean;    // Does a blockade block other players from passing over it?
  blocksPreventLanding: boolean;    // Does a blockade block other players from landing exactly on it?
}

export const DEFAULT_LUDO_POLICIES: LudoRulePolicies = {
  extraTurnOnSix: true,
  maxConsecutiveSixes: 3,
  rollToLeaveHome: 6,
  captureGrantsBonus: true,
  reachedHomeGrantsBonus: true,
  
  // Phase 5 defaults
  safeSquaresEnabled: true,
  doublePieceSafety: true,         // Standard Ludo rule: two pieces on same tile are safe
  blockingEnabled: false,          // Blockades configurable
  blocksPreventPassing: true,      // If blocking enabled, blocks passing
  blocksPreventLanding: true,      // If blocking enabled, blocks landing
};
