/* ===== i18n: English default, Russian optional ===== */

const LANG_KEY = "glimpse_lang_v1";

const EN = {
  "brand.name": "GLIMPSE",
  "footer.text": "GLIMPSE · a new challenge every day at 00:00 UTC",

  "nav.stats": "Stats",
  "nav.how": "How to play",
  "nav.home": "All games",

  "toast.copied": "Result copied!",
  "toast.copyFallback": "Copy failed — copy manually: {text}",

  "common.share": "Copy result",
  "common.playAgainPractice": "Play again (practice)",
  "common.practiceBtn": "Practice (doesn't affect streak)",
  "common.nextIn": "Next {game} in",
  "common.today": "Today's result",
  "common.backHome": "All games",

  "stat.streak": "Streak",
  "stat.bestStreak": "Best streak",
  "stat.played": "Played",
  "stat.fast": "Fast hits",
  "stat.rounds": "Rounds",
  "stat.bestLevel": "Best level",
  "stat.level": "Level",
  "stat.winRate": "Solved ≥1",

  "modal.statsTitle": "Statistics",
  "modal.howTitle": "How to play",
  "modal.gotIt": "Got it, let's play!",
  "modal.distTitle": "Results distribution",

  "hub.eyebrow": "Daily micro-games",
  "hub.title1": "Ten seconds to learn.",
  "hub.title2": "A lifetime to master.",
  "hub.subtitle": "Three tiny games, one new challenge a day. Everyone gets the same puzzle — compare your result with friends and streamers.",
  "hub.play": "Play",
  "hub.playedToday": "Played today",

  "shade.card.title": "SHADE",
  "shade.card.tag": "Spot the odd shade before it fades.",
  "pulse.card.title": "PULSE",
  "pulse.card.tag": "Stop the ring at the perfect moment.",
  "chain.card.title": "CHAIN",
  "chain.card.tag": "Repeat the pattern. How far can you go?",

  /* SHADE */
  "shade.intro.eyebrow": "Daily perception game",
  "shade.intro.title1": "Find the shade,",
  "shade.intro.title2": "before it fades",
  "shade.intro.subtitle": "One tile is a slightly different shade. Every round it gets smaller and subtler, and you get less time. 6 rounds a day — same puzzle for everyone.",
  "shade.intro.playDaily": "Play — Daily",
  "shade.intro.practice": "Practice",
  "shade.intro.difficulty": "Practice difficulty",
  "shade.diff.casual": "Casual",
  "shade.diff.standard": "Standard",
  "shade.diff.hard": "Hard",
  "shade.diff.insane": "Insane",
  "shade.game.hint": "Click the tile with the different shade",
  "shade.game.round": "Round {n} / {total}",
  "shade.how.1": "The grid is filled with tiles of nearly the same color. One of them is a different shade.",
  "shade.how.2": "Find and click it before the round timer runs out.",
  "shade.how.3": "6 rounds a day. Each round the grid grows, the color gap shrinks, and the timer gets shorter.",
  "shade.how.4": "🟩 = fast hit, 🟨 = hit near the deadline, 🟥 = missed or wrong tile.",
  "shade.how.5": "Practice mode has 4 difficulty levels if daily isn't enough.",

  /* PULSE */
  "pulse.intro.eyebrow": "Daily timing game",
  "pulse.intro.title1": "Stop the ring,",
  "pulse.intro.title2": "right on the mark",
  "pulse.intro.subtitle": "A ring closes in on a hidden target. Tap the instant it lines up. 6 rounds a day, each one faster than the last.",
  "pulse.intro.playDaily": "Play — Daily",
  "pulse.intro.practice": "Practice",
  "pulse.game.hint": "Tap when the closing ring matches the target ring",
  "pulse.game.round": "Round {n} / {total}",
  "pulse.game.tapHint": "TAP",
  "pulse.how.1": "An outer ring shrinks toward the center. A thin target ring is drawn at a hidden radius.",
  "pulse.how.2": "Tap / click / press Space the instant the shrinking ring passes the target ring.",
  "pulse.how.3": "6 rounds a day, each one closing faster than the last — precision gets harder to hold.",
  "pulse.how.4": "🟩 = perfect or great timing, 🟨 = good but late, 🟥 = miss or no tap in time.",

  /* CHAIN */
  "chain.intro.eyebrow": "Daily memory game",
  "chain.intro.title1": "Watch the pattern,",
  "chain.intro.title2": "repeat it back",
  "chain.intro.subtitle": "Each level adds one more step to the sequence. One mistake ends the run. Daily challenge is capped at level 10 — how far will you get?",
  "chain.intro.playDaily": "Play — Daily",
  "chain.intro.practice": "Practice (uncapped)",
  "chain.game.watch": "Watch…",
  "chain.game.repeat": "Your turn",
  "chain.game.level": "Level {n}",
  "chain.how.1": "Cells flash one by one — that's the pattern for this level.",
  "chain.how.2": "Click the cells back in the exact same order.",
  "chain.how.3": "Get it right and the pattern grows by one step. Get it wrong and the run ends.",
  "chain.how.4": "Daily mode stops at level 10 so everyone's result is comparable. Practice mode keeps going.",

  "result.reached": "Reached level {n}",
};

const RU = {
  "brand.name": "GLIMPSE",
  "footer.text": "GLIMPSE · новый вызов каждый день в 00:00 UTC",

  "nav.stats": "Статистика",
  "nav.how": "Как играть",
  "nav.home": "Все игры",

  "toast.copied": "Результат скопирован!",
  "toast.copyFallback": "Не удалось скопировать — скопируйте вручную: {text}",

  "common.share": "Скопировать результат",
  "common.playAgainPractice": "Ещё раз (тренировка)",
  "common.practiceBtn": "Тренировка (не влияет на серию)",
  "common.nextIn": "Следующий {game} через",
  "common.today": "Результат дня",
  "common.backHome": "Все игры",

  "stat.streak": "Серия",
  "stat.bestStreak": "Лучшая серия",
  "stat.played": "Сыграно",
  "stat.fast": "Быстрых",
  "stat.rounds": "Раундов",
  "stat.bestLevel": "Лучший уровень",
  "stat.level": "Уровень",
  "stat.winRate": "Решено ≥1",

  "modal.statsTitle": "Статистика",
  "modal.howTitle": "Как играть",
  "modal.gotIt": "Понятно, играть!",
  "modal.distTitle": "Распределение результатов",

  "hub.eyebrow": "Ежедневные мини-игры",
  "hub.title1": "Десять секунд, чтобы понять.",
  "hub.title2": "Целая жизнь, чтобы освоить.",
  "hub.subtitle": "Три коротких игры, каждый день — новая задача. У всех одна и та же головоломка — сравнивай результат с друзьями и стримерами.",
  "hub.play": "Играть",
  "hub.playedToday": "Сыграно сегодня",

  "shade.card.title": "SHADE",
  "shade.card.tag": "Найди другой оттенок, пока он не исчез.",
  "pulse.card.title": "PULSE",
  "pulse.card.tag": "Останови кольцо в идеальный момент.",
  "chain.card.title": "CHAIN",
  "chain.card.tag": "Повтори узор. Как далеко ты сможешь зайти?",

  /* SHADE */
  "shade.intro.eyebrow": "Ежедневная игра на восприятие",
  "shade.intro.title1": "Найди оттенок,",
  "shade.intro.title2": "пока он не исчез",
  "shade.intro.subtitle": "Одна плитка чуть-чуть отличается по цвету. С каждым раундом её сложнее заметить, а времени меньше. 6 раундов в день — одна задача для всех.",
  "shade.intro.playDaily": "Играть — Daily",
  "shade.intro.practice": "Тренировка",
  "shade.intro.difficulty": "Сложность тренировки",
  "shade.diff.casual": "Лёгкая",
  "shade.diff.standard": "Стандарт",
  "shade.diff.hard": "Сложная",
  "shade.diff.insane": "Безумная",
  "shade.game.hint": "Кликни по плитке другого оттенка",
  "shade.game.round": "Раунд {n} / {total}",
  "shade.how.1": "Поле заполнено плитками почти одного цвета. Одна из них — другого оттенка.",
  "shade.how.2": "Найди и кликни её до истечения времени раунда.",
  "shade.how.3": "6 раундов в день. С каждым раундом сетка растёт, разница цвета тоньше, времени меньше.",
  "shade.how.4": "🟩 — быстрое попадание, 🟨 — попадание почти на исходе времени, 🟥 — промах или не успел.",
  "shade.how.5": "В тренировке есть 4 уровня сложности, если daily покажется мало.",

  /* PULSE */
  "pulse.intro.eyebrow": "Ежедневная игра на тайминг",
  "pulse.intro.title1": "Останови кольцо",
  "pulse.intro.title2": "точно в цель",
  "pulse.intro.subtitle": "Кольцо сжимается к центру, а внутри спрятана цель. Тапни в момент совпадения. 6 раундов в день, каждый следующий — быстрее предыдущего.",
  "pulse.intro.playDaily": "Играть — Daily",
  "pulse.intro.practice": "Тренировка",
  "pulse.game.hint": "Тапни, когда сжимающееся кольцо совпадёт с целевым",
  "pulse.game.round": "Раунд {n} / {total}",
  "pulse.game.tapHint": "ТАП",
  "pulse.how.1": "Внешнее кольцо сжимается к центру. Тонкое целевое кольцо нарисовано на скрытом радиусе.",
  "pulse.how.2": "Тапни / кликни / нажми Пробел в момент, когда сжимающееся кольцо пройдёт целевое.",
  "pulse.how.3": "6 раундов в день, каждый следующий быстрее — удерживать точность всё труднее.",
  "pulse.how.4": "🟩 — идеально или отлично, 🟨 — попал, но поздно, 🟥 — промах или не успел тапнуть.",

  /* CHAIN */
  "chain.intro.eyebrow": "Ежедневная игра на память",
  "chain.intro.title1": "Запомни узор,",
  "chain.intro.title2": "повтори его",
  "chain.intro.subtitle": "На каждом уровне последовательность растёт на один шаг. Одна ошибка — и забег окончен. Daily ограничен 10 уровнем — как далеко ты дойдёшь?",
  "chain.intro.playDaily": "Играть — Daily",
  "chain.intro.practice": "Тренировка (без ограничения)",
  "chain.game.watch": "Смотри…",
  "chain.game.repeat": "Твой ход",
  "chain.game.level": "Уровень {n}",
  "chain.how.1": "Клетки по очереди вспыхивают — это узор для этого уровня.",
  "chain.how.2": "Кликни клетки обратно в том же порядке.",
  "chain.how.3": "Угадал — узор вырастет на шаг. Ошибся — забег закончен.",
  "chain.how.4": "Daily режим останавливается на уровне 10, чтобы результаты можно было сравнивать. Тренировка — без ограничений.",

  "result.reached": "Достигнут уровень {n}",
};

const LOCALES = { en: EN, ru: RU };

export function getLang() {
  return localStorage.getItem(LANG_KEY) || "en";
}

export function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
}

function format(str, vars) {
  if (!vars) return str;
  return Object.keys(vars).reduce((s, k) => s.split(`{${k}}`).join(vars[k]), str);
}

export function t(key, vars) {
  const lang = getLang();
  const dict = LOCALES[lang] || LOCALES.en;
  const str = dict[key] ?? LOCALES.en[key] ?? key;
  return format(str, vars);
}

/** Apply t() to every element with [data-i18n] in the given root (default: whole doc). */
export function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
}
