# Synth Tracks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add piano-roll-based synth tracks (supersaw, square, sine, triangle) that coexist with drum tracks, enabling trance/DnB composition in Strudel UI.

**Architecture:** Extend `Track` with `type: 'drum' | 'synth'` and `Step` with `notes?: string[]`. Synth tracks render a `SynthLane` with a fixed 36-row × 16-column piano roll (C2–B4). The code generator branches on track type: drum tracks use `s()` patterns, synth tracks use `note().s()` patterns with rests and chord notation.

**Tech Stack:** React 19, TypeScript (strict + `erasableSyntaxOnly` + `verbatimModuleSyntax`), Zustand 5, Tailwind CSS v4 (Vite plugin, not PostCSS), Vitest + React Testing Library. Always use `import type` for type-only imports. Run tests with `npm test -- --run`.

---

### Task 1: Extend types and update test helpers

**Files:**
- Modify: `src/store/types.ts`
- Modify: `src/lib/codeGenerator.test.ts`
- Modify: `src/components/TrackLane.test.tsx`

**Step 1: Update the Step and Track interfaces**

Replace the contents of `src/store/types.ts`:

```ts
export interface Step {
  active: boolean;
  notes?: string[];
}

export interface Effect {
  name: string;
  param: string;
  value: number;
  min: number;
  max: number;
  step: number;
  enabled: boolean;
}

export interface Track {
  id: string;
  sound: string;
  label: string;
  steps: Step[];
  effects: Effect[];
  muted: boolean;
  volume: number;
  color: string;
  type: 'drum' | 'synth';
  synth?: string;
}
```

**Step 2: Run type check to identify broken helpers**

```
npx tsc -b 2>&1 | head -40
```

Expected: TypeScript errors about `makeTrack` missing `type` field in test files.

**Step 3: Add `type: 'drum'` to `makeTrack` in `src/lib/codeGenerator.test.ts`**

Find the `makeTrack` helper (around line 18) and add `type: 'drum'` before the spread:

```ts
function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1',
    sound: 'bd',
    label: 'Kick',
    steps: Array.from({ length: 16 }, () => ({ active: false })),
    effects: [],
    muted: false,
    volume: 1,
    color: '#3b82f6',
    type: 'drum',
    ...overrides,
  }
}
```

**Step 4: Add `type: 'drum'` to `makeTrack` in `src/components/TrackLane.test.tsx`**

Same change — add `type: 'drum'` to the returned object in the `makeTrack` helper (around line 8).

**Step 5: Run type check again**

```
npx tsc -b 2>&1 | head -40
```

Expected: No errors related to missing `type` field.

**Step 6: Run all tests**

```
npm test -- --run
```

Expected: All existing tests pass.

**Step 7: Commit**

```bash
git add src/store/types.ts src/lib/codeGenerator.test.ts src/components/TrackLane.test.tsx
git commit -m "feat: extend Step and Track types for synth support"
```

---

### Task 2: Add SYNTH_SOUNDS, PIANO_ROLL_NOTES, and createSynthTrack

**Files:**
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/constants.test.ts`

**Step 1: Write the failing tests**

Add these imports and test suites to `src/lib/constants.test.ts`. Append after the existing imports:

```ts
import {
  // keep existing imports...
  SYNTH_SOUNDS,
  PIANO_ROLL_NOTES,
  createSynthTrack,
} from './constants'
```

Append these describe blocks at the end of the file:

```ts
describe('SYNTH_SOUNDS', () => {
  it('contains 4 sounds', () => {
    expect(SYNTH_SOUNDS).toHaveLength(4)
  })

  it('has supersaw, square, sine, triangle ids in order', () => {
    expect(SYNTH_SOUNDS.map(s => s.id)).toEqual(['supersaw', 'square', 'sine', 'triangle'])
  })

  it('each sound has a truthy id and label', () => {
    for (const s of SYNTH_SOUNDS) {
      expect(s.id).toBeTruthy()
      expect(s.label).toBeTruthy()
    }
  })
})

describe('PIANO_ROLL_NOTES', () => {
  it('contains 36 notes (3 octaves × 12)', () => {
    expect(PIANO_ROLL_NOTES).toHaveLength(36)
  })

  it('starts at b4 and ends at c2', () => {
    expect(PIANO_ROLL_NOTES[0].note).toBe('b4')
    expect(PIANO_ROLL_NOTES[35].note).toBe('c2')
  })

  it('marks sharp/flat notes as black keys', () => {
    const blackNotes = PIANO_ROLL_NOTES.filter(n => n.isBlack).map(n => n.note)
    expect(blackNotes).toContain('a#4')
    expect(blackNotes).toContain('c#3')
    expect(blackNotes).toContain('f#2')
    expect(blackNotes).not.toContain('c4')
    expect(blackNotes).not.toContain('e3')
    expect(blackNotes).not.toContain('b2')
  })

  it('labels C notes with octave number', () => {
    const cNotes = PIANO_ROLL_NOTES.filter(n => /^c\d$/.test(n.note))
    for (const c of cNotes) {
      expect(c.label).toMatch(/^C\d$/)
    }
  })

  it('has exactly 15 black key notes (5 per octave × 3 octaves)', () => {
    expect(PIANO_ROLL_NOTES.filter(n => n.isBlack)).toHaveLength(15)
  })
})

describe('createSynthTrack', () => {
  it('creates a track with type synth', () => {
    expect(createSynthTrack('supersaw').type).toBe('synth')
  })

  it('assigns the synth field', () => {
    expect(createSynthTrack('supersaw').synth).toBe('supersaw')
    expect(createSynthTrack('sine').synth).toBe('sine')
  })

  it('creates 16 steps all with empty notes arrays and active false', () => {
    const t = createSynthTrack('supersaw')
    expect(t.steps).toHaveLength(16)
    for (const step of t.steps) {
      expect(step.active).toBe(false)
      expect(step.notes).toEqual([])
    }
  })

  it('uses the synth id as sound', () => {
    expect(createSynthTrack('supersaw').sound).toBe('supersaw')
  })

  it('uppercases synth id as label', () => {
    expect(createSynthTrack('supersaw').label).toBe('SUPERSAW')
  })

  it('has volume 0.8 by default', () => {
    expect(createSynthTrack('supersaw').volume).toBe(0.8)
  })

  it('is not muted by default', () => {
    expect(createSynthTrack('supersaw').muted).toBe(false)
  })

  it('creates 5 default effects', () => {
    expect(createSynthTrack('supersaw').effects).toHaveLength(5)
  })

  it('generates a unique UUID id each call', () => {
    expect(createSynthTrack('supersaw').id).not.toBe(createSynthTrack('supersaw').id)
  })
})
```

**Step 2: Run to see them fail**

```
npm test -- --run src/lib/constants.test.ts
```

Expected: FAIL — `SYNTH_SOUNDS`, `PIANO_ROLL_NOTES`, `createSynthTrack` not exported.

**Step 3: Implement in `src/lib/constants.ts`**

First, add `type: 'drum'` to the existing `createTrack` return value (find the return statement and add the field):

```ts
export function createTrack(sound: string): Track {
  const soundInfo = DRUM_SOUNDS.find(s => s.id === sound);
  return {
    id: crypto.randomUUID(),
    sound,
    label: soundInfo?.label ?? sound.toUpperCase(),
    steps: Array.from({ length: 16 }, () => ({ active: false })),
    effects: createDefaultEffects(),
    muted: false,
    volume: 0.8,
    color: getNextColor(),
    type: 'drum',
  };
}
```

Then append these new exports at the end of the file:

```ts
export const SYNTH_SOUNDS = [
  { id: 'supersaw', label: 'Supersaw' },
  { id: 'square',   label: 'Square'   },
  { id: 'sine',     label: 'Sine'     },
  { id: 'triangle', label: 'Triangle' },
] as const;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const BLACK_KEY_NAMES = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);

export const PIANO_ROLL_NOTES: Array<{ note: string; label: string; isBlack: boolean }> = [];
for (let octave = 4; octave >= 2; octave--) {
  for (let i = 11; i >= 0; i--) {
    const name = NOTE_NAMES[i];
    const isBlack = BLACK_KEY_NAMES.has(name);
    const noteStr = name.toLowerCase().replace('#', '#') + octave;
    const label = (name === 'C') ? `C${octave}` : name;
    PIANO_ROLL_NOTES.push({ note: noteStr, label, isBlack });
  }
}

export function createSynthTrack(synth: string): Track {
  return {
    id: crypto.randomUUID(),
    sound: synth,
    label: synth.toUpperCase(),
    steps: Array.from({ length: 16 }, () => ({ active: false, notes: [] })),
    effects: createDefaultEffects(),
    muted: false,
    volume: 0.8,
    color: getNextColor(),
    type: 'synth',
    synth,
  };
}
```

**Step 4: Run tests**

```
npm test -- --run src/lib/constants.test.ts
```

Expected: All pass.

**Step 5: Run all tests**

```
npm test -- --run
```

Expected: All pass.

**Step 6: Commit**

```bash
git add src/lib/constants.ts src/lib/constants.test.ts
git commit -m "feat: add SYNTH_SOUNDS, PIANO_ROLL_NOTES, createSynthTrack"
```

---

### Task 3: Add addSynthTrack and toggleSynthNote to the Zustand store

**Files:**
- Modify: `src/store/useStore.ts`
- Create: `src/store/useStore.test.ts`

**Step 1: Write the failing tests**

Create `src/store/useStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './useStore'

beforeEach(() => {
  useStore.setState({ tracks: [], selectedTrackId: null, isPlaying: false, bpm: 120 })
})

describe('addSynthTrack', () => {
  it('adds a synth track with the given synth type', () => {
    useStore.getState().addSynthTrack('supersaw')
    const tracks = useStore.getState().tracks
    expect(tracks).toHaveLength(1)
    expect(tracks[0].type).toBe('synth')
    expect(tracks[0].synth).toBe('supersaw')
  })

  it('appends to existing tracks without affecting them', () => {
    useStore.getState().addSynthTrack('supersaw')
    useStore.getState().addSynthTrack('sine')
    expect(useStore.getState().tracks).toHaveLength(2)
    expect(useStore.getState().tracks[1].synth).toBe('sine')
  })
})

describe('toggleSynthNote', () => {
  it('adds a note to an empty step', () => {
    useStore.getState().addSynthTrack('supersaw')
    const trackId = useStore.getState().tracks[0].id
    useStore.getState().toggleSynthNote(trackId, 0, 'c3')
    const step = useStore.getState().tracks[0].steps[0]
    expect(step.notes).toContain('c3')
    expect(step.active).toBe(true)
  })

  it('removes a note already present (toggle off)', () => {
    useStore.getState().addSynthTrack('supersaw')
    const trackId = useStore.getState().tracks[0].id
    useStore.getState().toggleSynthNote(trackId, 0, 'c3')
    useStore.getState().toggleSynthNote(trackId, 0, 'c3')
    const step = useStore.getState().tracks[0].steps[0]
    expect(step.notes).not.toContain('c3')
    expect(step.active).toBe(false)
  })

  it('allows multiple notes at the same step (chord)', () => {
    useStore.getState().addSynthTrack('supersaw')
    const trackId = useStore.getState().tracks[0].id
    useStore.getState().toggleSynthNote(trackId, 0, 'c3')
    useStore.getState().toggleSynthNote(trackId, 0, 'e3')
    const step = useStore.getState().tracks[0].steps[0]
    expect(step.notes).toContain('c3')
    expect(step.notes).toContain('e3')
    expect(step.active).toBe(true)
  })

  it('removing one note from a chord keeps step active', () => {
    useStore.getState().addSynthTrack('supersaw')
    const trackId = useStore.getState().tracks[0].id
    useStore.getState().toggleSynthNote(trackId, 0, 'c3')
    useStore.getState().toggleSynthNote(trackId, 0, 'e3')
    useStore.getState().toggleSynthNote(trackId, 0, 'c3')
    const step = useStore.getState().tracks[0].steps[0]
    expect(step.notes).not.toContain('c3')
    expect(step.notes).toContain('e3')
    expect(step.active).toBe(true)
  })

  it('only affects the specified track', () => {
    useStore.getState().addSynthTrack('supersaw')
    useStore.getState().addSynthTrack('sine')
    const [track1, track2] = useStore.getState().tracks
    useStore.getState().toggleSynthNote(track1.id, 0, 'c3')
    expect(useStore.getState().tracks[1].id).toBe(track2.id)
    expect(useStore.getState().tracks[1].steps[0].notes ?? []).not.toContain('c3')
  })

  it('only affects the specified step index', () => {
    useStore.getState().addSynthTrack('supersaw')
    const trackId = useStore.getState().tracks[0].id
    useStore.getState().toggleSynthNote(trackId, 2, 'c3')
    expect(useStore.getState().tracks[0].steps[0].notes ?? []).not.toContain('c3')
    expect(useStore.getState().tracks[0].steps[2].notes).toContain('c3')
  })
})
```

**Step 2: Run to see them fail**

```
npm test -- --run src/store/useStore.test.ts
```

Expected: FAIL — `addSynthTrack` and `toggleSynthNote` not in store.

**Step 3: Update `src/store/useStore.ts`**

Add `createSynthTrack` to the import line:

```ts
import { createTrack, createSynthTrack, createPresetBasicBeat } from '../lib/constants';
```

Add to the `AppState` interface:

```ts
addSynthTrack: (synth: string) => void;
toggleSynthNote: (trackId: string, stepIndex: number, note: string) => void;
```

Add to the `create` call (after the existing `addTrack` implementation):

```ts
addSynthTrack: (synth) => set(state => ({
  tracks: [...state.tracks, createSynthTrack(synth)],
})),

toggleSynthNote: (trackId, stepIndex, note) => set(state => ({
  tracks: state.tracks.map(t => {
    if (t.id !== trackId) return t;
    return {
      ...t,
      steps: t.steps.map((s, i) => {
        if (i !== stepIndex) return s;
        const notes = s.notes ?? [];
        const updated = notes.includes(note)
          ? notes.filter(n => n !== note)
          : [...notes, note];
        return { ...s, notes: updated, active: updated.length > 0 };
      }),
    };
  }),
})),
```

**Step 4: Run tests**

```
npm test -- --run src/store/useStore.test.ts
```

Expected: All pass.

**Step 5: Run all tests**

```
npm test -- --run
```

Expected: All pass.

**Step 6: Commit**

```bash
git add src/store/useStore.ts src/store/useStore.test.ts
git commit -m "feat: add addSynthTrack and toggleSynthNote store actions"
```

---

### Task 4: Update code generator for synth tracks

**Files:**
- Modify: `src/lib/codeGenerator.ts`
- Modify: `src/lib/codeGenerator.test.ts`

**Step 1: Write the failing tests**

Add a `makeSynthTrack` helper and new describe blocks to `src/lib/codeGenerator.test.ts`, after the existing helpers and before the describe blocks:

```ts
function makeSynthTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'synth-1',
    sound: 'supersaw',
    label: 'SUPERSAW',
    steps: Array.from({ length: 16 }, () => ({ active: false, notes: [] })),
    effects: [],
    muted: false,
    volume: 1,
    color: '#a855f7',
    type: 'synth',
    synth: 'supersaw',
    ...overrides,
  }
}

function withSynthNotes(track: Track, notesByStep: Record<number, string[]>): Track {
  return {
    ...track,
    steps: track.steps.map((s, i) => {
      const notes = notesByStep[i] ?? []
      return { active: notes.length > 0, notes }
    }),
  }
}
```

Then add these describe blocks at the end of the file:

```ts
describe('generateDisplayCode — synth tracks', () => {
  it('uses note() instead of s() for synth tracks', () => {
    const t = withSynthNotes(makeSynthTrack(), { 0: ['c3'] })
    const code = generateDisplayCode([t], 120)
    expect(code).toContain('note(')
    expect(code).not.toContain('s("c3")')
  })

  it('generates rests (~) for empty steps', () => {
    const t = withSynthNotes(makeSynthTrack(), { 0: ['c3'] })
    const code = generateDisplayCode([t], 120)
    expect(code).toContain('c3 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~')
  })

  it('wraps multiple notes at one step in chord notation', () => {
    const t = withSynthNotes(makeSynthTrack(), { 0: ['c3', 'e3', 'g3'] })
    const code = generateDisplayCode([t], 120)
    expect(code).toContain('[c3,e3,g3]')
  })

  it('appends .s() with the synth type', () => {
    const t = withSynthNotes(makeSynthTrack({ synth: 'sine' }), { 0: ['c2'] })
    const code = generateDisplayCode([t], 120)
    expect(code).toContain('.s("sine")')
  })

  it('does not add .gain() when volume is exactly 1', () => {
    const t = withSynthNotes(makeSynthTrack({ volume: 1 }), { 0: ['c3'] })
    expect(generateDisplayCode([t], 120)).not.toContain('.gain(')
  })

  it('adds .gain() when volume is not 1', () => {
    const t = withSynthNotes(makeSynthTrack({ volume: 0.7 }), { 0: ['c3'] })
    expect(generateDisplayCode([t], 120)).toContain('.gain(0.70)')
  })

  it('appends enabled effects', () => {
    const t = withSynthNotes(
      makeSynthTrack({ effects: [makeEffect({ param: 'room', value: 0.4, enabled: true })] }),
      { 0: ['c3'] }
    )
    expect(generateDisplayCode([t], 120)).toContain('.room(0.4)')
  })

  it('mixes drum and synth tracks in a stack', () => {
    const drum = makeTrack({ id: 'a' })
    const synth = withSynthNotes(makeSynthTrack({ id: 'b' }), { 0: ['c3'] })
    const code = generateDisplayCode([drum, synth], 120)
    expect(code).toContain('stack(')
    expect(code).toContain('s("bd')
    expect(code).toContain('note(')
  })
})

describe('generatePlayableCode — synth tracks', () => {
  it('uses note() for synth tracks', () => {
    const t = withSynthNotes(makeSynthTrack(), { 0: ['c3'] })
    expect(generatePlayableCode([t], 120)).toContain('note(')
  })

  it('produces compact single-line output', () => {
    const t = withSynthNotes(makeSynthTrack(), { 0: ['c3'] })
    expect(generatePlayableCode([t], 120)).not.toContain('\n')
  })

  it('appends .s() with synth type', () => {
    const t = withSynthNotes(makeSynthTrack({ synth: 'square' }), { 0: ['a3'] })
    expect(generatePlayableCode([t], 120)).toContain('.s("square")')
  })
})
```

**Step 2: Run to see them fail**

```
npm test -- --run src/lib/codeGenerator.test.ts
```

Expected: FAIL — synth tracks currently generate `s()` patterns.

**Step 3: Update `src/lib/codeGenerator.ts`**

Add `generateSynthTrackCode` and branch `generateTrackCode`. Replace the file with:

```ts
import type { Track } from '../store/types';

function generateSynthTrackCode(track: Track): string {
  const steps = track.steps.map(step => {
    const notes = step.notes ?? [];
    if (notes.length === 0) return '~';
    if (notes.length === 1) return notes[0];
    return `[${notes.join(',')}]`;
  });

  let code = `note("${steps.join(' ')}").s("${track.synth ?? 'supersaw'}")`;

  if (track.volume !== 1) {
    code += `.gain(${track.volume.toFixed(2)})`;
  }

  for (const effect of track.effects) {
    if (effect.enabled) {
      code += `.${effect.param}(${effect.value})`;
    }
  }

  return code;
}

function generateTrackCode(track: Track): string {
  if (track.type === 'synth') {
    return generateSynthTrackCode(track);
  }

  const steps = track.steps.map(step => step.active ? track.sound : '~');
  let code = `s("${steps.join(' ')}")`;

  if (track.volume !== 1) {
    code += `.gain(${track.volume.toFixed(2)})`;
  }

  for (const effect of track.effects) {
    if (effect.enabled) {
      code += `.${effect.param}(${effect.value})`;
    }
  }

  return code;
}

/** Generate display code (formatted, for the code preview panel) */
export function generateDisplayCode(tracks: Track[], bpm: number): string {
  const activeTracks = tracks.filter(t => !t.muted);
  if (activeTracks.length === 0) return '// No active tracks';

  const cpm = bpm / 4;
  const trackCodes = activeTracks.map(t => generateTrackCode(t));

  const pattern = trackCodes.length === 1
    ? trackCodes[0]
    : `stack(\n${trackCodes.map(c => '  ' + c).join(',\n')}\n)`;

  return `${pattern}\n  .cpm(${cpm})`;
}

/** Generate executable code (uses Strudel's evaluate which auto-plays) */
export function generatePlayableCode(tracks: Track[], bpm: number): string {
  const activeTracks = tracks.filter(t => !t.muted);
  if (activeTracks.length === 0) return '';

  const cpm = bpm / 4;
  const trackCodes = activeTracks.map(t => generateTrackCode(t));

  const pattern = trackCodes.length === 1
    ? trackCodes[0]
    : `stack(${trackCodes.join(',')})`;

  return `${pattern}.cpm(${cpm})`;
}
```

**Step 4: Run tests**

```
npm test -- --run src/lib/codeGenerator.test.ts
```

Expected: All pass.

**Step 5: Run all tests**

```
npm test -- --run
```

Expected: All pass.

**Step 6: Commit**

```bash
git add src/lib/codeGenerator.ts src/lib/codeGenerator.test.ts
git commit -m "feat: generate note() patterns for synth tracks"
```

---

### Task 5: Create SynthLane component

**Files:**
- Create: `src/components/SynthLane.tsx`
- Create: `src/components/SynthLane.test.tsx`

**Step 1: Write the failing tests**

Create `src/components/SynthLane.test.tsx`. Note: uses real Zustand store (same pattern as TrackLane.test.tsx):

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SynthLane } from './SynthLane'
import { useStore } from '../store/useStore'
import { createSynthTrack } from '../lib/constants'

beforeEach(() => {
  useStore.setState({ tracks: [], selectedTrackId: null, isPlaying: false, bpm: 120 })
})

describe('SynthLane', () => {
  it('renders the track label', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)
    expect(screen.getByText('SUPERSAW')).toBeInTheDocument()
  })

  it('renders SAW badge for supersaw', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)
    expect(screen.getByText('SAW')).toBeInTheDocument()
  })

  it('renders SQ badge for square', () => {
    const track = createSynthTrack('square')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)
    expect(screen.getByText('SQ')).toBeInTheDocument()
  })

  it('renders SIN badge for sine', () => {
    const track = createSynthTrack('sine')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)
    expect(screen.getByText('SIN')).toBeInTheDocument()
  })

  it('renders TRI badge for triangle', () => {
    const track = createSynthTrack('triangle')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)
    expect(screen.getByText('TRI')).toBeInTheDocument()
  })

  it('renders 576 piano roll cells (36 notes × 16 steps)', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)
    const cells = screen.getAllByTestId(/^synth-cell-/)
    expect(cells).toHaveLength(576)
  })

  it('clicking a cell toggles the note in the store', async () => {
    const user = userEvent.setup()
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)

    await user.click(screen.getByTestId('synth-cell-0-c4'))

    expect(useStore.getState().tracks[0].steps[0].notes).toContain('c4')
  })

  it('active cells have the track color as background', () => {
    const track = createSynthTrack('supersaw')
    track.steps[0].notes = ['c4']
    track.steps[0].active = true
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)

    const activeCell = screen.getByTestId('synth-cell-0-c4')
    expect(activeCell).toHaveStyle({ backgroundColor: track.color })
  })

  it('mute button toggles mute in the store', async () => {
    const user = userEvent.setup()
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)

    await user.click(screen.getByTitle('Mute'))
    expect(useStore.getState().tracks[0].muted).toBe(true)
  })

  it('delete button removes the track', async () => {
    const user = userEvent.setup()
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    render(<SynthLane track={track} isSelected={false} />)

    await user.click(screen.getByTitle('Remove track'))
    expect(useStore.getState().tracks).toHaveLength(0)
  })

  it('applies selected styles when isSelected is true', () => {
    const track = createSynthTrack('supersaw')
    useStore.setState({ tracks: [track] })
    const { container } = render(<SynthLane track={track} isSelected={true} />)
    expect(container.firstChild).toHaveClass('ring-1')
  })
})
```

**Step 2: Run to see them fail**

```
npm test -- --run src/components/SynthLane.test.tsx
```

Expected: FAIL — `SynthLane` does not exist.

**Step 3: Create `src/components/SynthLane.tsx`**

```tsx
import type { Track } from '../store/types';
import { useStore } from '../store/useStore';
import { PIANO_ROLL_NOTES } from '../lib/constants';

const SYNTH_BADGES: Record<string, string> = {
  supersaw: 'SAW',
  square:   'SQ',
  sine:     'SIN',
  triangle: 'TRI',
};

interface SynthLaneProps {
  track: Track;
  isSelected: boolean;
}

export function SynthLane({ track, isSelected }: SynthLaneProps) {
  const toggleSynthNote = useStore(s => s.toggleSynthNote);
  const toggleMute      = useStore(s => s.toggleMute);
  const setTrackVolume  = useStore(s => s.setTrackVolume);
  const removeTrack     = useStore(s => s.removeTrack);
  const selectTrack     = useStore(s => s.selectTrack);

  const badge = SYNTH_BADGES[track.synth ?? ''] ?? '~';

  return (
    <div
      className={`
        px-3 py-2 rounded-lg transition-colors cursor-pointer
        ${isSelected ? 'bg-white/[0.06] ring-1 ring-white/10' : 'hover:bg-white/[0.03]'}
      `}
      onClick={() => selectTrack(track.id)}
    >
      {/* Track header */}
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: track.color }}
        />
        <span className="text-xs font-semibold tracking-wide text-white/70 uppercase truncate w-20">
          {track.label}
        </span>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/50 tracking-wider shrink-0">
          {badge}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); toggleMute(track.id); }}
          className={`
            w-7 h-7 rounded text-[10px] font-bold shrink-0 cursor-pointer transition-colors
            ${track.muted
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/60'
            }
          `}
          title={track.muted ? 'Unmute' : 'Mute'}
        >
          M
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={track.volume}
          onChange={(e) => { e.stopPropagation(); setTrackVolume(track.id, parseFloat(e.target.value)); }}
          onClick={(e) => e.stopPropagation()}
          className="w-14 shrink-0"
          title={`Volume: ${Math.round(track.volume * 100)}%`}
        />

        <button
          onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
          className="ml-auto w-6 h-6 rounded text-white/25 hover:text-red-400 hover:bg-red-500/10 text-xs cursor-pointer transition-colors shrink-0"
          title="Remove track"
        >
          ×
        </button>
      </div>

      {/* Piano roll grid */}
      <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
        {PIANO_ROLL_NOTES.map(({ note, label, isBlack }) => (
          <div
            key={note}
            className={`flex items-stretch h-[10px] ${isBlack ? 'bg-black/20' : ''}`}
          >
            {/* Note label — only shown for C notes */}
            <div className="w-7 shrink-0 flex items-center justify-end pr-1">
              {/^C\d$/.test(label) && (
                <span className="text-[7px] text-white/30 leading-none">{label}</span>
              )}
            </div>

            {/* 16 step cells */}
            {track.steps.map((step, stepIndex) => {
              const isActive = step.notes?.includes(note) ?? false;
              return (
                <button
                  key={stepIndex}
                  data-testid={`synth-cell-${stepIndex}-${note}`}
                  onClick={(e) => { e.stopPropagation(); toggleSynthNote(track.id, stepIndex, note); }}
                  className={`
                    flex-1 border-r border-white/[0.04] cursor-pointer transition-colors
                    ${!isActive
                      ? isBlack
                        ? 'bg-white/[0.03] hover:bg-white/10'
                        : 'bg-white/[0.05] hover:bg-white/15'
                      : ''
                    }
                  `}
                  style={isActive ? { backgroundColor: track.color } : undefined}
                  title={`${note} step ${stepIndex + 1}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Run tests**

```
npm test -- --run src/components/SynthLane.test.tsx
```

Expected: All pass.

**Step 5: Run all tests**

```
npm test -- --run
```

Expected: All pass.

**Step 6: Commit**

```bash
git add src/components/SynthLane.tsx src/components/SynthLane.test.tsx
git commit -m "feat: add SynthLane piano roll component"
```

---

### Task 6: Update AddTrackButton for two-step Drum/Synth flow

**Files:**
- Modify: `src/components/AddTrackButton.tsx`
- Modify: `src/components/AddTrackButton.test.tsx`

The existing tests open the dropdown and expect drum sounds immediately. The new flow shows a "Drum / Synth" type picker first. Update tests to match.

**Step 1: Update the existing tests in `src/components/AddTrackButton.test.tsx`**

Replace the file entirely:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddTrackButton } from './AddTrackButton'
import { useStore } from '../store/useStore'
import { DRUM_SOUNDS } from '../lib/constants'

beforeEach(() => {
  useStore.setState({ tracks: [], selectedTrackId: null, isPlaying: false, bpm: 120 })
})

describe('AddTrackButton', () => {
  it('renders the "+ Add Track" button', () => {
    render(<AddTrackButton />)
    expect(screen.getByText('+ Add Track')).toBeInTheDocument()
  })

  it('dropdown is closed by default', () => {
    render(<AddTrackButton />)
    expect(screen.queryByText('Drum')).not.toBeInTheDocument()
  })

  it('shows Drum and Synth options on first open', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    expect(screen.getByText('Drum')).toBeInTheDocument()
    expect(screen.getByText('Synth')).toBeInTheDocument()
  })

  it('shows drum sounds after clicking Drum', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Drum'))
    expect(screen.getByText('Kick')).toBeInTheDocument()
  })

  it('shows all drum sounds after clicking Drum', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Drum'))
    for (const sound of DRUM_SOUNDS) {
      expect(screen.getByText(sound.label)).toBeInTheDocument()
    }
  })

  it('shows synth sounds after clicking Synth', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Synth'))
    expect(screen.getByText('Supersaw')).toBeInTheDocument()
    expect(screen.getByText('Sine')).toBeInTheDocument()
    expect(screen.getByText('Square')).toBeInTheDocument()
    expect(screen.getByText('Triangle')).toBeInTheDocument()
  })

  it('toggles dropdown closed when button is clicked again', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('+ Add Track'))
    expect(screen.queryByText('Drum')).not.toBeInTheDocument()
  })

  it('adds a drum track when a drum sound is selected', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Drum'))
    await user.click(screen.getByText('Kick'))
    expect(useStore.getState().tracks).toHaveLength(1)
    expect(useStore.getState().tracks[0].sound).toBe('bd')
    expect(useStore.getState().tracks[0].type).toBe('drum')
  })

  it('adds a synth track when a synth sound is selected', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Synth'))
    await user.click(screen.getByText('Supersaw'))
    expect(useStore.getState().tracks).toHaveLength(1)
    expect(useStore.getState().tracks[0].synth).toBe('supersaw')
    expect(useStore.getState().tracks[0].type).toBe('synth')
  })

  it('closes dropdown after selecting a drum sound', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Drum'))
    await user.click(screen.getByText('Kick'))
    expect(screen.queryByText('Snare')).not.toBeInTheDocument()
  })

  it('closes dropdown after selecting a synth sound', async () => {
    const user = userEvent.setup()
    render(<AddTrackButton />)
    await user.click(screen.getByText('+ Add Track'))
    await user.click(screen.getByText('Synth'))
    await user.click(screen.getByText('Supersaw'))
    expect(screen.queryByText('Sine')).not.toBeInTheDocument()
  })

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <AddTrackButton />
        <div data-testid="outside">outside</div>
      </div>
    )
    await user.click(screen.getByText('+ Add Track'))
    expect(screen.getByText('Drum')).toBeInTheDocument()
    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByText('Drum')).not.toBeInTheDocument()
  })
})
```

**Step 2: Run to see them fail**

```
npm test -- --run src/components/AddTrackButton.test.tsx
```

Expected: FAIL — dropdown currently opens directly to drum sounds.

**Step 3: Replace `src/components/AddTrackButton.tsx`**

```tsx
import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { DRUM_SOUNDS, SYNTH_SOUNDS } from '../lib/constants';

type MenuView = 'closed' | 'type' | 'drum' | 'synth';

export function AddTrackButton() {
  const [view, setView] = useState<MenuView>('closed');
  const menuRef = useRef<HTMLDivElement>(null);
  const addTrack      = useStore(s => s.addTrack);
  const addSynthTrack = useStore(s => s.addSynthTrack);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setView('closed');
      }
    }
    if (view !== 'closed') {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [view]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setView(view === 'closed' ? 'type' : 'closed')}
        className="
          w-full py-2.5 rounded-lg border border-dashed border-white/15
          text-white/40 hover:text-white/70 hover:border-white/30 hover:bg-white/[0.03]
          text-sm font-medium cursor-pointer transition-all
        "
      >
        + Add Track
      </button>

      {view !== 'closed' && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a25] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
          {view === 'type' && (
            <>
              <button
                onClick={() => setView('drum')}
                className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-3"
              >
                <span className="text-white/40 font-mono text-xs w-8">drum</span>
                <span>Drum</span>
              </button>
              <button
                onClick={() => setView('synth')}
                className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-3"
              >
                <span className="text-white/40 font-mono text-xs w-8">synth</span>
                <span>Synth</span>
              </button>
            </>
          )}

          {view === 'drum' && DRUM_SOUNDS.map(sound => (
            <button
              key={sound.id}
              onClick={() => { addTrack(sound.id); setView('closed'); }}
              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-3"
            >
              <span className="text-white/40 font-mono text-xs w-8">{sound.id}</span>
              <span>{sound.label}</span>
            </button>
          ))}

          {view === 'synth' && SYNTH_SOUNDS.map(sound => (
            <button
              key={sound.id}
              onClick={() => { addSynthTrack(sound.id); setView('closed'); }}
              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-3"
            >
              <span className="text-white/40 font-mono text-xs w-8">~</span>
              <span>{sound.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run tests**

```
npm test -- --run src/components/AddTrackButton.test.tsx
```

Expected: All pass.

**Step 5: Run all tests**

```
npm test -- --run
```

Expected: All pass.

**Step 6: Commit**

```bash
git add src/components/AddTrackButton.tsx src/components/AddTrackButton.test.tsx
git commit -m "feat: two-step Drum/Synth track selection in AddTrackButton"
```

---

### Task 7: Wire up App.tsx to render SynthLane vs TrackLane

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add SynthLane import**

At the top of `src/App.tsx`, add:

```ts
import { SynthLane } from './components/SynthLane';
```

**Step 2: Replace the track render loop**

Find this block:

```tsx
{tracks.map(track => (
  <TrackLane
    key={track.id}
    track={track}
    isSelected={track.id === selectedTrackId}
  />
))}
```

Replace with:

```tsx
{tracks.map(track => (
  track.type === 'synth'
    ? <SynthLane key={track.id} track={track} isSelected={track.id === selectedTrackId} />
    : <TrackLane key={track.id} track={track} isSelected={track.id === selectedTrackId} />
))}
```

**Step 3: Run type check**

```
npx tsc -b
```

Expected: No errors.

**Step 4: Run all tests**

```
npm test -- --run
```

Expected: All pass.

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: render SynthLane for synth tracks in App"
```

---

### Final verification

**Run the dev server and manually test:**

```
npm run dev
```

1. Open http://localhost:5173
2. Click "+ Add Track" → should show "Drum / Synth" choice
3. Click "Synth" → should show Supersaw / Square / Sine / Triangle
4. Add a Supersaw track → should appear as a tall piano roll below the drum tracks
5. Click cells in the piano roll → cells should light up in the track color
6. Click play → Strudel should play the drum tracks + the synth notes together
7. Add chords (multiple cells in same column) → should play as chords
