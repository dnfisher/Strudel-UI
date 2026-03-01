import { create } from 'zustand';
import type { Track } from './types';
import { createTrack, createSynthTrack, createPresetBasicBeat } from '../lib/constants';

interface AppState {
  tracks: Track[];
  selectedTrackId: string | null;
  isPlaying: boolean;
  bpm: number;

  addTrack: (sound: string) => void;
  addSynthTrack: (synth: string) => void;
  toggleSynthNote: (trackId: string, stepIndex: number, note: string) => void;
  removeTrack: (id: string) => void;
  toggleStep: (trackId: string, stepIndex: number) => void;
  toggleMute: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setEffectValue: (trackId: string, effectParam: string, value: number) => void;
  toggleEffect: (trackId: string, effectParam: string) => void;
  toggleCollapse: (trackId: string) => void;
  setSynthOctave: (trackId: string, octave: number) => void;
  setEffectPattern: (trackId: string, effectParam: string, pattern: string) => void;
  toggleEffectPatternMode: (trackId: string, effectParam: string) => void;
  selectTrack: (id: string | null) => void;
  setPlaying: (playing: boolean) => void;
  setBpm: (bpm: number) => void;
  loadPreset: (tracks: Track[]) => void;
}

export const useStore = create<AppState>((set) => ({
  tracks: createPresetBasicBeat(),
  selectedTrackId: null,
  isPlaying: false,
  bpm: 120,

  addTrack: (sound) => set(state => ({
    tracks: [...state.tracks, createTrack(sound)],
  })),

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

  removeTrack: (id) => set(state => ({
    tracks: state.tracks.filter(t => t.id !== id),
    selectedTrackId: state.selectedTrackId === id ? null : state.selectedTrackId,
  })),

  toggleStep: (trackId, stepIndex) => set(state => ({
    tracks: state.tracks.map(t =>
      t.id === trackId
        ? { ...t, steps: t.steps.map((s, i) => i === stepIndex ? { ...s, active: !s.active } : s) }
        : t
    ),
  })),

  toggleMute: (trackId) => set(state => ({
    tracks: state.tracks.map(t =>
      t.id === trackId ? { ...t, muted: !t.muted } : t
    ),
  })),

  setTrackVolume: (trackId, volume) => set(state => ({
    tracks: state.tracks.map(t =>
      t.id === trackId ? { ...t, volume } : t
    ),
  })),

  setEffectValue: (trackId, effectParam, value) => set(state => ({
    tracks: state.tracks.map(t =>
      t.id === trackId
        ? {
          ...t,
          effects: t.effects.map(e =>
            e.param === effectParam ? { ...e, value, enabled: true } : e
          ),
        }
        : t
    ),
  })),

  toggleEffect: (trackId, effectParam) => set(state => ({
    tracks: state.tracks.map(t =>
      t.id === trackId
        ? {
          ...t,
          effects: t.effects.map(e =>
            e.param === effectParam ? { ...e, enabled: !e.enabled } : e
          ),
        }
        : t
    ),
  })),

  toggleCollapse: (trackId) => set(state => ({
    tracks: state.tracks.map(t =>
      t.id === trackId ? { ...t, collapsed: !t.collapsed } : t
    ),
  })),

  setSynthOctave: (trackId, octave) => set(state => ({
    tracks: state.tracks.map(t =>
      t.id === trackId ? { ...t, octave: Math.max(1, Math.min(7, octave)) } : t
    ),
  })),

  setEffectPattern: (trackId, effectParam, pattern) => set(state => ({
    tracks: state.tracks.map(t =>
      t.id === trackId
        ? { ...t, effects: t.effects.map(e => e.param === effectParam ? { ...e, pattern } : e) }
        : t
    ),
  })),

  toggleEffectPatternMode: (trackId, effectParam) => set(state => ({
    tracks: state.tracks.map(t =>
      t.id === trackId
        ? { ...t, effects: t.effects.map(e => e.param === effectParam ? { ...e, patternMode: !e.patternMode } : e) }
        : t
    ),
  })),

  selectTrack: (id) => set({ selectedTrackId: id }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setBpm: (bpm) => set({ bpm: Math.max(40, Math.min(300, bpm)) }),
  loadPreset: (tracks) => set({ tracks, selectedTrackId: null }),
}));
