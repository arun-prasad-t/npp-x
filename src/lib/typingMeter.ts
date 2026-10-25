export type TypingEvent = {
  /** Estimated characters per second over the last ~1s (inserts + deletes). */
  cps: number;
  /** Net character delta since last event (can be negative on delete). */
  delta: number;
  /** Milliseconds since previous edit. */
  idleMs: number;
};

type Sample = { t: number; n: number };

const WINDOW_MS = 1000;
/** Cap pastes / format-all so the buddy doesn't explode. */
const MAX_BURST = 6;

/** Sliding-window typing speed for plugin companions. */
export function createTypingMeter() {
  let lastLen = 0;
  let lastT = 0;
  const samples: Sample[] = [];

  return {
    reset(len: number) {
      lastLen = len;
      lastT = performance.now();
      samples.length = 0;
    },
    note(len: number): TypingEvent {
      const now = performance.now();
      const idleMs = lastT ? Math.max(0, now - lastT) : 0;
      const delta = len - lastLen;
      lastLen = len;
      lastT = now;
      samples.push({ t: now, n: Math.min(Math.abs(delta), MAX_BURST) });
      while (samples.length && now - samples[0].t > WINDOW_MS) samples.shift();
      const cps = samples.reduce((sum, s) => sum + s.n, 0);
      return { cps, delta, idleMs };
    },
  };
}
