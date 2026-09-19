import type { Direction } from '../core/game';
import type { ThemeName } from '../themes/types';

export type AppCommand =
  | { type: 'move'; direction: Direction }
  | { type: 'restart' }
  | { type: 'continue' }
  | { type: 'theme'; theme: ThemeName }
  | { type: 'toggle-dark' };
