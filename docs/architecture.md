# Architecture

This document describes the real runtime architecture of 2048 Studio as implemented in `src/`, `public/`, and `tests/`.

## Runtime flow

```
startup → app state → commands → game core → transition metadata
  → rendering / animation → themes → persistence → PWA / lifecycle
```

### 1. Startup (`src/main.ts`)

- Imports `src/styles.css` (all themes, cascade layers).
- Builds the static shell HTML (topbar, hero/scores, board + overlay, footer, four `<dialog>`s, live region) and wraps it with the Apple theme's `composeShell`. The initial theme is always `apple`; the saved theme is applied on `controller.start()` via the first `onState` callback.
- Instantiates `AppController` with the board element, `isStandalone()`, the `prefers-reduced-motion` match, and two callbacks:
  - `onState(state, transition)` — syncs shell datasets (`data-theme`, `data-dark`, `data-standalone`), per-theme icon glyphs, score/best/stats text, board ARIA summary, score-pop animation, theme composition classes, and the win/game-over overlay.
  - `onStatus(message)` — writes to the `aria-live` region.
- Wires all buttons/dialogs/overlay actions, then sets up input, viewport, and lifecycle controllers, clears dev service workers, registers the production PWA worker, and calls `controller.start()`.
- Supports hot-reload disposal (`__dispose2048Studio`) and HMR cleanup.

### 2. Application state & commands (`src/app/`)

- `state.ts` — `AppState`: `{ game, best, theme, dark, reducedMotion, standalone, sessionMoves, sessionMerges }`.
- `commands.ts` — `AppCommand`: `move(direction)` | `restart` | `continue` | `theme(name)` | `toggle-dark`.
- `controller.ts` — `AppController`:
  - Constructor loads the save (or creates a fresh game), builds `AnimationCoordinator` + `BoardRenderer`.
  - `dispatch()` handles theme/dark switches (persist + notify), `restart` (cancels animation, fresh game, resets session counters, full renderer reset), `continue` (only from `won`), and delegates `move`.
  - `move()` is guarded by a `busy` flag and game status; no-op transitions (blocked move, still playable) return without state change. On a real change it updates best/session counters, persists, notifies, announces via `onStatus`, and renders with a generation token so stale renders can't clear `busy`.
  - `cancelAnimation()` bumps the generation, cancels the renderer, and resets the board instantly (used on restart and page backgrounding).
  - `persistNow()` is called by the lifecycle hooks.

### 3. Game core (`src/core/game.ts`)

Pure, dependency-free logic; the only impure input is an injectable `RandomSource` (defaults to `Math.random`, stubbed in tests).

- 4×4 board as a 16-element `Cell[]`; tiles `{ id, value, position }`.
- `createGame()` spawns two tiles: random empty cell, 2 at 90% / 4 at 10%.
- `move()` walks each line from the move edge, slides tiles, merges each equal pair **once** (result keeps the first source's id, both source ids recorded), accumulates `scoreDelta`, then spawns one tile if space remains.
- Returns `{ state, transition }` where `MoveTransition = { changed, moves, merges, spawned?, scoreDelta, won, over }`. `moves` are per-tile from/to positions for animation; `merges` carry source ids + result tile for the merge/consume effects.
- `won` fires once (gated by `continued`); further moves are rejected while `status === 'won'` until `continueGame()` flips back to `playing`. `over` fires when `hasMoves()` is false after a changed move — or when a blocked move arrives on an already-blocked board.
- `hasMoves()` / `describe()` are small helpers (the latter pattern is mirrored inline for the board ARIA label).

### 4. Input (`src/input/controller.ts`)

- Keyboard: arrows + WASD. Ignored when the event is default-prevented, focus is in an input/textarea/select/contenteditable, inside a `button`/`dialog`, or any dialog is open.
- Pointer swipe on the board: pointer capture on down (left button only for mouse), direction from the dominant axis on up, 24 px minimum displacement. `pointercancel` resets the gesture.
- Every gesture checks `isBlocked()` (renderer busy or game not `playing`).
- Returns `{ destroy, cancel }` for teardown and lifecycle backgrounding.

### 5. Rendering (`src/render/board.ts`)

- `BoardRenderer` owns a `Map<tileId, HTMLElement>` plus 16 static background `.cell` divs. Tiles are absolutely positioned via `--row`/`--col` custom properties; movement animates through CSS `transform` transitions.
- Per render it writes theme motion values (`--move-duration`, `--merge-duration`, `--spawn-duration`, `--move-ease`) onto the board element.
- First render or no-change transitions take the `initialize()` path (build all tile nodes). Animated renders: reposition moved tiles (`.tile--moving`), mark merge results (`.tile--merging`) and consumed sources (`.tile--consumed`), insert the spawned tile (`.tile--spawn`), then await the coordinator and reconcile the DOM (drop animation classes, remove stale nodes, refresh content/classes).
- `refreshTheme()` re-applies durations and tile classes without touching positions (used on theme/dark switches). `reset()` clears all tiles and rebuilds. `cancel()` invalidates the in-flight render token.
- Tiles expose `role="img"` + `aria-label` with their value; the board-level summary is composed in `main.ts`.

### 6. Animation (`src/render/animation.ts`)

- `AnimationCoordinator` is token-based: each `run()` bumps the token; stale completions are ignored and `cancel()` just bumps the token and clears `running`.
- Waits one `requestAnimationFrame`, then — unless reduced motion — collects `getAnimations()` from the animated elements and awaits their `finished` promises (failures swallowed); with no WAAPI animations it falls back to a double `requestAnimationFrame`. Reduced motion short-circuits to a single extra frame.
- CSS keyframes involved: `tile-spawn`, `tile-merge`, `tile-consume`, `score-pop`, `theme-crossfade`, `sheet-in`, `overlay-in`, plus the Glass `aurora-drift` ambient loop (Oldschool overrides the merge keyframes with `oldschool-tile-merge`).

### 7. Theme system (`src/themes/` + `src/styles.css`)

- `types.ts` — `ThemeName` (`apple | glass | material | oldschool | modern`) and `ThemeDefinition`: name/label/note/icon, six composition class slots (shell/header/hud/board/controls/dialogs), typography tokens, five icon glyphs (theme/mode/newGame/close/continue), motion timings, `tileClass(tile)`, `composeShell(content)`.
- `registry.ts` — `themeRegistry` + `getTheme()`; unknown names are impossible by type (no fallback needed).
- `composition.ts` — one shared `.theme-effects` layer (orbs, aurora, grain, rail, scanlines, vignette, grid; each theme's CSS only displays its own) plus the `<main class="app-shell …">` wrapper.
- Each theme module is a ~12-line data object: class strings, icon glyphs, motion timings, a `tileClass` of `theme-<name>-tile tile-<value|super>`, and a `composeShell` call.
- `src/styles.css` uses cascade layers (`reset, foundation, shared-motion, apple, glass, material, oldschool, modern, accessibility`). Foundation holds layout, board grid, tile positioning, dialogs, stats/settings, and the light default tokens; each theme layer overrides CSS variables (`--page/--ink/--muted/--line/--surface/--board/--cell/--accent`, radii, shadows, overlay bg, font stacks) and adds decorative/effect rules plus per-value tile colors, each with a `[data-dark="true"]` variant (Modern inverts: dark base, light variant on `[data-dark="false"]`).
- `main.ts` applies themes by setting `shell.dataset.theme/dark` and re-adding composition classes, with a `theme-changing` crossfade on switch.

### 8. Persistence (`src/persistence/`)

- `storage.ts` — `localStorage` key `2048-studio-save`; `loadSave()` parses + migrates (removing corrupt entries), `save()` silently tolerates unavailable storage (e.g. private browsing), `createSave()` stamps `version: 1` and `best = max(best, score)`.
- `schema.ts` — strict validators: exactly 16 cells, integer ids > 0, power-of-two values ≥ 2, in-bounds positions, non-negative score, known status, `nextId` above every tile id, unique ids and positions, `best >= score`, known theme, boolean dark. `migrateSave()` accepts only version 1 (anything else → `null`, i.e. fresh game).
- Session counters (`sessionMoves/sessionMerges`) are intentionally ephemeral.

### 9. Platform / PWA (`src/platform/`, `public/`)

- `viewport.ts` — tracks `visualViewport`/window size into `--visual-viewport-height` and a portrait/landscape dataset for CSS.
- `lifecycle.ts` — `visibilitychange` + `pagehide`: backgrounding cancels input/animation and persists; foregrounding persists.
- `pwa.ts` — standalone detection; `registerPwa()` only when service workers exist **and** `import.meta.env.PROD`, deferred to window `load`; `clearDevelopmentServiceWorkers()` unregisters workers and wipes `2048-studio-*` caches in dev.
- `public/sw.js` — cache `2048-studio-v3`; precaches shell/manifest/icons plus `/assets` bundles parsed from `index.html`; skip-waiting only on dev hosts (production updates wait); navigations network-first with cached-`index.html` fallback; other GETs cache-first with runtime caching.
- `public/manifest.webmanifest` — standalone, portrait, theme/background `#f7f4ef`, three SVG icons.

### 10. Accessibility

Board `role="grid"` with row/column counts and a live-updated textual summary; polite live region for merges/score/win/over; native `<dialog>`s with focus restore; `:focus-visible` outlines in the accent color; full game playable by keyboard; `prefers-reduced-motion` honored in both JS (coordinator) and CSS (global animation collapse).

### 11. Tests (`tests/`, Vitest)

- `game.test.ts` — core rules and transitions (see README for the case list).
- `persistence.test.ts` — schema acceptance/rejection and migration null-cases.
- No UI/DOM, animation, theme, or service-worker tests exist — those areas rely on manual/real-device validation.
