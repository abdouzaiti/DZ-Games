/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import { createTile } from '../domain/tile';
import { createPlayer } from '../domain/player';
import { createEmptyBoard } from '../domain/board';
import { getDefaultConfig } from '../domain/gameConfig';
import { TurnManager } from '../engine/turn/turnManager';
import { BoardPlacementEngine } from '../engine/board/boardPlacementEngine';
import { GameEngine } from '../engine/game/gameEngine';

export function runTurnAndDrawTests(): void {
  console.log('🧪 Running Phase 5: Turn & Draw System Unit Tests...\n');

  // Setup basic board with [6|6]
  let board = createEmptyBoard();
  board = BoardPlacementEngine.placeTile(board, createTile(6, 6), 'RIGHT', 'p1'); // ends: left=6, right=6

  // 1. Player WITH playable move CANNOT draw
  const p1_playable = { ...createPlayer('p1', 'Player 1'), hand: [createTile(6, 2), createTile(1, 1)] };
  assert.strictEqual(
    TurnManager.canDraw(p1_playable, board, 10),
    false,
    'Player holding [6|2] matching board end 6 MUST play and CANNOT draw'
  );
  console.log('✅ 1. Player with playable move cannot draw verified.');

  // 2. Player WITHOUT playable move DRAWS
  const p1_unplayable = { ...createPlayer('p1', 'Player 1'), hand: [createTile(1, 1), createTile(2, 3)] };
  assert.strictEqual(
    TurnManager.canDraw(p1_unplayable, board, 10),
    true,
    'Player without playable move MUST draw when stock > 0'
  );
  console.log('✅ 2. Player without playable move draws verified.');

  // 3. First drawn tile is playable -> drawing stops immediately
  const stockWithFirstPlayable = [createTile(6, 4), createTile(0, 0)]; // 6-4 matches board end 6
  const drawResult1 = TurnManager.drawUntilPlayableOrEmpty(p1_unplayable, stockWithFirstPlayable, board);
  assert.strictEqual(drawResult1.drawnTiles.length, 1, 'Stopped drawing after 1 tile');
  assert.strictEqual(drawResult1.drawnTiles[0].id, '4-6');
  assert.strictEqual(drawResult1.hasPlayableMove, true);
  assert.strictEqual(drawResult1.updatedPlayer.hand.length, 3, 'Hand grew from 2 to 3 tiles');
  assert.strictEqual(drawResult1.updatedStock.length, 1, 'Stock decreased from 2 to 1');
  console.log('✅ 3. First drawn tile is playable verified.');

  // 4 & 5. Multiple non-playable draws until a playable tile appears
  const stockWithDelayedPlayable = [
    createTile(0, 0), // unplayable
    createTile(1, 2), // unplayable
    createTile(2, 2), // unplayable
    createTile(6, 1), // PLAYABLE! (matches 6)
    createTile(5, 5), // remaining in stock
  ];
  const drawResult2 = TurnManager.drawUntilPlayableOrEmpty(p1_unplayable, stockWithDelayedPlayable, board);
  assert.strictEqual(drawResult2.drawnTiles.length, 4, 'Drew exactly 4 tiles until playable [6|1] was found');
  assert.strictEqual(drawResult2.hasPlayableMove, true);
  assert.strictEqual(drawResult2.updatedPlayer.hand.length, 6, 'Hand grew from 2 to 6');
  assert.strictEqual(drawResult2.updatedStock.length, 1, 'Stock remaining = 1');
  console.log('✅ 4 & 5. Multiple non-playable draws & delayed playable tile verified.');

  // 6 & 7. Stock becomes empty & PASS turn
  const stockAllUnplayable = [createTile(0, 0), createTile(1, 2)];
  const drawResult3 = TurnManager.drawUntilPlayableOrEmpty(p1_unplayable, stockAllUnplayable, board);
  assert.strictEqual(drawResult3.drawnTiles.length, 2, 'Drew all 2 stock tiles');
  assert.strictEqual(drawResult3.hasPlayableMove, false, 'No playable tile found');
  assert.strictEqual(drawResult3.updatedStock.length, 0, 'Stock is now empty');

  // Player now has no legal move and stock is empty -> MUST PASS
  assert.strictEqual(
    TurnManager.canPass(drawResult3.updatedPlayer, board, 0),
    true,
    'Player MUST pass when hand has no moves and stock is 0'
  );
  assert.strictEqual(
    TurnManager.canDraw(drawResult3.updatedPlayer, board, 0),
    false,
    'Player CANNOT draw when stock is 0'
  );
  console.log('✅ 6 & 7. Stock empty & Pass eligibility verified.');

  // 8. Next player receives turn in order (0 -> 1 -> 2 -> 3 -> 0)
  assert.strictEqual(TurnManager.getNextTurnIndex(0, 4), 1);
  assert.strictEqual(TurnManager.getNextTurnIndex(1, 4), 2);
  assert.strictEqual(TurnManager.getNextTurnIndex(2, 4), 3);
  assert.strictEqual(TurnManager.getNextTurnIndex(3, 4), 0);
  console.log('✅ 8. Clockwise turn order progression verified.');

  // 9. Tile count and state accounting integrity (No lost/duplicated tiles)
  const fullEngine = new GameEngine(getDefaultConfig('1v1'));
  fullEngine.dispatch({ type: 'START_NEW_ROUND' });
  const snapshot = fullEngine.getSnapshot();

  const integrity = TurnManager.validateTileStateIntegrity(snapshot.players, snapshot.stock, snapshot.board, 28);
  assert.strictEqual(integrity.isValid, true, 'All 28 domino tiles accounted for without duplicates or loss');
  console.log('✅ 9. Hand/stock/board tile accounting integrity verified (28 total tiles).');

  // 10, 11 & 12. Turn and deal system across 2, 3, and 4 player modes
  const modes = ['1v1', '3player_ffa', '4player_ffa', '2v2'] as const;
  modes.forEach((mode) => {
    const engine = new GameEngine(getDefaultConfig(mode));
    engine.dispatch({ type: 'START_NEW_ROUND' });
    const snap = engine.getSnapshot();

    const expectedPlayers = mode === '1v1' ? 2 : mode === '3player_ffa' ? 3 : 4;
    assert.strictEqual(snap.players.length, expectedPlayers, `Player count for ${mode} is ${expectedPlayers}`);

    // Verify turn advancement for all player indices
    for (let i = 0; i < expectedPlayers; i++) {
      const nextIdx = TurnManager.getNextTurnIndex(i, expectedPlayers);
      assert.strictEqual(nextIdx, (i + 1) % expectedPlayers, `Turn advance from ${i} -> ${nextIdx}`);
    }

    // Verify tile accounting for every mode
    const check = TurnManager.validateTileStateIntegrity(snap.players, snap.stock, snap.board, 28);
    assert.strictEqual(check.isValid, true, `Tile accounting valid for mode ${mode}`);
  });
  console.log('✅ 10, 11 & 12. Turn and deal verification across 2, 3, and 4 player modes passed.');

  console.log('\n🎉 ALL PHASE 5 TURN AND DRAW TESTS PASSED SUCCESSFULLY!\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTurnAndDrawTests();
}
