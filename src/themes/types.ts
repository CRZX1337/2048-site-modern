import type { Tile } from '../core/game';

export type ThemeName = 'apple' | 'glass' | 'material' | 'oldschool' | 'modern';
export type ThemeDefinition = {
  name: ThemeName;
  label: string;
  note: string;
  icon: string;
  composition: {
    shell: string;
    header: string;
    hud: string;
    board: string;
    controls: string;
    dialogs: string;
  };
  typography: { display: string; body: string; mono: string };
  icons: Record<'theme' | 'mode' | 'newGame' | 'close' | 'continue', string>;
  motion: { moveMs: number; mergeMs: number; spawnMs: number; easing: string };
  tileClass: (tile: Tile) => string;
  composeShell: (content: string) => string;
};
