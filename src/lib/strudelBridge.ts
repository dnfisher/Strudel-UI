import { initStrudel } from '@strudel/web';

let initialized = false;
let initPromise: Promise<void> | null = null;
let currentPlayId = 0;

export async function ensureInit(): Promise<void> {
  if (initialized) return;
  if (!initPromise) {
    initPromise = initStrudel({
      prebake: () => {
        const w = window as unknown as Record<string, unknown>;
        if (typeof w.samples === 'function') {
          const s = w.samples as (url: string) => Promise<void>;
          return Promise.all([
            s('github:tidalcycles/dirt-samples'),
            s('github:switchangel/beginningtrance'),
            s('github:switchangel/pad'),
            s('github:switchangel/breaks'),
            s('github:eddyflux/crate'),
          ]).then(() => undefined);
        }
      },
    }).then(() => {
      initialized = true;
    });
  }
  return initPromise;
}

export async function playCode(code: string): Promise<void> {
  const myPlayId = ++currentPlayId;
  await ensureInit();
  try {
    const w = window as unknown as Record<string, unknown>;
    if (typeof w.hush === 'function') {
      (w.hush as () => void)();
    }
    // Bail out if stop() was called while we were awaiting init
    if (myPlayId !== currentPlayId) return;
    if (typeof w.evaluate === 'function') {
      await (w.evaluate as (code: string) => Promise<void>)(code);
    }
  } catch (err) {
    console.error('Strudel evaluation error:', err);
  }
}

export async function stop(): Promise<void> {
  currentPlayId++; // Invalidate any in-flight playCode calls
  if (!initialized) return;
  try {
    const w = window as unknown as Record<string, unknown>;
    if (typeof w.hush === 'function') {
      (w.hush as () => void)();
    }
  } catch (err) {
    console.error('Error stopping:', err);
  }
}
