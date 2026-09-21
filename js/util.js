/* ===== shared helpers: seeded RNG + daily puzzle numbering ===== */

const REF_EPOCH = Date.UTC(2025, 0, 1); // puzzle #1 day

export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dayNumberUTC(date) {
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((midnight - REF_EPOCH) / 86400000);
}

export function puzzleNumberToday() {
  return dayNumberUTC(new Date()) + 1;
}

export function msUntilNextUTCMidnight() {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/** Seed a PRNG for a given game + daily puzzle number (or a random one for practice). */
export function seedFor(gameKey, mode, puzzleNumber) {
  if (mode === "daily") {
    const gameSalt = [...gameKey].reduce((a, c) => a + c.charCodeAt(0), 0);
    return mulberry32((puzzleNumber * 2654435761) ^ (gameSalt * 40503));
  }
  return mulberry32((Math.random() * 2 ** 31) | 0);
}
