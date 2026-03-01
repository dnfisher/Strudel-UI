import { describe, it, expect } from 'vitest'
import {
  DRUM_SOUNDS,
  TRACK_COLORS,
  createDefaultEffects,
  getNextColor,
  createTrack,
  createPresetBasicBeat,
  createPresetHipHop,
  createPresetBreakbeat,
  SYNTH_SOUNDS,
  PIANO_ROLL_NOTES,
  createSynthTrack,
  SAMPLE_PACK_SOUNDS,
} from './constants'

describe('DRUM_SOUNDS', () => {
  it('contains 11 sounds', () => {
    expect(DRUM_SOUNDS).toHaveLength(11)
  })

  it('each sound has id and label', () => {
    for (const s of DRUM_SOUNDS) {
      expect(s.id).toBeTruthy()
      expect(s.label).toBeTruthy()
    }
  })

  it('has unique ids', () => {
    const ids = DRUM_SOUNDS.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('TRACK_COLORS', () => {
  it('has 10 colors', () => {
    expect(TRACK_COLORS).toHaveLength(10)
  })

  it('each color is a valid hex code', () => {
    for (const c of TRACK_COLORS) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('createDefaultEffects', () => {
  it('returns 14 effects', () => {
    expect(createDefaultEffects()).toHaveLength(14)
  })

  it('all effects are disabled by default', () => {
    for (const e of createDefaultEffects()) {
      expect(e.enabled).toBe(false)
    }
  })

  it('starts with lpf, room, delay, distort, pan', () => {
    const params = createDefaultEffects().map(e => e.param)
    expect(params.slice(0, 5)).toEqual(['lpf', 'room', 'delay', 'distort', 'pan'])
  })

  it('each call returns an independent array', () => {
    const a = createDefaultEffects()
    const b = createDefaultEffects()
    expect(a).not.toBe(b)
    a[0].enabled = true
    expect(b[0].enabled).toBe(false)
  })

  it('min is less than max for all effects', () => {
    for (const e of createDefaultEffects()) {
      expect(e.min).toBeLessThan(e.max)
    }
  })

  it('default value is within min/max range', () => {
    for (const e of createDefaultEffects()) {
      expect(e.value).toBeGreaterThanOrEqual(e.min)
      expect(e.value).toBeLessThanOrEqual(e.max)
    }
  })

  it('each effect has a step > 0', () => {
    for (const e of createDefaultEffects()) {
      expect(e.step).toBeGreaterThan(0)
    }
  })
})

describe('getNextColor', () => {
  it('returns a color from TRACK_COLORS', () => {
    expect(TRACK_COLORS).toContain(getNextColor())
  })

  it('cycles through all 10 colors without repetition in one cycle', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 10; i++) {
      seen.add(getNextColor())
    }
    expect(seen.size).toBe(10)
  })

  it('wraps around after 10 calls', () => {
    // Call 10 more times — should see all colors again
    const second = new Set<string>()
    for (let i = 0; i < 10; i++) {
      second.add(getNextColor())
    }
    expect(second.size).toBe(10)
  })
})

describe('createTrack', () => {
  it('assigns the given sound', () => {
    expect(createTrack('bd').sound).toBe('bd')
  })

  it('looks up the label from DRUM_SOUNDS', () => {
    expect(createTrack('sd').label).toBe('Snare')
    expect(createTrack('hh').label).toBe('Hi-Hat')
  })

  it('uppercases unknown sounds as label', () => {
    expect(createTrack('xyz').label).toBe('XYZ')
  })

  it('creates 16 steps all inactive', () => {
    const t = createTrack('bd')
    expect(t.steps).toHaveLength(16)
    expect(t.steps.every(s => !s.active)).toBe(true)
  })

  it('creates 14 default effects', () => {
    expect(createTrack('hh').effects).toHaveLength(14)
  })

  it('is not muted by default', () => {
    expect(createTrack('bd').muted).toBe(false)
  })

  it('has volume 0.8 by default', () => {
    expect(createTrack('bd').volume).toBe(0.8)
  })

  it('generates a unique UUID id', () => {
    const t1 = createTrack('bd')
    const t2 = createTrack('bd')
    expect(t1.id).not.toBe(t2.id)
    expect(t1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('assigns a color from TRACK_COLORS', () => {
    expect(TRACK_COLORS).toContain(createTrack('bd').color)
  })
})

// Helpers to extract active step indices
function activeIndices(steps: { active: boolean }[]): number[] {
  return steps.map((s, i) => (s.active ? i : -1)).filter(i => i >= 0)
}

describe('createPresetBasicBeat', () => {
  it('returns 3 tracks', () => {
    expect(createPresetBasicBeat()).toHaveLength(3)
  })

  it('kick (bd) hits on beats 0, 4, 8, 12', () => {
    const [kick] = createPresetBasicBeat()
    expect(kick.sound).toBe('bd')
    expect(activeIndices(kick.steps)).toEqual([0, 4, 8, 12])
  })

  it('snare (sd) hits on steps 4 and 12', () => {
    const [, snare] = createPresetBasicBeat()
    expect(snare.sound).toBe('sd')
    expect(activeIndices(snare.steps)).toEqual([4, 12])
  })

  it('hi-hat (hh) hits on every other step', () => {
    const [,, hat] = createPresetBasicBeat()
    expect(hat.sound).toBe('hh')
    expect(activeIndices(hat.steps)).toEqual([0, 2, 4, 6, 8, 10, 12, 14])
  })

  it('hi-hat has volume 0.5', () => {
    const [,, hat] = createPresetBasicBeat()
    expect(hat.volume).toBe(0.5)
  })
})

describe('createPresetHipHop', () => {
  it('returns 4 tracks', () => {
    expect(createPresetHipHop()).toHaveLength(4)
  })

  it('kick hits on steps 0, 3, 7, 10', () => {
    const [kick] = createPresetHipHop()
    expect(activeIndices(kick.steps)).toEqual([0, 3, 7, 10])
  })

  it('snare hits on steps 4 and 12', () => {
    const [, snare] = createPresetHipHop()
    expect(activeIndices(snare.steps)).toEqual([4, 12])
  })

  it('hi-hat has all 16 steps active', () => {
    const [,, hat] = createPresetHipHop()
    expect(hat.steps.every(s => s.active)).toBe(true)
  })

  it('hi-hat has volume 0.4', () => {
    const [,, hat] = createPresetHipHop()
    expect(hat.volume).toBe(0.4)
  })

  it('open hat (hc) hits on steps 2, 6, 10, 14', () => {
    const [,,, openHat] = createPresetHipHop()
    expect(openHat.sound).toBe('hc')
    expect(activeIndices(openHat.steps)).toEqual([2, 6, 10, 14])
  })

  it('open hat has volume 0.3', () => {
    const [,,, openHat] = createPresetHipHop()
    expect(openHat.volume).toBe(0.3)
  })
})

describe('createPresetBreakbeat', () => {
  it('returns 4 tracks', () => {
    expect(createPresetBreakbeat()).toHaveLength(4)
  })

  it('kick hits on steps 0, 4, 9, 10', () => {
    const [kick] = createPresetBreakbeat()
    expect(activeIndices(kick.steps)).toEqual([0, 4, 9, 10])
  })

  it('snare hits on steps 4 and 12', () => {
    const [, snare] = createPresetBreakbeat()
    expect(activeIndices(snare.steps)).toEqual([4, 12])
  })

  it('hi-hat hits on even steps', () => {
    const [,, hat] = createPresetBreakbeat()
    expect(activeIndices(hat.steps)).toEqual([0, 2, 4, 6, 8, 10, 12, 14])
  })

  it('hi-hat has volume 0.5', () => {
    const [,, hat] = createPresetBreakbeat()
    expect(hat.volume).toBe(0.5)
  })

  it('rimshot (rs) hits on steps 2, 7, 14', () => {
    const [,,, rimshot] = createPresetBreakbeat()
    expect(rimshot.sound).toBe('rs')
    expect(activeIndices(rimshot.steps)).toEqual([2, 7, 14])
  })

  it('rimshot has volume 0.6', () => {
    const [,,, rimshot] = createPresetBreakbeat()
    expect(rimshot.volume).toBe(0.6)
  })
})

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

describe('SAMPLE_PACK_SOUNDS', () => {
  it('exists and has at least one entry', () => {
    expect(SAMPLE_PACK_SOUNDS.length).toBeGreaterThan(0)
  })

  it('each entry has id and label', () => {
    for (const s of SAMPLE_PACK_SOUNDS) {
      expect(s.id).toBeTruthy()
      expect(s.label).toBeTruthy()
    }
  })

  it('has no overlap with DRUM_SOUNDS ids', () => {
    const drumIds = new Set(DRUM_SOUNDS.map(s => s.id))
    for (const s of SAMPLE_PACK_SOUNDS) {
      expect(drumIds.has(s.id)).toBe(false)
    }
  })
})

describe('PIANO_ROLL_NOTES', () => {
  it('contains 84 notes (7 octaves × 12)', () => {
    expect(PIANO_ROLL_NOTES).toHaveLength(84)
  })

  it('starts at b7 and ends at c1', () => {
    expect(PIANO_ROLL_NOTES[0].note).toBe('b7')
    expect(PIANO_ROLL_NOTES[83].note).toBe('c1')
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

  it('has exactly 35 black key notes (5 per octave × 7 octaves)', () => {
    expect(PIANO_ROLL_NOTES.filter(n => n.isBlack)).toHaveLength(35)
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

  it('creates 14 default effects', () => {
    expect(createSynthTrack('supersaw').effects).toHaveLength(14)
  })

  it('generates a unique UUID id each call', () => {
    expect(createSynthTrack('supersaw').id).not.toBe(createSynthTrack('supersaw').id)
  })

  it('has default octave of 3', () => {
    expect(createSynthTrack('supersaw').octave).toBe(3)
  })
})
