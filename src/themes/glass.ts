import type { ThemeDefinition } from './types';
import { composeThemeShell } from './composition';

export const glassTheme: ThemeDefinition = {
  name: 'glass', label: 'Liquid Glass', note: 'Light in motion', icon: '✧',
  composition: { shell: 'theme-glass-shell', header: 'theme-glass-header', hud: 'theme-glass-hud', board: 'theme-glass-board', controls: 'theme-glass-controls', dialogs: 'theme-glass-dialogs' },
  typography: { display: 'glass-display', body: 'glass-text', mono: 'glass-mono' },
  icons: { theme: '✧', mode: '◐', newGame: '↗', close: '×', continue: '→' },
  motion: { moveMs: 220, mergeMs: 300, spawnMs: 260, easing: 'cubic-bezier(.16,1,.3,1)' },
  tileClass: tile => `theme-glass-tile tile-${tile.value > 2048 ? 'super' : tile.value}`,
  composeShell: content => composeThemeShell('theme-glass-shell', 'glass-content', content)
};
