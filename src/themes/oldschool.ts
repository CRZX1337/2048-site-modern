import type { ThemeDefinition } from './types';
import { composeThemeShell } from './composition';

export const oldschoolTheme: ThemeDefinition = {
  name: 'oldschool', label: 'Oldschool', note: 'Classic arcade', icon: '▦',
  composition: { shell: 'theme-oldschool-shell', header: 'theme-oldschool-header', hud: 'theme-oldschool-hud', board: 'theme-oldschool-board', controls: 'theme-oldschool-controls', dialogs: 'theme-oldschool-dialogs' },
  typography: { display: 'pixel-display', body: 'pixel-text', mono: 'pixel-mono' },
  icons: { theme: '▦', mode: '◐', newGame: '↗', close: '×', continue: '→' },
  motion: { moveMs: 120, mergeMs: 140, spawnMs: 100, easing: 'steps(3,end)' },
  tileClass: tile => `theme-oldschool-tile tile-${tile.value > 2048 ? 'super' : tile.value}`,
  composeShell: content => composeThemeShell('theme-oldschool-shell', 'oldschool-content', content)
};
