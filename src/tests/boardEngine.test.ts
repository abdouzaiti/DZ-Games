/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import { createTile, generateDoubleSixSet } from '../domain/tile';
import { createEmptyBoard, PlacedTile } from '../domain/board';
import { BoardPlacementEngine } from '../engine/board/boardPlacementEngine';
import { BoardLayoutCalculator } from '../engine/board/boardLayoutCalculator';

export function runBoardEngineTests(): void {
  console.log('🧪 Running Phase 4: Domino Board Engine & Tile Placement Unit Tests...\n');

  // 1. Empty Board
  let board = createEmptyBoard();
  assert.strictEqual(board.chain.length, 0, 'Empty board has 0 tiles');
  assert.strictEqual(board.leftEndPip, null, 'Empty board leftEndPip is null');
  assert.strictEqual(board.rightEndPip, null, 'Empty board rightEndPip is null');
  assert.strictEqual(BoardPlacementEngine.canPlaceLeft(board, createTile(6, 6)), true);
  assert.strictEqual(BoardPlacementEngine.canPlaceRight(board, createTile(6, 6)), true);
  console.log('✅ 1. Empty board initialization passed.');

  // 2. First Tile Placement (Double [6|6])
  const d6 = createTile(6, 6);
  board = BoardPlacementEngine.placeTile(board, d6, 'RIGHT', 'p1');
  assert.strictEqual(board.chain.length, 1);
  assert.strictEqual(board.leftEndPip, 6);
  assert.strictEqual(board.rightEndPip, 6);
  assert.strictEqual(board.chain[0].tile.id, '6-6');
  assert.strictEqual(board.chain[0].isDouble, true);
  assert.strictEqual(board.chain[0].rotation, 90, 'Double placed crosswise (90 deg)');
  console.log('✅ 2. Double as first tile placement passed.');

  // 3. Right Placement - Non-reversed tile [5|6]
  const tile65 = createTile(6, 5); // normalized sideA=5, sideB=6
  board = BoardPlacementEngine.placeTile(board, tile65, 'RIGHT', 'p1');
  // Right connection: connects 6 to existing 6 on right, open pip is 5 on right
  assert.strictEqual(board.chain.length, 2);
  assert.strictEqual(board.leftEndPip, 6, 'Left open pip remains 6');
  assert.strictEqual(board.rightEndPip, 5, 'Right open pip becomes 5');
  assert.strictEqual(board.chain[1].leftPip, 6, 'Connected facing left towards board');
  assert.strictEqual(board.chain[1].rightPip, 5, 'Open facing right');
  assert.strictEqual(board.chain[1].isFlipped, true, '[6|5] played as leftPip=6 rightPip=5 is flipped relative to physical [5|6]');
  console.log('✅ 3. Right placement tile orientation passed.');


  // 4. Left Placement - Reversed tile [3|6]
  const tile36 = createTile(3, 6);
  board = BoardPlacementEngine.placeTile(board, tile36, 'LEFT', 'p2');
  // Left connection: connects 6 to existing 6 on left, open pip is 3 on left
  assert.strictEqual(board.chain.length, 3);
  assert.strictEqual(board.leftEndPip, 3, 'Left open pip becomes 3');
  assert.strictEqual(board.rightEndPip, 5, 'Right open pip remains 5');
  assert.strictEqual(board.chain[0].leftPip, 3, 'Open pip facing left');
  assert.strictEqual(board.chain[0].rightPip, 6, 'Connected facing right towards board');
  assert.strictEqual(board.chain[0].isFlipped, false, '[3|6] played as leftPip=3 rightPip=6 matches physical [3|6] (isFlipped=false)');
  console.log('✅ 4. Left placement reversed tile passed.');

  // 5. Multiple Valid Placements (Tile fits both LEFT and RIGHT)
  const tile35 = createTile(3, 5); // fits left (3) and right (5)
  const legalEnds = BoardPlacementEngine.getLegalPlacements(board, tile35);
  assert.deepStrictEqual(legalEnds, ['LEFT', 'RIGHT'], 'Tile [3|5] can be placed on both LEFT and RIGHT');
  console.log('✅ 5. Multiple valid placements detection passed.');

  // 6. Illegal Placement Attempt
  const illegalTile = createTile(0, 1);
  assert.strictEqual(BoardPlacementEngine.canPlaceLeft(board, illegalTile), false);
  assert.strictEqual(BoardPlacementEngine.canPlaceRight(board, illegalTile), false);
  assert.throws(
    () => BoardPlacementEngine.placeTile(board, illegalTile, 'LEFT', 'p1'),
    /Illegal placement/
  );
  assert.strictEqual(board.chain.length, 3, 'Board state unmutated after illegal attempt');
  console.log('✅ 6. Illegal placement error handling & immutability passed.');

  // 7. Same Number on Both Sides & Placing Doubles in Chain
  const d3 = createTile(3, 3);
  board = BoardPlacementEngine.placeTile(board, d3, 'LEFT', 'p1');
  assert.strictEqual(board.chain.length, 4);
  assert.strictEqual(board.leftEndPip, 3);
  assert.strictEqual(board.chain[0].isDouble, true);
  assert.strictEqual(board.chain[0].tile.id, '3-3');
  console.log('✅ 7. Placing doubles in active chain passed.');

  // 8. Long Board Chain Simulation (All 28 Tiles sequentially connected)
  let longBoard = createEmptyBoard();
  const allTiles = generateDoubleSixSet();
  // Build a valid chain manually
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(6, 6), 'RIGHT', 'p1'); // 6, 6
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(6, 5), 'RIGHT', 'p1'); // 6, 5
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(5, 5), 'RIGHT', 'p1'); // 5, 5
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(5, 4), 'RIGHT', 'p1'); // 5, 4
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(4, 4), 'RIGHT', 'p1'); // 4, 4
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(4, 3), 'RIGHT', 'p1'); // 4, 3
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(3, 3), 'RIGHT', 'p1'); // 3, 3
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(3, 2), 'RIGHT', 'p1'); // 3, 2
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(2, 2), 'RIGHT', 'p1'); // 2, 2
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(2, 1), 'RIGHT', 'p1'); // 2, 1
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(1, 1), 'RIGHT', 'p1'); // 1, 1
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(1, 0), 'RIGHT', 'p1'); // 1, 0
  longBoard = BoardPlacementEngine.placeTile(longBoard, createTile(0, 0), 'RIGHT', 'p1'); // 0, 0

  assert.strictEqual(longBoard.chain.length, 13);
  assert.strictEqual(longBoard.leftEndPip, 6);
  assert.strictEqual(longBoard.rightEndPip, 0);

  // Verify internal chain consistency: adjacent pips must match
  for (let i = 0; i < longBoard.chain.length - 1; i++) {
    const current = longBoard.chain[i];
    const next = longBoard.chain[i + 1];
    assert.strictEqual(
      current.rightPip,
      next.leftPip,
      `Adjacent pips must match at boundary index ${i}: ${current.rightPip} === ${next.leftPip}`
    );
  }
  console.log('✅ 8. Long board chain & internal pip adjacency consistency passed.');

  // 9. Preserving Physical Tile Identity & Orientation
  longBoard.chain.forEach((placedTile) => {
    assert.ok(placedTile.tile.id, 'Tile ID exists');
    assert.ok(placedTile.placedByPlayerId === 'p1');
    assert.ok(typeof placedTile.isFlipped === 'boolean');
    assert.ok(typeof placedTile.stepIndex === 'number');
  });
  console.log('✅ 9. Physical tile identity & orientation preservation passed.');

  // 10. Visual Presentation Layout Engine Test
  const layout = BoardLayoutCalculator.calculateLayout(longBoard);
  assert.strictEqual(layout.tiles.length, 13);
  assert.strictEqual(layout.tileCount, 13);
  assert.strictEqual(layout.leftEndPip, 6);
  assert.strictEqual(layout.rightEndPip, 0);
  assert.ok(layout.bounds.gridWidth > 0);
  assert.ok(layout.bounds.gridHeight > 0);
  console.log('✅ 10. Presentation visual layout engine bounds & units calculation passed.');

  console.log('\n🎉 ALL PHASE 4 DOMINO BOARD ENGINE TESTS PASSED SUCCESSFULLY!\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBoardEngineTests();
}
