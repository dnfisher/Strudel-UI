import { useEffect, useRef, useState } from 'react';

export function usePlayhead(isPlaying: boolean, bpm: number): number | null {
  const [step, setStep] = useState<number | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      setStep(null);
      return;
    }

    startRef.current = performance.now();
    // bpm/4 = cycles per minute, /60 = cycles per second, *16 = steps per second
    const stepsPerMs = (bpm / 4 / 60 / 1000) * 16;

    function tick() {
      const elapsed = performance.now() - startRef.current;
      setStep(Math.floor(elapsed * stepsPerMs) % 16);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, bpm]);

  return step;
}
