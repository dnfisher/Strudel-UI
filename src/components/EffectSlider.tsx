import type { Effect } from '../store/types';

interface EffectSliderProps {
  effect: Effect;
  trackId: string;
  onToggle: (trackId: string, param: string) => void;
  onChange: (trackId: string, param: string, value: number) => void;
}

export function EffectSlider({ effect, trackId, onToggle, onChange }: EffectSliderProps) {
  const displayValue = effect.param === 'lpf'
    ? `${Math.round(effect.value)} Hz`
    : effect.param === 'pan'
      ? effect.value < 0.45 ? `L ${Math.round((0.5 - effect.value) * 200)}%`
        : effect.value > 0.55 ? `R ${Math.round((effect.value - 0.5) * 200)}%`
          : 'Center'
      : effect.value.toFixed(2);

  return (
    <div className="flex items-center gap-3">
      {/* Toggle */}
      <button
        onClick={() => onToggle(trackId, effect.param)}
        className={`
          w-5 h-5 rounded-sm border cursor-pointer transition-colors text-[10px] flex items-center justify-center
          ${effect.enabled
            ? 'bg-blue-500/30 border-blue-500/50 text-blue-400'
            : 'bg-white/5 border-white/15 text-white/20 hover:border-white/30'
          }
        `}
        title={effect.enabled ? 'Disable' : 'Enable'}
      >
        {effect.enabled ? '✓' : ''}
      </button>

      {/* Label */}
      <span className="text-xs text-white/50 w-16 shrink-0">{effect.name}</span>

      {/* Slider */}
      <input
        type="range"
        min={effect.min}
        max={effect.max}
        step={effect.step}
        value={effect.value}
        onChange={(e) => onChange(trackId, effect.param, parseFloat(e.target.value))}
        className="flex-1"
      />

      {/* Value display */}
      <span className="text-[10px] text-white/30 w-16 text-right font-mono">
        {displayValue}
      </span>
    </div>
  );
}
