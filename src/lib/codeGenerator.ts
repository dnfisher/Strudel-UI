import type { Track, Effect } from '../store/types';

function effectsCode(effects: Effect[]): string {
  return effects
    .filter(e => e.enabled)
    .map(e => {
      const val = e.patternMode && e.pattern ? `"${e.pattern}"` : e.value;
      return `.${e.param}(${val})`;
    })
    .join('');
}

function generateSynthTrackCode(track: Track): string {
  const steps = track.steps.map(step => {
    const notes = step.notes ?? [];
    if (notes.length === 0) return '~';
    if (notes.length === 1) return notes[0];
    return `[${notes.join(',')}]`;
  });

  let code = `note("${steps.join(' ')}").s("${track.synth ?? 'supersaw'}")`;
  if (track.volume !== 1) code += `.gain(${track.volume.toFixed(2)})`;
  code += effectsCode(track.effects);
  return code;
}

function generateTrackCode(track: Track): string {
  if (track.type === 'synth') return generateSynthTrackCode(track);

  const steps = track.steps.map(step => step.active ? track.sound : '~');
  let code = `s("${steps.join(' ')}")`;
  if (track.volume !== 1) code += `.gain(${track.volume.toFixed(2)})`;
  code += effectsCode(track.effects);
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
