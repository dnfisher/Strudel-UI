import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { DRUM_SOUNDS } from '../lib/constants';

export function AddTrackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const addTrack = useStore(s => s.addTrack);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full py-2.5 rounded-lg border border-dashed border-white/15
          text-white/40 hover:text-white/70 hover:border-white/30 hover:bg-white/[0.03]
          text-sm font-medium cursor-pointer transition-all
        "
      >
        + Add Track
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a25] border border-white/10 rounded-lg shadow-xl z-10 overflow-hidden">
          {DRUM_SOUNDS.map(sound => (
            <button
              key={sound.id}
              onClick={() => { addTrack(sound.id); setIsOpen(false); }}
              className="
                w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white
                cursor-pointer transition-colors flex items-center gap-3
              "
            >
              <span className="text-white/40 font-mono text-xs w-8">{sound.id}</span>
              <span>{sound.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
