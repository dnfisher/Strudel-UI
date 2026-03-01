# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A step-sequencer drum machine UI that generates and plays [Strudel](https://strudel.cc/) live-coding patterns. Users click a visual 16-step grid per track; the app translates that into Strudel code evaluated in real time via `@strudel/web`.

## Commands

- **Dev server:** `npm run dev` (Vite, port 5173)
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **Preview production build:** `npm run preview`
- **Lint:** `npx eslint .`
- **Type check only:** `npx tsc -b`
- **Test:** `npm test` (Vitest, watch mode)
- **Test (coverage):** `npm run test:coverage`

## Testing

Vitest with jsdom environment and React Testing Library. Setup file at `src/test/setup.ts` imports `@testing-library/jest-dom` matchers. Tests use `globals: true` so no imports needed for `describe`, `it`, `expect`, etc.

## Architecture

Single-page React 19 + TypeScript app. No routing. Not a monorepo.

### State Management

Zustand 5 store in `src/store/useStore.ts` — single flat store with all app state (`tracks`, `selectedTrackId`, `isPlaying`, `bpm`) and mutation functions. Components subscribe via selector pattern: `useStore(s => s.field)`.

### Audio Pipeline

1. UI interaction → Zustand store mutation
2. `src/lib/codeGenerator.ts` translates `Track[]` + BPM into Strudel code strings
3. `src/lib/strudelBridge.ts` lazily initializes `@strudel/web` (singleton) and calls `window.evaluate()` / `window.hush()` — globals injected by Strudel after init
4. While playing, code is auto-re-evaluated on track state changes (string diff via `useRef` in `Header.tsx`)

Two code generation functions: `generateDisplayCode()` (formatted, for the preview panel) and `generatePlayableCode()` (compact, for Strudel evaluation).

### Key Modules

- `src/lib/constants.ts` — `DRUM_SOUNDS`, `TRACK_COLORS`, `createTrack()`, preset factory functions (Basic Beat, Hip-Hop, Breakbeat)
- `src/store/types.ts` — `Step`, `Effect`, `Track` interfaces
- `src/strudel-web.d.ts` — manual type declarations for `@strudel/web` (package lacks full types)

### Styling

Tailwind CSS v4 (uses Vite plugin, not PostCSS). Dark theme via CSS custom properties in `src/index.css` `@theme {}` block. Per-track accent colors from `TRACK_COLORS`.

### TypeScript

Strict mode with `erasableSyntaxOnly` and `verbatimModuleSyntax` (requires `import type` for type-only imports). Split config: `tsconfig.app.json` for `src/`, `tsconfig.node.json` for Vite config.

### Strudel Globals

`@strudel/web` injects `window.evaluate`, `window.hush`, and `window.samples` at runtime. These are accessed via `window as Record<string, unknown>` casts in `strudelBridge.ts` because the package doesn't ship full types.

### Behavioral Notes

- **First play requires network**: `strudelBridge.ts` fetches the Tidal Cycles dirt-samples from `github:tidalcycles/dirt-samples` during `initStrudel` prebake.
- **BPM range**: `setBpm` clamps to 40–300.
- **BPM → CPM**: Strudel uses cycles-per-minute; `codeGenerator.ts` converts as `cpm = bpm / 4`.
- **`setEffectValue` always enables the effect**: setting a value forces `enabled: true` on that effect.
- **Space bar**: toggles play/stop when `event.target === document.body` (handled in `Header.tsx`).
- **`getNextColor()`**: uses a module-level counter that is never reset, so colors cycle across all track additions regardless of preset loads.
