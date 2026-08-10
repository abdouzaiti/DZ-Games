/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import { BoardPlacementEngine } from '../engine/board/boardPlacementEngine';
import { GameEngine } from '../engine/game/gameEngine';
import { MostaganemRulesEngine } from '../engine/rules/mostaganemRules';
import { ScoreManager } from '../engine/score/scoreManager';
import { StockManager } from '../engine/stock/stockManager';
import { createTile, generateDoubleSixSet, areTilesEqual, getTileHash, serializeTile, deserializeTile } from '../domain/tile';
import { createPlayer } from '../domain/player';
import { createTeam } from '../domain/team';
import { createStock, shuffleStock, drawFromStock } from '../domain/stock';
import { serializeGameState, deserializeGameState } from '../domain/gameState';
import { getDefaultConfig } from '../domain/gameConfig';

export function runAllTests(): void {
  console.log('🧪 Running Dominoes Core Models & Engine Unit Tests...\n');

  // 1. Tile Generator & Physical Identity Test
  const tiles = generateDoubleSixSet();
  assert.strictEqual(tiles.length, 28, 'Standard double-six set must have 28 tiles');
  
  // Verify all values are between 0 and 6
  tiles.forEach(t => {
    assert.ok(t.sideA >= 0 && t.sideA <= 6, `Side A (${t.sideA}) must be between 0 and 6`);
    assert.ok(t.sideB >= 0 && t.sideB <= 6, `Side B (${t.sideB}) must be between 0 and 6`);
  });

  // Verify no duplicate physical tiles
  const hashes = new Set(tiles.map(getTileHash));
  assert.strictEqual(hashes.size, 28, 'All 28 tiles must have unique physical hashes');

  // Verify doubles exist ([0|0] to [6|6] = 7 doubles)
  const doubles = tiles.filter(t => t.isDouble);
  assert.strictEqual(doubles.length, 7, 'Must have exactly 7 doubles in double-six set');

  // Verify physical tile equality: [6|5] equals [5|6]
  const tile65 = createTile(6, 5);
  const tile56 = createTile(5, 6);
  assert.strictEqual(areTilesEqual(tile65, tile56), true, '[6|5] and [5|6] must be equal as physical tile');
  assert.strictEqual(getTileHash(tile65), getTileHash(tile56), '[6|5] and [5|6] must produce same tile hash');

  // Tile serialization/deserialization
  const serializedTile = serializeTile(tile65);
  const deserializedTile = deserializeTile(serializedTile);
  assert.strictEqual(areTilesEqual(tile65, deserializedTile), true, 'Deserialized tile must equal original');

  console.log('✅ 1. Tile domain model & physical identity tests passed.');

  // 2. Player & Team Models Test
  const p1 = createPlayer('p1', 'Player 1', false, 0, 0);
  const p2 = createPlayer('p2', 'Player 2', true, 1, 1);
  assert.strictEqual(p1.id, 'p1');
  assert.strictEqual(p1.isAI, false);
  assert.strictEqual(p2.isAI, true);

  const team1 = createTeam(0, 'Team 1', ['p1']);
  assert.strictEqual(team1.memberIds.length, 1);
  assert.strictEqual(team1.score, 0);
  console.log('✅ 2. Player & Team models verified.');

  // 3. Stock Model Test
  let stock = createStock();
  assert.strictEqual(stock.remainingCount, 28, 'Stock starts with 28 tiles');
  stock = shuffleStock(stock);
  assert.strictEqual(stock.remainingCount, 28, 'Shuffled stock preserves tile count');
  
  const { tile: drawnTile, updatedStock } = drawFromStock(stock);
  assert.ok(drawnTile !== null, 'Drawn tile must exist');
  assert.strictEqual(updatedStock.remainingCount, 27, 'Stock count decreases to 27');
  console.log('✅ 3. Stock model shuffle & draw verified.');

  // 4. Stock Manager Deal Test
  const dealt = StockManager.dealHands([p1, p2], 7);
  assert.strictEqual(dealt.players[0].hand.length, 7, 'Player 1 receives 7 tiles');
  assert.strictEqual(dealt.players[1].hand.length, 7, 'Player 2 receives 7 tiles');
  assert.strictEqual(dealt.stock.length, 14, 'Pioche stock has 14 remaining tiles in 1v1');
  console.log('✅ 4. Stock Manager deal & pioche size passed.');

  // 5. Mostaganem First Round Opener Test
  const mockP1 = { ...p1, hand: [createTile(1, 2), createTile(3, 4)] };
  const mockP2 = { ...p2, hand: [createTile(6, 6), createTile(0, 0)] };
  const opener = MostaganemRulesEngine.findFirstRoundOpener([mockP1, mockP2]);
  assert.strictEqual(opener.playerIndex, 1, 'Player with 6-6 opens first round');
  assert.strictEqual(opener.openingTile.id, '6-6');
  console.log('✅ 5. Mostaganem double-six opener rule passed.');

  // 6. Board Placement Engine Test
  let board = { chain: [], leftEndPip: null, rightEndPip: null, tileCount: 0 };
  // Place [6|6]
  board = BoardPlacementEngine.placeTile(board, createTile(6, 6), 'RIGHT', 'p2');
  assert.strictEqual(board.leftEndPip, 6, 'Left open pip is 6');
  assert.strictEqual(board.rightEndPip, 6, 'Right open pip is 6');
  assert.strictEqual(board.chain.length, 1);

  // Place [6|5] on RIGHT
  board = BoardPlacementEngine.placeTile(board, createTile(6, 5), 'RIGHT', 'p1');
  assert.strictEqual(board.leftEndPip, 6, 'Left open pip remains 6');
  assert.strictEqual(board.rightEndPip, 5, 'Right open pip is now 5');
  assert.strictEqual(board.chain.length, 2);

  // Place [6|2] on LEFT
  board = BoardPlacementEngine.placeTile(board, createTile(6, 2), 'LEFT', 'p1');
  assert.strictEqual(board.leftEndPip, 2, 'Left open pip is now 2');
  assert.strictEqual(board.rightEndPip, 5, 'Right open pip remains 5');
  assert.strictEqual(board.chain.length, 3);
  console.log('✅ 6. Board placement & open end matching passed.');

  // 7. Score Manager Sortie Test
  const config = getDefaultConfig('1v1');
  const winner = createPlayer('p1', 'Player 1');
  const loser = { ...createPlayer('p2', 'Player 2'), hand: [createTile(5, 5), createTile(3, 2)] };
  const result = ScoreManager.calculateSortieResult(1, winner, [winner, loser], config);
  assert.strictEqual(result.reason, 'SORTIE');
  assert.strictEqual(result.pointsAwarded, 15, 'Winner gets sum of opponent pips (10 + 5 = 15)');
  console.log('✅ 7. Score Manager Sortie scoring passed.');

  // 8. Game Engine & GameState Serialization Test
  const engine = new GameEngine(config);
  let state = engine.getSnapshot();
  assert.strictEqual(state.roundStatus, 'NOT_STARTED');

  engine.dispatch({
    type: 'START_MATCH',
    config: getDefaultConfig('1v1'),
  });

  state = engine.getSnapshot();
  assert.strictEqual(state.roundStatus, 'PLAYING');
  assert.strictEqual(state.players[0].hand.length, 7);
  assert.strictEqual(state.players[1].hand.length, 7);
  assert.ok(state.board.chain.length === 0, 'Board starts empty');

  // Verify GameState serialization & reconstruction
  const serialized = serializeGameState(state);
  const reconstructedState = deserializeGameState(serialized);
  assert.strictEqual(reconstructedState.roundNumber, state.roundNumber);
  assert.strictEqual(reconstructedState.players.length, state.players.length);
  assert.strictEqual(reconstructedState.stock.length, state.stock.length);
  console.log('✅ 8. GameState complete representation & JSON serialization passed.');

  // 9. Phase 2: Tile Distribution & Shuffle Extensive Validation Tests
  console.log('🧪 Testing Phase 2 Distribution (2, 3, 4 players & 100+ random trials)...');

  // 2 Players
  const players2 = [createPlayer('p1', 'Player 1'), createPlayer('p2', 'Player 2')];
  const deal2 = StockManager.dealHands(players2, 7);
  assert.strictEqual(deal2.players.length, 2);
  assert.strictEqual(deal2.players[0].hand.length, 7);
  assert.strictEqual(deal2.players[1].hand.length, 7);
  assert.strictEqual(deal2.stock.length, 14);
  assert.strictEqual(StockManager.validateDistribution(deal2.players, deal2.stock, 7).valid, true);

  // 3 Players
  const players3 = [createPlayer('p1', 'Player 1'), createPlayer('p2', 'Player 2'), createPlayer('p3', 'Player 3')];
  const deal3 = StockManager.dealHands(players3, 7);
  assert.strictEqual(deal3.players.length, 3);
  assert.strictEqual(deal3.players[0].hand.length, 7);
  assert.strictEqual(deal3.players[1].hand.length, 7);
  assert.strictEqual(deal3.players[2].hand.length, 7);
  assert.strictEqual(deal3.stock.length, 7);
  assert.strictEqual(StockManager.validateDistribution(deal3.players, deal3.stock, 7).valid, true);

  // 4 Players
  const players4 = [
    createPlayer('p1', 'Player 1'),
    createPlayer('p2', 'Player 2'),
    createPlayer('p3', 'Player 3'),
    createPlayer('p4', 'Player 4'),
  ];
  const deal4 = StockManager.dealHands(players4, 7);
  assert.strictEqual(deal4.players.length, 4);
  assert.strictEqual(deal4.players[0].hand.length, 7);
  assert.strictEqual(deal4.players[1].hand.length, 7);
  assert.strictEqual(deal4.players[2].hand.length, 7);
  assert.strictEqual(deal4.players[3].hand.length, 7);
  assert.strictEqual(deal4.stock.length, 0);
  assert.strictEqual(StockManager.validateDistribution(deal4.players, deal4.stock, 7).valid, true);

  // 100+ Random Distribution Iterations
  const trialsCount = 150;
  for (let trial = 0; trial < trialsCount; trial++) {
    // Randomize player count between 2 and 4
    const count = 2 + (trial % 3);
    const testPlayers = Array.from({ length: count }, (_, i) => createPlayer(`p${i}`, `Player ${i + 1}`));
    
    const { players: dealtPlayers, stock: remainingStock } = StockManager.dealHands(testPlayers, 7);
    
    // Verify each player has exactly 7 tiles
    dealtPlayers.forEach((p) => {
      assert.strictEqual(p.hand.length, 7, `Trial ${trial}: Player ${p.name} must have 7 tiles`);
    });

    // Verify stock size = 28 - (7 * count)
    assert.strictEqual(
      remainingStock.length,
      28 - 7 * count,
      `Trial ${trial}: Stock size must be ${28 - 7 * count}`
    );

    // Verify mathematical distribution integrity
    const validation = StockManager.validateDistribution(dealtPlayers, remainingStock, 7);
    assert.ok(validation.valid, `Trial ${trial} distribution validation failed: ${validation.error}`);
  }

  // Determinism Test with Seeded PRNG
  function createSimpleLcg(seed: number) {
    let s = seed;
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  const rngSeedA = createSimpleLcg(12345);
  const rngSeedB = createSimpleLcg(12345);

  const deterministicDeal1 = StockManager.dealHands(players2, 7, { rng: rngSeedA });
  const deterministicDeal2 = StockManager.dealHands(players2, 7, { rng: rngSeedB });

  assert.deepStrictEqual(
    deterministicDeal1.players[0].hand.map(getTileHash),
    deterministicDeal2.players[0].hand.map(getTileHash),
    'Deterministic shuffle with identical seed must yield identical Player 1 hand'
  );
  assert.deepStrictEqual(
    deterministicDeal1.stock.map(getTileHash),
    deterministicDeal2.stock.map(getTileHash),
    'Deterministic shuffle with identical seed must yield identical stock'
  );

  console.log('✅ 9. Phase 2 distribution, shuffle & mathematical validation tests passed (150 trials + deterministic PRNG).');

  console.log('\n🎉 ALL DOMINO CORE MODEL & DISTRIBUTION TESTS PASSED SUCCESSFULLY!\n');
}

// Auto-run if executed directly via runner script
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}
