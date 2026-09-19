import { describe, expect, it } from 'vitest';
import { createGame } from '../src/core/game';
import { createSave } from '../src/persistence/storage';
import { isValidGame, isValidSave, migrateSave } from '../src/persistence/schema';

describe('persistence schema', () => {
  it('accepts a serialized valid save', () => {
    const game = createGame(() => 0);
    const save = createSave(game, 0, 'apple', false);
    expect(isValidSave(JSON.parse(JSON.stringify(save)))).toBe(true);
  });

  it('rejects corrupt game shapes and invalid tile values', () => {
    const game = createGame(() => 0);
    const invalid = { ...game, cells: [...game.cells], score: -1 };
    expect(isValidGame(invalid)).toBe(false);
    const invalidTile = { ...game, cells: game.cells.map(tile => tile ? { ...tile, value: 3 } : tile) };
    expect(isValidGame(invalidTile)).toBe(false);
  });

  it('recovers by returning null for unsupported or corrupt versions', () => {
    expect(migrateSave({ version: 99 })).toBeNull();
    expect(migrateSave(null)).toBeNull();
  });
});
