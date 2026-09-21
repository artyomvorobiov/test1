import { seedFor, puzzleNumberToday, msUntilNextUTCMidnight, clamp, pad } from "./util.js";
import { t } from "./i18n.js";
import { state, persist } from "./storage.js";
import {
  showScreen, showToast, copyText, addStat,
  renderPips, setPipActive, setPipResult, emojiFor,
} from "./ui.js";

const KEY = "shade";
const ROUNDS = 6;

const DAILY_CONFIG = [
  { size: 4, timeMs: 5000, delta: 20 },
  { size: 5, timeMs: 4500, delta: 15 },
  { size: 5, timeMs: 4000, delta: 11 },
  { size: 6, timeMs: 3500, delta: 8 },
  { size: 6, timeMs: 3000, delta: 6 },
  { size: 7, timeMs: 2500, delta: 4 },
];

const PRACTICE_DIFFICULTIES = {
  casual: [
    { size: 4, timeMs: 6000, delta: 26 },
    { size: 4, timeMs: 5500, delta: 22 },
    { size: 5, timeMs: 5000, delta: 18 },
    { size: 5, timeMs: 4500, delta: 15 },
    { size: 6, timeMs: 4000, delta: 12 },
    { size: 6, timeMs: 3500, delta: 10 },
  ],
  standard: DAILY_CONFIG,
  hard: [
    { size: 5, timeMs: 4000, delta: 14 },
    { size: 5, timeMs: 3500, delta: 11 },
    { size: 6, timeMs: 3200, delta: 9 },
    { size: 6, timeMs: 2800, delta: 7 },
    { size: 7, timeMs: 2400, delta: 5 },
    { size: 7, timeMs: 2000, delta: 4 },
  ],
  insane: [
    { size: 6, timeMs: 3000, delta: 9 },
    { size: 6, timeMs: 2600, delta: 7 },
    { size: 7, timeMs: 2300, delta: 6 },
    { size: 7, timeMs: 2000, delta: 5 },
    { size: 8, timeMs: 1800, delta: 4 },
    { size: 8, timeMs: 1500, delta: 3 },
  ],
};

let session = null;
let timerRAF = null;
let timerStart = 0;
let timerDuration = 0;
let countdownHandle = null;

function el(id) { return document.getElementById(id); }

function makeSession(mode, difficulty) {
  const puzzleNumber = mode === "daily" ? puzzleNumberToday() : Math.floor(Math.random() * 1e9);
  const config = mode === "daily" ? DAILY_CONFIG : PRACTICE_DIFFICULTIES[difficulty] || DAILY_CONFIG;
  return {
    mode,
    difficulty,
    puzzleNumber,
    config,
    rng: seedFor(KEY, mode, puzzleNumber),
    roundIndex: 0,
    results: [],
    locked: false,
  };
}

function startGame(mode, difficulty) {
  session = makeSession(mode, difficulty);
  showScreen("shade-game");
  renderPips("shadeRoundPips", ROUNDS);
  startRound();
}

function startRound() {
  session.locked = false;
  const cfg = session.config[session.roundIndex];
  el("shadeRoundLabel").textContent = t("shade.game.round", { n: session.roundIndex + 1, total: ROUNDS });
  el("shadeHintText").textContent = t("shade.game.hint");
  setPipActive("shadeRoundPips", session.roundIndex, ROUNDS);

  const grid = buildRoundData(cfg, session.rng);
  renderGrid(grid, cfg);
  runTimer(cfg.timeMs);
}

function buildRoundData(cfg, rng) {
  const total = cfg.size * cfg.size;
  const targetIndex = Math.floor(rng() * total);
  const hue = Math.floor(rng() * 360);
  const sat = 45 + Math.floor(rng() * 15);
  const baseLight = 42 + Math.floor(rng() * 12);
  const sign = rng() > 0.5 ? 1 : -1;
  const targetLight = clamp(baseLight + sign * cfg.delta, 8, 92);
  return { total, targetIndex, hue, sat, baseLight, targetLight };
}

function renderGrid(data, cfg) {
  const grid = el("shadeTileGrid");
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

function runTimer(durationMs) {
  const fill = el("shadeTimerFill");
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
  const cfg = session.config[session.roundIndex];
  let grade;
  if (outcome === "hit") {
    grade = elapsed < cfg.timeMs * 0.5 ? "good" : "warn";
  } else {
    grade = "bad";
  }
  session.results.push(grade);

  revealTarget();
  flashRoundResult(grade);
  setPipResult("shadeRoundPips", session.roundIndex, grade);

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
  const grid = el("shadeTileGrid");
  const target = grid.querySelector('[data-target="1"]');
  if (target) target.classList.add("target-reveal");
}

function flashRoundResult(grade) {
  const flash = el("shadeRoundFlash");
  flash.textContent = grade === "bad" ? "✕" : "✓";
  flash.className = "round-flash " + (grade === "bad" ? "show-bad" : "show-good");
  setTimeout(() => { flash.className = "round-flash"; }, 650);
}

function endGame() {
  const solved = session.results.filter((r) => r !== "bad").length;

  if (session.mode === "daily") {
    const s = state.shade;
    s.played++;
    if (s.lastPuzzleNumber !== session.puzzleNumber) {
      s.streak = solved > 0 ? s.streak + 1 : 0;
      s.maxStreak = Math.max(s.maxStreak, s.streak);
      s.lastPuzzleNumber = session.puzzleNumber;
      s.lastResult = session.results;
      s.distribution[solved]++;
      persist();
    }
  }

  renderResultScreen(solved);
  showScreen("shade-result");
}

function buildShareText(puzzleNumber, results) {
  const solved = results.filter((r) => r !== "bad").length;
  const strip = results.map(emojiFor).join("");
  return `SHADE #${puzzleNumber} ${solved}/${ROUNDS}\n${strip}`;
}

function renderResultScreen(solved) {
  el("shadeResultEyebrow").textContent = session.mode === "daily" ? `SHADE #${session.puzzleNumber}` : t("shade.intro.practice");
  el("shadeResultTitle").textContent = `${solved} / ${ROUNDS}`;
  el("shadeEmojiStrip").textContent = session.results.map(emojiFor).join(" ");

  const statsRow = el("shadeStatsRow");
  statsRow.innerHTML = "";
  if (session.mode === "daily") {
    addStat(statsRow, state.shade.streak, t("stat.streak"));
    addStat(statsRow, state.shade.maxStreak, t("stat.bestStreak"));
    addStat(statsRow, state.shade.played, t("stat.played"));
  } else {
    addStat(statsRow, solved, t("stat.rounds"));
    addStat(statsRow, session.results.filter((r) => r === "good").length, t("stat.fast"));
  }

  const nextDaily = el("shadeNextDaily");
  const againBtn = el("shadeAgainBtn");
  if (session.mode === "daily") {
    nextDaily.innerHTML = `${t("common.nextIn", { game: "SHADE" })} <b id="shadeCountdownVal"></b>`;
    startCountdown();
    againBtn.textContent = t("common.practiceBtn");
  } else {
    nextDaily.innerHTML = "";
    againBtn.textContent = t("common.playAgainPractice");
  }
}

function startCountdown() {
  clearInterval(countdownHandle);
  function tick() {
    const ms = msUntilNextUTCMidnight();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const target = el("shadeCountdownVal");
    if (target) target.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  tick();
  countdownHandle = setInterval(tick, 1000);
}

function currentDifficulty() {
  return state.shade.difficulty || "standard";
}

function setDifficulty(diff) {
  state.shade.difficulty = diff;
  persist();
  document.querySelectorAll("#shadeDifficultyRow .pill").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.diff === diff);
  });
}

export function renderIntro() {
  el("shadePuzzleId").textContent = `SHADE #${puzzleNumberToday()}`;
  const alreadyPlayed = state.shade.lastPuzzleNumber === puzzleNumberToday() && state.shade.lastResult;

  const badges = el("shadeStreakBadges");
  badges.innerHTML = "";
  addBadge(badges, state.shade.streak, t("stat.streak"));
  addBadge(badges, state.shade.maxStreak, t("stat.bestStreak"));
  addBadge(badges, state.shade.played, t("stat.played"));

  setDifficulty(currentDifficulty());

  const dailyBtn = el("shadePlayDailyBtn");
  if (alreadyPlayed) {
    dailyBtn.textContent = t("common.today");
    dailyBtn.onclick = () => {
      session = { mode: "daily", puzzleNumber: puzzleNumberToday(), results: state.shade.lastResult, config: DAILY_CONFIG };
      const solved = session.results.filter((r) => r !== "bad").length;
      renderResultScreen(solved);
      showScreen("shade-result");
    };
  } else {
    dailyBtn.textContent = t("shade.intro.playDaily");
    dailyBtn.onclick = () => startGame("daily");
  }
}

function addBadge(wrap, value, label) {
  const b = document.createElement("div");
  b.className = "badge";
  b.innerHTML = `<b>${value}</b>${label}`;
  wrap.appendChild(b);
}

export function renderStatsTab(container) {
  const s = state.shade;
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "stats-grid";
  container.appendChild(grid);
  addStat(grid, s.played, t("stat.played"));
  addStat(grid, s.streak, t("stat.streak"));
  addStat(grid, s.maxStreak, t("stat.bestStreak"));
  const winPct = s.played
    ? Math.round((s.distribution.slice(1).reduce((a, b) => a + b, 0) / s.played) * 100)
    : 0;
  addStat(grid, winPct + "%", t("stat.winRate"));

  const distTitle = document.createElement("p");
  distTitle.className = "dist-title";
  distTitle.textContent = t("modal.distTitle");
  container.appendChild(distTitle);

  const bars = document.createElement("div");
  bars.className = "dist-bars";
  container.appendChild(bars);
  const max = Math.max(1, ...s.distribution);
  for (let i = ROUNDS; i >= 0; i--) {
    const count = s.distribution[i];
    const row = document.createElement("div");
    row.className = "dist-row";
    row.innerHTML = `
      <span style="width:34px">${i}/${ROUNDS}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%"></div></div>
      <span class="bar-count">${count}</span>`;
    bars.appendChild(row);
  }
}

export const HOW_KEYS = ["shade.how.1", "shade.how.2", "shade.how.3", "shade.how.4", "shade.how.5"];

export function mount() {
  el("shadePlayPracticeBtn").addEventListener("click", () => startGame("practice", currentDifficulty()));
  el("shadeShareBtn").addEventListener("click", () => {
    copyText(
      buildShareText(session.puzzleNumber, session.results),
      t("toast.copied"),
      (text) => t("toast.copyFallback", { text: text.split("\n")[0] })
    );
  });
  el("shadeAgainBtn").addEventListener("click", () => startGame("practice", currentDifficulty()));

  document.querySelectorAll("#shadeDifficultyRow .pill").forEach((btn) => {
    btn.addEventListener("click", () => setDifficulty(btn.dataset.diff));
  });
}
