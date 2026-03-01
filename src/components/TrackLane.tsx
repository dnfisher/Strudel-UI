import type { Track } from '../store/types';
import { useStore } from '../store/useStore';
import { StepCell } from './StepCell';

interface TrackLaneProps {
  track: Track;
  isSelected: boolean;
  activeStep: number | null;
}

export function TrackLane({ track, isSelected, activeStep }: TrackLaneProps) {
  const toggleStep     = useStore(s => s.toggleStep);
  const toggleMute     = useStore(s => s.toggleMute);
  const setTrackVolume = useStore(s => s.setTrackVolume);
  const removeTrack    = useStore(s => s.removeTrack);
  const selectTrack    = useStore(s => s.selectTrack);
  const toggleCollapse = useStore(s => s.toggleCollapse);

  const beatGroups: { steps: typeof track.steps; startIndex: number }[] = [];
  for (let i = 0; i < track.steps.length; i += 4) {
    beatGroups.push({ steps: track.steps.slice(i, i + 4), startIndex: i });
  }

  return (
    <div
      className={`
        px-3 py-2 rounded-lg transition-colors cursor-pointer
        ${isSelected ? 'bg-white/[0.06] ring-1 ring-white/10' : 'hover:bg-white/[0.03]'}
      `}
      onClick={() => selectTrack(track.id)}
    >
      <div className="flex items-center gap-2">
        {/* Collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleCollapse(track.id); }}
          className="w-4 h-4 text-white/25 hover:text-white/60 cursor-pointer transition-colors shrink-0 text-[10px] flex items-center justify-center"
          title={track.collapsed ? 'Expand' : 'Collapse'}
        >
          {track.collapsed ? '▶' : '▼'}
        </button>

        {/* Track info */}
        <div className="flex items-center gap-2 w-20 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: track.color }} />
          <span className="text-xs font-semibold tracking-wide text-white/70 uppercase truncate">
            {track.label}
          </span>
        </div>

        {/* Mute button */}
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

        {/* Volume slider */}
        <input
          type="range" min={0} max={1} step={0.05} value={track.volume}
          onChange={(e) => { e.stopPropagation(); setTrackVolume(track.id, parseFloat(e.target.value)); }}
          onClick={(e) => e.stopPropagation()}
          className="w-14 shrink-0"
          title={`Volume: ${Math.round(track.volume * 100)}%`}
        />

        {/* Step grid — hidden when collapsed */}
        {!track.collapsed && (
          <div className="flex gap-2 flex-1 min-w-0">
            {beatGroups.map((group, gi) => (
              <div key={gi} className="flex gap-[2px] flex-1 min-w-0">
                {group.steps.map((step, si) => (
                  <StepCell
                    key={group.startIndex + si}
                    active={step.active}
                    color={track.color}
                    beat={group.startIndex + si}
                    muted={track.muted}
                    isPlayhead={activeStep === group.startIndex + si}
                    onClick={() => toggleStep(track.id, group.startIndex + si)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
          className="w-6 h-6 rounded text-white/25 hover:text-red-400 hover:bg-red-500/10 text-xs cursor-pointer transition-colors shrink-0 ml-auto"
          title="Remove track"
        >
          ×
        </button>
      </div>

      {/* Mini strip — shown only when collapsed */}
      {track.collapsed && (
        <div
          data-testid="mini-strip"
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
                  : step.active
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
