/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Board, PlacedTile } from '../../domain/board';

export interface VisualSnakeTile {
  placedTile: PlacedTile;
  logicalIndex: number;
  x: number;
  y: number;
  isVertical: boolean;
  rotation: number;
  displayTile: {
    id: string;
    sideA: number;
    sideB: number;
    totalPips: number;
    isDouble: boolean;
  };
}

export interface SnakeLayoutResult {
  tiles: VisualSnakeTile[];
  width: number;
  height: number;
  minX: number;
  minY: number;
  leftTilePos: { x: number; y: number } | null;
  rightTilePos: { x: number; y: number } | null;
}

export class BoardLayoutCalculator {
  /**
   * Calculates a continuous S-curve snake visual layout for domino tile chain.
   */
  static calculateSnakeLayout(
    chain: PlacedTile[],
    maxPerRow: number = 6,
    tileWidth: number = 64,
    tileHeight: number = 36,
    gap: number = 0
  ): SnakeLayoutResult {
    if (chain.length === 0) {
      return {
        tiles: [],
        width: 0,
        height: 0,
        minX: 0,
        minY: 0,
        leftTilePos: null,
        rightTilePos: null,
      };
    }

    const visualTiles: VisualSnakeTile[] = [];
    let currentX = 0;
    let rowY = 0;
    let dir = 1; // 1 = Left-to-Right (+X), -1 = Right-to-Left (-X)
    let tilesInRow = 0;

    for (let i = 0; i < chain.length; i++) {
      const placed = chain[i];
      const isLast = i === chain.length - 1;

      // Corner turn tile if row reaches maxPerRow and not last tile
      const isCorner = tilesInRow >= maxPerRow && !isLast;

      let isVertical = false;
      let x = 0;
      let y = 0;

      let displayTile = {
        ...placed.tile,
        sideA: placed.leftPip,
        sideB: placed.rightPip,
      };

      if (isCorner) {
        // Vertical corner turn tile (36px wide, 64px high)
        isVertical = true;
        if (dir === 1) {
          x = currentX;
          y = rowY;
          rowY += 64; // Next row starts exactly at bottom of corner tile
          currentX = x + tileHeight; // 36px right
          dir = -1;
        } else {
          x = currentX - tileHeight; // 36px left
          y = rowY;
          rowY += 64; // Next row starts exactly at bottom of corner tile
          currentX = x; // Next row starts at left edge of corner tile
          dir = 1;
        }
        tilesInRow = 0;
        displayTile.sideA = placed.leftPip;
        displayTile.sideB = placed.rightPip;
      } else {
        isVertical = placed.isDouble;
        const tWidth = isVertical ? tileHeight : tileWidth;

        if (dir === 1) {
          x = currentX;
          y = rowY + (isVertical ? -14 : 0);
          currentX += tWidth + gap;
          displayTile.sideA = placed.leftPip;
          displayTile.sideB = placed.rightPip;
        } else {
          x = currentX - tWidth;
          y = rowY + (isVertical ? -14 : 0);
          currentX -= (tWidth + gap);
          displayTile.sideA = placed.rightPip;
          displayTile.sideB = placed.leftPip;
        }
        tilesInRow++;
      }

      visualTiles.push({
        placedTile: placed,
        logicalIndex: i,
        x,
        y,
        isVertical,
        rotation: isVertical ? 90 : 0,
        displayTile,
      });
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    visualTiles.forEach((t) => {
      const w = t.isVertical ? tileHeight : tileWidth;
      const h = t.isVertical ? tileWidth : tileHeight;
      minX = Math.min(minX, t.x);
      maxX = Math.max(maxX, t.x + w);
      minY = Math.min(minY, t.y);
      maxY = Math.max(maxY, t.y + h);
    });

    const offsetX = -minX;
    const offsetY = -minY;

    visualTiles.forEach((t) => {
      t.x += offsetX;
      t.y += offsetY;
    });

    const leftTile = visualTiles[0];
    const rightTile = visualTiles[visualTiles.length - 1];

    let leftTilePos = leftTile ? { x: leftTile.x - 100, y: leftTile.y } : null;
    let rightTilePos = null;

    if (rightTile) {
      if (rightTile.isVertical && rightTile.displayTile.sideA === rightTile.placedTile.leftPip) {
        rightTilePos = { x: rightTile.x - 20, y: rightTile.y + 70 };
      } else if (rightTile.displayTile.sideA === rightTile.placedTile.leftPip) {
        rightTilePos = { x: rightTile.x + (rightTile.isVertical ? 36 : 64) + 10, y: rightTile.y };
      } else {
        rightTilePos = { x: rightTile.x - 100, y: rightTile.y };
      }
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    return {
      tiles: visualTiles,
      width: contentWidth,
      height: contentHeight,
      minX: 0,
      minY: 0,
      leftTilePos,
      rightTilePos,
    };
  }

  static calculateLayout(board: Board) {
    const res = this.calculateSnakeLayout(board.chain);
    return {
      tiles: res.tiles,
      tileCount: board.chain.length,
      leftEndPip: board.leftEndPip,
      rightEndPip: board.rightEndPip,
      bounds: {
        minX: res.minX,
        maxX: res.width,
        minY: res.minY,
        maxY: res.height,
        gridWidth: res.width,
        gridHeight: res.height,
      },
    };
  }
}

