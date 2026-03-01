# V2 Features Design

**Date:** 2026-03-01
**Goal:** Six interconnected features that elevate Strudel UI into a capable trance/DnB production tool, inspired by Switch Angel's live-coding workflow.

---

## 1. Step Playhead

**Mechanism:** A `usePlayhead(isPlaying)` hook uses `requestAnimationFrame` + `getTime()` imported from `@strudel/core` to derive the current step on every animation frame:

```ts
currentStep = Math.floor((getTime() % 1) * 16)  // 0–15, null when stopped
```

**Rendering:**
- Both `TrackLane` and `SynthLane` receive `activeStep: number | null` as a prop.
- Drum tracks: the active step cell gets a bright white top border.
- Piano roll: the active column gets a subtle glow overlay across all rows.
- In collapsed mode (see Feature 2): active step is shown in the mini strip.

**Files:** `src/lib/usePlayhead.ts` (new hook), `src/components/TrackLane.tsx`, `src/components/SynthLane.tsx`, `src/App.tsx` (passes `activeStep` to tracks).

---

## 2. Track Collapse / Minimize

**Data model:** `Track` gains `collapsed: boolean` (default `false`).

**Store action:** `toggleCollapse(trackId: string) => void`

**Expanded state:** unchanged — full step grid or piano roll.

**Collapsed state:** Header row only + a **mini strip** of 16 cells (~4px tall each). Mini strip cells show:
- Active steps: dimly lit in the track's accent color
- Playhead cursor: the current step column highlighted brighter

Total collapsed height: ~50px. A track with 10+ loaded remains fully navigable without scrolling.

**UI:** A chevron button (`▶` collapsed / `▼` expanded) sits to the left of the color dot in both `TrackLane` and `SynthLane`. No data is lost when collapsed.

**Files:** `src/store/types.ts`, `src/store/useStore.ts`, `src/components/TrackLane.tsx`, `src/components/SynthLane.tsx`.

---

## 3. Sample Banks

**Loading:** Four repos added to `strudelBridge.ts`'s `prebake` function alongside the existing dirt-samples load:

```ts
samples('github:switchangel/beginningtrance')  // ctvox — 19 vocal samples
samples('github:switchangel/pad')               // swpad — 5 pad textures
samples('github:switchangel/breaks')            // breaks — 5 breakbeats
samples('github:eddyflux/crate')                // crate_bd, crate_sd, crate_hh,
                                                // crate_oh, crate_cp, crate_perc,
                                                // crate_tb, crate_cr, crate_sh,
                                                // crate_bell, crate_block, crate_bongo,
                                                // crate_clave, crate_conga, crate_djembe,
                                                // crate_rd, crate_rim, crate_stick (18 total)
```

Loading is lazy — `prebake` fires once on first play, same as now.

**UI:** `AddTrackButton` Drum submenu splits into two groups:
- **Classic** — existing 11 `DRUM_SOUNDS`
- **Sample Packs** — new sounds with display names

New sounds added to `DRUM_SOUNDS` (or a new `SAMPLE_PACK_SOUNDS` constant):

| Sound ID | Label |
|---|---|
| `ctvox` | Vox |
| `swpad` | SW Pad |
| `breaks` | Break |
| `crate_bd` | Crate Kick |
| `crate_sd` | Crate Snare |
| `crate_hh` | Crate Hat |
| `crate_oh` | Crate Open Hat |
| `crate_cp` | Crate Clap |
| `crate_perc` | Crate Perc |

**Files:** `src/lib/strudelBridge.ts`, `src/lib/constants.ts`, `src/components/AddTrackButton.tsx`.

---

## 4. Expanded Effects

The existing 5 effects stay unchanged. Nine new effects added to `createDefaultEffects()`:

| Name | Param | Min | Max | Step | Default |
|---|---|---|---|---|---|
| Resonance | `lpq` | 0 | 50 | 1 | 0 |
| High Pass | `hpf` | 0 | 20000 | 100 | 0 |
| HP Resonance | `hpq` | 0 | 10 | 0.1 | 0 |
| Delay Time | `delaytime` | 0 | 1 | 0.05 | 0.25 |
| Delay Feedback | `delayfeedback` | 0 | 1 | 0.05 | 0 |
| Bitcrusher | `crush` | 2 | 16 | 1 | 8 |
| Attack | `attack` | 0 | 2 | 0.05 | 0 |
| Release | `release` | 0 | 4 | 0.1 | 0 |
| Speed | `speed` | 0.25 | 4 | 0.05 | 1 |

All default to `enabled: false`. The FX panel grid expands naturally — 14 effects displayed in the existing responsive grid layout.

**Files:** `src/lib/constants.ts`, `src/lib/constants.test.ts`.

---

## 5. Patterned Effects (Effect Chaining)

**Data model:** `Effect` gains two new fields:

```ts
patternMode: boolean  // false by default
pattern: string       // Strudel mini-notation, e.g. "200 400 800 1600"
```

**UI:** Each `EffectSlider` gets a small `~` toggle button next to its label. Clicking switches between:
- **Slider mode** (default): the existing range slider + value display
- **Pattern mode**: a compact text input pre-filled with the current value as a string

In pattern mode the text input is free-form Strudel mini-notation. Examples for trance:
- Filter sweep: `"200 400 800 1600"`
- Cycle through values: `"<200 800>"`
- Held + burst: `"200!3 1600"`

**Code generation:** When `effect.patternMode && effect.pattern`, the code generator outputs:
```
.lpf("200 400 800 1600")
```
instead of `.lpf(800)`. The pattern string is passed directly to Strudel's evaluator, so the full mini-notation syntax works.

**Store action:** `setEffectPattern(trackId, effectParam, pattern)` and `toggleEffectPatternMode(trackId, effectParam)` added to the store.

**Files:** `src/store/types.ts`, `src/store/useStore.ts`, `src/lib/codeGenerator.ts`, `src/components/EffectSlider.tsx`.

---

## 6. Synth Octave Picker

**Data model:** `Track` gains `octave: number` (default `3`, range 1–7).

**Store action:** `setSynthOctave(trackId: string, octave: number) => void` (clamps to 1–7).

**Piano roll change:** `PIANO_ROLL_NOTES` expanded from 36 notes (C2–B4) to 84 notes (C1–B7). Each synth track renders only its 12-note window: `notes.filter(n => n.note.endsWith(String(track.octave)))`.

**Row height:** Increased from 10px to 14px per row. One octave = 12 rows × 14px = 168px — well under the old 360px.

**UI:** Octave picker in the `SynthLane` header, between the synth badge and mute button:

```
[▶ • SUPERSAW  < C3 >  SAW  M ──vol── ×]
```

`<` and `>` buttons decrement/increment `track.octave`. The label shows the root note of the visible octave (`C3`, `C4`, etc.).

**Note persistence:** Notes outside the current octave are preserved in `step.notes` — switching octaves reveals them. This supports multi-octave melodies built by switching the picker, placing notes, switching back.

**Files:** `src/store/types.ts`, `src/store/useStore.ts`, `src/lib/constants.ts`, `src/components/SynthLane.tsx`, `src/components/SynthLane.test.tsx`.

---

## Files Affected Summary

| File | Changes |
|---|---|
| `src/store/types.ts` | Add `collapsed`, `octave` to `Track`; add `patternMode`, `pattern` to `Effect` |
| `src/store/useStore.ts` | Add `toggleCollapse`, `setSynthOctave`, `setEffectPattern`, `toggleEffectPatternMode` |
| `src/lib/constants.ts` | Add 9 new effects to `createDefaultEffects`; expand `PIANO_ROLL_NOTES` to C1–B7; add `SAMPLE_PACK_SOUNDS` |
| `src/lib/constants.test.ts` | Update effect count tests; add `SAMPLE_PACK_SOUNDS` tests |
| `src/lib/codeGenerator.ts` | Handle `patternMode` in effect chain |
| `src/lib/codeGenerator.test.ts` | Add patterned effect tests |
| `src/lib/strudelBridge.ts` | Add 4 sample repo loads to `prebake` |
| `src/lib/usePlayhead.ts` | New hook |
| `src/components/TrackLane.tsx` | Add collapse toggle, mini strip, `activeStep` prop |
| `src/components/SynthLane.tsx` | Add collapse toggle, mini strip, octave picker, `activeStep` prop, 1-octave view |
| `src/components/EffectSlider.tsx` | Add pattern mode toggle + text input |
| `src/components/AddTrackButton.tsx` | Split Drum submenu into Classic / Sample Packs |
| `src/App.tsx` | Pass `activeStep` from `usePlayhead` to all tracks |
| `src/store/useStore.test.ts` | New action tests |
| `src/components/SynthLane.test.tsx` | Update for octave picker + collapse |
| `src/components/TrackLane.test.tsx` | Update for collapse |
| `src/components/EffectSlider.test.tsx` | Add pattern mode tests |
