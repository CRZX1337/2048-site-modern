import type { ThemeDefinition } from './types';
import { composeThemeShell } from './composition';

export const appleTheme: ThemeDefinition = {
  name: 'apple', label: 'Apple', note: 'Quietly refined', icon: '◌',
  composition: { shell: 'theme-apple-shell', header: 'theme-apple-header', hud: 'theme-apple-hud', board: 'theme-apple-board', controls: 'theme-apple-controls', dialogs: 'theme-apple-dialogs' },
  typography: { display: 'sf-display', body: 'sf-text', mono: 'sf-mono' },
  icons: { theme: '✦', mode: '◐', newGame: '↗', close: '×', continue: '→' },
  motion: { moveMs: 180, mergeMs: 220, spawnMs: 180, easing: 'cubic-bezier(.2,.8,.2,1)' },
  tileClass: tile => `theme-apple-tile tile-${tile.value > 2048 ? 'super' : tile.value}`,
  composeShell: content => composeThemeShell('theme-apple-shell', 'apple-content', content)
};
