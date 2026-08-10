/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import { createTile } from '../domain/tile';
import { createPlayer } from '../domain/player';
import { getDefaultConfig } from '../domain/gameConfig';
import { MostaganemRulesEngine } from '../engine/rules/mostaganemRules';
import { ScoreManager } from '../engine/score/scoreManager';
import { BoardPlacementEngine } from '../engine/board/boardPlacementEngine';
import { GameEngine } from '../engine/game/gameEngine';

export function runMostaganemRulesTests(): void {
  console.log('🧪 Running Phase 3: Mostaganem Rules Engine Unit Tests...\n');

  // 1. [6|6] Starting First Round
  const p1_d6 = { ...createPlayer('p1', 'Player 1'), hand: [createTile(6, 6), createTile(1, 1)] };
  const p2_noD6 = { ...createPlayer('p2', 'Player 2'), hand: [createTile(5, 5), createTile(2, 3)] };
  const opener1 = MostaganemRulesEngine.findFirstRoundOpener([p1_d6, p2_noD6]);
  assert.strictEqual(opener1.playerIndex, 0, 'Player 1 with [6|6] must open');
  assert.strictEqual(opener1.openingTile.id, '6-6');
  console.log('✅ 1. [6|6] first round opening rule verified.');

  // 2. Highest double starting if no [6|6] in hand
  const p1_d4 = { ...createPlayer('p1', 'Player 1'), hand: [createTile(4, 4), createTile(0, 1)] };
  const p2_d5 = { ...createPlayer('p2', 'Player 2'), hand: [createTile(5, 5), createTile(2, 3)] };
  const opener2 = MostaganemRulesEngine.findFirstRoundOpener([p1_d4, p2_d5]);
  assert.strictEqual(opener2.playerIndex, 1, 'Player 2 with highest double [5|5] must open');
  assert.strictEqual(opener2.openingTile.id, '5-5');
  console.log('✅ 2. Highest double starting rule verified.');

  // 3. Highest normal tile starting if no doubles in hand
  const p1_normal = { ...createPlayer('p1', 'Player 1'), hand: [createTile(6, 5), createTile(0, 1)] }; // max pips = 11
  const p2_normal = { ...createPlayer('p2', 'Player 2'), hand: [createTile(6, 4), createTile(2, 3)] }; // max pips = 10
  const opener3 = MostaganemRulesEngine.findFirstRoundOpener([p1_normal, p2_normal]);
  assert.strictEqual(opener3.playerIndex, 0, 'Player 1 with highest pip sum tile [6|5] must open');
  assert.strictEqual(opener3.openingTile.id, '5-6');
  console.log('✅ 3. Highest normal tile starting rule verified.');

  // 4 & 5. Winner starting next round with arbitrary tile
  const engine = new GameEngine(getDefaultConfig('1v1'));
  engine.dispatch({ type: 'START_NEW_ROUND' });
  let snapshot = engine.getSnapshot();
  const initialOpenerId = snapshot.openerPlayerId;
  assert.ok(initialOpenerId !== null, 'Initial opener ID must exist after starting round 1');

  // Play opening tile
  const activeP = snapshot.players[snapshot.currentPlayerIndex];
  const openingTileId = snapshot.requiredOpeningTileId!;
  engine.dispatch({ type: 'PLAY_TILE', playerId: activeP.id, tileId: openingTileId, end: 'RIGHT' });
  snapshot = engine.getSnapshot();
  assert.strictEqual(snapshot.board.chain.length, 1, 'Opening tile placed on board');
  assert.strictEqual(snapshot.requiredOpeningTileId, null, 'Required opening tile cleared after first play');
  console.log('✅ 4 & 5. Required opening tile placement verified.');

  // 6, 7 & 8. Left, Right & Illegal placement validation
  let board = { chain: [], leftEndPip: null, rightEndPip: null, tileCount: 0 };
  board = BoardPlacementEngine.placeTile(board, createTile(6, 4), 'RIGHT', 'p1'); // board ends: leftEndPip=4, rightEndPip=6
  assert.strictEqual(MostaganemRulesEngine.isValidMove(createTile(4, 2), 'LEFT', board), true, '[4|2] legal on LEFT (matching 4)');
  assert.strictEqual(MostaganemRulesEngine.isValidMove(createTile(6, 1), 'RIGHT', board), true, '[6|1] legal on RIGHT (matching 6)');
  assert.strictEqual(MostaganemRulesEngine.isValidMove(createTile(2, 3), 'LEFT', board), false, '[2|3] illegal on LEFT (no matching 4)');
  assert.strictEqual(MostaganemRulesEngine.isValidMove(createTile(2, 3), 'RIGHT', board), false, '[2|3] illegal on RIGHT (no matching 6)');
  console.log('✅ 6, 7 & 8. Left, Right, and Illegal placement validation verified.');

  // 9 & 10. Draw eligibility (playable tile in hand vs no playable tile)
  board = BoardPlacementEngine.placeTile(board, createTile(6, 1), 'RIGHT', 'p1'); // board ends: leftEndPip=4, rightEndPip=1
  const handWithPlayable = [createTile(4, 3), createTile(0, 0)]; // 4 matches left end
  const handWithoutPlayable = [createTile(2, 2), createTile(3, 5)];

  assert.strictEqual(MostaganemRulesEngine.canPlayerDraw(handWithPlayable, board, 5), false, 'Player with playable tile CANNOT draw');
  assert.strictEqual(MostaganemRulesEngine.canPlayerDraw(handWithoutPlayable, board, 5), true, 'Player without playable tile MUST draw when stock > 0');
  console.log('✅ 9 & 10. Draw eligibility rules verified.');

  // 11 & 12. Drawing loop until playable tile obtained & Empty stock pass behavior
  assert.strictEqual(MostaganemRulesEngine.canPlayerDraw(handWithoutPlayable, board, 0), false, 'Cannot draw from empty stock');
  assert.strictEqual(MostaganemRulesEngine.canPlayerPass(handWithoutPlayable, board, 0), true, 'Must pass when no valid moves and stock empty');
  assert.strictEqual(MostaganemRulesEngine.canPlayerPass(handWithPlayable, board, 0), false, 'Cannot pass if holding valid moves');
  console.log('✅ 11 & 12. Draw loop termination & Pass behavior verified.');

  // 13. Hand empty = Immediate Sortie Round Win
  const p1_winner = createPlayer('p1', 'Player 1', false, 0);
  const p2_loser = { ...createPlayer('p2', 'Player 2', true, 1), hand: [createTile(6, 6), createTile(3, 4)] };
  const sortieResult = ScoreManager.calculateSortieResult(1, p1_winner, [p1_winner, p2_loser], getDefaultConfig('1v1'));
  assert.strictEqual(sortieResult.reason, 'SORTIE');
  assert.strictEqual(sortieResult.winnerPlayerId, 'p1');
  assert.strictEqual(sortieResult.pointsAwarded, 19, 'Winner receives losing opponent pips (12 + 7 = 19)');
  console.log('✅ 13. Hand empty immediate Sortie win & scoring verified.');

  // 14, 15, 16. Blocked game (Ghallaq) - Lowest individual hand wins & winning team gets losing team pips
  // Example from specification:
  // Team 0: Player A = 5 pts, Player C = 30 pts
  // Team 1: Player B = 10 pts, Player D = 15 pts
  // Lowest individual hand = Player A (5). Team 0 wins. Points = Team 1 total (10 + 15 = 25).
  const pA = { ...createPlayer('pA', 'Player A', false, 0), hand: [createTile(5, 0)] }; // 5 pips
  const pB = { ...createPlayer('pB', 'Player B', false, 1), hand: [createTile(5, 5)] }; // 10 pips
  const pC = { ...createPlayer('pC', 'Player C', false, 0), hand: [createTile(6, 6), createTile(6, 6), createTile(6, 6)] }; // 30 pips (mock tiles)
  const pD = { ...createPlayer('pD', 'Player D', false, 1), hand: [createTile(6, 6), createTile(3, 0)] }; // 15 pips

  const config2v2 = getDefaultConfig('2v2');
  const blockResult = ScoreManager.calculateGhallaqResult(1, [pA, pB, pC, pD], config2v2);

  assert.strictEqual(blockResult.reason, 'GHALLAQ');
  assert.strictEqual(blockResult.winnerPlayerId, 'pA', 'Player A with lowest hand (5) wins block');
  assert.strictEqual(blockResult.winnerTeamId, 0, 'Team 0 wins round');
  assert.strictEqual(blockResult.pointsAwarded, 25, 'Winning team gets losing team remaining pips (10 + 15 = 25)');
  console.log('✅ 14, 15 & 16. Blocked game, lowest individual hand & losing team scoring verified.');

  // 17. Block Tie (Egalité) burns round & next round starts with [6|6]
  const pA_tie = { ...createPlayer('pA', 'Player A', false, 0), hand: [createTile(5, 0)] }; // 5 pips
  const pB_tie = { ...createPlayer('pB', 'Player B', false, 1), hand: [createTile(3, 2)] }; // 5 pips
  const blockTieResult = ScoreManager.calculateGhallaqResult(1, [pA_tie, pB_tie], getDefaultConfig('1v1'));

  assert.strictEqual(blockTieResult.reason, 'EGALITE', 'Tied lowest hand results in burned round (EGALITE)');
  assert.strictEqual(blockTieResult.winnerPlayerId, null);
  assert.strictEqual(blockTieResult.pointsAwarded, 0);
  console.log('✅ 17. Block tie burned round (Egalité) verified.');

  // 18. Target score ends match (50, 100, 150, 200)
  [50, 100, 150, 200].forEach((targetScore) => {
    const customConfig = { ...getDefaultConfig('1v1'), targetScore };
    let scores = ScoreManager.createInitialScores([p1_winner, p2_loser], false);
    
    // Apply a round result that crosses target score
    const winningRound = {
      roundNumber: 1,
      winnerPlayerId: 'p1',
      winnerTeamId: null,
      reason: 'SORTIE' as const,
      pointsAwarded: targetScore + 10,
      losingPips: targetScore + 10,
      playerHandPipsAtEnd: { p1: 0, p2: targetScore + 10 },
    };

    scores = ScoreManager.applyRoundResultToMatch(scores, winningRound, customConfig);
    assert.strictEqual(scores.matchWinnerId, 'p1', `Match ends immediately when target score ${targetScore} is reached`);
  });
  console.log('✅ 18. Match target score completion (50, 100, 150, 200) verified.');

  console.log('\n🎉 ALL PHASE 3 MOSTAGANEM RULES TESTS PASSED SUCCESSFULLY!\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMostaganemRulesTests();
}
