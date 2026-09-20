const CACHE = '2048-studio-v5';
// Deployment base path ("/2048-site-modern/" on GitHub Pages), derived from the
// worker's own scope so all cached URLs and fallbacks follow the real subpath.
const BASE = new URL(self.registration.scope).pathname;
const INDEX = `${BASE}index.html`;
const IS_DEV_HOST = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const CORE = [BASE, INDEX, `${BASE}manifest.webmanifest`, `${BASE}logo.png`, `${BASE}icon-192.png`, `${BASE}icon-512.png`, `${BASE}icon-maskable.png`, `${BASE}apple-touch-icon.png`, `${BASE}favicon-32.png`];
const ASSET_PATTERN = new RegExp(`(?:src|href)="(${BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}assets/[^"]+\\.(?:js|css))"`, 'g');

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    try {
      const shell = await fetch(INDEX, { cache: 'no-store' });
      const html = await shell.text();
      const assets = [...html.matchAll(ASSET_PATTERN)].map(match => match[1]);
      await cache.addAll(assets);
      await cache.put(INDEX, new Response(html, { headers: { 'Content-Type': 'text/html' } }));
    } catch { /* Runtime caching remains available if precaching fails. */ }
    if (IS_DEV_HOST) self.skipWaiting();
    // Production updates intentionally wait so they cannot interrupt active gameplay.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      void caches.open(CACHE).then(cache => cache.put(INDEX, copy));
      return response;
    }).catch(() => caches.match(INDEX)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok || response.type === 'opaque') {
      const copy = response.clone();
      void caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(BASE))));
});
