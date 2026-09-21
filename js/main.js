import { getLang, setLang, t, applyI18n } from "./i18n.js";
import { showScreen, toggleModal } from "./ui.js";
import * as Shade from "./shade.js";
import * as Pulse from "./pulse.js";
import * as Chain from "./chain.js";

const GAMES = { shade: Shade, pulse: Pulse, chain: Chain };
let currentGame = null; // 'shade' | 'pulse' | 'chain' | null (hub)

function el(id) { return document.getElementById(id); }

function applyTitles(root = document) {
  root.querySelectorAll("[data-i18n-title]").forEach((elm) => {
    elm.setAttribute("title", t(elm.dataset.i18nTitle));
  });
}

function refreshAllText() {
  applyI18n();
  applyTitles();
  // Dynamic per-game text needs a manual re-render of whichever intro is on screen.
  if (currentGame) GAMES[currentGame].renderIntro();
}

function goHub() {
  currentGame = null;
  showScreen("hub");
}

function goGameIntro(key) {
  currentGame = key;
  GAMES[key].renderIntro();
  showScreen(`${key}-intro`);
}

function setupLangSwitch() {
  const buttons = document.querySelectorAll("#langSwitch .lang-btn");
  function paint() {
    const lang = getLang();
    buttons.forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
  }
  buttons.forEach((b) => {
    b.addEventListener("click", () => {
      setLang(b.dataset.lang);
      paint();
      refreshAllText();
    });
  });
  paint();
}

function setupNav() {
  el("brandHomeBtn").addEventListener("click", goHub);
  document.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", goHub));

  document.querySelectorAll(".card-play-btn").forEach((btn) => {
    btn.addEventListener("click", () => goGameIntro(btn.dataset.game));
  });
}

function currentHowKeys() {
  if (currentGame) return GAMES[currentGame].HOW_KEYS;
  return [...Shade.HOW_KEYS.slice(0, 2), ...Pulse.HOW_KEYS.slice(0, 2), ...Chain.HOW_KEYS.slice(0, 2)];
}

function setupHowModal() {
  el("howBtn").addEventListener("click", () => {
    const list = el("howRulesList");
    list.innerHTML = "";
    currentHowKeys().forEach((key) => {
      const li = document.createElement("li");
      li.textContent = t(key);
      list.appendChild(li);
    });
    toggleModal("howOverlay", true);
  });
  el("howClose").addEventListener("click", () => toggleModal("howOverlay", false));
  el("howGotIt").addEventListener("click", () => toggleModal("howOverlay", false));
}

function setupStatsModal() {
  const tabs = document.querySelectorAll("#statsTabs .pill");
  function renderTab(key) {
    tabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === key));
    GAMES[key].renderStatsTab(el("statsContent"));
  }
  tabs.forEach((b) => b.addEventListener("click", () => renderTab(b.dataset.tab)));

  el("statsBtn").addEventListener("click", () => {
    renderTab(currentGame || "shade");
    toggleModal("statsOverlay", true);
  });
  el("statsClose").addEventListener("click", () => toggleModal("statsOverlay", false));
}

function setupOverlayDismiss() {
  [el("howOverlay"), el("statsOverlay")].forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.add("hidden");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyI18n();
  applyTitles();

  Shade.mount();
  Pulse.mount();
  Chain.mount();

  setupLangSwitch();
  setupNav();
  setupHowModal();
  setupStatsModal();
  setupOverlayDismiss();

  goHub();
});
