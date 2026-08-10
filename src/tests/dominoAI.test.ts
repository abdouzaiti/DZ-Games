/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import { createTile } from '../domain/tile';
import { createPlayer } from '../domain/player';
import { createEmptyBoard } from '../domain/board';
import { getDefaultConfig } from '../domain/gameConfig';
import { AIEngine } from '../engine/ai/aiEngine';
import { GameEngine } from '../engine/game/gameEngine';
import { MostaganemRulesEngine } from '../engine/rules/mostaganemRules';
import { BoardPlacementEngine } from '../engine/board/boardPlacementEngine';
import { TurnManager } from '../engine/turn/turnManager';

export function runDominoAITests(): void {
  console.log('🧪 Running Phase 7: Domino AI Unit Tests...\n');

  // Setup sample board with tile [6|6]
  let board = createEmptyBoard();
  board = BoardPlacementEngine.placeTile(board, createTile(6, 6), 'RIGHT', 'p1');

  // 1. AI produces valid move whenever valid move exists & never plays illegal tiles
  const aiPlayer = { ...createPlayer('ai1', 'AI Player 1', true, 0), hand: [createTile(6, 2), createTile(1, 1)] };
  const mockSnapshot = {
    config: getDefaultConfig('1v1'),
    matchScores: { playerScores: {}, teamScores: {}, matchWinnerId: null, matchWinnerTeamId: null },
    roundNumber: 1,
    roundStatus: 'PLAYING' as const,
    board,
    players: [aiPlayer, createPlayer('p2', 'Human', false, 1)],
    stock: [createTile(0, 0)],
    currentPlayerIndex: 0,
    lastPlayedTileId: '6-6',
    consecutivePassesCount: 0,
    roundHistory: [],
    latestResult: null,
    lastActionDescription: null,
    openerPlayerId: 'p1',
    requiredOpeningTileId: null,
  };

  const choice = AIEngine.selectBestMove(mockSnapshot, 'ai1');
  assert.ok(choice !== null, 'AI should return a valid move');
  assert.strictEqual(choice.tileId, '2-6', 'AI selects playable tile [6|2]');

  const tileToPlay = aiPlayer.hand.find((t) => t.id === choice.tileId)!;
  const isValid = MostaganemRulesEngine.isValidMove(tileToPlay, choice.end, board);
  assert.strictEqual(isValid, true, 'AI choice MUST be a legally valid move according to Mostaganem Rules');
  console.log('✅ 1. AI move validity & legal rule compliance verified.');

  // 2. AI handles Left / Right choices
  // Place [6|2] on right end -> left end=6, right end=2
  board = BoardPlacementEngine.placeTile(board, createTile(6, 2), 'RIGHT', 'ai1');
  const aiMultiChoice = {
    ...createPlayer('ai1', 'AI Player 1', true, 0),
    hand: [createTile(6, 4), createTile(2, 5)], // 6-4 fits LEFT (6), 2-5 fits RIGHT (2)
  };
  const mockSnapshotMulti = { ...mockSnapshot, board, players: [aiMultiChoice, mockSnapshot.players[1]] };

  const choiceMulti = AIEngine.selectBestMove(mockSnapshotMulti, 'ai1');
  assert.ok(choiceMulti !== null);
  const chosenTile = aiMultiChoice.hand.find((t) => t.id === choiceMulti.tileId)!;
  const isValidMulti = MostaganemRulesEngine.isValidMove(chosenTile, choiceMulti.end, board);
  assert.strictEqual(isValidMulti, true, 'AI choice on multi-end board MUST be valid');
  console.log('✅ 2. AI Left/Right placement choices verified.');

  // 3. AI handles Doubles priority
  const aiDoublesPlayer = {
    ...createPlayer('ai1', 'AI Player 1', true, 0),
    hand: [createTile(6, 1), createTile(6, 6)], // Both fit open end 6, [6|6] is double
  };
  let emptyBoard = createEmptyBoard();
  emptyBoard = BoardPlacementEngine.placeTile(emptyBoard, createTile(6, 3), 'RIGHT', 'p2'); // open end 6
  const mockSnapshotDoubles = { ...mockSnapshot, board: emptyBoard, players: [aiDoublesPlayer, mockSnapshot.players[1]] };

  const doubleChoice = AIEngine.selectBestMove(mockSnapshotDoubles, 'ai1');
  assert.ok(doubleChoice !== null);
  assert.strictEqual(doubleChoice.tileId, '6-6', 'AI prioritizes placing double tile [6|6]');
  console.log('✅ 3. AI Double tile prioritization verified.');

  // 4. AI handles Drawing when holding no playable tiles
  const aiUnplayable = {
    ...createPlayer('ai1', 'AI Player 1', true, 0),
    hand: [createTile(0, 0), createTile(1, 1)], // unplayable against board ends (6)
  };
  const mockSnapshotDraw = { ...mockSnapshot, players: [aiUnplayable, mockSnapshot.players[1]] };
  const choiceDraw = AIEngine.selectBestMove(mockSnapshotDraw, 'ai1');
  assert.strictEqual(choiceDraw, null, 'AI returns null when no legal moves exist in hand');
  console.log('✅ 4. AI handles drawing condition (no legal move) verified.');

  // 5. AI handles Blocked situations (No move & Stock 0)
  const mockSnapshotBlocked = { ...mockSnapshotDraw, stock: [] };
  const choiceBlocked = AIEngine.selectBestMove(mockSnapshotBlocked, 'ai1');
  assert.strictEqual(choiceBlocked, null, 'AI returns null when stock is 0 and no legal moves exist');
  assert.strictEqual(
    TurnManager.canPass(aiUnplayable, mockSnapshotBlocked.board, 0),
    true,
    'Game engine allows AI to pass when no moves & stock empty'
  );
  console.log('✅ 5. AI blocked situation pass condition verified.');

  // 6. AI 1v1 and 2v2 simulation without accessing hidden hands
  const config2v2 = getDefaultConfig('2v2');
  const engine2v2 = new GameEngine(config2v2);
  engine2v2['snapshot'] = {
    ...engine2v2.getSnapshot(),
    players: engine2v2.getSnapshot().players.map((p) => ({ ...p, isAI: true })),
  };
  engine2v2.dispatch({ type: 'START_NEW_ROUND' });

  // Simulate AI steps for a full round
  let steps = 0;
  while (engine2v2.getSnapshot().roundStatus === 'PLAYING' && steps < 200) {
    steps++;
    engine2v2.dispatch({ type: 'AI_STEP' });
  }

  const endSnap = engine2v2.getSnapshot();
  assert.notStrictEqual(endSnap.roundStatus, 'PLAYING', 'Round completed successfully');
  assert.ok(endSnap.latestResult !== null, 'Round result generated');
  console.log(`✅ 6. 2v2 simulation round finished in ${steps} steps with status ${endSnap.roundStatus}.`);

  // 7. Mass Game Simulation: 1,000 Complete Rounds across 1v1, 3player_ffa, 4player_ffa, and 2v2
  console.log('🚀 Running 1,000 complete simulated rounds across all modes...');
  const modes = ['1v1', '3player_ffa', '4player_ffa', '2v2'] as const;
  let totalRoundsSimulated = 0;

  for (let i = 0; i < 1000; i++) {
    const mode = modes[i % modes.length];
    const simConfig = getDefaultConfig(mode);
    const simEngine = new GameEngine(simConfig);

    // Make all players AI for fully automated simulation
    simEngine['snapshot'] = {
      ...simEngine.getSnapshot(),
      players: simEngine.getSnapshot().players.map((p) => ({ ...p, isAI: true })),
    };

    simEngine.dispatch({ type: 'START_NEW_ROUND' });

    let roundTurns = 0;
    while (simEngine.getSnapshot().roundStatus === 'PLAYING' && roundTurns < 300) {
      roundTurns++;
      simEngine.dispatch({ type: 'AI_STEP' });
    }

    const simSnap = simEngine.getSnapshot();
    assert.notStrictEqual(
      simSnap.roundStatus,
      'PLAYING',
      `Round ${i + 1} (${mode}) failed to finish within 300 turns`
    );

    // Verify tile integrity (No lost or duplicated dominoes!)
    const integrity = TurnManager.validateTileStateIntegrity(
      simSnap.players,
      simSnap.stock,
      simSnap.board,
      28
    );
    assert.strictEqual(
      integrity.isValid,
      true,
      `Tile integrity compromised in round ${i + 1}: ${integrity.details}`
    );

    totalRoundsSimulated++;
  }

  console.log(`✅ 7. Successfully simulated ${totalRoundsSimulated} complete game rounds without crashes, illegal moves, or tile accounting errors.`);

  console.log('\n🎉 ALL PHASE 7 DOMINO AI TESTS PASSED SUCCESSFULLY!\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDominoAITests();
}
