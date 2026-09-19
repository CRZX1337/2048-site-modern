# Contributing

Thanks for stopping by. This is a small, dependency-light project — please keep it that way.

## Ground rules

- **Do not change gameplay, rules, movement, merging, spawning, scoring, rendering, animations, theme designs, input, PWA, or persistence behavior** unless the change is explicitly requested and reviewed. Most contributions should be docs, tests, tooling, or accessibility improvements.
- Do not add dependencies without prior discussion. The runtime has zero dependencies; dev tooling is Vite + TypeScript + Vitest only.
- Do not commit secrets, `.env` files, or local device artifacts.

## Workflow

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Make your change in `src/`, `public/`, or `tests/`
4. Verify: `npm test` and `npm run build` (build runs `tsc --noEmit` first — type errors fail the build)
5. Open a pull request using the provided template; describe what you verified and on which browser/device

## Code conventions

- TypeScript, strict mode, 2-space indent, LF endings (see `.editorconfig`)
- Game logic stays pure and injectable (see `src/core/game.ts` taking a `RandomSource`) so it remains unit-testable
- New game behavior must come with Vitest coverage in `tests/`
- Styles live in `src/styles.css` under the matching cascade layer; keep theme rules inside their theme layer
- Follow the existing module boundaries: `core` (pure rules) → `app` (state/commands) → `render`/`input`/`platform` (effects)

## Reporting issues

Use the issue templates (bug report / feature request) and include browser + OS/device, reproduction steps, and expected vs. actual behavior.
