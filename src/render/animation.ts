export class AnimationCoordinator {
  private token = 0;
  private running = false;
  get isRunning() { return this.running; }

  async run(elements: HTMLElement[], reducedMotion: boolean): Promise<void> {
    const token = ++this.token;
    this.running = true;
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    if (token !== this.token) return;
    if (reducedMotion) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    } else {
      const animations = elements.flatMap(element => typeof element.getAnimations === 'function' ? element.getAnimations() : []);
      if (animations.length) await Promise.all(animations.map(animation => animation.finished.catch(() => undefined)));
      else await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }
    if (token === this.token) this.running = false;
  }

  cancel(): void { this.token++; this.running = false; }
}
