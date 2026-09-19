export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function registerPwa(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  // BASE_URL carries the Vite `base` ("/2048-site-modern/" in production builds),
  // so registration — and the worker's default scope — follows the deploy subpath.
  const workerUrl = `${import.meta.env.BASE_URL}sw.js`;
  window.addEventListener('load', () => { void navigator.serviceWorker.register(workerUrl, { updateViaCache: 'none' }).catch(() => undefined); });
}

export function clearDevelopmentServiceWorkers(): void {
  if (!('serviceWorker' in navigator) || import.meta.env.PROD) return;
  void navigator.serviceWorker.getRegistrations().then(registrations => Promise.all(registrations.map(registration => registration.unregister())));
  void caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('2048-studio-')).map(key => caches.delete(key))));
}
