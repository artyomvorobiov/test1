/* ===== GLIMPSE — game logic ===== */

const ROUNDS = 5;
const REF_EPOCH = Date.UTC(2025, 0, 1); // puzzle #1 day

const ROUND_CONFIG = [
  { size: 4, timeMs: 5000, delta: 20 },
  { size: 5, timeMs: 4500, delta: 15 },
  { size: 6, timeMs: 4000, delta: 11 },
  { size: 6, timeMs: 3300, delta: 8 },
  { size: 7, timeMs: 2800, delta: 6 },
];

const STORAGE_KEY = "glimpse_state_v1";

/* ---------- seeded RNG ---------- */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dayNumberUTC(date) {
  const midnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((midnight - REF_EPOCH) / 86400000);
}

function puzzleNumberToday() {
  return dayNumberUTC(new Date()) + 1;
}

function msUntilNextUTCMidnight() {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

/* ---------- persistent state ---------- */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    return { ...defaultState(), ...s };
  } catch {
    return defaultState();
  }
}
function defaultState() {
  return {
    streak: 0,
    maxStreak: 0,
    played: 0,
    lastPuzzleNumber: 0,
    lastResult: null, // array of "good"|"warn"|"bad"
    distribution: [0, 0, 0, 0, 0, 0], // index = rounds solved (0..5)
  };
}
function saveState(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

let appState = loadState();

/* ---------- game session ---------- */
let session = null; // { mode, puzzleNumber, rng, roundIndex, results, timerHandle, deadline }

function makeSession(mode) {
  const puzzleNumber = mode === "daily" ? puzzleNumberToday() : Math.floor(Math.random() * 1e9);
  const seed = mode === "daily" ? puzzleNumber * 2654435761 : (Math.random() * 2 ** 31) | 0;
  return {
    mode,
    puzzleNumber,
    rng: mulberry32(seed),
    roundIndex: 0,
    results: [],
    locked: false,
  };
}

function startGame(mode) {
  session = makeSession(mode);
  showScreen("game");
  renderPips();
  startRound();
}

function startRound() {
  session.locked = false;
  const cfg = ROUND_CONFIG[session.roundIndex];
  document.getElementById("roundLabel").textContent = `Раунд ${session.roundIndex + 1} / ${ROUNDS}`;
  document.getElementById("hintText").textContent = "Кликни по плитке другого оттенка";
  updatePipsActive();

  const grid = buildRoundData(cfg, session.rng);
  renderGrid(grid, cfg);
  runTimer(cfg.timeMs);
}

function buildRoundData(cfg, rng) {
  const total = cfg.size * cfg.size;
  const targetIndex = Math.floor(rng() * total);
  const hue = Math.floor(rng() * 360);
  const sat = 45 + Math.floor(rng() * 15); // 45-60
  const baseLight = 42 + Math.floor(rng() * 12); // 42-54
  const sign = rng() > 0.5 ? 1 : -1;
  const targetLight = clamp(baseLight + sign * cfg.delta, 8, 92);
  return { total, targetIndex, hue, sat, baseLight, targetLight };
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function renderGrid(data, cfg) {
  const grid = document.getElementById("tileGrid");
  grid.style.gridTemplateColumns = `repeat(${cfg.size}, 1fr)`;
  grid.innerHTML = "";
  for (let i = 0; i < data.total; i++) {
    const tile = document.createElement("div");
    tile.className = "tile";
    const light = i === data.targetIndex ? data.targetLight : data.baseLight;
    tile.style.background = `hsl(${data.hue} ${data.sat}% ${light}%)`;
    tile.dataset.target = i === data.targetIndex ? "1" : "0";
    tile.addEventListener("click", onTileClick);
    grid.appendChild(tile);
  }
}

function onTileClick(e) {
  if (session.locked) return;
  const isTarget = e.currentTarget.dataset.target === "1";
  if (isTarget) {
    finishRound("hit");
  } else {
    e.currentTarget.classList.add("wrong-shake");
    finishRound("miss-click");
  }
}

let timerRAF = null;
let timerStart = 0;
let timerDuration = 0;

function runTimer(durationMs) {
  const fill = document.getElementById("timerFill");
  fill.style.transition = "none";
  fill.style.width = "100%";
  fill.style.background = "linear-gradient(90deg, var(--accent2), var(--accent))";
  timerStart = performance.now();
  timerDuration = durationMs;
  cancelAnimationFrame(timerRAF);

  function tick(now) {
    const elapsed = now - timerStart;
    const pct = Math.max(0, 1 - elapsed / timerDuration);
    fill.style.width = pct * 100 + "%";
    if (pct < 0.35) fill.style.background = "linear-gradient(90deg, var(--warn), var(--danger))";
    if (elapsed >= timerDuration) {
      if (!session.locked) finishRound("timeout");
      return;
    }
    timerRAF = requestAnimationFrame(tick);
  }
  timerRAF = requestAnimationFrame(tick);
}

function finishRound(outcome) {
  if (session.locked) return;
  session.locked = true;
  cancelAnimationFrame(timerRAF);

  const elapsed = performance.now() - timerStart;
  const cfg = ROUND_CONFIG[session.roundIndex];
  let grade;
  if (outcome === "hit") {
    grade = elapsed < cfg.timeMs * 0.5 ? "good" : "warn";
  } else {
    grade = "bad";
  }
  session.results.push(grade);

  revealTarget();
  flashRoundResult(grade);
  updatePipsResult(session.roundIndex, grade);

  setTimeout(() => {
    session.roundIndex++;
    if (session.roundIndex >= ROUNDS) {
      endGame();
    } else {
      startRound();
    }
  }, 700);
}

function revealTarget() {
  const grid = document.getElementById("tileGrid");
  const t = grid.querySelector('[data-target="1"]');
  if (t) t.classList.add("target-reveal");
}

function flashRoundResult(grade) {
  const flash = document.getElementById("roundFlash");
  flash.textContent = grade === "bad" ? "✕" : "✓";
  flash.className = "round-flash " + (grade === "bad" ? "show-bad" : "show-good");
  requestAnimationFrame(() => {
    setTimeout(() => { flash.className = "round-flash"; }, 650);
  });
}

/* ---------- pips ---------- */
function renderPips() {
  const wrap = document.getElementById("roundPips");
  wrap.innerHTML = "";
  for (let i = 0; i < ROUNDS; i++) {
    const pip = document.createElement("div");
    pip.className = "pip";
    pip.id = "pip-" + i;
    wrap.appendChild(pip);
  }
  updatePipsActive();
}
function updatePipsActive() {
  for (let i = 0; i < ROUNDS; i++) {
    const pip = document.getElementById("pip-" + i);
    if (!pip) continue;
    pip.classList.toggle("active", i === session.roundIndex);
  }
}
function updatePipsResult(index, grade) {
  const pip = document.getElementById("pip-" + index);
  if (!pip) return;
  pip.classList.remove("active");
  pip.classList.add(grade === "good" ? "done-good" : grade === "warn" ? "done-warn" : "done-bad");
}

/* ---------- end game / results ---------- */
function endGame() {
  const solved = session.results.filter((r) => r !== "bad").length;

  if (session.mode === "daily") {
    appState.played++;
    if (appState.lastPuzzleNumber !== session.puzzleNumber) {
      appState.streak = solved > 0 ? appState.streak + 1 : 0;
      appState.maxStreak = Math.max(appState.maxStreak, appState.streak);
      appState.lastPuzzleNumber = session.puzzleNumber;
      appState.lastResult = session.results;
      appState.distribution[solved]++;
      saveState(appState);
    }
  }

  renderResultScreen(solved);
  showScreen("result");
}

function emojiFor(grade) {
  return grade === "good" ? "🟩" : grade === "warn" ? "🟨" : "🟥";
}

function buildShareText(puzzleNumber, results) {
  const solved = results.filter((r) => r !== "bad").length;
  const strip = results.map(emojiFor).join("");
  return `GLIMPSE #${puzzleNumber} ${solved}/${ROUNDS}\n${strip}`;
}

function renderResultScreen(solved) {
  document.getElementById("resultEyebrow").textContent =
    session.mode === "daily" ? `GLIMPSE #${session.puzzleNumber}` : "Тренировка";
  document.getElementById("resultTitle").textContent = `${solved} / ${ROUNDS}`;
  document.getElementById("emojiStrip").textContent = session.results.map(emojiFor).join(" ");

  const statsRow = document.getElementById("statsRow");
  statsRow.innerHTML = "";
  if (session.mode === "daily") {
    addStat(statsRow, appState.streak, "Серия");
    addStat(statsRow, appState.maxStreak, "Лучшая серия");
    addStat(statsRow, appState.played, "Сыграно");
  } else {
    addStat(statsRow, solved, "Раундов");
    addStat(statsRow, session.results.filter((r) => r === "good").length, "Быстрых");
  }

  const nextDaily = document.getElementById("nextDaily");
  if (session.mode === "daily") {
    nextDaily.innerHTML = `Следующий GLIMPSE через <b id="countdownVal"></b>`;
    startCountdown();
    document.getElementById("againBtn").textContent = "Тренировка (без сохранения серии)";
  } else {
    nextDaily.innerHTML = "";
    document.getElementById("againBtn").textContent = "Играть ещё раз";
  }
}

function addStat(row, value, label) {
  const el = document.createElement("div");
  el.className = "stat";
  el.innerHTML = `<b>${value}</b><span>${label}</span>`;
  row.appendChild(el);
}

let countdownHandle = null;
function startCountdown() {
  clearInterval(countdownHandle);
  function tick() {
    const ms = msUntilNextUTCMidnight();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const el = document.getElementById("countdownVal");
    if (el) el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  tick();
  countdownHandle = setInterval(tick, 1000);
}
function pad(n) { return String(n).padStart(2, "0"); }

/* ---------- screens ---------- */
function showScreen(name) {
  ["intro", "game", "result"].forEach((s) => {
    document.getElementById("screen-" + s).classList.toggle("hidden", s !== name);
  });
}

/* ---------- intro rendering ---------- */
function renderIntro() {
  document.getElementById("puzzleId").textContent = `GLIMPSE #${puzzleNumberToday()}`;
  const alreadyPlayed = appState.lastPuzzleNumber === puzzleNumberToday() && appState.lastResult;

  const badges = document.getElementById("streakBadges");
  badges.innerHTML = "";
  addBadge(badges, appState.streak, "Серия");
  addBadge(badges, appState.maxStreak, "Лучшая");
  addBadge(badges, appState.played, "Игр");

  const dailyBtn = document.getElementById("playDailyBtn");
  if (alreadyPlayed) {
    dailyBtn.textContent = "Результат дня";
    dailyBtn.onclick = () => {
      session = { mode: "daily", puzzleNumber: puzzleNumberToday(), results: appState.lastResult };
      const solved = session.results.filter((r) => r !== "bad").length;
      renderResultScreen(solved);
      showScreen("result");
    };
  } else {
    dailyBtn.textContent = "Играть — Daily";
    dailyBtn.onclick = () => startGame("daily");
  }
}
function addBadge(wrap, value, label) {
  const el = document.createElement("div");
  el.className = "badge";
  el.innerHTML = `<b>${value}</b>${label}`;
  wrap.appendChild(el);
}

/* ---------- stats modal ---------- */
function renderStatsModal() {
  const grid = document.getElementById("statsGrid");
  grid.innerHTML = "";
  addStat(grid, appState.played, "Сыграно");
  addStat(grid, appState.streak, "Серия");
  addStat(grid, appState.maxStreak, "Лучшая серия");
  const winPct = appState.played
    ? Math.round((appState.distribution.slice(1).reduce((a, b) => a + b, 0) / appState.played) * 100)
    : 0;
  addStat(grid, winPct + "%", "Хотя бы 1/5");

  const bars = document.getElementById("distBars");
  bars.innerHTML = "";
  const max = Math.max(1, ...appState.distribution);
  for (let i = ROUNDS; i >= 0; i--) {
    const row = document.createElement("div");
    row.className = "dist-row";
    const count = appState.distribution[i];
    row.innerHTML = `
      <span style="width:34px">${i}/5</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%"></div></div>
      <span class="bar-count">${count}</span>`;
    bars.appendChild(row);
  }
}

/* ---------- clipboard / toast ---------- */
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

async function copyShareText() {
  const text = buildShareText(session.puzzleNumber, session.results);
  try {
    await navigator.clipboard.writeText(text);
    showToast("Результат скопирован!");
  } catch {
    showToast(text.split("\n")[0] + " — скопируйте вручную");
  }
}

/* ---------- wiring ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderIntro();

  document.getElementById("playPracticeBtn").addEventListener("click", () => startGame("practice"));
  document.getElementById("shareBtn").addEventListener("click", copyShareText);
  document.getElementById("againBtn").addEventListener("click", () => startGame("practice"));

  document.getElementById("howBtn").addEventListener("click", () => toggleModal("howOverlay", true));
  document.getElementById("howClose").addEventListener("click", () => toggleModal("howOverlay", false));
  document.getElementById("howGotIt").addEventListener("click", () => toggleModal("howOverlay", false));

  document.getElementById("statsBtn").addEventListener("click", () => {
    renderStatsModal();
    toggleModal("statsOverlay", true);
  });
  document.getElementById("statsClose").addEventListener("click", () => toggleModal("statsOverlay", false));

  [document.getElementById("howOverlay"), document.getElementById("statsOverlay")].forEach((ov) => {
    ov.addEventListener("click", (e) => {
      if (e.target === ov) ov.classList.add("hidden");
    });
  });
});

function toggleModal(id, show) {
  document.getElementById(id).classList.toggle("hidden", !show);
}
