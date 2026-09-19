import type { Cell, GameState } from '../core/game';
import type { ThemeName } from '../themes/types';

export type SaveData = { version: 1; game: GameState; best: number; theme: ThemeName; dark: boolean };
const themes: ThemeName[] = ['apple', 'glass', 'material', 'oldschool', 'modern'];
const statuses = ['playing', 'won', 'over'];

function validCell(cell: Cell): boolean {
  return cell === null || (Number.isInteger(cell.id) && cell.id > 0 && Number.isInteger(cell.value) && cell.value >= 2 && (cell.value & (cell.value - 1)) === 0 && Number.isInteger(cell.position?.row) && cell.position.row >= 0 && cell.position.row < 4 && Number.isInteger(cell.position?.col) && cell.position.col >= 0 && cell.position.col < 4);
}

export function isValidGame(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const game = value as Partial<GameState>;
  if (!Array.isArray(game.cells) || game.cells.length !== 16 || !game.cells.every(validCell) || typeof game.score !== 'number' || game.score < 0 || !statuses.includes(game.status ?? '') || typeof game.continued !== 'boolean' || typeof game.nextId !== 'number' || !Number.isInteger(game.nextId) || game.nextId <= 0) return false;
  const tiles = game.cells.filter((cell): cell is NonNullable<Cell> => cell !== null);
  const ids = tiles.map(tile => tile.id);
  const positions = tiles.map(tile => `${tile.position.row}:${tile.position.col}`);
  return new Set(ids).size === ids.length && new Set(positions).size === positions.length && Math.max(0, ...ids) < game.nextId;

}

export function isValidSave(value: unknown): value is SaveData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<SaveData>;
  return data.version === 1 && isValidGame(data.game) && typeof data.best === 'number' && data.best >= data.game.score && themes.includes(data.theme as ThemeName) && typeof data.dark === 'boolean';
}

export function migrateSave(value: unknown): SaveData | null {
  return isValidSave(value) ? value : null;
}
