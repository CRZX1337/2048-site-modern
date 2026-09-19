import type { Direction } from '../core/game';

export type InputController = { destroy: () => void; cancel: () => void };
export type InputHandlers = { move: (direction: Direction) => void; isBlocked: () => boolean };
const keys: Record<string, Direction> = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left', w: 'up', a: 'left', s: 'down', d: 'right' };

export function setupInput(board: HTMLElement, handlers: InputHandlers): InputController {
  let start: { x: number; y: number } | null = null;
  const onKey = (event: KeyboardEvent) => {
    const target = event.target;
    const direction = keys[event.key];
    const isEditable = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable);
    const isControl = target instanceof HTMLElement && target.closest('dialog,button,[contenteditable="true"]');
    const dialogOpen = document.querySelector('dialog[open]') !== null;
    if (event.defaultPrevented || !direction || isEditable || isControl || dialogOpen) return;
    event.preventDefault();
    event.stopPropagation();
    if (!handlers.isBlocked()) handlers.move(direction);
  };
  const onDown = (event: PointerEvent) => { if (event.pointerType === 'mouse' && event.button !== 0) return; start = { x: event.clientX, y: event.clientY }; board.setPointerCapture(event.pointerId); };
  const onUp = (event: PointerEvent) => { if (!start) return; const dx = event.clientX - start.x; const dy = event.clientY - start.y; start = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24 || handlers.isBlocked()) return; handlers.move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); };
  const onCancel = () => { start = null; };
  document.addEventListener('keydown', onKey); board.addEventListener('pointerdown', onDown); board.addEventListener('pointerup', onUp); board.addEventListener('pointercancel', onCancel);
  return { cancel: onCancel, destroy() { document.removeEventListener('keydown', onKey); board.removeEventListener('pointerdown', onDown); board.removeEventListener('pointerup', onUp); board.removeEventListener('pointercancel', onCancel); } };
}
