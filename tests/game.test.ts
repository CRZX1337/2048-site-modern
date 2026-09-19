import { describe, expect, it } from 'vitest';
import { continueGame, hasMoves, move, type GameState, type Tile } from '../src/core/game';

const t = (id: number, value: number, row: number, col: number): Tile => ({ id, value, position: { row, col } });
const state = (tiles: Tile[], status: GameState['status'] = 'playing'): GameState => {
  const cells = Array<GameState['cells'][number]>(16).fill(null);
  for (const tile of tiles) cells[tile.position.row * 4 + tile.position.col] = tile;
  return { cells, score: 0, status, continued: false, nextId: 20 };
};
const noRandom = () => 0;

describe('2048 core', () => {
  it('moves and merges once per pair with stable result identity', () => {
    const initial = state([t(1, 2, 0, 0), t(2, 2, 0, 1), t(3, 2, 0, 2), t(4, 2, 0, 3)]);
    const result = move(initial, 'left', noRandom);
    expect(result.state.cells[0]?.value).toBe(4);
    expect(result.state.cells[1]?.value).toBe(4);
    expect(result.state.score).toBe(8);
    expect(result.transition.merges).toHaveLength(2);
    expect(result.transition.merges[0]).toMatchObject({ sources: [1, 2], result: { id: 1, value: 4, position: { row: 0, col: 0 } } });
    expect(result.transition.spawned).toBeDefined();
    expect(result.state.cells.filter(Boolean).map(tile => tile!.id)).toContain(1);
    expect(result.state.cells.filter(Boolean).map(tile => tile!.id)).not.toContain(2);
  });

  it('supports all four movement directions', () => {
    expect(move(state([t(1, 2, 0, 1)]), 'down', noRandom).state.cells[13]?.value).toBe(2);
    expect(move(state([t(1, 2, 1, 0)]), 'right', noRandom).state.cells[7]?.value).toBe(2);
    expect(move(state([t(1, 2, 1, 1)]), 'up', noRandom).state.cells[1]?.value).toBe(2);
    expect(move(state([t(1, 2, 1, 1)]), 'left', noRandom).state.cells[4]?.value).toBe(2);
  });

  it('preserves merge ordering for chained equal tiles', () => {
    const result = move(state([t(1, 2, 0, 0), t(2, 2, 0, 1), t(3, 4, 0, 2), t(4, 4, 0, 3)]), 'left', noRandom);
    expect(result.state.cells[0]?.value).toBe(4);
    expect(result.state.cells[1]?.value).toBe(8);
    expect(result.state.score).toBe(12);
    expect(result.transition.merges.map(merge => merge.sources)).toEqual([[1, 2], [3, 4]]);
  });

  it('does not change a blocked move', () => {
    const initial = state([t(1, 2, 0, 0)]);
    const result = move(initial, 'up', noRandom);
    expect(result.transition.changed).toBe(false);
    expect(result.state).toBe(initial);
  });

  it('detects game over only when the board is full and blocked', () => {
    const values = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];
    const tiles = values.map((value, index) => t(index + 1, value, Math.floor(index / 4), index % 4));
    expect(hasMoves(tiles.map(tile => tile))).toBe(false);
    const result = move(state(tiles), 'left', noRandom);
    expect(result.state.status).toBe('over');
    expect(result.transition.over).toBe(true);
  });

  it('detects 2048, continues afterward, and rejects moves before continuing', () => {
    const initial = state([t(1, 1024, 0, 0), t(2, 1024, 0, 1)]);
    const result = move(initial, 'left', noRandom);
    expect(result.state.status).toBe('won');
    expect(result.transition.won).toBe(true);
    expect(move(result.state, 'right', noRandom).state).toBe(result.state);
    expect(continueGame(result.state)).toMatchObject({ status: 'playing', continued: true });
  });
});
