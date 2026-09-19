export type LifecycleController = { destroy: () => void; isBackgrounded: () => boolean };

export function setupLifecycle(onBackground: () => void, onForeground: () => void): LifecycleController {
  let backgrounded = document.visibilityState === 'hidden';
  const onVisibility = () => { backgrounded = document.visibilityState === 'hidden'; if (backgrounded) onBackground(); else onForeground(); };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onBackground);
  return { isBackgrounded: () => backgrounded, destroy() { document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('pagehide', onBackground); } };
}
