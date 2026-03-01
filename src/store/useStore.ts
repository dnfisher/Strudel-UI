import { create } from 'zustand';
import type { Track } from './types';
import { createTrack, createPresetBasicBeat } from '../lib/constants';

interface AppState {
  tracks: Track[];
  selectedTrackId: string | null;
  isPlaying: boolean;
  bpm: number;

  addTrack: (sound: string) => void;
  removeTrack: (id: string) => void;
  toggleStep: (trackId: string, stepIndex: number) => void;
  toggleMute: (trackId: string) => void;
  setTrackVolume: (trackId: string, volume: number) => void;
  setEffectValue: (trackId: string, effectParam: string, value: number) => void;
  toggleEffect: (trackId: string, effectParam: string) => void;
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

  selectTrack: (id) => set({ selectedTrackId: id }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setBpm: (bpm) => set({ bpm: Math.max(40, Math.min(300, bpm)) }),
  loadPreset: (tracks) => set({ tracks, selectedTrackId: null }),
}));
