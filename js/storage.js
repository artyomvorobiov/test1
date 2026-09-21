/* ===== persistent per-browser state for all games ===== */

const STORAGE_KEY = "glimpse_suite_v2";

function defaultState() {
  return {
    shade: {
      streak: 0,
      maxStreak: 0,
      played: 0,
      lastPuzzleNumber: 0,
      lastResult: null, // array of "good"|"warn"|"bad", length = rounds
      distribution: [0, 0, 0, 0, 0, 0, 0], // index = rounds solved (0..6)
      difficulty: "standard",
    },
    pulse: {
      streak: 0,
      maxStreak: 0,
      played: 0,
      lastPuzzleNumber: 0,
      lastResult: null,
      distribution: [0, 0, 0, 0, 0, 0, 0],
    },
    chain: {
      streak: 0,
      maxStreak: 0,
      played: 0,
      bestLevel: 0,
      lastPuzzleNumber: 0,
      lastResult: 0, // level reached (0..10)
      distribution: new Array(11).fill(0), // index = level reached (0..10)
    },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      shade: { ...base.shade, ...parsed.shade },
      pulse: { ...base.pulse, ...parsed.pulse },
      chain: { ...base.chain, ...parsed.chain },
    };
  } catch {
    return defaultState();
  }
}

export const state = loadState();

export function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
