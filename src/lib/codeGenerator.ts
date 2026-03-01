import type { Track } from '../store/types';

function generateTrackCode(track: Track): string {
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
