import { describe, it, expect } from 'vitest'
import { generateDisplayCode, generatePlayableCode } from './codeGenerator'
import type { Track, Effect } from '../store/types'

function makeEffect(overrides: Partial<Effect> = {}): Effect {
  return {
    name: 'Low Pass',
    param: 'lpf',
    value: 20000,
    min: 100,
    max: 20000,
    step: 100,
    enabled: false,
    ...overrides,
  }
}

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
    ...overrides,
  }
}

function withActiveSteps(track: Track, indices: number[]): Track {
  return {
    ...track,
    steps: track.steps.map((s, i) => ({ active: indices.includes(i) })),
  }
}

describe('generateDisplayCode', () => {
  it('returns placeholder when there are no tracks', () => {
    expect(generateDisplayCode([], 120)).toBe('// No active tracks')
  })

  it('returns placeholder when all tracks are muted', () => {
    const t = makeTrack({ muted: true })
    expect(generateDisplayCode([t], 120)).toBe('// No active tracks')
  })

  it('converts BPM to CPM (bpm / 4)', () => {
    const t = makeTrack()
    const code = generateDisplayCode([t], 120)
    expect(code).toContain('.cpm(30)')
  })

  it('uses correct CPM for non-standard BPM', () => {
    const t = makeTrack()
    expect(generateDisplayCode([t], 160)).toContain('.cpm(40)')
    expect(generateDisplayCode([t], 80)).toContain('.cpm(20)')
  })

  it('uses sound id for active steps and ~ for inactive', () => {
    const t = withActiveSteps(makeTrack({ sound: 'bd' }), [0, 4, 8, 12])
    const code = generateDisplayCode([t], 120)
    expect(code).toContain('s("bd ~ ~ ~ bd ~ ~ ~ bd ~ ~ ~ bd ~ ~ ~")')
  })

  it('does not add .gain() when volume is exactly 1', () => {
    const t = makeTrack({ volume: 1 })
    expect(generateDisplayCode([t], 120)).not.toContain('.gain(')
  })

  it('adds .gain() when volume is not 1', () => {
    const t = makeTrack({ volume: 0.8 })
    expect(generateDisplayCode([t], 120)).toContain('.gain(0.80)')
  })

  it('formats volume to 2 decimal places', () => {
    const t = makeTrack({ volume: 0.5 })
    expect(generateDisplayCode([t], 120)).toContain('.gain(0.50)')
  })

  it('does not add disabled effects', () => {
    const t = makeTrack({ effects: [makeEffect({ param: 'room', value: 0.5, enabled: false })] })
    expect(generateDisplayCode([t], 120)).not.toContain('.room(')
  })

  it('appends enabled effects as chained calls', () => {
    const t = makeTrack({
      effects: [makeEffect({ param: 'room', value: 0.5, enabled: true })],
    })
    expect(generateDisplayCode([t], 120)).toContain('.room(0.5)')
  })

  it('appends multiple enabled effects in order', () => {
    const t = makeTrack({
      effects: [
        makeEffect({ param: 'room', value: 0.3, enabled: true }),
        makeEffect({ param: 'delay', value: 0.5, enabled: true }),
        makeEffect({ param: 'pan', value: 0.7, enabled: false }),
      ],
    })
    const code = generateDisplayCode([t], 120)
    expect(code).toContain('.room(0.3)')
    expect(code).toContain('.delay(0.5)')
    expect(code).not.toContain('.pan(')
  })

  it('wraps single track without stack()', () => {
    const t = makeTrack()
    const code = generateDisplayCode([t], 120)
    expect(code).not.toContain('stack(')
  })

  it('wraps multiple tracks in formatted stack()', () => {
    const t1 = makeTrack({ id: 'a', sound: 'bd' })
    const t2 = makeTrack({ id: 'b', sound: 'sd' })
    const code = generateDisplayCode([t1, t2], 120)
    expect(code).toContain('stack(')
    expect(code).toContain('\n')
  })

  it('excludes muted tracks from stack', () => {
    const t1 = makeTrack({ id: 'a', sound: 'bd' })
    const t2 = makeTrack({ id: 'b', sound: 'sd', muted: true })
    const code = generateDisplayCode([t1, t2], 120)
    expect(code).not.toContain('stack(')
    expect(code).not.toContain('sd')
  })

  it('appends .cpm() at the end', () => {
    const t = makeTrack()
    const code = generateDisplayCode([t], 120)
    expect(code.trimEnd()).toMatch(/\.cpm\(\d+\)$/)
  })
})

describe('generatePlayableCode', () => {
  it('returns empty string when there are no tracks', () => {
    expect(generatePlayableCode([], 120)).toBe('')
  })

  it('returns empty string when all tracks are muted', () => {
    const t = makeTrack({ muted: true })
    expect(generatePlayableCode([t], 120)).toBe('')
  })

  it('converts BPM to CPM (bpm / 4)', () => {
    const t = makeTrack()
    expect(generatePlayableCode([t], 120)).toContain('.cpm(30)')
  })

  it('uses sound id for active steps and ~ for inactive', () => {
    const t = withActiveSteps(makeTrack({ sound: 'hh' }), [0, 2, 4])
    const code = generatePlayableCode([t], 120)
    expect(code).toContain('s("hh ~ hh ~ hh ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~")')
  })

  it('produces compact single-line output (no extra whitespace)', () => {
    const t1 = makeTrack({ id: 'a', sound: 'bd' })
    const t2 = makeTrack({ id: 'b', sound: 'sd' })
    const code = generatePlayableCode([t1, t2], 120)
    expect(code).not.toContain('\n')
  })

  it('wraps single track without stack()', () => {
    const t = makeTrack()
    expect(generatePlayableCode([t], 120)).not.toContain('stack(')
  })

  it('wraps multiple active tracks in stack()', () => {
    const t1 = makeTrack({ id: 'a', sound: 'bd' })
    const t2 = makeTrack({ id: 'b', sound: 'sd' })
    const code = generatePlayableCode([t1, t2], 120)
    expect(code).toContain('stack(')
  })

  it('excludes muted tracks', () => {
    const t1 = makeTrack({ id: 'a', sound: 'bd' })
    const t2 = makeTrack({ id: 'b', sound: 'sd', muted: true })
    const code = generatePlayableCode([t1, t2], 120)
    expect(code).not.toContain('stack(')
    expect(code).not.toContain('sd')
  })

  it('includes enabled effects', () => {
    const t = makeTrack({
      effects: [makeEffect({ param: 'distort', value: 2, enabled: true })],
    })
    expect(generatePlayableCode([t], 120)).toContain('.distort(2)')
  })

  it('excludes disabled effects', () => {
    const t = makeTrack({
      effects: [makeEffect({ param: 'room', value: 0.5, enabled: false })],
    })
    expect(generatePlayableCode([t], 120)).not.toContain('.room(')
  })
})
