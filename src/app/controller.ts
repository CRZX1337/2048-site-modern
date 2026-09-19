import { continueGame, createGame, move, type MoveTransition, type Direction } from '../core/game';
import { createSave, loadSave, save } from '../persistence/storage';
import { getTheme } from '../themes/registry';
import { AnimationCoordinator, BoardRenderer } from '../render';
import type { AppCommand } from './commands';
import type { AppState } from './state';

export type AppControllerOptions = {
  board: HTMLElement;
  standalone: boolean;
  reducedMotion: boolean;
  onState: (state: AppState, transition: MoveTransition | null) => void;
  onStatus: (message: string) => void;
};

export class AppController {
  readonly renderer: BoardRenderer;
  readonly coordinator: AnimationCoordinator;
  private state: AppState;
  private busy = false;
  private renderGeneration = 0;
  private readonly onState: AppControllerOptions['onState'];
  private readonly onStatus: AppControllerOptions['onStatus'];

  constructor(options: AppControllerOptions) {
    const saved = loadSave();
    this.state = { game: saved?.game ?? createGame(), best: saved?.best ?? 0, theme: saved?.theme ?? 'apple', dark: saved?.dark ?? false, reducedMotion: options.reducedMotion, standalone: options.standalone, sessionMoves: 0, sessionMerges: 0 };
    this.onState = options.onState;
    this.onStatus = options.onStatus;
    this.coordinator = new AnimationCoordinator();
    this.renderer = new BoardRenderer(options.board, this.coordinator);
  }

  get snapshot(): AppState { return this.state; }
  get isBusy(): boolean { return this.busy; }
  get theme() { return getTheme(this.state.theme); }

  async start(): Promise<void> { this.onState(this.state, null); await this.renderer.render(this.state.game, null, this.theme, this.state.reducedMotion); }

  dispatch(command: AppCommand): void {
    if (command.type === 'theme') { this.state = { ...this.state, theme: command.theme }; this.persist(); this.onState(this.state, null); return; }
    if (command.type === 'toggle-dark') { this.state = { ...this.state, dark: !this.state.dark }; this.persist(); this.onState(this.state, null); return; }
    if (command.type === 'restart') { this.cancelAnimation(); this.state = { ...this.state, game: createGame(), sessionMoves: 0, sessionMerges: 0 }; this.persist(); this.onState(this.state, null); void this.renderer.reset(this.state.game, this.theme); this.onStatus('New game started.'); return; }
    if (command.type === 'continue') { if (this.state.game.status !== 'won') return; this.state = { ...this.state, game: continueGame(this.state.game) }; this.persist(); this.onState(this.state, null); this.onStatus('Continuing after 2048.'); return; }
    if (command.type === 'move') this.move(command.direction);
  }

  cancelAnimation(): void { this.renderGeneration++; this.renderer.cancel(); this.busy = false; void this.renderer.reset(this.state.game, this.theme); }
  persistNow(): void { this.persist(); }

  private move(direction: Direction): void {
    if (this.busy || this.state.game.status !== 'playing') return;
    const result = move(this.state.game, direction);
    if (!result.transition.changed && !result.transition.over) return;
    this.state = { ...this.state, game: result.state, best: Math.max(this.state.best, result.state.score), sessionMoves: this.state.sessionMoves + 1, sessionMerges: this.state.sessionMerges + result.transition.merges.length };
    this.busy = true;
    const generation = ++this.renderGeneration;
    this.persist();
    this.onState(this.state, result.transition);
    this.onStatus(`${result.transition.scoreDelta ? `Merged for ${result.transition.scoreDelta}. ` : ''}Score ${this.state.game.score}.`);
    if (result.transition.changed) void this.renderer.render(this.state.game, result.transition, this.theme, this.state.reducedMotion).finally(() => { if (generation === this.renderGeneration) this.busy = false; });
    else this.busy = false;
  }

  private persist(): void { save(createSave(this.state.game, this.state.best, this.state.theme, this.state.dark)); }
}
