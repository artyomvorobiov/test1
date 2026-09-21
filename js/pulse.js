import { seedFor, puzzleNumberToday, msUntilNextUTCMidnight, pad } from "./util.js";
import { t } from "./i18n.js";
import { state, persist } from "./storage.js";
import {
  showScreen, addStat, copyText,
  renderPips, setPipActive, setPipResult, emojiFor,
} from "./ui.js";

const KEY = "pulse";
const ROUNDS = 6;
const MAX_RADIUS = 130; // px

const DAILY_DURATIONS = [2600, 2200, 1900, 1600, 1400, 1200];

let session = null;
let rafHandle = null;
let roundStart = 0;
let roundDuration = 0;
let targetRadius = 0;
let countdownHandle = null;
let listening = false;

function el(id) { return document.getElementById(id); }

function makeSession(mode) {
  const puzzleNumber = mode === "daily" ? puzzleNumberToday() : Math.floor(Math.random() * 1e9);
  return {
    mode,
    puzzleNumber,
    rng: seedFor(KEY, mode, puzzleNumber),
    roundIndex: 0,
    results: [],
    locked: false,
  };
}

function startGame(mode) {
  session = makeSession(mode);
  showScreen("pulse-game");
  renderPips("pulseRoundPips", ROUNDS);
  listening = true;
  startRound();
}

function durationForRound(mode, index, rng) {
  if (mode === "daily") return DAILY_DURATIONS[index];
  // practice: randomized but same difficulty curve shape
  const base = DAILY_DURATIONS[index];
  return Math.round(base * (0.85 + rng() * 0.3));
}

function startRound() {
  session.locked = false;
  el("pulseRoundLabel").textContent = t("pulse.game.round", { n: session.roundIndex + 1, total: ROUNDS });
  setPipActive("pulseRoundPips", session.roundIndex, ROUNDS);

  roundDuration = durationForRound(session.mode, session.roundIndex, session.rng);
  targetRadius = 22 + Math.floor(session.rng() * (MAX_RADIUS - 45));

  const targetRing = el("pulseTargetRing");
  targetRing.style.width = targetRadius * 2 + "px";
  targetRing.style.height = targetRadius * 2 + "px";

  const outerRing = el("pulseOuterRing");
  outerRing.style.width = MAX_RADIUS * 2 + "px";
  outerRing.style.height = MAX_RADIUS * 2 + "px";
  outerRing.style.opacity = "1";
  outerRing.style.borderColor = "";

  roundStart = performance.now();
  cancelAnimationFrame(rafHandle);

  function tick(now) {
    const elapsed = now - roundStart;
    const pct = Math.max(0, 1 - elapsed / roundDuration);
    const radius = MAX_RADIUS * pct;
    outerRing.style.width = radius * 2 + "px";
    outerRing.style.height = radius * 2 + "px";
    if (elapsed >= roundDuration) {
      if (!session.locked) finishRound(null);
      return;
    }
    rafHandle = requestAnimationFrame(tick);
  }
  rafHandle = requestAnimationFrame(tick);
}

function currentRadiusNow() {
  const elapsed = performance.now() - roundStart;
  const pct = Math.max(0, 1 - elapsed / roundDuration);
  return MAX_RADIUS * pct;
}

function onTap() {
  if (!session || session.locked) return;
  finishRound(currentRadiusNow());
}

function finishRound(radiusAtTap) {
  if (session.locked) return;
  session.locked = true;
  cancelAnimationFrame(rafHandle);

  let grade;
  if (radiusAtTap === null) {
    grade = "bad";
  } else {
    const diff = Math.abs(radiusAtTap - targetRadius);
    if (diff <= 8) grade = "good";
    else if (diff <= 20) grade = "warn";
    else grade = "bad";
  }
  session.results.push(grade);
  flashRing(grade);
  setPipResult("pulseRoundPips", session.roundIndex, grade);

  setTimeout(() => {
    session.roundIndex++;
    if (session.roundIndex >= ROUNDS) {
      listening = false;
      endGame();
    } else {
      startRound();
    }
  }, 650);
}

function flashRing(grade) {
  const outerRing = el("pulseOuterRing");
  outerRing.style.borderColor = grade === "bad" ? "var(--danger)" : grade === "warn" ? "var(--warn)" : "var(--good)";
  const flash = el("pulseRoundFlash");
  flash.textContent = grade === "bad" ? "✕" : "✓";
  flash.className = "round-flash " + (grade === "bad" ? "show-bad" : "show-good");
  setTimeout(() => { flash.className = "round-flash"; }, 650);
}

function endGame() {
  const solved = session.results.filter((r) => r !== "bad").length;

  if (session.mode === "daily") {
    const s = state.pulse;
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
  showScreen("pulse-result");
}

function buildShareText(puzzleNumber, results) {
  const solved = results.filter((r) => r !== "bad").length;
  const strip = results.map(emojiFor).join("");
  return `PULSE #${puzzleNumber} ${solved}/${ROUNDS}\n${strip}`;
}

function renderResultScreen(solved) {
  el("pulseResultEyebrow").textContent = session.mode === "daily" ? `PULSE #${session.puzzleNumber}` : t("pulse.intro.practice");
  el("pulseResultTitle").textContent = `${solved} / ${ROUNDS}`;
  el("pulseEmojiStrip").textContent = session.results.map(emojiFor).join(" ");

  const statsRow = el("pulseStatsRow");
  statsRow.innerHTML = "";
  if (session.mode === "daily") {
    addStat(statsRow, state.pulse.streak, t("stat.streak"));
    addStat(statsRow, state.pulse.maxStreak, t("stat.bestStreak"));
    addStat(statsRow, state.pulse.played, t("stat.played"));
  } else {
    addStat(statsRow, solved, t("stat.rounds"));
    addStat(statsRow, session.results.filter((r) => r === "good").length, t("stat.fast"));
  }

  const nextDaily = el("pulseNextDaily");
  const againBtn = el("pulseAgainBtn");
  if (session.mode === "daily") {
    nextDaily.innerHTML = `${t("common.nextIn", { game: "PULSE" })} <b id="pulseCountdownVal"></b>`;
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
    const target = el("pulseCountdownVal");
    if (target) target.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  tick();
  countdownHandle = setInterval(tick, 1000);
}

export function renderIntro() {
  el("pulsePuzzleId").textContent = `PULSE #${puzzleNumberToday()}`;
  const alreadyPlayed = state.pulse.lastPuzzleNumber === puzzleNumberToday() && state.pulse.lastResult;

  const badges = el("pulseStreakBadges");
  badges.innerHTML = "";
  addBadge(badges, state.pulse.streak, t("stat.streak"));
  addBadge(badges, state.pulse.maxStreak, t("stat.bestStreak"));
  addBadge(badges, state.pulse.played, t("stat.played"));

  const dailyBtn = el("pulsePlayDailyBtn");
  if (alreadyPlayed) {
    dailyBtn.textContent = t("common.today");
    dailyBtn.onclick = () => {
      session = { mode: "daily", puzzleNumber: puzzleNumberToday(), results: state.pulse.lastResult };
      const solved = session.results.filter((r) => r !== "bad").length;
      renderResultScreen(solved);
      showScreen("pulse-result");
    };
  } else {
    dailyBtn.textContent = t("pulse.intro.playDaily");
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
  const s = state.pulse;
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

export const HOW_KEYS = ["pulse.how.1", "pulse.how.2", "pulse.how.3", "pulse.how.4"];

export function mount() {
  el("pulsePlayPracticeBtn").addEventListener("click", () => startGame("practice"));
  el("pulseShareBtn").addEventListener("click", () => {
    copyText(
      buildShareText(session.puzzleNumber, session.results),
      t("toast.copied"),
      (text) => t("toast.copyFallback", { text: text.split("\n")[0] })
    );
  });
  el("pulseAgainBtn").addEventListener("click", () => startGame("practice"));

  el("pulseStage").addEventListener("click", onTap);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && listening) {
      e.preventDefault();
      onTap();
    }
  });
}
