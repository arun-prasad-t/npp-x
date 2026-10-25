export type TypingEvent = {
  /** Estimated characters per second over a short window. */
  cps: number;
  /** Net character delta since last event (can be negative on delete). */
  delta: number;
  /** Milliseconds since previous edit. */
  idleMs: number;
};

type Sample = { t: number; len: number };

/**
 * Sliding-window typing speed for plugin companions (Type Runner, etc.).
 */
export function createTypingMeter() {
  let lastLen = 0;
  let lastT = 0;
  const window: Sample[] = [];
  const WINDOW_MS = 1200;

  return {
    reset(len: number) {
      lastLen = len;
      lastT = performance.now();
      window.length = 0;
      window.push({ t: lastT, len });
    },
    note(len: number): TypingEvent {
      const now = performance.now();
      const idleMs = lastT ? Math.max(0, now - lastT) : 0;
      const delta = len - lastLen;
      lastLen = len;
      lastT = now;
      window.push({ t: now, len });
      while (window.length > 1 && now - window[0].t > WINDOW_MS) {
        window.shift();
      }
      const first = window[0];
      const dt = Math.max(1, now - first.t);
      const cps = Math.max(0, ((len - first.len) / dt) * 1000);
      return { cps, delta, idleMs };
    },
  };
}
