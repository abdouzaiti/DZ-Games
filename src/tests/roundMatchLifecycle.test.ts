/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import { createTile } from '../domain/tile';
import { createPlayer } from '../domain/player';
import { getDefaultConfig } from '../domain/gameConfig';
import { ScoreManager } from '../engine/score/scoreManager';
import { GameEngine } from '../engine/game/gameEngine';

export function runRoundMatchLifecycleTests(): void {
  console.log('🧪 Running Phase 6: Round, Match, and Score Lifecycle Unit Tests...\n');

  // 1. Normal Win (Sortie) in 2v2
  const pA = createPlayer('pA', 'Player A', false, 0); // Team 0 (Winner with empty hand)
  const pB = { ...createPlayer('pB', 'Player B', false, 1), hand: [createTile(6, 6), createTile(3, 4)] }; // Team 1 (19 pips)
  const pC = { ...createPlayer('pC', 'Player C', false, 0), hand: [createTile(2, 2)] }; // Team 0 (partner has 4 pips)
  const pD = { ...createPlayer('pD', 'Player D', false, 1), hand: [createTile(5, 5), createTile(1, 0)] }; // Team 1 (11 pips)

  const config2v2 = getDefaultConfig('2v2');
  const sortieResult = ScoreManager.calculateSortieResult(1, pA, [pA, pB, pC, pD], config2v2);

  assert.strictEqual(sortieResult.reason, 'SORTIE');
  assert.strictEqual(sortieResult.winnerPlayerId, 'pA');
  assert.strictEqual(sortieResult.winnerTeamId, 0, 'Team 0 wins immediately when Player A empties hand');
  assert.strictEqual(
    sortieResult.pointsAwarded,
    30,
    'Team 0 receives total losing Team 1 pips (19 + 11 = 30 pts)'
  );
  console.log('✅ 1. Normal win (Sortie) & 2v2 losing side scoring verified.');

  // 2. Block Win (Ghallaq) - Lowest individual hand wins & awards losing team pips
  // Example scenario:
  // Player A (Team 0) = 4 pips  (Lowest individual hand!)
  // Player C (Team 0) = 20 pips
  // Player B (Team 1) = 8 pips
  // Player D (Team 1) = 12 pips
  const pA_block = { ...createPlayer('pA', 'Player A', false, 0), hand: [createTile(4, 0)] }; // 4 pips
  const pB_block = { ...createPlayer('pB', 'Player B', false, 1), hand: [createTile(4, 4)] }; // 8 pips
  const pC_block = { ...createPlayer('pC', 'Player C', false, 0), hand: [createTile(5, 5), createTile(5, 5)] }; // 20 pips
  const pD_block = { ...createPlayer('pD', 'Player D', false, 1), hand: [createTile(6, 6)] }; // 12 pips

  const blockResult = ScoreManager.calculateGhallaqResult(1, [pA_block, pB_block, pC_block, pD_block], config2v2);
  assert.strictEqual(blockResult.reason, 'GHALLAQ');
  assert.strictEqual(blockResult.winnerPlayerId, 'pA', 'Player A with lowest hand (4) wins block');
  assert.strictEqual(blockResult.winnerTeamId, 0, 'Team 0 wins round');
  assert.strictEqual(blockResult.pointsAwarded, 20, 'Team 0 receives losing Team 1 pips (8 + 12 = 20 pts)');
  console.log('✅ 2. Block win (Ghallaq) lowest hand & losing team scoring verified.');

  // 3. Block Tie (Egalite) - Lowest hand tied between opposing sides -> Burned Round
  const pA_tie = { ...createPlayer('pA', 'Player A', false, 0), hand: [createTile(3, 1)] }; // 4 pips
  const pB_tie = { ...createPlayer('pB', 'Player B', false, 1), hand: [createTile(2, 2)] }; // 4 pips (Opposing team tied!)
  const blockTieResult = ScoreManager.calculateGhallaqResult(1, [pA_tie, pB_tie], getDefaultConfig('1v1'));

  assert.strictEqual(blockTieResult.reason, 'EGALITE', 'Tied lowest hand results in EGALITE');
  assert.strictEqual(blockTieResult.winnerPlayerId, null);
  assert.strictEqual(blockTieResult.pointsAwarded, 0, 'Burned round awards 0 points');
  console.log('✅ 3. Block tie (Egalite) burned round verified.');

  // 4. Target score match completion (50, 100, 150, 200)
  [50, 100, 150, 200].forEach((targetScore) => {
    const customConfig = { ...getDefaultConfig('2v2'), targetScore };
    let matchScores = ScoreManager.createInitialScores([pA, pB, pC, pD], true);

    // Apply a round winning 60 points
    const winningRound = {
      roundNumber: 1,
      winnerPlayerId: 'pA',
      winnerTeamId: 0,
      reason: 'SORTIE' as const,
      pointsAwarded: targetScore + 5,
      losingPips: targetScore + 5,
      playerHandPipsAtEnd: { pA: 0, pB: targetScore + 5 },
    };

    matchScores = ScoreManager.applyRoundResultToMatch(matchScores, winningRound, customConfig);
    assert.strictEqual(
      matchScores.matchWinnerTeamId,
      0,
      `Match ends immediately when Team 0 hits target score ${targetScore}`
    );
  });
  console.log('✅ 4. Target score match completion (50, 100, 150, 200) verified.');

  // 5. Next round starter rules (Winner starts with any tile vs Burned round requires [6|6])
  const engine = new GameEngine(getDefaultConfig('1v1'));
  engine.dispatch({ type: 'START_NEW_ROUND' });
  let snap = engine.getSnapshot();

  assert.ok(snap.requiredOpeningTileId !== null, 'First round requires double-six opening tile');

  // Simulate a burned round result manually via state to test burned round starter
  const burnedRoundResult = {
    roundNumber: 1,
    winnerPlayerId: null,
    winnerTeamId: null,
    reason: 'EGALITE' as const,
    pointsAwarded: 0,
    losingPips: 10,
    playerHandPipsAtEnd: { p1: 5, p2: 5 },
  };

  engine['snapshot'] = {
    ...snap,
    latestResult: burnedRoundResult,
  };

  engine.dispatch({ type: 'START_NEW_ROUND' });
  snap = engine.getSnapshot();
  assert.ok(snap.requiredOpeningTileId !== null, 'Round after burned round MUST start with [6|6]');

  // Simulate a won round result manually via state to test winner starter
  const wonRoundResult = {
    roundNumber: 2,
    winnerPlayerId: snap.players[1].id,
    winnerTeamId: null,
    reason: 'SORTIE' as const,
    pointsAwarded: 25,
    losingPips: 25,
    playerHandPipsAtEnd: {},
  };

  engine['snapshot'] = {
    ...snap,
    latestResult: wonRoundResult,
  };

  engine.dispatch({ type: 'START_NEW_ROUND' });
  snap = engine.getSnapshot();
  assert.strictEqual(
    snap.currentPlayerIndex,
    1,
    'Winner of previous round opens next round'
  );
  assert.strictEqual(
    snap.requiredOpeningTileId,
    null,
    'Winner of previous round may start with ANY tile (no required opening tile)'
  );
  console.log('✅ 5. Next round starter rules (winner starter vs burned-round [6|6] starter) verified.');

  // 6. Clean result objects/events and 2v2 score ownership
  let scores2v2 = ScoreManager.createInitialScores([pA, pB, pC, pD], true);
  assert.strictEqual(scores2v2.teamScores[0], 0);
  assert.strictEqual(scores2v2.teamScores[1], 0);

  scores2v2 = ScoreManager.applyRoundResultToMatch(scores2v2, sortieResult, config2v2);
  assert.strictEqual(scores2v2.teamScores[0], 30, 'Team 0 receives 30 points');
  assert.strictEqual(scores2v2.teamScores[1], 0, 'Team 1 score remains 0');

  console.log('✅ 6. Clean result events & 2v2 score ownership verified.');

  console.log('\n🎉 ALL PHASE 6 ROUND, MATCH & SCORE LIFECYCLE TESTS PASSED SUCCESSFULLY!\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRoundMatchLifecycleTests();
}
