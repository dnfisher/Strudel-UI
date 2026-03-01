import type { Effect, Track } from '../store/types';

export const DRUM_SOUNDS = [
  { id: 'bd', label: 'Kick' },
  { id: 'sd', label: 'Snare' },
  { id: 'hh', label: 'Hi-Hat' },
  { id: 'hc', label: 'Open Hat' },
  { id: 'cp', label: 'Clap' },
  { id: 'rs', label: 'Rimshot' },
  { id: 'lt', label: 'Low Tom' },
  { id: 'mt', label: 'Mid Tom' },
  { id: 'ht', label: 'High Tom' },
  { id: 'cb', label: 'Cowbell' },
  { id: 'cr', label: 'Crash' },
] as const;

export const TRACK_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#a855f7', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#14b8a6', // teal
];

export function createDefaultEffects(): Effect[] {
  return [
    { name: 'Low Pass', param: 'lpf', value: 20000, min: 100, max: 20000, step: 100, enabled: false },
    { name: 'Reverb', param: 'room', value: 0, min: 0, max: 1, step: 0.05, enabled: false },
    { name: 'Delay', param: 'delay', value: 0, min: 0, max: 1, step: 0.05, enabled: false },
    { name: 'Distortion', param: 'distort', value: 0, min: 0, max: 5, step: 0.1, enabled: false },
    { name: 'Pan', param: 'pan', value: 0.5, min: 0, max: 1, step: 0.05, enabled: false },
  ];
}

let colorIndex = 0;
export function getNextColor(): string {
  const color = TRACK_COLORS[colorIndex % TRACK_COLORS.length];
  colorIndex++;
  return color;
}

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

// Preset: basic four-on-the-floor beat
export function createPresetBasicBeat(): Track[] {
  const kick = createTrack('bd');
  kick.steps.forEach((s, i) => { if (i % 4 === 0) s.active = true; });

  const snare = createTrack('sd');
  snare.steps.forEach((s, i) => { if (i % 8 === 4) s.active = true; });

  const hat = createTrack('hh');
  hat.steps.forEach((s, i) => { if (i % 2 === 0) s.active = true; });
  hat.volume = 0.5;

  return [kick, snare, hat];
}

// Preset: hip-hop beat
export function createPresetHipHop(): Track[] {
  const kick = createTrack('bd');
  [0, 3, 7, 10].forEach(i => { kick.steps[i].active = true; });

  const snare = createTrack('sd');
  [4, 12].forEach(i => { snare.steps[i].active = true; });

  const hat = createTrack('hh');
  hat.steps.forEach(s => { s.active = true; });
  hat.volume = 0.4;

  const openHat = createTrack('hc');
  [2, 6, 10, 14].forEach(i => { openHat.steps[i].active = true; });
  openHat.volume = 0.3;

  return [kick, snare, hat, openHat];
}

// Preset: breakbeat
export function createPresetBreakbeat(): Track[] {
  const kick = createTrack('bd');
  [0, 4, 9, 10].forEach(i => { kick.steps[i].active = true; });

  const snare = createTrack('sd');
  [4, 12].forEach(i => { snare.steps[i].active = true; });

  const hat = createTrack('hh');
  [0, 2, 4, 6, 8, 10, 12, 14].forEach(i => { hat.steps[i].active = true; });
  hat.volume = 0.5;

  const rimshot = createTrack('rs');
  [2, 7, 14].forEach(i => { rimshot.steps[i].active = true; });
  rimshot.volume = 0.6;

  return [kick, snare, hat, rimshot];
}
