import { useStore } from './store/useStore';
import { generateDisplayCode } from './lib/codeGenerator';
import { Header } from './components/Header';
import { TrackLane } from './components/TrackLane';
import { SynthLane } from './components/SynthLane';
import { AddTrackButton } from './components/AddTrackButton';
import { EffectSlider } from './components/EffectSlider';
import { CodePreview } from './components/CodePreview';
import {
  createPresetBasicBeat,
  createPresetHipHop,
  createPresetBreakbeat,
} from './lib/constants';

const PRESETS = [
  { name: 'Basic Beat', create: createPresetBasicBeat },
  { name: 'Hip-Hop', create: createPresetHipHop },
  { name: 'Breakbeat', create: createPresetBreakbeat },
];

function App() {
  const tracks = useStore(s => s.tracks);
  const selectedTrackId = useStore(s => s.selectedTrackId);
  const bpm = useStore(s => s.bpm);
  const toggleEffect = useStore(s => s.toggleEffect);
  const setEffectValue = useStore(s => s.setEffectValue);
  const loadPreset = useStore(s => s.loadPreset);

  const selectedTrack = tracks.find(t => t.id === selectedTrackId);
  const displayCode = generateDisplayCode(tracks, bpm);

  return (
    <div className="min-h-screen flex flex-col bg-[--color-surface]">
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Presets bar */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-white/5">
          <span className="text-[10px] text-white/30 uppercase tracking-wider mr-1">Presets</span>
          {PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => loadPreset(preset.create())}
              className="px-3 py-1 rounded-full text-xs text-white/50 bg-white/5 hover:bg-white/10 hover:text-white/70 cursor-pointer transition-colors border border-white/5 hover:border-white/15"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Tracks */}
        <div className="flex-1 px-5 py-4">
          <div className="flex flex-col gap-1">
            {tracks.map(track => (
              track.type === 'synth'
                ? <SynthLane key={track.id} track={track} isSelected={track.id === selectedTrackId} />
                : <TrackLane key={track.id} track={track} isSelected={track.id === selectedTrackId} />
            ))}
          </div>

          <div className="mt-3 max-w-xs">
            <AddTrackButton />
          </div>
        </div>

        {/* Effects panel for selected track */}
        {selectedTrack && (
          <div className="px-5 py-3 border-t border-white/10 bg-[#0d0d14]/50">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedTrack.color }}
              />
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                {selectedTrack.label} Effects
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
              {selectedTrack.effects.map(effect => (
                <EffectSlider
                  key={effect.param}
                  effect={effect}
                  trackId={selectedTrack.id}
                  onToggle={toggleEffect}
                  onChange={setEffectValue}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <CodePreview code={displayCode} />
    </div>
  );
}

export default App;
