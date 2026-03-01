# Synth Tracks Design

**Date:** 2026-02-28
**Inspiration:** Switch Angel (trance / drum and bass Strudel live-coding)
**Goal:** Add synth tracks with a piano roll UI alongside existing drum tracks, enabling full trance composition — basslines, leads, arpeggios, pads.

---

## Overview

Extend the drum machine to support a second track type: `synth`. Drum tracks work exactly as now (16-step on/off grid). Synth tracks show a piano roll — rows are pitches, columns are steps — and generate Strudel `note()` patterns instead of `s()` patterns. Both track types coexist freely in the same session.

---

## 1. Data Model

### `Step` interface (extended)

```ts
interface Step {
  active: boolean;    // drum tracks only
  notes?: string[];   // synth tracks: pitches active at this step ([] = rest)
}
```

A chord is represented as multiple entries in `notes` (e.g. `['c3', 'e3', 'g3']`). A rest is an empty array. For drum tracks, `notes` is unused.

### `Track` interface (extended)

```ts
interface Track {
  // ... all existing fields unchanged ...
  type: 'drum' | 'synth';
  synth?: 'supersaw' | 'square' | 'sine' | 'triangle';
}
```

Existing drum tracks implicitly have `type: 'drum'`. The `synth` field is only meaningful when `type === 'synth'`.

### New Zustand action

```ts
toggleSynthNote: (trackId: string, stepIndex: number, note: string) => void
```

Adds the note to `step.notes` if absent; removes it if present. Sets `step.active` to `notes.length > 0`.

### New synth sounds constants

```ts
export const SYNTH_SOUNDS = [
  { id: 'supersaw', label: 'Supersaw' },
  { id: 'square',   label: 'Square'   },
  { id: 'sine',     label: 'Sine'     },
  { id: 'triangle', label: 'Triangle' },
] as const;
```

---

## 2. Piano Roll UI

### `SynthLane` component

Replaces `TrackLane` for synth tracks. Structure:

- **Track header** — identical to `TrackLane`: name, mute button, volume slider, delete, select. Adds a small synth badge (`SAW`, `SQ`, `SIN`, `TRI`) to identify the synth type at a glance.
- **Piano roll grid** — 36 rows × 16 columns.

### Piano roll grid

- **Pitch range:** C2–B4 (3 octaves, 36 notes), fixed — no scroll.
- **Orientation:** B4 at top, C2 at bottom.
- **Row labels:** Only C notes fully labeled (`C4`, `C3`, `C2`). Sharp/flat rows use a slightly darker background (like black keys on a piano) with no label.
- **Cell size:** ~10px tall × ~28px wide. Total height ~360px per synth track.
- **Active cells:** filled with the track's accent color.
- **Inactive cells:** dim background.
- **Interaction:** clicking a cell calls `toggleSynthNote(trackId, stepIndex, note)`. Multiple cells in the same column create a chord.

### `AddTrackButton` changes

Two-step flow:
1. Choose type: `Drum` | `Synth`
2. Choose sound: drum sounds (existing list) or synth type (Supersaw / Square / Sine / Triangle)

---

## 3. Code Generation

### Synth track output format

```
note("<pattern>").s("<synth>").gain(<volume>)[.effect(value)...]
```

### Pattern building rules (per step)

| Step state | Mini-notation |
|---|---|
| No notes (rest) | `~` |
| Single note | `c3` |
| Multiple notes (chord) | `[c3,e3,g3]` |

Steps joined with spaces, wrapped in `note("...")`.

### Examples

```
// Single-note bassline
note("c2 ~ ~ ~ c2 ~ ~ ~ g1 ~ ~ ~ a1 ~ ~ ~").s("sine").gain(0.8)

// Chord lead
note("[c4,e4,g4] ~ ~ ~ [a3,c4,e4] ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~").s("supersaw").gain(0.7).room(0.3)

// Arpeggio
note("c4 ~ e4 ~ g4 ~ e4 ~").s("square").gain(0.6).delay(0.3)
```

### Effects

Effects apply identically to synth tracks — same `.lpf()`, `.room()`, `.delay()`, `.distort()`, `.pan()` chain appended after the base pattern. No changes to effect data model or `EffectSlider` component.

### BPM/CPM

Unchanged — existing `cpm = bpm / 4` conversion applies to all tracks.

---

## 4. Testing

### `codeGenerator.test.ts` (new cases)
- Single note per step → correct `note("c3 ~ e3 ~")` output
- Chord at one step → `[c3,e3]` notation
- All-empty synth track → no output (silence)
- Effects on synth track append correctly

### `SynthLane.test.tsx` (new file)
- Clicking a cell calls `toggleSynthNote` with correct trackId, stepIndex, note
- Active cells have track accent color applied
- Track header renders correct synth badge

### `useStore` (new cases)
- `toggleSynthNote` adds note to empty step
- `toggleSynthNote` removes note already present
- `toggleSynthNote` handles chords (two notes at same step coexist)

### `constants.test.ts` (new cases)
- `SYNTH_SOUNDS` exists with correct ids and labels

---

## Files Affected

| File | Change |
|---|---|
| `src/store/types.ts` | Add `notes?: string[]` to `Step`; add `type` and `synth` to `Track` |
| `src/store/useStore.ts` | Add `toggleSynthNote` action |
| `src/lib/constants.ts` | Add `SYNTH_SOUNDS`; update `createTrack` to accept type |
| `src/lib/codeGenerator.ts` | Add synth branch in pattern generation |
| `src/components/SynthLane.tsx` | New component |
| `src/components/AddTrackButton.tsx` | Two-step drum/synth selection flow |
| `src/App.tsx` | Render `SynthLane` vs `TrackLane` based on track type |
| `src/components/SynthLane.test.tsx` | New test file |
| `src/lib/codeGenerator.test.ts` | New synth test cases |
| `src/lib/constants.test.ts` | New `SYNTH_SOUNDS` test cases |
| `src/store/useStore` tests | New `toggleSynthNote` test cases |
