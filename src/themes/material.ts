import type { ThemeDefinition } from './types';
import { composeThemeShell } from './composition';

export const materialTheme: ThemeDefinition = {
  name: 'material', label: 'Material', note: 'Structured energy', icon: '◆',
  composition: { shell: 'theme-material-shell', header: 'theme-material-header', hud: 'theme-material-hud', board: 'theme-material-board', controls: 'theme-material-controls', dialogs: 'theme-material-dialogs' },
  typography: { display: 'material-display', body: 'material-text', mono: 'material-mono' },
  icons: { theme: '◆', mode: '◐', newGame: '↗', close: '×', continue: '→' },
  motion: { moveMs: 200, mergeMs: 240, spawnMs: 180, easing: 'cubic-bezier(.2,0,0,1)' },
  tileClass: tile => `theme-material-tile tile-${tile.value > 2048 ? 'super' : tile.value}`,
  composeShell: content => composeThemeShell('theme-material-shell', 'material-content', content)
};
