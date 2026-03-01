import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { DRUM_SOUNDS, SYNTH_SOUNDS } from '../lib/constants';

type MenuView = 'closed' | 'type' | 'drum' | 'synth';

export function AddTrackButton() {
  const [view, setView] = useState<MenuView>('closed');
  const menuRef = useRef<HTMLDivElement>(null);
  const addTrack      = useStore(s => s.addTrack);
  const addSynthTrack = useStore(s => s.addSynthTrack);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setView('closed');
      }
    }
    if (view !== 'closed') {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [view]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setView(view === 'closed' ? 'type' : 'closed')}
        className="
          w-full py-2.5 rounded-lg border border-dashed border-white/15
          text-white/40 hover:text-white/70 hover:border-white/30 hover:bg-white/[0.03]
          text-sm font-medium cursor-pointer transition-all
        "
      >
        + Add Track
      </button>

      {view !== 'closed' && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a25] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
          {view === 'type' && (
            <>
              <button
                onClick={() => setView('drum')}
                className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-3"
              >
                <span className="text-white/40 font-mono text-xs w-8">drum</span>
                <span>Drum</span>
              </button>
              <button
                onClick={() => setView('synth')}
                className="w-full px-4 py-2.5 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-3"
              >
                <span className="text-white/40 font-mono text-xs w-8">synth</span>
                <span>Synth</span>
              </button>
            </>
          )}

          {view === 'drum' && DRUM_SOUNDS.map(sound => (
            <button
              key={sound.id}
              onClick={() => { addTrack(sound.id); setView('closed'); }}
              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-3"
            >
              <span className="text-white/40 font-mono text-xs w-8">{sound.id}</span>
              <span>{sound.label}</span>
            </button>
          ))}

          {view === 'synth' && SYNTH_SOUNDS.map(sound => (
            <button
              key={sound.id}
              onClick={() => { addSynthTrack(sound.id); setView('closed'); }}
              className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-3"
            >
              <span className="text-white/40 font-mono text-xs w-8">~</span>
              <span>{sound.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
