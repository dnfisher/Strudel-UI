import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './useStore'

beforeEach(() => {
  // Reset to a clean slate before each test
  useStore.setState({
    tracks: [],
    selectedTrackId: null,
    isPlaying: false,
    bpm: 120,
  })
})

describe('addTrack', () => {
  it('appends a new track', () => {
    useStore.getState().addTrack('bd')
    expect(useStore.getState().tracks).toHaveLength(1)
    expect(useStore.getState().tracks[0].sound).toBe('bd')
  })

  it('appends multiple tracks in order', () => {
    useStore.getState().addTrack('bd')
    useStore.getState().addTrack('sd')
    const sounds = useStore.getState().tracks.map(t => t.sound)
    expect(sounds).toEqual(['bd', 'sd'])
  })
})

describe('removeTrack', () => {
  it('removes the track with the given id', () => {
    useStore.getState().addTrack('bd')
    const id = useStore.getState().tracks[0].id
    useStore.getState().removeTrack(id)
    expect(useStore.getState().tracks).toHaveLength(0)
  })

  it('leaves other tracks intact', () => {
    useStore.getState().addTrack('bd')
    useStore.getState().addTrack('sd')
    const id = useStore.getState().tracks[0].id
    useStore.getState().removeTrack(id)
    expect(useStore.getState().tracks).toHaveLength(1)
    expect(useStore.getState().tracks[0].sound).toBe('sd')
  })

  it('clears selectedTrackId when the selected track is removed', () => {
    useStore.getState().addTrack('bd')
    const id = useStore.getState().tracks[0].id
    useStore.setState({ selectedTrackId: id })
    useStore.getState().removeTrack(id)
    expect(useStore.getState().selectedTrackId).toBeNull()
  })

  it('keeps selectedTrackId when a different track is removed', () => {
    useStore.getState().addTrack('bd')
    useStore.getState().addTrack('sd')
    const [t1, t2] = useStore.getState().tracks
    useStore.setState({ selectedTrackId: t2.id })
    useStore.getState().removeTrack(t1.id)
    expect(useStore.getState().selectedTrackId).toBe(t2.id)
  })
})

describe('toggleStep', () => {
  it('activates an inactive step', () => {
    useStore.getState().addTrack('bd')
    const { id } = useStore.getState().tracks[0]
    useStore.getState().toggleStep(id, 0)
    expect(useStore.getState().tracks[0].steps[0].active).toBe(true)
  })

  it('deactivates an active step', () => {
    useStore.getState().addTrack('bd')
    const { id } = useStore.getState().tracks[0]
    useStore.getState().toggleStep(id, 0)
    useStore.getState().toggleStep(id, 0)
    expect(useStore.getState().tracks[0].steps[0].active).toBe(false)
  })

  it('only toggles the specified step index', () => {
    useStore.getState().addTrack('bd')
    const { id } = useStore.getState().tracks[0]
    useStore.getState().toggleStep(id, 3)
    const steps = useStore.getState().tracks[0].steps
    expect(steps[3].active).toBe(true)
    expect(steps.filter((_, i) => i !== 3).every(s => !s.active)).toBe(true)
  })

  it('does not affect other tracks', () => {
    useStore.getState().addTrack('bd')
    useStore.getState().addTrack('sd')
    const [t1, t2] = useStore.getState().tracks
    useStore.getState().toggleStep(t1.id, 0)
    expect(useStore.getState().tracks.find(t => t.id === t2.id)!.steps[0].active).toBe(false)
  })
})

describe('toggleMute', () => {
  it('mutes an unmuted track', () => {
    useStore.getState().addTrack('bd')
    const { id } = useStore.getState().tracks[0]
    useStore.getState().toggleMute(id)
    expect(useStore.getState().tracks[0].muted).toBe(true)
  })

  it('unmutes a muted track', () => {
    useStore.getState().addTrack('bd')
    const { id } = useStore.getState().tracks[0]
    useStore.getState().toggleMute(id)
    useStore.getState().toggleMute(id)
    expect(useStore.getState().tracks[0].muted).toBe(false)
  })

  it('does not affect other tracks', () => {
    useStore.getState().addTrack('bd')
    useStore.getState().addTrack('sd')
    const [t1, t2] = useStore.getState().tracks
    useStore.getState().toggleMute(t1.id)
    expect(useStore.getState().tracks.find(t => t.id === t2.id)!.muted).toBe(false)
  })
})

describe('setTrackVolume', () => {
  it('sets the volume for the specified track', () => {
    useStore.getState().addTrack('bd')
    const { id } = useStore.getState().tracks[0]
    useStore.getState().setTrackVolume(id, 0.5)
    expect(useStore.getState().tracks[0].volume).toBe(0.5)
  })

  it('does not affect other tracks', () => {
    useStore.getState().addTrack('bd')
    useStore.getState().addTrack('sd')
    const [t1, t2] = useStore.getState().tracks
    const originalVolume = t2.volume
    useStore.getState().setTrackVolume(t1.id, 0.1)
    expect(useStore.getState().tracks.find(t => t.id === t2.id)!.volume).toBe(originalVolume)
  })
})

describe('setEffectValue', () => {
  it('updates the value of the specified effect', () => {
    useStore.getState().addTrack('bd')
    const { id } = useStore.getState().tracks[0]
    useStore.getState().setEffectValue(id, 'lpf', 5000)
    const lpf = useStore.getState().tracks[0].effects.find(e => e.param === 'lpf')!
    expect(lpf.value).toBe(5000)
  })

  it('forces the effect to enabled: true', () => {
    useStore.getState().addTrack('bd')
    const { id } = useStore.getState().tracks[0]
    // Initially disabled
    expect(useStore.getState().tracks[0].effects.find(e => e.param === 'lpf')!.enabled).toBe(false)
    useStore.getState().setEffectValue(id, 'lpf', 5000)
    expect(useStore.getState().tracks[0].effects.find(e => e.param === 'lpf')!.enabled).toBe(true)
  })

  it('does not affect other effects on the same track', () => {
    useStore.getState().addTrack('bd')
    const { id } = useStore.getState().tracks[0]
    useStore.getState().setEffectValue(id, 'lpf', 5000)
    const room = useStore.getState().tracks[0].effects.find(e => e.param === 'room')!
    expect(room.enabled).toBe(false)
  })
})

describe('toggleEffect', () => {
  it('enables a disabled effect', () => {
    useStore.getState().addTrack('bd')
    const { id } = useStore.getState().tracks[0]
    useStore.getState().toggleEffect(id, 'room')
    expect(useStore.getState().tracks[0].effects.find(e => e.param === 'room')!.enabled).toBe(true)
  })

  it('disables an enabled effect', () => {
    useStore.getState().addTrack('bd')
    const { id } = useStore.getState().tracks[0]
    useStore.getState().toggleEffect(id, 'room')
    useStore.getState().toggleEffect(id, 'room')
    expect(useStore.getState().tracks[0].effects.find(e => e.param === 'room')!.enabled).toBe(false)
  })

  it('does not affect other effects', () => {
    useStore.getState().addTrack('bd')
    const { id } = useStore.getState().tracks[0]
    useStore.getState().toggleEffect(id, 'room')
    expect(useStore.getState().tracks[0].effects.find(e => e.param === 'lpf')!.enabled).toBe(false)
  })
})

describe('selectTrack', () => {
  it('sets selectedTrackId', () => {
    useStore.getState().selectTrack('some-id')
    expect(useStore.getState().selectedTrackId).toBe('some-id')
  })

  it('can be set to null', () => {
    useStore.getState().selectTrack('some-id')
    useStore.getState().selectTrack(null)
    expect(useStore.getState().selectedTrackId).toBeNull()
  })
})

describe('setPlaying', () => {
  it('sets isPlaying to true', () => {
    useStore.getState().setPlaying(true)
    expect(useStore.getState().isPlaying).toBe(true)
  })

  it('sets isPlaying to false', () => {
    useStore.getState().setPlaying(true)
    useStore.getState().setPlaying(false)
    expect(useStore.getState().isPlaying).toBe(false)
  })
})

describe('setBpm', () => {
  it('sets the BPM', () => {
    useStore.getState().setBpm(140)
    expect(useStore.getState().bpm).toBe(140)
  })

  it('clamps BPM to minimum of 40', () => {
    useStore.getState().setBpm(10)
    expect(useStore.getState().bpm).toBe(40)
  })

  it('clamps BPM to maximum of 300', () => {
    useStore.getState().setBpm(500)
    expect(useStore.getState().bpm).toBe(300)
  })

  it('accepts exactly 40', () => {
    useStore.getState().setBpm(40)
    expect(useStore.getState().bpm).toBe(40)
  })

  it('accepts exactly 300', () => {
    useStore.getState().setBpm(300)
    expect(useStore.getState().bpm).toBe(300)
  })
})

describe('loadPreset', () => {
  it('replaces all tracks with preset tracks', () => {
    useStore.getState().addTrack('bd')
    useStore.getState().addTrack('sd')

    const preset = [
      { id: 'preset-1', sound: 'hh', label: 'Hi-Hat', steps: [], effects: [], muted: false, volume: 1, color: '#fff', type: 'drum' as const },
    ]
    useStore.getState().loadPreset(preset)
    expect(useStore.getState().tracks).toHaveLength(1)
    expect(useStore.getState().tracks[0].sound).toBe('hh')
  })

  it('clears selectedTrackId', () => {
    useStore.getState().addTrack('bd')
    useStore.setState({ selectedTrackId: 'some-id' })
    useStore.getState().loadPreset([])
    expect(useStore.getState().selectedTrackId).toBeNull()
  })
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
