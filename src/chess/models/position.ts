export interface Position {
  row: number; // 0 to 7 (Rank: 8 to 1)
  col: number; // 0 to 7 (File: a to h)
}

export const isValidPosition = (pos: Position): boolean => {
  return pos.row >= 0 && pos.row <= 7 && pos.col >= 0 && pos.col <= 7;
};

export const positionsEqual = (p1: Position, p2: Position): boolean => {
  return p1.row === p2.row && p1.col === p2.col;
};

export const positionToAlgebraic = (pos: Position): string => {
  if (!isValidPosition(pos)) return 'invalid';
  const files = 'abcdefgh';
  return `${files[pos.col]}${8 - pos.row}`;
};

export const algebraicToPosition = (alg: string): Position | null => {
  if (alg.length !== 2) return null;
  const col = alg.charCodeAt(0) - 97; // 'a' is 97
  const row = 8 - parseInt(alg[1], 10);
  const pos = { row, col };
  return isValidPosition(pos) ? pos : null;
};
