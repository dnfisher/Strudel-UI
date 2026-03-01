interface StepCellProps {
  active: boolean;
  color: string;
  beat: number;
  muted: boolean;
  onClick: () => void;
}

export function StepCell({ active, color, beat, muted, onClick }: StepCellProps) {
  const isDownbeat = beat % 4 === 0;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`
        aspect-square rounded-md border transition-all duration-75 cursor-pointer min-w-0 flex-1
        ${active
          ? 'border-white/20'
          : isDownbeat
            ? 'border-white/10 bg-white/[0.06]'
            : 'border-white/5 bg-white/[0.03]'
        }
        ${!active ? 'hover:border-white/20 hover:bg-white/[0.08]' : ''}
        ${muted ? 'opacity-40' : ''}
      `}
      style={active ? {
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}30`,
      } : undefined}
      aria-label={`Step ${beat + 1} ${active ? 'on' : 'off'}`}
    />
  );
}
