import type { Track } from '../store/types';
import { useStore } from '../store/useStore';
import { PIANO_ROLL_NOTES } from '../lib/constants';

const SYNTH_BADGES: Record<string, string> = {
  supersaw: 'SAW', square: 'SQ', sine: 'SIN', triangle: 'TRI',
};

interface SynthLaneProps {
  track: Track;
  isSelected: boolean;
  activeStep: number | null;
}

export function SynthLane({ track, isSelected, activeStep }: SynthLaneProps) {
  const toggleSynthNote = useStore(s => s.toggleSynthNote);
  const toggleMute      = useStore(s => s.toggleMute);
  const setTrackVolume  = useStore(s => s.setTrackVolume);
  const removeTrack     = useStore(s => s.removeTrack);
  const selectTrack     = useStore(s => s.selectTrack);
  const toggleCollapse  = useStore(s => s.toggleCollapse);
  const setSynthOctave  = useStore(s => s.setSynthOctave);

  const badge = SYNTH_BADGES[track.synth ?? ''] ?? '~';
  const octave = track.octave ?? 3;

  // Show only the 12 notes in the current octave (B{oct} down to C{oct})
  const visibleNotes = PIANO_ROLL_NOTES.filter(n => n.note.endsWith(String(octave)));

  return (
    <div
      className={`
        px-3 py-2 rounded-lg transition-colors cursor-pointer
        ${isSelected ? 'bg-white/[0.06] ring-1 ring-white/10' : 'hover:bg-white/[0.03]'}
      `}
      onClick={() => selectTrack(track.id)}
    >
      {/* Track header */}
      <div className="flex items-center gap-2">
        {/* Collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleCollapse(track.id); }}
          className="w-4 h-4 text-white/25 hover:text-white/60 cursor-pointer transition-colors shrink-0 text-[10px] flex items-center justify-center"
          title={track.collapsed ? 'Expand' : 'Collapse'}
        >
          {track.collapsed ? '▶' : '▼'}
        </button>

        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
        <span className="text-xs font-semibold tracking-wide text-white/70 uppercase truncate w-20">
          {track.label}
        </span>

        {/* Octave picker */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSynthOctave(track.id, octave - 1)}
            className="w-4 h-4 text-white/30 hover:text-white/70 cursor-pointer text-[10px] flex items-center justify-center"
            title="Octave down"
          >
            ‹
          </button>
          <span className="text-[10px] text-white/50 font-mono w-6 text-center">C{octave}</span>
          <button
            onClick={() => setSynthOctave(track.id, octave + 1)}
            className="w-4 h-4 text-white/30 hover:text-white/70 cursor-pointer text-[10px] flex items-center justify-center"
            title="Octave up"
          >
            ›
          </button>
        </div>

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
          type="range" min={0} max={1} step={0.05} value={track.volume}
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

      {/* Piano roll — one octave, hidden when collapsed */}
      {!track.collapsed && (
        <div className="flex flex-col mt-1" onClick={(e) => e.stopPropagation()}>
          {visibleNotes.map(({ note, label, isBlack }) => (
            <div key={note} className={`flex items-stretch h-[14px] ${isBlack ? 'bg-black/20' : ''}`}>
              <div className="w-7 shrink-0 flex items-center justify-end pr-1">
                {/^C\d$/.test(label) && (
                  <span className="text-[7px] text-white/30 leading-none">{label}</span>
                )}
              </div>
              {track.steps.map((step, stepIndex) => {
                const isActive = step.notes?.includes(note) ?? false;
                const isCurrentStep = activeStep === stepIndex;
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
                    style={{
                      backgroundColor: isActive ? track.color : undefined,
                      borderTop: isCurrentStep ? '2px solid rgba(255,255,255,0.6)' : undefined,
                    }}
                    title={`${note} step ${stepIndex + 1}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Mini strip — shown only when collapsed */}
      {track.collapsed && (
        <div
          data-testid="synth-mini-strip"
          className="flex gap-[1px] h-[4px] mt-1 ml-6"
          onClick={(e) => e.stopPropagation()}
        >
          {track.steps.map((step, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                backgroundColor: i === activeStep
                  ? track.color
                  : (step.notes?.length ?? 0) > 0
                    ? `${track.color}50`
                    : 'rgba(255,255,255,0.05)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
