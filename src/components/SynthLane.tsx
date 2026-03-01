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
