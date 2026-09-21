import { seedFor, puzzleNumberToday, msUntilNextUTCMidnight, pad } from "./util.js";
import { t } from "./i18n.js";
import { state, persist } from "./storage.js";
import { showScreen, addStat, copyText } from "./ui.js";

const KEY = "chain";
const CELLS = 9;
const DAILY_CAP = 10;
const PRACTICE_CAP = 25;

let session = null;
let countdownHandle = null;
let cellEls = [];

function el(id) { return document.getElementById(id); }

function buildGrid() {
  const grid = el("chainGrid");
  grid.innerHTML = "";
  cellEls = [];
  for (let i = 0; i < CELLS; i++) {
    const cell = document.createElement("div");
    cell.className = "chain-cell";
    cell.style.background = `hsl(${Math.round((i * 360) / CELLS)} 55% 42%)`;
    cell.dataset.index = i;
    cell.addEventListener("click", () => onCellClick(i));
    grid.appendChild(cell);
    cellEls.push(cell);
  }
}

function makeSession(mode) {
  const puzzleNumber = mode === "daily" ? puzzleNumberToday() : Math.floor(Math.random() * 1e9);
  return {
    mode,
    puzzleNumber,
    rng: seedFor(KEY, mode, puzzleNumber),
    cap: mode === "daily" ? DAILY_CAP : PRACTICE_CAP,
    level: 1,
    sequence: [],
    phase: "idle",
    inputIndex: 0,
  };
}

function startGame(mode) {
  session = makeSession(mode);
  buildGrid();
  showScreen("chain-game");
  session.sequence.push(Math.floor(session.rng() * CELLS));
  playSequence();
}

function flashDurationFor(level) {
  return Math.max(190, 480 - level * 18);
}

function playSequence() {
  session.phase = "showing";
  el("chainLevelLabel").textContent = t("chain.game.level", { n: session.level });
  el("chainStatusLabel").textContent = t("chain.game.watch");
  session.inputIndex = 0;

  const flashMs = flashDurationFor(session.level);
  const gapMs = Math.round(flashMs * 0.55);
  let i = 0;

  function step() {
    if (i >= session.sequence.length) {
      session.phase = "input";
      el("chainStatusLabel").textContent = t("chain.game.repeat");
      return;
    }
    const idx = session.sequence[i];
    const cellEl = cellEls[idx];
    cellEl.classList.add("chain-flash");
    setTimeout(() => {
      cellEl.classList.remove("chain-flash");
      i++;
      setTimeout(step, gapMs);
    }, flashMs);
  }
  setTimeout(step, 400);
}

function onCellClick(i) {
  if (!session || session.phase !== "input") return;
  const expected = session.sequence[session.inputIndex];
  const cellEl = cellEls[i];

  if (i === expected) {
    cellEl.classList.add("chain-hit");
    setTimeout(() => cellEl.classList.remove("chain-hit"), 220);
    session.inputIndex++;
    if (session.inputIndex === session.sequence.length) {
      levelComplete();
    }
  } else {
    cellEl.classList.add("chain-miss");
    setTimeout(() => cellEl.classList.remove("chain-miss"), 300);
    fail();
  }
}

function levelComplete() {
  session.phase = "idle";
  if (session.level >= session.cap) {
    endGame(session.level);
    return;
  }
  session.level++;
  session.sequence.push(Math.floor(session.rng() * CELLS));
  setTimeout(playSequence, 550);
}

function fail() {
  session.phase = "idle";
  const reached = session.level - 1;
  setTimeout(() => endGame(reached), 400);
}

function endGame(reached) {
  session.finalReached = reached;
  if (session.mode === "daily") {
    const s = state.chain;
    s.played++;
    if (s.lastPuzzleNumber !== session.puzzleNumber) {
      s.streak = reached > 0 ? s.streak + 1 : 0;
      s.maxStreak = Math.max(s.maxStreak, s.streak);
      s.lastPuzzleNumber = session.puzzleNumber;
      s.lastResult = reached;
      s.distribution[reached]++;
      persist();
    }
  }
  s_updateBestLevel(reached);
  renderResultScreen(reached);
  showScreen("chain-result");
}

function s_updateBestLevel(reached) {
  if (reached > state.chain.bestLevel) {
    state.chain.bestLevel = reached;
    persist();
  }
}

function buildShareText(puzzleNumber, reached, cap) {
  const strip = Array.from({ length: cap }, (_, i) => (i < reached ? "🟩" : "🟥")).join("");
  return `CHAIN #${puzzleNumber} ${reached}/${cap}\n${strip}`;
}

function renderResultScreen(reached) {
  const cap = session.cap;
  el("chainResultEyebrow").textContent = session.mode === "daily" ? `CHAIN #${session.puzzleNumber}` : t("chain.intro.practice");
  el("chainResultTitle").textContent = session.mode === "daily" ? `${reached} / ${cap}` : `${t("stat.level")} ${reached}`;
  el("chainEmojiStrip").textContent = session.mode === "daily"
    ? Array.from({ length: cap }, (_, i) => (i < reached ? "🟩" : "🟥")).join(" ")
    : "";

  const statsRow = el("chainStatsRow");
  statsRow.innerHTML = "";
  if (session.mode === "daily") {
    addStat(statsRow, state.chain.streak, t("stat.streak"));
    addStat(statsRow, state.chain.maxStreak, t("stat.bestStreak"));
    addStat(statsRow, state.chain.played, t("stat.played"));
  } else {
    addStat(statsRow, reached, t("stat.level"));
    addStat(statsRow, state.chain.bestLevel, t("stat.bestLevel"));
  }

  const nextDaily = el("chainNextDaily");
  const againBtn = el("chainAgainBtn");
  if (session.mode === "daily") {
    nextDaily.innerHTML = `${t("common.nextIn", { game: "CHAIN" })} <b id="chainCountdownVal"></b>`;
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
    const target = el("chainCountdownVal");
    if (target) target.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  tick();
  countdownHandle = setInterval(tick, 1000);
}

export function renderIntro() {
  el("chainPuzzleId").textContent = `CHAIN #${puzzleNumberToday()}`;
  const alreadyPlayed = state.chain.lastPuzzleNumber === puzzleNumberToday() && state.chain.played > 0;

  const badges = el("chainStreakBadges");
  badges.innerHTML = "";
  addBadge(badges, state.chain.streak, t("stat.streak"));
  addBadge(badges, state.chain.bestLevel, t("stat.bestLevel"));
  addBadge(badges, state.chain.played, t("stat.played"));

  const dailyBtn = el("chainPlayDailyBtn");
  if (alreadyPlayed) {
    dailyBtn.textContent = t("common.today");
    dailyBtn.onclick = () => {
      session = { mode: "daily", puzzleNumber: puzzleNumberToday(), cap: DAILY_CAP, finalReached: state.chain.lastResult };
      renderResultScreen(state.chain.lastResult);
      showScreen("chain-result");
    };
  } else {
    dailyBtn.textContent = t("chain.intro.playDaily");
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
  const s = state.chain;
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "stats-grid";
  container.appendChild(grid);
  addStat(grid, s.played, t("stat.played"));
  addStat(grid, s.streak, t("stat.streak"));
  addStat(grid, s.bestLevel, t("stat.bestLevel"));
  addStat(grid, s.maxStreak, t("stat.bestStreak"));

  const distTitle = document.createElement("p");
  distTitle.className = "dist-title";
  distTitle.textContent = t("modal.distTitle");
  container.appendChild(distTitle);

  const bars = document.createElement("div");
  bars.className = "dist-bars";
  container.appendChild(bars);
  const max = Math.max(1, ...s.distribution);
  for (let i = DAILY_CAP; i >= 0; i--) {
    const count = s.distribution[i];
    const row = document.createElement("div");
    row.className = "dist-row";
    row.innerHTML = `
      <span style="width:34px">${i}/${DAILY_CAP}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%"></div></div>
      <span class="bar-count">${count}</span>`;
    bars.appendChild(row);
  }
}

export const HOW_KEYS = ["chain.how.1", "chain.how.2", "chain.how.3", "chain.how.4"];

export function mount() {
  el("chainPlayPracticeBtn").addEventListener("click", () => startGame("practice"));
  el("chainShareBtn").addEventListener("click", () => {
    copyText(
      buildShareText(session.puzzleNumber, session.finalReached ?? 0, session.cap),
      t("toast.copied"),
      (text) => t("toast.copyFallback", { text: text.split("\n")[0] })
    );
  });
  el("chainAgainBtn").addEventListener("click", () => startGame("practice"));
}
