# GLIMPSE

A hub of three tiny daily browser games. Everyone gets the same puzzle each day (seeded from the UTC date) and can share a compact, Wordle-style emoji result. English by default, Russian available via the language switch in the header.

## The games

- **SHADE** — a perception game. One tile on the grid is a slightly different shade; find and click it before the round timer runs out. 6 rounds a day, each one harder (bigger grid, subtler color gap, less time). Practice mode adds 4 selectable difficulty tiers (Casual / Standard / Hard / Insane).
- **PULSE** — a timing game. A ring closes in on a hidden target ring; tap (click, tap, or press Space) the instant they line up. 6 rounds a day, each one closing faster than the last.
- **CHAIN** — a memory game. Cells flash a growing pattern; repeat it back in order. One mistake ends the run. Daily mode is capped at level 10 so results are comparable; practice mode keeps going.

## Features

- **Daily mode** — one puzzle a day per game, same for everyone. Results (streak, best streak, games played, distribution) are saved per-browser in `localStorage` — no account, no server.
- **Practice mode** — unlimited random runs for training or streaming, doesn't affect the daily streak.
- **Share result** — copies a short emoji strip (🟩/🟨/🟥) to the clipboard, no spoilers, just like Wordle.
- **i18n** — English by default, Russian optional, switchable anytime from the header.
- Zero dependencies, zero build step: plain `HTML/CSS/JS` (ES modules).

## Run locally

Static site — open `index.html` directly, or serve it:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`. (ES modules require serving over `http://`, not `file://`.)

## Structure

```
index.html         Hub + all three games' screens + shared modals
style.css           Dark glass theme, shared across the whole site
js/
  util.js           Seeded RNG + daily puzzle numbering
  i18n.js           English/Russian dictionaries + t()/applyI18n()
  storage.js        Per-browser localStorage state for all 3 games
  ui.js             Shared screen/toast/modal/pip helpers
  shade.js          SHADE game logic
  pulse.js          PULSE game logic
  chain.js          CHAIN game logic
  main.js           Navigation, language switch, modal wiring, boot
```

## Deploy

Static files only — works as-is on GitHub Pages / Vercel / Netlify / Cloudflare Pages, no build step.
