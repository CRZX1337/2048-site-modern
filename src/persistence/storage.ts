import type { GameState } from '../core/game';
import { migrateSave, type SaveData } from './schema';
import type { ThemeName } from '../themes/types';

const KEY = '2048-studio-save';
export type { SaveData } from './schema';

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const migrated = migrateSave(JSON.parse(raw) as unknown);
    if (!migrated) localStorage.removeItem(KEY);
    return migrated;
  } catch {
    try { localStorage.removeItem(KEY); } catch { /* Storage unavailable. */ }
    return null;
  }
}

export function save(data: SaveData): void {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* Storage can be unavailable in private browsing. */ }
}

export function createSave(game: GameState, best: number, theme: ThemeName, dark: boolean): SaveData {
  return { version: 1, game, best: Math.max(best, game.score), theme, dark };
}
