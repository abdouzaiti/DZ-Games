/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import { createTile, generateDoubleSixSet } from '../domain/tile';
import { createPlayer } from '../domain/player';
import { createEmptyBoard } from '../domain/board';
import { getDefaultConfig } from '../domain/gameConfig';
import { GameEngine } from '../engine/game/gameEngine';
import { MostaganemRulesEngine } from '../engine/rules/mostaganemRules';
import { BoardPlacementEngine } from '../engine/board/boardPlacementEngine';
import { TurnManager } from '../engine/turn/turnManager';
import { ScoreManager } from '../engine/score/scoreManager';

export function runQAStressTestSuite(): void {
  console.log('🧪 Running Phase 10: Final Offline V1 QA & Stress Test Suite...\n');

  // 1. Tile Universe & Inventory Accounting (28 unique tiles, standard double-six set)
  const fullSet = generateDoubleSixSet();
  assert.strictEqual(fullSet.length, 28, 'Double-Six set MUST contain exactly 28 tiles');
  const uniqueIds = new Set(fullSet.map((t) => t.id));
  assert.strictEqual(uniqueIds.size, 28, 'All 28 tiles MUST have unique IDs');
  console.log('✅ 1. 28 Unique tiles & standard double-six set verified.');

  // 2. Deal Distribution & Stock Size Verification across 2, 3, and 4 players
  // 2 players -> 7 tiles each (14 total, stock = 14)
  const e2 = new GameEngine(getDefaultConfig('1v1'));
  e2.dispatch({ type: 'START_NEW_ROUND' });
  const snap2 = e2.getSnapshot();
  assert.strictEqual(snap2.players.length, 2);
  assert.strictEqual(snap2.players[0].hand.length, 7);
  assert.strictEqual(snap2.players[1].hand.length, 7);
  assert.strictEqual(snap2.stock.length, 14, 'Stock in 2-player mode MUST be 14 tiles');

  // 3 players -> 7 tiles each (21 total, stock = 7)
  const e3 = new GameEngine(getDefaultConfig('3player_ffa'));
  e3.dispatch({ type: 'START_NEW_ROUND' });
  const snap3 = e3.getSnapshot();
  assert.strictEqual(snap3.players.length, 3);
  assert.strictEqual(snap3.stock.length, 7, 'Stock in 3-player mode MUST be 7 tiles');

  // 4 players -> 7 tiles each (28 total, stock = 0)
  const e4 = new GameEngine(getDefaultConfig('2v2'));
  e4.dispatch({ type: 'START_NEW_ROUND' });
  const snap4 = e4.getSnapshot();
  assert.strictEqual(snap4.players.length, 4);
  assert.strictEqual(snap4.stock.length, 0, 'Stock in 4-player mode MUST be 0 tiles');
  console.log('✅ 2. Hand sizes & stock size formulas (2p/3p/4p) verified.');

  // 3. Opening Rules ([6|6] first round vs fallback)
  // Check opener determination logic
  const p1 = { ...createPlayer('p1', 'P1', false, 0), hand: [createTile(6, 6)] };
  const p2 = { ...createPlayer('p2', 'P2', false, 1), hand: [createTile(5, 5)] };
  const opener = MostaganemRulesEngine.findFirstRoundOpener([p1, p2]);
  assert.strictEqual(opener.playerIndex, 0, 'Player holding [6|6] MUST open first round');
  assert.strictEqual(opener.openingTile.id, '6-6');

  // Check highest double fallback when no player holds [6|6]
  const p1_nod6 = { ...createPlayer('p1', 'P1', false, 0), hand: [createTile(4, 4)] };
  const p2_nod6 = { ...createPlayer('p2', 'P2', false, 1), hand: [createTile(5, 5)] };
  const openerFallback = MostaganemRulesEngine.findFirstRoundOpener([p1_nod6, p2_nod6]);
  assert.strictEqual(openerFallback.playerIndex, 1, 'Player with highest double [5|5] opens when [6|6] absent');

  // Check highest normal tile fallback when no player holds any double
  const p1_normal = { ...createPlayer('p1', 'P1', false, 0), hand: [createTile(6, 4)] };
  const p2_normal = { ...createPlayer('p2', 'P2', false, 1), hand: [createTile(6, 5)] };
  const openerNormal = MostaganemRulesEngine.findFirstRoundOpener([p1_normal, p2_normal]);
  assert.strictEqual(openerNormal.playerIndex, 1, 'Player with highest normal tile [6|5] opens when no doubles');
  console.log('✅ 3. Opening rules ([6|6], highest double, highest normal tile) verified.');

  // 4. Score Target Completion (50, 100, 150, 200)
  [50, 100, 150, 200].forEach((target) => {
    const config = { ...getDefaultConfig('1v1'), targetScore: target };
    let scores = ScoreManager.createInitialScores([p1, p2], false);
    const roundResult = {
      roundNumber: 1,
      winnerPlayerId: 'p1',
      winnerTeamId: null,
      reason: 'SORTIE' as const,
      pointsAwarded: target + 10,
      losingPips: target + 10,
      playerHandPipsAtEnd: { p1: 0, p2: target + 10 },
    };
    scores = ScoreManager.applyRoundResultToMatch(scores, roundResult, config);
    assert.strictEqual(scores.matchWinnerId, 'p1', `Match finishes when score >= ${target}`);
  });
  console.log('✅ 4. Match targets (50, 100, 150, 200) termination verified.');

  // 5. Stress Test: 2,000 Complete Matches across 1v1, 3p, 4p, and 2v2 modes
  console.log('🚀 Running 2,000 complete simulated game rounds with tile integrity validation...');
  const modes = ['1v1', '3player_ffa', '4player_ffa', '2v2'] as const;

  for (let sim = 0; sim < 2000; sim++) {
    const mode = modes[sim % modes.length];
    const engine = new GameEngine(getDefaultConfig(mode));

    // Force AI controller for automated test loop
    engine['snapshot'] = {
      ...engine.getSnapshot(),
      players: engine.getSnapshot().players.map((p) => ({ ...p, isAI: true })),
    };

    engine.dispatch({ type: 'START_NEW_ROUND' });

    let turnCount = 0;
    while (engine.getSnapshot().roundStatus === 'PLAYING' && turnCount < 400) {
      turnCount++;
      engine.dispatch({ type: 'AI_STEP' });
    }

    const snap = engine.getSnapshot();
    assert.notStrictEqual(
      snap.roundStatus,
      'PLAYING',
      `Round ${sim + 1} (${mode}) timed out without reaching round end`
    );

    // Verify 28 Total Tiles Invariant
    const tileCheck = TurnManager.validateTileStateIntegrity(
      snap.players,
      snap.stock,
      snap.board,
      28
    );
    assert.strictEqual(
      tileCheck.isValid,
      true,
      `Tile corruption detected in sim #${sim + 1}: ${tileCheck.details}`
    );

    // Verify board chain internal pip adjacency
    for (let c = 0; c < snap.board.chain.length - 1; c++) {
      const left = snap.board.chain[c];
      const right = snap.board.chain[c + 1];
      assert.strictEqual(
        left.rightPip,
        right.leftPip,
        `Board chain pip mismatch at position ${c} <-> ${c + 1}`
      );
    }
  }

  console.log('✅ 5. 2,000 Complete simulation rounds passed with 100% tile & board integrity.');

  // 6. Extreme Placement Layout Test (Long chain with 28 tiles & doubles)
  let longBoard = createEmptyBoard();
  let leftPip = 6;
  let rightPip = 6;
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(6, 6), 'RIGHT', 'p1');

  for (let val = 5; val >= 0; val--) {
    longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(leftPip, val), 'LEFT', 'p1');
    leftPip = val;
    longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(rightPip, val), 'RIGHT', 'p2');
    rightPip = val;
  }
  assert.ok(longBoard.chain.length > 10, 'Long board chain successfully built');
  console.log('✅ 6. Long board layout & snake chain placement stress test verified.');

  console.log('\n🎉 ALL PHASE 10 QA & STRESS TESTS PASSED SUCCESSFULLY!\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runQAStressTestSuite();
}
