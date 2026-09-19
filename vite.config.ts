import { defineConfig } from 'vite';

export default defineConfig({
  // Repository subpath for GitHub Pages: https://crzx1337.github.io/2048-site-modern/
  base: '/2048-site-modern/',
  server: { host: '0.0.0.0', port: 5173 },
  build: { target: 'es2022' }
});
