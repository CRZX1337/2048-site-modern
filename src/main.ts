import './styles.css';
import { AppController } from './app/controller';
import { setupInput } from './input/controller';
import { getTheme, themeRegistry, type ThemeName } from './themes/registry';
import { clearDevelopmentServiceWorkers, isStandalone, registerPwa, setupLifecycle, setupViewport } from './platform';

type StudioWindow = Window & { __dispose2048Studio?: () => void };
const studioWindow = window as StudioWindow;
studioWindow.__dispose2048Studio?.();
const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App root missing');
const root = app;

const content = `
  <header class="topbar"><div class="brand"><span class="brand-mark">2⁰</span><div><strong>2048</strong><span>STUDIO</span></div></div><div class="top-actions"><button class="icon-button" id="stats-button" aria-label="View statistics">⌁</button><button class="icon-button" id="theme-button" aria-label="Choose theme">✦</button><button class="icon-button" id="mode-button" aria-label="Toggle dark mode">◐</button><button class="icon-button" id="settings-button" aria-label="Open settings">☼</button></div></header>
  <section class="hero" aria-labelledby="title"><div><p class="eyebrow">A small game of big moves</p><h1 id="title">2048<span class="accent">.</span></h1><p class="subtitle">Combine numbers. Find your flow.</p></div><div class="scores" aria-label="Game scores"><div class="score-card"><span>SCORE</span><strong id="score">0</strong></div><div class="score-card"><span>BEST</span><strong id="best">0</strong></div></div></section>
  <section class="game-wrap"><div class="board-frame"><div class="board" id="board" role="grid" aria-rowcount="4" aria-colcount="4" aria-label="2048 game board" tabindex="0"></div><div class="status-overlay" id="overlay" hidden></div></div><div class="game-actions"><button class="primary-button" id="new-game">New game <span>↗</span></button></div><p class="hint"><span class="keyboard-icon">⌘</span> <span>Swipe to move · use arrow keys on desktop</span></p></section>
  <footer><span>Local-first · Works offline</span><div class="footer-links"><button class="link-button" id="about">How to play <span>→</span></button><button class="link-button" id="stats-link">Stats <span>↗</span></button></div></footer>
  <dialog id="theme-dialog"><div class="dialog-head"><div><p class="eyebrow">Make it yours</p><h2>Choose a mood</h2></div><button class="close-button" id="close-theme" aria-label="Close theme picker">×</button></div><div class="theme-grid" id="theme-grid"></div></dialog>
  <dialog id="about-dialog"><button class="close-button dialog-close" id="close-about" aria-label="Close">×</button><p class="eyebrow">The simple rules</p><h2>Make 2048</h2><p class="dialog-copy">Swipe or use your arrow keys to move every tile. When two tiles with the same number touch, they merge into one. Reach <strong>2048</strong> to win — then keep going if you like.</p><button class="primary-button" id="got-it">Got it</button></dialog>
  <dialog id="stats-dialog" class="sheet-dialog"><button class="close-button dialog-close" id="close-stats" aria-label="Close statistics">×</button><p class="eyebrow">Your local journey</p><h2>Statistics</h2><div class="stat-grid"><div><span>Current score</span><strong id="stat-score">0</strong></div><div><span>Best score</span><strong id="stat-best">0</strong></div><div><span>Moves this game</span><strong id="stat-moves">0</strong></div><div><span>Merges this game</span><strong id="stat-merges">0</strong></div></div><div class="stat-highlight"><span>Highest tile</span><strong id="stat-highest">2</strong></div></dialog>
  <dialog id="settings-dialog" class="sheet-dialog"><button class="close-button dialog-close" id="close-settings" aria-label="Close settings">×</button><p class="eyebrow">Make it feel right</p><h2>Settings</h2><div class="setting-list"><button class="setting-row" id="settings-theme"><span><strong>Theme</strong><small id="settings-theme-value">Apple</small></span><b>→</b></button><button class="setting-row" id="settings-mode"><span><strong>Appearance</strong><small id="settings-mode-value">Light</small></span><b>◐</b></button><div class="setting-row setting-static"><span><strong>Motion</strong><small>Follows your device preference</small></span><span class="setting-pill">iOS</span></div></div></dialog>
  <div class="sr-only" id="live" role="status" aria-live="polite"></div>`;

const initialTheme = getTheme('apple');
app.innerHTML = initialTheme.composeShell(content);
const shell = app.querySelector<HTMLElement>('.app-shell')!;
const board = app.querySelector<HTMLElement>('#board')!;
const overlay = app.querySelector<HTMLElement>('#overlay')!;
const themeDialog = app.querySelector<HTMLDialogElement>('#theme-dialog')!;
const aboutDialog = app.querySelector<HTMLDialogElement>('#about-dialog')!;
const statsDialog = app.querySelector<HTMLDialogElement>('#stats-dialog')!;
const settingsDialog = app.querySelector<HTMLDialogElement>('#settings-dialog')!;
const live = app.querySelector<HTMLElement>('#live')!;
const score = app.querySelector<HTMLElement>('#score')!;
const best = app.querySelector<HTMLElement>('#best')!;
const statScore = app.querySelector<HTMLElement>('#stat-score')!;
const statBest = app.querySelector<HTMLElement>('#stat-best')!;
const statMoves = app.querySelector<HTMLElement>('#stat-moves')!;
const statMerges = app.querySelector<HTMLElement>('#stat-merges')!;
const statHighest = app.querySelector<HTMLElement>('#stat-highest')!;
const settingsThemeValue = app.querySelector<HTMLElement>('#settings-theme-value')!;
const settingsModeValue = app.querySelector<HTMLElement>('#settings-mode-value')!;
const themeGrid = app.querySelector<HTMLElement>('#theme-grid')!;
let lastFocus: HTMLElement | null = null;
let renderedTheme: ThemeName = 'apple';

const controller = new AppController({
  board,
  standalone: isStandalone(),
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  onStatus: message => { live.textContent = message; },
  onState: (state, transition) => {
    shell.dataset.theme = state.theme;
    shell.dataset.dark = String(state.dark); shell.dataset.standalone = String(state.standalone);
    app.querySelector<HTMLButtonElement>('#theme-button')!.textContent = getTheme(state.theme).icons.theme; app.querySelector<HTMLButtonElement>('#mode-button')!.textContent = getTheme(state.theme).icons.mode; app.querySelector<HTMLButtonElement>('#new-game')!.innerHTML = `New game <span>${getTheme(state.theme).icons.newGame}</span>`;
    score.textContent = String(state.game.score);
    board.setAttribute('aria-label', `2048 board. ${state.game.cells.filter(Boolean).map(tile => `${tile!.value} at row ${tile!.position.row + 1}, column ${tile!.position.col + 1}`).join(', ') || 'empty'}.`);
    if (transition?.scoreDelta) { const card = score.closest<HTMLElement>('.score-card'); card?.classList.remove('score-pop'); void card?.offsetWidth; card?.classList.add('score-pop'); card?.addEventListener('animationend', () => card.classList.remove('score-pop'), { once: true }); }
    best.textContent = String(state.best);
    statScore.textContent = String(state.game.score); statBest.textContent = String(state.best); statMoves.textContent = String(state.sessionMoves); statMerges.textContent = String(state.sessionMerges); statHighest.textContent = String(Math.max(2, ...state.game.cells.filter(Boolean).map(tile => tile!.value))); settingsThemeValue.textContent = getTheme(state.theme).label; settingsModeValue.textContent = state.dark ? 'Dark' : 'Light';
    updateComposition(getTheme(state.theme));
    overlay.hidden = state.game.status === 'playing';
    overlay.innerHTML = state.game.status === 'won' ? '<div><span class="overlay-kicker">You found it</span><strong>2048</strong><button class="primary-button" data-action="continue">Keep going</button></div>' : '<div><span class="overlay-kicker">No more moves</span><strong>Try again?</strong><button class="primary-button" data-action="restart">New game</button></div>';
    if (transition?.won) live.textContent = 'You reached 2048. Keep going or start a new game.';
    if (transition?.over) live.textContent = 'Game over. Start a new game to play again.';
    if (!transition) controller.renderer.refreshTheme(state.game, getTheme(state.theme));
  }
});

function updateComposition(theme: ReturnType<typeof getTheme>) {
  const changed = renderedTheme !== theme.name;
  shell.className = `app-shell ${theme.composition.shell}`;
  for (const [selector, className] of [['.topbar', theme.composition.header], ['.scores', theme.composition.hud], ['.board-frame', theme.composition.board], ['.game-actions', theme.composition.controls]] as const) root.querySelector<HTMLElement>(selector)?.classList.add(className);
  if (changed) { shell.classList.add('theme-changing'); shell.addEventListener('animationend', () => shell.classList.remove('theme-changing'), { once: true }); }
  renderedTheme = theme.name;
}
function renderThemeChoices() {
  const current = controller.snapshot.theme;
  themeGrid.innerHTML = Object.entries(themeRegistry).map(([key, theme]) => `<button class="theme-choice ${key === current ? 'selected' : ''}" data-theme-choice="${key}" aria-pressed="${key === current}"><span class="theme-swatch swatch-${key}">${theme.icon}</span><span><strong>${theme.label}</strong><small>${theme.note}</small></span><i aria-hidden="true">✓</i></button>`).join('');
}

app.querySelector('#new-game')!.addEventListener('click', () => controller.dispatch({ type: 'restart' }));
app.querySelector('#mode-button')!.addEventListener('click', () => controller.dispatch({ type: 'toggle-dark' }));
app.querySelector('#settings-mode')!.addEventListener('click', () => controller.dispatch({ type: 'toggle-dark' }));
app.querySelector('#settings-theme')!.addEventListener('click', () => { settingsDialog.close(); lastFocus = app.querySelector('#settings-button'); renderThemeChoices(); themeDialog.showModal(); });
app.querySelector('#stats-button')!.addEventListener('click', () => { lastFocus = document.activeElement as HTMLElement; statsDialog.showModal(); });
app.querySelector('#stats-link')!.addEventListener('click', () => { lastFocus = document.activeElement as HTMLElement; statsDialog.showModal(); });
app.querySelector('#settings-button')!.addEventListener('click', () => { lastFocus = document.activeElement as HTMLElement; settingsDialog.showModal(); });
app.querySelector('#theme-button')!.addEventListener('click', () => { lastFocus = document.activeElement as HTMLElement; renderThemeChoices(); themeDialog.showModal(); themeGrid.querySelector<HTMLButtonElement>('.selected')?.focus(); });
app.querySelector('#about')!.addEventListener('click', () => { lastFocus = document.activeElement as HTMLElement; aboutDialog.showModal(); });
app.querySelector('#close-theme')!.addEventListener('click', () => themeDialog.close());
app.querySelector('#close-about')!.addEventListener('click', () => aboutDialog.close());
app.querySelector('#close-stats')!.addEventListener('click', () => statsDialog.close());
app.querySelector('#close-settings')!.addEventListener('click', () => settingsDialog.close());
app.querySelector('#got-it')!.addEventListener('click', () => aboutDialog.close());
themeDialog.addEventListener('close', () => lastFocus?.focus()); aboutDialog.addEventListener('close', () => lastFocus?.focus()); statsDialog.addEventListener('close', () => lastFocus?.focus()); settingsDialog.addEventListener('close', () => lastFocus?.focus());
themeGrid.addEventListener('click', event => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-theme-choice]'); if (!button) return; controller.dispatch({ type: 'theme', theme: button.dataset.themeChoice as ThemeName }); renderThemeChoices(); themeDialog.close(); });
overlay.addEventListener('click', event => { const action = (event.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action; if (action === 'continue') controller.dispatch({ type: 'continue' }); if (action === 'restart') controller.dispatch({ type: 'restart' }); });

const input = setupInput(board, { move: direction => controller.dispatch({ type: 'move', direction }), isBlocked: () => controller.isBusy || controller.snapshot.game.status !== 'playing' });
const viewport = setupViewport();
const lifecycle = setupLifecycle(() => { input.cancel(); controller.cancelAnimation(); controller.persistNow(); }, () => { controller.persistNow(); });
const dispose = () => { input.destroy(); viewport.destroy(); lifecycle.destroy(); controller.cancelAnimation(); if (studioWindow.__dispose2048Studio === dispose) delete studioWindow.__dispose2048Studio; };
studioWindow.__dispose2048Studio = dispose;
if (import.meta.hot) import.meta.hot.dispose(dispose);
clearDevelopmentServiceWorkers();
registerPwa();
void controller.start();
