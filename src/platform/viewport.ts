export type ViewportController = { destroy: () => void };

export function setupViewport(): ViewportController {
  const update = () => {
    const viewport = window.visualViewport;
    const height = viewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`);
    document.documentElement.dataset.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  };
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('orientationchange', update, { passive: true });
  window.visualViewport?.addEventListener('resize', update, { passive: true });
  update();
  return { destroy() { window.removeEventListener('resize', update); window.removeEventListener('orientationchange', update); window.visualViewport?.removeEventListener('resize', update); } };
}
