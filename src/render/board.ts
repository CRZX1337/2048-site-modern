import type { GameState, MoveTransition, Tile } from '../core/game';
import type { ThemeDefinition } from '../themes/types';
import { AnimationCoordinator } from './animation';

export class BoardRenderer {
  private readonly tiles = new Map<number, HTMLElement>();
  private initialized = false;
  private renderToken = 0;
  constructor(private readonly board: HTMLElement, private readonly coordinator: AnimationCoordinator) {
    for (let i = 0; i < 16; i++) { const cell = document.createElement('div'); cell.className = 'cell'; cell.setAttribute('role', 'presentation'); cell.setAttribute('aria-hidden', 'true'); board.append(cell); }
  }

  async render(state: GameState, transition: MoveTransition | null, theme: ThemeDefinition, reducedMotion: boolean): Promise<void> {
    const renderToken = ++this.renderToken;
    this.board.style.setProperty('--move-duration', `${theme.motion.moveMs}ms`);
    this.board.style.setProperty('--merge-duration', `${theme.motion.mergeMs}ms`);
    this.board.style.setProperty('--spawn-duration', `${theme.motion.spawnMs}ms`);
    this.board.style.setProperty('--move-ease', theme.motion.easing);
    if (!this.initialized || !transition?.changed) { this.initialize(state, theme); return; }
    const current = new Map<number, Tile>();
    state.cells.forEach(tile => { if (tile) current.set(tile.id, tile); });
    const animated: HTMLElement[] = [];
    for (const move of transition.moves) {
      const element = this.tiles.get(move.id);
      const tile = current.get(move.id);
      if (!element || !tile) continue;
      this.setPosition(element, tile);
      element.classList.add('tile--moving');
      animated.push(element);
    }
    for (const merge of transition.merges) {
      const resultElement = this.tiles.get(merge.result.id);
      if (resultElement) { resultElement.classList.add('tile--merging'); animated.push(resultElement); }
      for (const sourceId of merge.sources) {
        const source = this.tiles.get(sourceId);
        if (source && sourceId !== merge.result.id) { this.setPosition(source, merge.result); source.classList.add('tile--consumed'); animated.push(source); }
      }
    }
    if (transition.spawned) {
      const element = this.ensureTile(transition.spawned, theme);
      element.classList.add('tile--spawn');
      animated.push(element);
    }
    for (const [id, tile] of current) {
      if (!this.tiles.has(id)) { const element = this.ensureTile(tile, theme); this.setPosition(element, tile); }
      else this.updateContent(this.tiles.get(id)!, tile, theme);
    }
    await this.coordinator.run(animated, reducedMotion);
    if (renderToken !== this.renderToken) return;
    for (const element of animated) element.classList.remove('tile--moving', 'tile--merging', 'tile--consumed', 'tile--spawn');
    for (const [id, element] of this.tiles) if (!current.has(id)) { element.remove(); this.tiles.delete(id); }
    for (const [id, tile] of current) this.updateContent(this.tiles.get(id)!, tile, theme);
  }

  cancel(): void { this.renderToken++; this.coordinator.cancel(); }

  refreshTheme(state: GameState, theme: ThemeDefinition): void {
    this.board.style.setProperty('--move-duration', `${theme.motion.moveMs}ms`);
    this.board.style.setProperty('--merge-duration', `${theme.motion.mergeMs}ms`);
    this.board.style.setProperty('--spawn-duration', `${theme.motion.spawnMs}ms`);
    this.board.style.setProperty('--move-ease', theme.motion.easing);
    for (const tile of state.cells) if (tile) {
      const element = this.tiles.get(tile.id);
      if (element) this.updateContent(element, tile, theme);
    }
  }

  async reset(state: GameState, theme: ThemeDefinition): Promise<void> {
    this.renderToken++;
    this.coordinator.cancel();
    for (const element of this.tiles.values()) element.remove();
    this.tiles.clear();
    this.initialized = false;
    this.initialize(state, theme);
  }

  private initialize(state: GameState, theme: ThemeDefinition) {
    for (const tile of state.cells) if (tile) { const element = this.ensureTile(tile, theme); this.setPosition(element, tile); }
    this.initialized = true;
  }
  private ensureTile(tile: Tile, theme: ThemeDefinition): HTMLElement {
    const existing = this.tiles.get(tile.id); if (existing) return existing;
    const element = document.createElement('div'); element.className = `tile ${theme.tileClass(tile)}`; element.dataset.id = String(tile.id); element.setAttribute('role', 'img'); element.setAttribute('aria-label', `${tile.value}`); this.board.append(element); this.tiles.set(tile.id, element); return element;
  }
  private updateContent(element: HTMLElement, tile: Tile, theme: ThemeDefinition) {
    const animationClasses = ['tile--moving', 'tile--merging', 'tile--consumed', 'tile--spawn'].filter(className => element.classList.contains(className));
    const className = ['tile', theme.tileClass(tile), ...animationClasses].join(' ');
    if (element.className !== className) element.className = className;
    const value = String(tile.value);
    if (element.textContent !== value) element.textContent = value;
    if (element.dataset.id !== String(tile.id)) element.dataset.id = String(tile.id);
    if (element.getAttribute('aria-label') !== value) element.setAttribute('aria-label', value);
    this.setPosition(element, tile);
  }
  private setPosition(element: HTMLElement, tile: Tile) {
    const row = String(tile.position.row); const col = String(tile.position.col);
    if (element.style.getPropertyValue('--row') !== row) element.style.setProperty('--row', row);
    if (element.style.getPropertyValue('--col') !== col) element.style.setProperty('--col', col);
  }
}
