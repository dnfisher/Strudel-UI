import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { generatePlayableCode } from '../lib/codeGenerator';
import { playCode, stop } from '../lib/strudelBridge';

export function Header() {
  const isPlaying = useStore(s => s.isPlaying);
  const bpm = useStore(s => s.bpm);
  const tracks = useStore(s => s.tracks);
  const setPlaying = useStore(s => s.setPlaying);
  const setBpm = useStore(s => s.setBpm);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const handlePlay = useCallback(async () => {
    if (isPlayingRef.current) {
      await stop();
      setPlaying(false);
    } else {
      const code = generatePlayableCode(tracks, bpm);
      if (code) {
        prevStateRef.current = code; // Prevent re-evaluate effect from double-firing
        await playCode(code);
        setPlaying(true);
      }
    }
  }, [tracks, bpm, setPlaying]);

  // Re-evaluate when state changes while playing
  const prevStateRef = useRef('');
  useEffect(() => {
    if (!isPlaying) return;
    const code = generatePlayableCode(tracks, bpm);
    if (code && code !== prevStateRef.current) {
      prevStateRef.current = code;
      playCode(code);
    }
  }, [tracks, bpm, isPlaying]);

  // Space bar shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        handlePlay();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlay]);

  return (
    <header className="flex items-center gap-6 px-5 py-3 bg-[#0d0d14] border-b border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Strudel UI
        </span>
      </div>

      {/* Transport */}
      <div className="flex items-center gap-4 flex-1 justify-center">
        {/* Play/Stop */}
        <button
          onClick={handlePlay}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all
            ${isPlaying
              ? 'bg-green-500 text-white playing-pulse hover:bg-green-600'
              : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }
          `}
          title={isPlaying ? 'Stop (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="2" width="12" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <polygon points="4,2 16,9 4,16" />
            </svg>
          )}
        </button>

        {/* BPM */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">BPM</span>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
            className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-center text-white/80 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {/* Spacer for balance */}
      <div className="w-20 shrink-0" />
    </header>
  );
}
