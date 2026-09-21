/* ===== small shared UI helpers used by every game module ===== */

const ALL_SCREENS = [
  "hub",
  "shade-intro", "shade-game", "shade-result",
  "pulse-intro", "pulse-game", "pulse-result",
  "chain-intro", "chain-game", "chain-result",
];

export function showScreen(name) {
  ALL_SCREENS.forEach((s) => {
    const el = document.getElementById("screen-" + s);
    if (el) el.classList.toggle("hidden", s !== name);
  });
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

export function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 1800);
}

export async function copyText(text, okMsg, failMsgBuilder) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(okMsg);
  } catch {
    showToast(failMsgBuilder ? failMsgBuilder(text) : text);
  }
}

export function toggleModal(id, show) {
  document.getElementById(id).classList.toggle("hidden", !show);
}

export function addStat(row, value, label) {
  const el = document.createElement("div");
  el.className = "stat";
  el.innerHTML = `<b>${value}</b><span>${label}</span>`;
  row.appendChild(el);
}

export function renderPips(containerId, count) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const pip = document.createElement("div");
    pip.className = "pip";
    pip.id = containerId + "-" + i;
    wrap.appendChild(pip);
  }
}

export function setPipActive(containerId, index, count) {
  for (let i = 0; i < count; i++) {
    const pip = document.getElementById(containerId + "-" + i);
    if (pip) pip.classList.toggle("active", i === index);
  }
}

export function setPipResult(containerId, index, grade) {
  const pip = document.getElementById(containerId + "-" + index);
  if (!pip) return;
  pip.classList.remove("active");
  pip.classList.add(grade === "good" ? "done-good" : grade === "warn" ? "done-warn" : "done-bad");
}

export function emojiFor(grade) {
  return grade === "good" ? "🟩" : grade === "warn" ? "🟨" : "🟥";
}
