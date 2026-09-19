import type { ThemeDefinition } from './types';
import { composeThemeShell } from './composition';

export const modernTheme: ThemeDefinition = {
  name: 'modern', label: 'Modern', note: 'Boldly minimal', icon: '⌁',
  composition: { shell: 'theme-modern-shell', header: 'theme-modern-header', hud: 'theme-modern-hud', board: 'theme-modern-board', controls: 'theme-modern-controls', dialogs: 'theme-modern-dialogs' },
  typography: { display: 'modern-display', body: 'modern-text', mono: 'modern-mono' },
  icons: { theme: '⌁', mode: '◐', newGame: '↗', close: '×', continue: '→' },
  motion: { moveMs: 160, mergeMs: 190, spawnMs: 150, easing: 'cubic-bezier(.22,1,.36,1)' },
  tileClass: tile => `theme-modern-tile tile-${tile.value > 2048 ? 'super' : tile.value}`,
  composeShell: content => composeThemeShell('theme-modern-shell', 'modern-content', content)
};
