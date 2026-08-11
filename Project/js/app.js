(function () {
  "use strict";

  const config = window.LOVE_CONFIG;
  if (!config) {
    document.body.innerHTML = '<div class="noscript">config.js could not be loaded. Keep it before app.js in index.html. 💙</div>';
    return;
  }

  const STORAGE_KEY = "ourLittleBlueUniverse.v1";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const defaultState = {
    achievements: [],
    hiddenHearts: [],
    viewedMemories: [],
    coupons: [],
    giftsOpened: [],
    games: { catch: false, match: false, quiz: false, puzzle: false },
    letterOpened: false,
    reachedBottom: false,
    completed: false,
    kissCount: 0,
    bearTaps: 0,
    logoTaps: 0,
    starTaps: 0,
    soundMuted: false
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return {
        ...defaultState,
        ...(saved || {}),
        games: { ...defaultState.games, ...((saved && saved.games) || {}) },
        achievements: Array.isArray(saved?.achievements) ? saved.achievements : [],
        hiddenHearts: Array.isArray(saved?.hiddenHearts) ? saved.hiddenHearts : [],
        viewedMemories: Array.isArray(saved?.viewedMemories) ? saved.viewedMemories : [],
        coupons: Array.isArray(saved?.coupons) ? saved.coupons : [],
        giftsOpened: Array.isArray(saved?.giftsOpened) ? saved.giftsOpened : []
      };
    } catch (error) {
      return { ...defaultState, games: { ...defaultState.games } };
    }
  }

  let state = loadState();
  let toastTimer = 0;
  let galleryIndex = 0;
  let galleryTouchStart = null;
  let lastJarIndex = -1;
  let cinematicTimers = [];
  let finaleCelebrationTimers = [];
  let wanderingTimer = 0;
  let wanderingCleanupTimer = 0;
  let lastWanderingIndex = -1;
  let songVolumeFrame = 0;
  const activeSongDucks = new Set();
  let audioContext = null;
  let buttonSoundBuffer = null;
  let buttonSoundOffset = 0;
  const openedTimelineSecrets = new Set();
  const openedScrapbookSecrets = new Set();

  const soundSettings = {
    enabled: config.soundEffects?.enabled !== false,
    volume: Math.min(1, Math.max(0, Number(config.soundEffects?.volume ?? .32)))
  };
  const buttonSound = config.soundEffects?.buttonFile ? new Audio(config.soundEffects.buttonFile) : null;
  if (buttonSound) buttonSound.preload = "auto";
  const confettiSound = config.soundEffects?.confettiFile ? new Audio(config.soundEffects.confettiFile) : null;
  if (confettiSound) confettiSound.preload = "auto";
  const fireworksSound = config.soundEffects?.fireworksFile ? new Audio(config.soundEffects.fireworksFile) : null;
  if (fireworksSound) fireworksSound.preload = "auto";

  const achievements = {
    "first-surprise": { icon: "💙", title: "First Surprise", copy: "Opened the anniversary universe" },
    "bubu-expert": { icon: "🐻", title: "Bear Expert", copy: "Tapped the bear couple 10 times" },
    "heart-collector": { icon: "❤️", title: "Heart Collector", copy: "Found every secret heart" },
    "gamer-girlfriend": { icon: "🎮", title: "Gamer Wifey", copy: "Finished a mini-game" },
    "memory-keeper": { icon: "📸", title: "Memory Keeper", copy: "Viewed every scrapbook memory" },
    "letter-reader": { icon: "💌", title: "Love Letter Reader", copy: "Opened the sealed letter" },
    "quiz-champion": { icon: "🏆", title: "Certified Best Girlfriend", copy: "Finished the relationship quiz" },
    "puzzle-heart": { icon: "🧩", title: "Piece of My Heart", copy: "Solved the sliding puzzle" },
    "star-whisperer": { icon: "⭐", title: "Star Whisperer", copy: "Found five messages in the sky" },
    "moon-secret": { icon: "🌙", title: "Moon Keeper", copy: "Held the moon long enough to hear its secret" },
    "logo-secret": { icon: "👀", title: "Professional Wifey", copy: "Found the seven-tap logo secret" },
    "kiss-master": { icon: "💋", title: "Unlimited Kisses", copy: "Requested twenty emergency kisses" },
    "return-secret": { icon: "🦋", title: "Amazed", copy: "Returned to the beginning after the finale" },
    "best-girlfriend": { icon: "🏆", title: "Best Wifey", copy: "Completed the entire experience" }
  };

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { /* private mode can block storage */ }
    updateAchievementCount();
    updateGiftBoxes();
  }

  function textTemplate(value) {
    return String(value || "")
      .replaceAll("{myName}", config.names.myName)
      .replaceAll("{girlfriendName}", config.names.girlfriendName)
      .replaceAll("{nickname}", config.names.nickname);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function soundIsOn() {
    return soundSettings.enabled && !state.soundMuted;
  }

  function getAudioContext() {
    if (!soundIsOn()) return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    return audioContext;
  }

  function playTone(frequency, duration = .08, options = {}) {
    const context = getAudioContext();
    if (!context) return;
    const start = context.currentTime + (options.delay || 0);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = options.type || "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, options.endFrequency || frequency), start + duration);
    const level = soundSettings.volume * (options.level ?? .22);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, level), start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  }

  function playFireworkSound() {
    const context = getAudioContext();
    if (!context) return;
    const start = context.currentTime;
    playTone(260 + Math.random() * 100, .25, { endFrequency: 920 + Math.random() * 300, level: .12 });

    const duration = .42;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      const decay = Math.pow(1 - index / data.length, 2.4);
      data[index] = (Math.random() * 2 - 1) * decay;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = 1500 + Math.random() * 900;
    gain.gain.setValueAtTime(soundSettings.volume * .18, start + .2);
    gain.gain.exponentialRampToValueAtTime(.0001, start + .2 + duration);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start(start + .2);
  }

  function playSound(name) {
    if (!soundIsOn()) return;
    if (name === "tap") playTone(430, .045, { endFrequency: 560, level: .1, type: "sine" });
    else if (name === "pop") playTone(620, .07, { endFrequency: 920, level: .16 });
    else if (name === "flip") playTone(360, .06, { endFrequency: 470, level: .11, type: "triangle" });
    else if (name === "wrong") playTone(230, .16, { endFrequency: 145, level: .18, type: "triangle" });
    else if (name === "whoosh") playTone(190, .24, { endFrequency: 760, level: .13 });
    else if (name === "sparkle") {
      playTone(880, .1, { level: .12 });
      playTone(1320, .13, { delay: .07, level: .1 });
    } else if (name === "success" || name === "achievement") {
      [523, 659, 784].forEach((frequency, index) => playTone(frequency, .22, { delay: index * .075, level: name === "achievement" ? .16 : .13 }));
      if (name === "achievement") playTone(1047, .3, { delay: .23, level: .13 });
    } else if (name === "firework") playFireworkSound();
  }

  function updateSoundToggle() {
    const button = $("#sound-toggle");
    if (!button) return;
    button.hidden = !soundSettings.enabled;
    const muted = !soundIsOn();
    button.textContent = muted ? "🔇" : "🔊";
    button.classList.toggle("is-muted", muted);
    button.setAttribute("aria-pressed", String(muted));
    button.setAttribute("aria-label", muted ? "Turn on sound effects" : "Mute sound effects");
    button.title = muted ? "Turn on sound effects" : "Mute sound effects";
  }

  function toggleSoundEffects() {
    const turningOn = Boolean(state.soundMuted);
    if (!turningOn) playButtonSound();
    state.soundMuted = !state.soundMuted;
    saveState();
    updateSoundToggle();
    if (turningOn) playButtonSound();
  }

  function playButtonSound() {
    if (!soundIsOn()) return;
    const context = getAudioContext();
    if (context && buttonSoundBuffer) {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buttonSoundBuffer;
      gain.gain.value = soundSettings.volume;
      source.connect(gain).connect(context.destination);
      source.start(context.currentTime, buttonSoundOffset);
      return;
    }
    if (!buttonSound) {
      playSound("tap");
      return;
    }
    const effect = buttonSound.cloneNode(true);
    effect.volume = soundSettings.volume;
    effect.play().catch(() => playSound("tap"));
  }

  function findButtonSoundOffset(buffer) {
    const windowSize = 256;
    const step = 128;
    for (let start = 0; start < buffer.length - windowSize; start += step) {
      let energy = 0;
      for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        const data = buffer.getChannelData(channel);
        for (let index = start; index < start + windowSize; index += 1) energy += Math.abs(data[index]);
      }
      const average = energy / (windowSize * buffer.numberOfChannels);
      if (average > .018) return Math.max(0, start / buffer.sampleRate - .012);
    }
    return 0;
  }

  async function preloadButtonSound() {
    if (!config.soundEffects?.buttonFile) return;
    const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OfflineContext || !window.fetch) return;
    try {
      const response = await fetch(config.soundEffects.buttonFile);
      if (!response.ok) return;
      const decoder = new OfflineContext(1, 1, 44100);
      buttonSoundBuffer = await decoder.decodeAudioData(await response.arrayBuffer());
      buttonSoundOffset = findButtonSoundOffset(buttonSoundBuffer);
    } catch (error) { /* The preloaded HTML audio remains as a fallback. */ }
  }

  function playConfettiSound(amount, volumeScale = 1) {
    if (!soundIsOn()) return;
    if (!confettiSound) {
      playSound(amount >= 70 ? "success" : "sparkle");
      return;
    }
    const effect = confettiSound.cloneNode(true);
    effect.volume = Math.min(1, soundSettings.volume * Math.max(.15, Number(volumeScale) || 1));
    effect.play().catch(() => playSound(amount >= 70 ? "success" : "sparkle"));
  }

  function playFireworksSequence(volumeScale = 1) {
    if (!soundIsOn()) return;
    if (!fireworksSound) {
      playSound("firework");
      return;
    }
    const effect = fireworksSound.cloneNode(true);
    effect.volume = Math.min(1, soundSettings.volume * Math.max(.15, Number(volumeScale) || 1));
    effect.play().catch(() => playSound("firework"));
  }

  function setBodyModal(open) {
    const anyOpen = open || $$(".modal, .gallery-modal, .cinematic, .forever-question, .music-prompt")
      .some((element) => !element.classList.contains("is-hidden"));
    document.body.classList.toggle("modal-open", anyOpen);
  }

  function wanderingSurpriseCanAppear() {
    if (document.hidden || document.body.classList.contains("modal-open")) return false;
    return ["intro-screen", "lock-screen", "grand-entrance"]
      .every((id) => $("#" + id)?.classList.contains("is-hidden"));
  }

  function scheduleWanderingSurprise(delay) {
    const settings = config.wanderingSurprises;
    window.clearTimeout(wanderingTimer);
    if (prefersReducedMotion || !settings?.enabled || !settings.items?.length) return;
    const minimum = Math.max(8000, Number(settings.minDelay) || 16000);
    const maximum = Math.max(minimum, Number(settings.maxDelay) || 30000);
    const waitTime = Number.isFinite(delay) ? delay : minimum + Math.random() * (maximum - minimum);
    wanderingTimer = window.setTimeout(showWanderingSurprise, waitTime);
  }

  function showWanderingSurprise() {
    const settings = config.wanderingSurprises;
    const items = settings?.items || [];
    const host = $("#wandering-surprise");
    if (!host || !items.length) return;
    if (!wanderingSurpriseCanAppear()) {
      scheduleWanderingSurprise(5500);
      return;
    }

    let index = Math.floor(Math.random() * items.length);
    if (items.length > 1 && index === lastWanderingIndex) index = (index + 1) % items.length;
    lastWanderingIndex = index;
    const surprise = items[index];
    const motion = ["cross", "peek", "float"].includes(surprise.motion) ? surprise.motion : "cross";
    const durations = { cross: 7200, peek: 7600, float: 9000 };
    const duration = durations[motion];

    const oldImage = $("#wandering-surprise-image");
    const freshImage = document.createElement("img");
    freshImage.className = "wandering-surprise__image";
    freshImage.id = "wandering-surprise-image";
    freshImage.alt = "";
    freshImage.src = surprise.image;
    oldImage.replaceWith(freshImage);
    $("#wandering-surprise-caption").textContent = surprise.message || "Bubu & Dudu found you!";

    host.className = "wandering-surprise";
    host.style.setProperty("--surprise-duration", `${duration}ms`);
    host.style.setProperty("--surprise-top", `${16 + Math.random() * 54}%`);
    host.style.setProperty("--surprise-left", `${10 + Math.random() * 66}%`);
    void host.offsetWidth;
    host.classList.add(`wandering-surprise--${motion}`, "is-showing");

    window.clearTimeout(wanderingCleanupTimer);
    wanderingCleanupTimer = window.setTimeout(() => {
      host.className = "wandering-surprise";
      scheduleWanderingSurprise();
    }, duration + 180);
  }

  function burstConfetti(amount = 65, options = {}) {
    if (options.sound !== false) playConfettiSound(amount, options.volumeScale);
    if (prefersReducedMotion) amount = Math.min(amount, 18);
    const colors = ["#2ea8ff", "#79d8ff", "#c9efff", "#ff8fb5", "#ffd3e3", "#b7a5ff", "#ffcf59", "#ffffff"];
    for (let index = 0; index < amount; index += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.background = colors[index % colors.length];
      piece.style.width = `${6 + Math.random() * 7}px`;
      piece.style.height = `${10 + Math.random() * 13}px`;
      piece.style.borderRadius = index % 5 === 0 ? "50%" : `${2 + Math.random() * 4}px`;
      piece.style.setProperty("--drift", `${-115 + Math.random() * 230}px`);
      piece.style.setProperty("--fall", `${2 + Math.random() * 2.2}s`);
      piece.style.animationDelay = `${Math.random() * .5}s`;
      document.body.appendChild(piece);
      window.setTimeout(() => piece.remove(), 5000);
    }
  }

  function fireworks(amount = 7, options = {}) {
    if (prefersReducedMotion) amount = 2;
    const interval = Math.max(80, Number(options.interval) || 180);
    if (options.sound !== false && fireworksSound) playFireworksSequence(options.volumeScale);
    const colors = ["#6bc7ff", "#ffd36b", "#ffc3df", "#d6cbff", "#ffffff"];
    for (let index = 0; index < amount; index += 1) {
      window.setTimeout(() => {
        if (options.sound !== false && !fireworksSound && index < 6) playSound("firework");
        const firework = document.createElement("span");
        firework.className = "firework";
        firework.style.left = `${15 + Math.random() * 70}vw`;
        firework.style.top = `${12 + Math.random() * 58}vh`;
        firework.style.setProperty("--c", colors[index % colors.length]);
        document.body.appendChild(firework);
        window.setTimeout(() => firework.remove(), 1000);
      }, index * interval);
    }
  }

  function floatingHearts(amount = 8, options = {}) {
    if (options.sound !== false && amount >= 5) playSound("pop");
    if (prefersReducedMotion) amount = Math.min(amount, 7);
    for (let index = 0; index < amount; index += 1) {
      const heart = document.createElement("span");
      heart.className = "floating-heart-pop";
      heart.textContent = index % 3 === 0 ? "💋" : "💙";
      heart.style.left = `${15 + Math.random() * 70}vw`;
      heart.style.bottom = `${5 + Math.random() * 25}vh`;
      heart.style.setProperty("--drift", `${-40 + Math.random() * 80}px`);
      heart.style.setProperty("--rotate", `${-25 + Math.random() * 50}deg`);
      heart.style.animationDelay = `${Math.random() * .25}s`;
      document.body.appendChild(heart);
      window.setTimeout(() => heart.remove(), 2400);
    }
  }

  function finaleLightFlash() {
    const flash = document.createElement("span");
    const colors = ["rgba(83,186,255,.48)", "rgba(255,199,99,.42)", "rgba(255,135,181,.38)", "rgba(181,154,255,.42)"];
    flash.className = "finale-celebration-flash";
    flash.style.setProperty("--flash-color", colors[Math.floor(Math.random() * colors.length)]);
    flash.style.setProperty("--flash-x", `${18 + Math.random() * 64}%`);
    flash.style.setProperty("--flash-y", `${12 + Math.random() * 52}%`);
    document.body.appendChild(flash);
    window.setTimeout(() => flash.remove(), 950);
  }

  function runFinaleCelebration() {
    finaleCelebrationTimers.forEach(window.clearTimeout);
    finaleCelebrationTimers = [];
    const visualWaves = prefersReducedMotion
      ? [{ delay: 0, confetti: 24, fireworks: 2, hearts: 7 }]
      : [
          { delay: 0, confetti: 140, fireworks: 8, hearts: 20 },
          { delay: 1050, confetti: 100, fireworks: 7, hearts: 13 },
          { delay: 2100, confetti: 80, fireworks: 8, hearts: 16 }
        ];

    visualWaves.forEach((wave) => {
      const timer = window.setTimeout(() => {
        burstConfetti(wave.confetti, { sound: false });
        fireworks(wave.fireworks, { sound: false, interval: 110 });
        floatingHearts(wave.hearts, { sound: false });
        finaleLightFlash();
      }, wave.delay);
      finaleCelebrationTimers.push(timer);
    });

    const soundCues = prefersReducedMotion
      ? [
          { delay: 0, play: () => playConfettiSound(24, .55) },
          { delay: 120, play: () => playFireworksSequence(.55) }
        ]
      : [
          { delay: 0, play: () => playConfettiSound(140, .82) },
          { delay: 120, play: () => playFireworksSequence(.88) },
          { delay: 1120, play: () => playConfettiSound(100, .56) },
          { delay: 1660, play: () => playFireworksSequence(.58) },
          { delay: 2520, play: () => playConfettiSound(80, .42) },
          { delay: 2920, play: () => playSound("sparkle") }
        ];
    soundCues.forEach((cue) => {
      const timer = window.setTimeout(cue.play, cue.delay);
      finaleCelebrationTimers.push(timer);
    });
  }

  function burstSecretHearts(origin, amount = 24) {
    const rect = origin.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const total = prefersReducedMotion ? Math.min(amount, 10) : amount;

    for (let index = 0; index < total; index += 1) {
      const heart = document.createElement("span");
      const angle = (Math.PI * 2 * index) / total + (Math.random() - .5) * .28;
      const distance = prefersReducedMotion ? 55 + Math.random() * 30 : 90 + Math.random() * 125;
      const duration = prefersReducedMotion ? 520 : 850 + Math.random() * 450;
      heart.className = "secret-heart-burst";
      heart.textContent = index % 2 === 0 ? "❤️" : "💙";
      heart.style.left = `${centerX}px`;
      heart.style.top = `${centerY}px`;
      heart.style.setProperty("--heart-x", `${Math.cos(angle) * distance}px`);
      heart.style.setProperty("--heart-y", `${Math.sin(angle) * distance}px`);
      heart.style.setProperty("--heart-spin", `${-160 + Math.random() * 320}deg`);
      heart.style.setProperty("--heart-size", `${.72 + Math.random() * .7}rem`);
      heart.style.setProperty("--heart-duration", `${duration}ms`);
      document.body.appendChild(heart);
      window.setTimeout(() => heart.remove(), duration + 80);
    }
  }

  function showModal({ icon = "💙", title = "A little surprise", body = "", actions = [] }) {
    $("#modal-icon").textContent = icon;
    $("#modal-title").textContent = title;
    $("#modal-body").innerHTML = body;
    const actionWrap = $("#modal-actions");
    actionWrap.innerHTML = "";
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `button ${action.primary ? "button--primary" : "button--ghost"}`;
      button.textContent = action.label;
      button.addEventListener("click", () => action.onClick?.());
      actionWrap.appendChild(button);
    });
    $("#modal").classList.remove("is-hidden");
    setBodyModal(true);
    window.setTimeout(() => $("#modal .modal-close")?.focus(), 30);
  }

  function closeModal() {
    $("#modal").classList.add("is-hidden");
    setBodyModal(false);
  }

  function unlockAchievement(id) {
    if (!achievements[id] || state.achievements.includes(id)) return;
    state.achievements.push(id);
    playSound("achievement");
    saveState();
    const item = achievements[id];
    $("#achievement-toast-icon").textContent = item.icon;
    $("#achievement-toast-title").textContent = item.title;
    $("#achievement-toast-copy").textContent = item.copy;
    const toast = $("#achievement-toast");
    toast.classList.remove("is-showing");
    void toast.offsetWidth;
    toast.classList.add("is-showing");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-showing"), 4200);
  }

  function updateAchievementCount() {
    $("#achievement-count").textContent = state.achievements.length;
  }

  function showAchievements() {
    const rows = Object.entries(achievements).map(([id, item]) => {
      const earned = state.achievements.includes(id);
      return `<div class="achievement-row ${earned ? "is-earned" : ""}"><span>${item.icon}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(earned ? item.copy : "Keep exploring to unlock")}</small></div>`;
    }).join("");
    showModal({
      icon: "🏆",
      title: `${state.achievements.length} of ${Object.keys(achievements).length} achievements`,
      body: `<div class="achievement-list">${rows}</div>`
    });
  }

  function applyConfig() {
    $$('[data-name="myName"]').forEach((element) => { element.textContent = config.names.myName; });
    $$('[data-name="girlfriendName"]').forEach((element) => { element.textContent = config.names.girlfriendName; });
    $$('[data-name="nickname"]').forEach((element) => { element.textContent = config.names.nickname; });
    $$('[data-config="intro.greeting"]').forEach((element) => { element.textContent = config.intro.greeting; });
    $$('[data-config="intro.subheading"]').forEach((element) => { element.textContent = config.intro.subheading; });
    $("#lock-question").textContent = config.lock.question;
    const anniversary = new Date(`${config.dates.anniversary}T00:00:00`);
    $("#anniversary-date").textContent = Number.isNaN(anniversary.getTime())
      ? config.dates.anniversary
      : anniversary.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    document.title = `Happy Anniversary, ${config.names.girlfriendName} 💙`;
  }

  function renderTimeline() {
    const wrap = $("#timeline-list");
    wrap.innerHTML = "";
    config.timeline.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = "timeline-item reveal";
      row.innerHTML = `
        <span class="timeline-item__dot" aria-hidden="true">${escapeHtml(item.emoji)}</span>
        <button class="timeline-card" type="button" aria-expanded="false">
          <span class="timeline-card__date">${escapeHtml(item.date)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <span class="timeline-secret"><span>${escapeHtml(item.secret)}</span></span>
        </button>`;
      const button = $(".timeline-card", row);

      if (item.image) {
        const photo = document.createElement("span");
        photo.className = "timeline-card__image";

        const image = document.createElement("img");
        image.src = item.image;
        image.alt = `${item.title} memory`;
        image.loading = "lazy";
        image.decoding = "async";
        image.addEventListener("error", () => photo.remove(), { once: true });

        photo.appendChild(image);
        button.insertBefore(photo, $("h3", button));
      }

      button.addEventListener("click", () => {
        const opening = !button.classList.contains("is-open");
        button.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(button.classList.contains("is-open")));
        if (opening && !openedTimelineSecrets.has(index)) {
          openedTimelineSecrets.add(index);
          const secretMessage = $(".timeline-secret span", button);
          window.setTimeout(() => {
            burstSecretHearts(secretMessage);
            playSound("sparkle");
          }, prefersReducedMotion ? 20 : 230);
        }
        if (button.classList.contains("is-open") && index === config.timeline.length - 1) floatingHearts(4);
      });
      wrap.appendChild(row);
    });
  }

  function memoryVisual(container, memory) {
    container.innerHTML = "";
    if (memory.image) {
      const image = document.createElement("img");
      image.src = memory.image;
      image.alt = memory.title;
      image.addEventListener("error", () => {
        image.remove();
        container.classList.remove("has-image");
        container.innerHTML = '<span aria-hidden="true">🐻💙🐼</span>';
      }, { once: true });
      container.appendChild(image);
      container.classList.add("has-image");
    } else {
      container.classList.remove("has-image");
      container.innerHTML = '<span aria-hidden="true">🐻💙🐼</span>';
    }
  }

  function renderGallery() {
    const reel = $("#gallery-reel");
    reel.innerHTML = "";
    config.memories.forEach((memory, index) => {
      const card = document.createElement("button");
      card.className = "polaroid reveal";
      card.type = "button";
      card.dataset.accent = memory.accent || "sky";
      card.style.setProperty("--tilt", `${index % 2 ? 2.4 : -2.2}deg`);
      const visual = document.createElement("span");
      visual.className = "polaroid__image";
      memoryVisual(visual, memory);
      const title = document.createElement("strong");
      title.textContent = memory.title;
      const caption = document.createElement("small");
      caption.textContent = memory.caption;
      card.append(visual, title, caption);
      card.addEventListener("click", () => openGallery(index));
      reel.appendChild(card);
    });
  }

  function openGallery(index) {
    galleryIndex = (index + config.memories.length) % config.memories.length;
    const memory = config.memories[galleryIndex];
    memoryVisual($("#gallery-modal-image"), memory);
    $("#gallery-modal-meta").textContent = `${memory.date} · ${memory.location}`;
    $("#gallery-modal-title").textContent = memory.title;
    $("#gallery-modal-caption").textContent = memory.caption;
    $("#memory-secret-text").textContent = memory.secret;
    $("#memory-secret-text").classList.add("is-hidden");
    $("#memory-secret").classList.remove("is-hidden");
    $("#gallery-modal").classList.remove("is-hidden");
    setBodyModal(true);
    if (!state.viewedMemories.includes(galleryIndex)) {
      state.viewedMemories.push(galleryIndex);
      saveState();
      if (state.viewedMemories.length >= config.memories.length) unlockAchievement("memory-keeper");
    }
    window.setTimeout(() => $("#gallery-close").focus(), 30);
  }

  function closeGallery() {
    $("#gallery-modal").classList.add("is-hidden");
    setBodyModal(false);
  }

  function lightHaptic(pattern = 8) {
    try {
      if (typeof navigator.vibrate === "function") navigator.vibrate(pattern);
    } catch (error) {
      // Haptics are an optional enhancement and may be blocked by the browser.
    }
  }

  function setupTiltSurface(surface) {
    if (!surface || surface.dataset.tiltReady || prefersReducedMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    surface.dataset.tiltReady = "true";
    surface.addEventListener("pointermove", (event) => {
      const rect = surface.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      surface.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
      surface.style.setProperty("--tilt-y", `${(x - 0.5) * 6}deg`);
      surface.style.setProperty("--shine-x", `${x * 100}%`);
      surface.style.setProperty("--shine-y", `${y * 100}%`);
    });
    surface.addEventListener("pointerleave", () => {
      surface.style.setProperty("--tilt-x", "0deg");
      surface.style.setProperty("--tilt-y", "0deg");
      surface.style.setProperty("--shine-x", "50%");
      surface.style.setProperty("--shine-y", "50%");
    });
  }

  function createInteractionRipple(event) {
    if (prefersReducedMotion) return;
    const host = event.target.closest(".button, .icon-button, .gift-box, .timeline-card, .quiz-option, .secret-note-button, .love-menu__panel button");
    if (!host || host.disabled) return;
    const rect = host.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height) * 1.25;
    ripple.className = "interaction-ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    host.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 720);
  }

  function setupTactileInteractions() {
    const surfaces = $$(".game-card, .gift-box, .timeline-card, .counter-cloud, .secret-map, .jar-scene, .voice-card, .phone-frame, .meaningful-memory");
    surfaces.forEach((surface) => {
      surface.dataset.tilt = "true";
      setupTiltSurface(surface);
    });
    document.addEventListener("pointerdown", createInteractionRipple, { passive: true });
  }

  function renderCoupons() {
    const reel = $("#coupon-reel");
    reel.innerHTML = "";
    config.coupons.forEach((coupon) => {
      const redeemed = state.coupons.includes(coupon.id);
      const card = document.createElement("button");
      card.type = "button";
      card.className = `coupon theme-coupon ${redeemed ? "is-redeemed" : ""}`;
      card.dataset.couponId = coupon.id;
      card.dataset.tilt = "true";
      card.setAttribute("aria-label", `${coupon.title}. ${redeemed ? "Already redeemed" : "Tap to redeem"}.`);
      card.innerHTML = `
        <span class="coupon-card__sheen" aria-hidden="true"></span>
        <span class="coupon-card__cloud coupon-card__cloud--one" aria-hidden="true"></span>
        <span class="coupon-card__cloud coupon-card__cloud--two" aria-hidden="true"></span>
        <span class="coupon-card__sparkles" aria-hidden="true">✦ · 💙 · ✦</span>
        <span class="coupon-card__icon" aria-hidden="true">${coupon.icon}</span>
        <span class="coupon-card__eyebrow">A LITTLE COUPON FOR YOU</span>
        <span class="coupon-card__title">${escapeHtml(coupon.title)}</span>
        <span class="coupon-card__note">${escapeHtml(coupon.note)}</span>
        <span class="coupon-card__action">${redeemed ? "Used with love 💙" : "Redeem this 💙"}</span>
        <span class="coupon-card__stamp" aria-hidden="true">claimed 💙</span>`;
      card.addEventListener("click", () => redeemCoupon(coupon, card));
      setupTiltSurface(card);
      reel.appendChild(card);
    });
    updateCouponWallet();
  }

  function updateCouponWallet() {
    const total = config.coupons.length;
    const redeemed = config.coupons.filter((coupon) => state.coupons.includes(coupon.id)).length;
    const status = $("#coupon-wallet-status");
    const progress = $("#coupon-wallet-progress");
    const progressWrap = $(".coupon-wallet__progress");
    if (status) status.textContent = `${redeemed} / ${total} used`;
    if (progress) progress.style.width = `${total ? (redeemed / total) * 100 : 0}%`;
    if (progressWrap) {
      progressWrap.setAttribute("aria-valuemax", String(total));
      progressWrap.setAttribute("aria-valuenow", String(redeemed));
    }
  }

  function redeemCoupon(coupon, card) {
    if (state.coupons.includes(coupon.id)) {
      showModal({ icon: coupon.icon, title: "Already redeemed 💙", body: `<p>${escapeHtml(coupon.title)} has already been lovingly used on this device.</p>` });
      return;
    }
    lightHaptic(10);
    showModal({
      icon: coupon.icon,
      title: "Use this coupon? 💙",
      body: `<div class="coupon-confirm"><strong>${escapeHtml(coupon.title)}</strong><p>${escapeHtml(coupon.note)}</p></div>`,
      actions: [
        { label: "Maybe later", onClick: closeModal },
        { label: "Redeem 💙", primary: true, onClick: () => {
          state.coupons.push(coupon.id);
          saveState();
          closeModal();
          card.classList.add("is-redeemed", "is-redeeming");
          card.setAttribute("aria-label", `${coupon.title}. Already redeemed.`);
          const action = $(".coupon-card__action", card);
          if (action) action.textContent = "Used with love";
          updateCouponWallet();
          lightHaptic([24, 45, 55]);
          burstSecretHearts(card, 20);
          burstConfetti(34);
          window.setTimeout(renderCoupons, prefersReducedMotion ? 80 : 900);
        } }
      ]
    });
  }

  function renderFunny() {
    const wrap = $("#funny-list");
    wrap.innerHTML = config.funnyHabits.map((habit, index) => `<div class="complaint"><span>${["🍟", "🤨", "😂", "😰", "🧥"][index % 5]}</span>${escapeHtml(habit)}</div>`).join("");
  }

  function renderStars() {
    const positions = [[9, 65], [24, 23], [36, 75], [51, 39], [67, 70], [79, 19], [89, 55]];
    const field = $("#star-field");
    field.innerHTML = "";
    config.nightMessages.slice(0, positions.length).forEach((message, index) => {
      const star = document.createElement("button");
      star.className = "tap-star";
      star.type = "button";
      star.textContent = index % 2 ? "✧" : "✦";
      star.style.left = `${positions[index][0]}%`;
      star.style.top = `${positions[index][1]}%`;
      star.style.setProperty("--twinkle", `${2 + (index % 4) * .45}s`);
      star.setAttribute("aria-label", `Reveal star message ${index + 1}`);
      star.addEventListener("click", () => {
        $("#star-message").textContent = message;
        star.textContent = "💙";
        state.starTaps = Math.min(99, Number(state.starTaps || 0) + 1);
        saveState();
        if (state.starTaps >= 5) unlockAchievement("star-whisperer");
      });
      field.appendChild(star);
    });
  }

  function setupMedia() {
    $("#song-title").textContent = config.media.songTitle;
    $("#song-artist").textContent = config.media.songArtist;
    const songAudio = $("#song-audio");
    songAudio.loop = true;
    const requestedVolume = Number(config.media.songVolume ?? .42);
    songAudio.volume = Number.isFinite(requestedVolume) ? Math.min(.65, Math.max(.25, requestedVolume)) : .42;
    if (config.media.localSong) songAudio.src = config.media.localSong;
    const links = $("#song-links");
    if (config.media.spotifyUrl) links.insertAdjacentHTML("beforeend", `<a href="${escapeHtml(config.media.spotifyUrl)}" target="_blank" rel="noopener">Open Spotify ↗</a>`);
    if (config.media.youtubeUrl) links.insertAdjacentHTML("beforeend", `<a href="${escapeHtml(config.media.youtubeUrl)}" target="_blank" rel="noopener">Open YouTube ↗</a>`);

    const voice = $("#voice-audio");
    if (config.media.voiceMessage) voice.src = config.media.voiceMessage;
    if (config.media.videoMessage) {
      const video = document.createElement("video");
      video.controls = true;
      video.preload = "metadata";
      video.src = config.media.videoMessage;
      const requestedVideoVolume = Number(config.media.videoVolume ?? .40);
      video.volume = Number.isFinite(requestedVideoVolume) ? Math.min(1, Math.max(0, requestedVideoVolume)) : .40;
      video.setAttribute("playsinline", "");
      video.setAttribute("aria-label", "Personal anniversary video message");
      video.addEventListener("play", () => setSongDucked("video", true));
      video.addEventListener("pause", () => setSongDucked("video", false));
      video.addEventListener("ended", () => setSongDucked("video", false));
      video.addEventListener("error", () => setSongDucked("video", false));
      $("#video-container").replaceWith(video);
    }
    voice.addEventListener("play", () => setSongDucked("voice", true));
    voice.addEventListener("pause", () => setSongDucked("voice", false));
    voice.addEventListener("ended", () => setSongDucked("voice", false));
    voice.addEventListener("error", () => setSongDucked("voice", false));
    applyPhoto($("#meaningful-photo"), config.media.meaningfulPhoto, "Our meaningful memory");
    applyPhoto($("#cinematic-photo"), config.media.finalePhoto, "Our favorite photo");
  }

  function normalSongVolume() {
    const requested = Number(config.media.songVolume ?? .42);
    return Number.isFinite(requested) ? Math.min(.65, Math.max(.25, requested)) : .42;
  }

  function backgroundSongVolume() {
    const normal = normalSongVolume();
    const requested = Number(config.media.videoBackgroundMusicVolume ?? normal * .38);
    return Number.isFinite(requested) ? Math.min(normal, Math.max(.08, requested)) : Math.max(.08, normal * .38);
  }

  function voiceBackgroundSongVolume() {
    const normal = normalSongVolume();
    const requested = Number(config.media.voiceBackgroundMusicVolume ?? .20);
    return Number.isFinite(requested) ? Math.min(normal, Math.max(.08, requested)) : Math.min(normal, .20);
  }

  function currentSongVolume() {
    const duckedVolumes = [];
    if (activeSongDucks.has("video")) duckedVolumes.push(backgroundSongVolume());
    if (activeSongDucks.has("voice")) duckedVolumes.push(voiceBackgroundSongVolume());
    return duckedVolumes.length ? Math.min(...duckedVolumes) : normalSongVolume();
  }

  function fadeSongVolume(target, duration) {
    const audio = $("#song-audio");
    const safeTarget = Math.min(1, Math.max(0, Number(target) || 0));
    window.cancelAnimationFrame(songVolumeFrame);
    const from = audio.volume;
    const difference = safeTarget - from;
    if (Math.abs(difference) < .005) {
      audio.volume = safeTarget;
      return;
    }
    const startedAt = performance.now();
    const fadeDuration = Math.max(120, Number(duration) || 600);
    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / fadeDuration);
      const eased = 1 - Math.pow(1 - progress, 3);
      audio.volume = Math.min(1, Math.max(0, from + difference * eased));
      if (progress < 1) songVolumeFrame = window.requestAnimationFrame(step);
    };
    songVolumeFrame = window.requestAnimationFrame(step);
  }

  function setSongDucked(source, ducked) {
    if (ducked) activeSongDucks.add(source);
    else activeSongDucks.delete(source);
    fadeSongVolume(currentSongVolume(), activeSongDucks.size ? 520 : 760);
  }

  function applyPhoto(container, src, alt) {
    if (!src) return;
    const image = document.createElement("img");
    image.src = src;
    image.alt = alt;
    image.addEventListener("error", () => image.remove(), { once: true });
    container.appendChild(image);
  }

  async function toggleSong() {
    const audio = $("#song-audio");
    if (!config.media.localSong) {
      const hasLink = config.media.spotifyUrl || config.media.youtubeUrl;
      showModal({
        icon: "🎵",
        title: hasLink ? "Choose where to listen" : "Your song is waiting",
        body: hasLink ? "<p>Use the Spotify or YouTube button just below the player.</p>" : "<p>Add a local audio path, Spotify URL, or YouTube URL in <strong>js/config.js</strong>.</p>"
      });
      return false;
    }
    try {
      if (audio.paused) {
        audio.volume = currentSongVolume();
        await audio.play();
        $("#song-play").textContent = "Pause our song ⏸";
        $("#vinyl-scene").classList.add("is-playing");
      } else {
        audio.pause();
        $("#song-play").textContent = "Play our song again 💙";
        $("#vinyl-scene").classList.remove("is-playing");
      }
      return true;
    } catch (error) {
      showModal({ icon: "🎵", title: "The song could not play", body: "<p>Check the audio path in <strong>js/config.js</strong>, then try again.</p>" });
      return false;
    }
  }

  async function toggleVoice() {
    const audio = $("#voice-audio");
    if (!config.media.voiceMessage) {
      showModal({ icon: "🎙️", title: "Your voice belongs here", body: "<p>Add <strong>audio/message.mp3</strong> and set the voiceMessage path in <strong>js/config.js</strong>.</p>" });
      return;
    }
    try {
      if (audio.paused) {
        await audio.play();
        $("#voice-play").textContent = "Pause My Message ⏸";
      } else {
        audio.pause();
        $("#voice-play").textContent = "▶ Hear My Message";
      }
    } catch (error) {
      showModal({ icon: "🎙️", title: "The voice note could not play", body: "<p>Check its file path in <strong>js/config.js</strong>.</p>" });
    }
  }

  function updateCounter() {
    const start = new Date(config.dates.relationshipStart);
    const now = new Date();
    if (Number.isNaN(start.getTime()) || start > now) return;
    let cursor = new Date(start);
    let years = now.getFullYear() - cursor.getFullYear();
    let candidate = new Date(cursor);
    candidate.setFullYear(candidate.getFullYear() + years);
    if (candidate > now) years -= 1;
    cursor.setFullYear(cursor.getFullYear() + years);
    let months = 0;
    while (months < 11) {
      candidate = new Date(cursor);
      candidate.setMonth(candidate.getMonth() + 1);
      if (candidate > now) break;
      cursor = candidate;
      months += 1;
    }
    let remaining = now - cursor;
    const days = Math.floor(remaining / 86400000); remaining %= 86400000;
    const hours = Math.floor(remaining / 3600000); remaining %= 3600000;
    const minutes = Math.floor(remaining / 60000); remaining %= 60000;
    const seconds = Math.floor(remaining / 1000);
    const values = { years, months, days, hours, minutes, seconds };
    Object.entries(values).forEach(([key, value]) => {
      const element = $(`[data-counter="${key}"]`);
      if (element) element.textContent = String(value).padStart(key === "years" || key === "months" || key === "days" ? 1 : 2, "0");
    });
  }

  function setupReveal() {
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      $$(".reveal").forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: "0px 0px -5%" });
    $$(".reveal").forEach((element) => observer.observe(element));
  }

  function updateScrollProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percent = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
    $("#progress-bar").style.width = `${percent}%`;
    $("#progress-percent").textContent = `${Math.round(percent)}%`;
    if (state.completed && state.reachedBottom && window.scrollY < 70 && !state.achievements.includes("return-secret")) {
      unlockAchievement("return-secret");
      showModal({ icon: "🦋", title: "Fun fact…", body: "<p>I still get butterflies because of you. Even after reaching the end, I would start our story all over again.</p>" });
    }
  }

  function setupBottomObserver() {
    const markReached = () => {
      if (state.reachedBottom) return;
      state.reachedBottom = true;
      saveState();
      updateGiftBoxes();
    };
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) markReached();
      }, { threshold: .2 });
      observer.observe($("#finale"));
    } else {
      window.addEventListener("scroll", () => {
        if (window.scrollY + window.innerHeight > document.documentElement.scrollHeight - 700) markReached();
      }, { passive: true });
    }
  }

  function openLetter() {
    if (!$("#love-letter").classList.contains("is-hidden")) return;
    playSound("whoosh");
    $("#envelope-wrap").classList.add("is-open");
    $("#open-letter-label").classList.add("is-hidden");
    state.letterOpened = true;
    saveState();
    unlockAchievement("letter-reader");
    window.setTimeout(() => {
      const letter = $("#love-letter");
      letter.classList.remove("is-hidden");
      letter.innerHTML = "";
      typeLetter(letter);
    }, prefersReducedMotion ? 20 : 700);
  }

  async function typeLetter(container) {
    for (const paragraph of config.loveLetter) {
      const element = document.createElement("p");
      element.className = "typing-caret";
      container.appendChild(element);
      const words = textTemplate(paragraph).split(" ");
      if (prefersReducedMotion) {
        element.textContent = words.join(" ");
      } else {
        for (const word of words) {
          element.textContent += `${element.textContent ? " " : ""}${word}`;
          await wait(32);
        }
      }
      element.classList.remove("typing-caret");
    }
  }

  /* Catch the hearts */
  let catchActive = false;
  let catchScore = state.games.catch ? 10 : 0;
  let catchInterval = 0;
  let catcherDragging = false;

  function updateCatchUI() {
    $("#catch-score").textContent = `💙 ${catchScore} / 10`;
    if (state.games.catch) {
      $("#catch-message").textContent = "You already caught my whole heart. 💙";
      $("#claim-catch").classList.remove("is-hidden");
      $("#start-catch").textContent = "Play again";
    }
  }

  function startCatchGame() {
    playSound("whoosh");
    window.clearInterval(catchInterval);
    $("#catch-sky").innerHTML = "";
    catchActive = true;
    catchScore = 0;
    $("#claim-catch").classList.add("is-hidden");
    $("#start-catch").textContent = "Heart rain in progress…";
    $("#catch-message").textContent = "Move the bear under a heart!";
    updateCatchScore();
    spawnHeart();
    catchInterval = window.setInterval(spawnHeart, prefersReducedMotion ? 950 : 720);
  }

  function spawnHeart() {
    if (!catchActive) return;
    const sky = $("#catch-sky");
    const heart = document.createElement("span");
    heart.className = "falling-heart";
    heart.textContent = Math.random() > .15 ? "💙" : "💖";
    const maxLeft = Math.max(10, sky.clientWidth - 44);
    heart.style.left = `${8 + Math.random() * (maxLeft - 8)}px`;
    sky.appendChild(heart);
    const duration = prefersReducedMotion ? 3700 : 2800 + Math.random() * 1200;
    const started = performance.now();
    function fall(now) {
      if (!heart.isConnected) return;
      if (!catchActive) { heart.remove(); return; }
      const progress = Math.min(1, (now - started) / duration);
      const travel = $("#catch-game").clientHeight + 60;
      heart.style.transform = `translateY(${progress * travel}px) rotate(${progress * 320}deg)`;
      if (progress > .55 && intersects(heart, $("#catcher"))) {
        heart.remove();
        caughtHeart();
        return;
      }
      if (progress < 1) requestAnimationFrame(fall); else heart.remove();
    }
    requestAnimationFrame(fall);
  }

  function intersects(a, b) {
    const x = a.getBoundingClientRect();
    const y = b.getBoundingClientRect();
    return x.right > y.left + 8 && x.left < y.right - 8 && x.bottom > y.top + 10 && x.top < y.bottom;
  }

  function caughtHeart() {
    catchScore += 1;
    playSound("pop");
    const messages = ["I love you!", "Mwah 😘", "Mine!", "+1 kiss", "Bear council approves 🐻"];
    $("#catch-message").textContent = messages[Math.floor(Math.random() * messages.length)];
    updateCatchScore();
    if (catchScore >= 10) completeCatchGame();
  }

  function updateCatchScore() { $("#catch-score").textContent = `💙 ${catchScore} / 10`; }

  function completeCatchGame() {
    catchActive = false;
    window.clearInterval(catchInterval);
    state.games.catch = true;
    saveState();
    $("#catch-message").textContent = "You caught every one—but you already had mine. 💙";
    $("#start-catch").textContent = "Play again";
    $("#claim-catch").classList.remove("is-hidden");
    unlockAchievement("gamer-girlfriend");
    burstConfetti();
  }

  function moveCatcher(clientX) {
    const game = $("#catch-game");
    const rect = game.getBoundingClientRect();
    const catcher = $("#catcher");
    const left = Math.max(0, Math.min(rect.width - catcher.offsetWidth, clientX - rect.left - catcher.offsetWidth / 2));
    catcher.style.left = `${left}px`;
  }

  /* Memory matching */
  let flippedCards = [];
  let matchLock = false;
  let matchedPairs = 0;

  function shuffled(array) {
    const result = [...array];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const random = Math.floor(Math.random() * (index + 1));
      [result[index], result[random]] = [result[random], result[index]];
    }
    return result;
  }

  function buildMatchGame() {
    const picturePairs = Array.isArray(config.memoryMatchImages)
      ? config.memoryMatchImages.filter((item) => item?.image).slice(0, 8)
      : [];
    const fallbackSymbols = ["🐻", "🐼", "💙", "🌹", "🍓", "💌", "🌙", "⭐"];
    const pairs = picturePairs.length === 8
      ? picturePairs.map((item, index) => ({
          id: item.id || `memory-${index + 1}`,
          image: item.image,
          label: item.alt || `Our memory ${index + 1}`
        }))
      : fallbackSymbols.map((symbol, index) => ({ id: `symbol-${index}`, symbol, label: symbol }));
    const grid = $("#match-grid");
    grid.innerHTML = "";
    flippedCards = [];
    matchLock = false;
    matchedPairs = 0;
    $("#match-count").textContent = "0 / 8";
    $("#match-complete").classList.toggle("is-hidden", !state.games.match);
    shuffled([...pairs, ...pairs]).forEach((item, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "match-card";
      card.dataset.symbol = item.id;
      card.dataset.label = item.label;
      card.setAttribute("aria-label", `Hidden card ${index + 1}`);

      const face = document.createElement("span");
      face.className = "match-card__photo";
      if (item.image) {
        const image = document.createElement("img");
        try {
          image.src = new URL(item.image, document.baseURI).href;
        } catch (error) {
          image.src = item.image;
        }
        image.alt = "";
        image.loading = "eager";
        image.decoding = "async";
        image.addEventListener("error", () => {
          image.remove();
          face.classList.add("match-card__photo--symbol");
          face.textContent = "💙";
          card.setAttribute("aria-label", `Hidden card ${index + 1}; picture unavailable`);
        }, { once: true });
        face.appendChild(image);
      } else {
        face.classList.add("match-card__photo--symbol");
        face.textContent = item.symbol;
      }
      card.appendChild(face);
      card.addEventListener("click", () => flipMatchCard(card));
      grid.appendChild(card);
    });
  }

  function flipMatchCard(card) {
    if (matchLock || card.classList.contains("is-flipped") || card.classList.contains("is-matched")) return;
    playSound("flip");
    card.classList.add("is-flipped");
    card.setAttribute("aria-label", `Card showing ${card.dataset.label}`);
    flippedCards.push(card);
    if (flippedCards.length !== 2) return;
    const [first, second] = flippedCards;
    if (first.dataset.symbol === second.dataset.symbol) {
      playSound("success");
      first.classList.add("is-matched");
      second.classList.add("is-matched");
      flippedCards = [];
      matchedPairs += 1;
      $("#match-count").textContent = `${matchedPairs} / 8`;
      if (matchedPairs === 8) completeMatchGame();
    } else {
      playSound("wrong");
      matchLock = true;
      window.setTimeout(() => {
        first.classList.remove("is-flipped");
        second.classList.remove("is-flipped");
        first.setAttribute("aria-label", "Hidden card");
        second.setAttribute("aria-label", "Hidden card");
        flippedCards = [];
        matchLock = false;
      }, prefersReducedMotion ? 50 : 750);
    }
  }

  function completeMatchGame() {
    state.games.match = true;
    saveState();
    $("#match-complete").classList.remove("is-hidden");
    unlockAchievement("gamer-girlfriend");
    burstConfetti(55);
  }

  /* Quiz */
  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;

  function renderQuiz() {
    const stage = $("#quiz-stage");
    const questions = config.quizQuestions;
    if (quizIndex >= questions.length) {
      stage.innerHTML = `<div class="quiz-result"><span>🏆</span><h4>Certified Best Girlfriend</h4><p>You scored ${quizScore} / ${questions.length}. But there was never a wrong ending—you are still my favorite answer. 💙</p></div>`;
      $("#quiz-progress").textContent = "Complete";
      $("#quiz-reaction").textContent = "";
      $("#quiz-next").classList.add("is-hidden");
      state.games.quiz = true;
      saveState();
      unlockAchievement("quiz-champion");
      unlockAchievement("gamer-girlfriend");
      burstConfetti(45);
      return;
    }
    const question = questions[quizIndex];
    quizAnswered = false;
    $("#quiz-progress").textContent = `${quizIndex + 1} / ${questions.length}`;
    $("#quiz-reaction").textContent = "";
    $("#quiz-next").classList.add("is-hidden");
    stage.innerHTML = `<p class="quiz-question">${escapeHtml(question.question)}</p><div class="quiz-options">${question.options.map((option, index) => `<button class="quiz-option" type="button" data-answer="${index}">${escapeHtml(option)}</button>`).join("")}</div>`;
    $$(".quiz-option", stage).forEach((button) => button.addEventListener("click", () => answerQuiz(Number(button.dataset.answer))));
  }

  function answerQuiz(answerIndex) {
    if (quizAnswered) return;
    quizAnswered = true;
    const question = config.quizQuestions[quizIndex];
    const playful = question.answer === null;
    const correct = playful || answerIndex === question.answer;
    playSound(correct ? "success" : "wrong");
    if (correct) quizScore += 1;
    $$(".quiz-option", $("#quiz-stage")).forEach((button) => {
      button.disabled = true;
      const index = Number(button.dataset.answer);
      if (index === answerIndex) button.classList.add(correct ? "is-correct" : "is-wrong");
      if (!playful && index === question.answer) button.classList.add("is-correct");
    });
    $("#quiz-reaction").textContent = playful ? "No wrong answer. The bears accept this truth 😂" : correct ? "YAYYY! +1 girlfriend point 💙" : "DUDU IS JUDGING YOU 😭 (lovingly)";
    $("#quiz-next").classList.remove("is-hidden");
  }

  /* Sliding puzzle */
  let puzzle = [1, 2, 3, 4, 5, 6, 7, 8, null];
  let puzzleMoves = 0;

  function adjacentPuzzleIndexes(empty) {
    const row = Math.floor(empty / 3);
    const column = empty % 3;
    const options = [];
    if (row > 0) options.push(empty - 3);
    if (row < 2) options.push(empty + 3);
    if (column > 0) options.push(empty - 1);
    if (column < 2) options.push(empty + 1);
    return options;
  }

  function shufflePuzzle() {
    puzzle = [1, 2, 3, 4, 5, 6, 7, 8, null];
    let previous = -1;
    for (let step = 0; step < 140; step += 1) {
      const empty = puzzle.indexOf(null);
      let options = adjacentPuzzleIndexes(empty).filter((index) => index !== previous);
      if (!options.length) options = adjacentPuzzleIndexes(empty);
      const choice = options[Math.floor(Math.random() * options.length)];
      [puzzle[empty], puzzle[choice]] = [puzzle[choice], puzzle[empty]];
      previous = empty;
    }
    puzzleMoves = 0;
    $("#puzzle-complete").classList.add("is-hidden");
    renderPuzzle();
  }

  function renderPuzzle() {
    const grid = $("#puzzle-grid");
    const puzzlePicture = config.puzzleGame || {};
    const isSolved = puzzle.every((value, position) => value === [1,2,3,4,5,6,7,8,null][position]);
    grid.innerHTML = "";
    grid.style.aspectRatio = puzzlePicture.aspectRatio || "1";
    grid.classList.toggle("is-solved", isSolved);
    puzzle.forEach((value, index) => {
      const tile = document.createElement("button");
      const picturePiece = value === null && isSolved ? 9 : value;
      tile.type = "button";
      const tileClasses = ["puzzle-tile"];
      if (value === null && !isSolved) tileClasses.push("is-empty");
      if (picturePiece && puzzlePicture.image) tileClasses.push("has-image");
      if (value === null && isSolved) tileClasses.push("is-final-piece");
      tile.className = tileClasses.join(" ");
      tile.textContent = puzzlePicture.image ? "" : (value === null ? "" : value);
      tile.disabled = value === null;
      if (picturePiece && puzzlePicture.image) {
        const originalIndex = picturePiece - 1;
        const column = originalIndex % 3;
        const row = Math.floor(originalIndex / 3);
        tile.style.backgroundImage = `url("${puzzlePicture.image}")`;
        tile.style.backgroundPosition = `${column * 50}% ${row * 50}%`;
      }
      tile.setAttribute(
        "aria-label",
        value === null
          ? (isSolved ? `${puzzlePicture.alt || "Our picture"}, completed` : "Empty puzzle space")
          : `Picture puzzle piece ${value}`
      );
      tile.addEventListener("click", () => movePuzzleTile(index));
      grid.appendChild(tile);
    });
    $("#puzzle-moves").textContent = `${puzzleMoves} move${puzzleMoves === 1 ? "" : "s"}`;
  }

  function movePuzzleTile(index) {
    const empty = puzzle.indexOf(null);
    if (!adjacentPuzzleIndexes(empty).includes(index)) return;
    playSound("flip");
    [puzzle[empty], puzzle[index]] = [puzzle[index], puzzle[empty]];
    puzzleMoves += 1;
    renderPuzzle();
    if (puzzle.every((value, position) => value === [1,2,3,4,5,6,7,8,null][position])) {
      state.games.puzzle = true;
      saveState();
      $("#puzzle-complete").classList.remove("is-hidden");
      unlockAchievement("puzzle-heart");
      unlockAchievement("gamer-girlfriend");
      burstConfetti(40);
    }
  }

  function updateHiddenHearts() {
    $$('[data-secret-heart]').forEach((heart) => heart.classList.toggle("is-found", state.hiddenHearts.includes(heart.dataset.secretHeart)));
    $("#heart-count").textContent = state.hiddenHearts.length;
    const meter = $("#heart-meter-icons");
    meter.innerHTML = Array.from({ length: 5 }, (_, index) => `<span class="${index < state.hiddenHearts.length ? "is-found" : ""}">💙</span>`).join("");
  }

  function collectHeart(id) {
    if (state.hiddenHearts.includes(id)) return;
    state.hiddenHearts.push(id);
    saveState();
    updateHiddenHearts();
    floatingHearts(7);
    if (state.hiddenHearts.length >= 5) {
      unlockAchievement("heart-collector");
      burstConfetti(70);
      const reasons = config.hiddenHeartReasons.map((reason, index) => `<li><strong>${index + 1}.</strong>${escapeHtml(reason)}</li>`).join("");
      showModal({ icon: "💙", title: "Why there were five…", body: `<p>Five reasons I fall in love with you again and again.</p><ol class="reason-list">${reasons}</ol>` });
    } else {
      showModal({ icon: "💙", title: `Secret heart ${state.hiddenHearts.length} of 5`, body: "<p>You found one! The others are pretending to be very well hidden.</p>" });
    }
  }

  function giftUnlocked(key) {
    return key === "catch" ? state.games.catch
      : key === "match" ? state.games.match
      : key === "hearts" ? state.hiddenHearts.length >= 5
      : key === "finale" ? state.reachedBottom
      : false;
  }

  function updateGiftBoxes() {
    $$(".gift-box").forEach((box) => {
      const key = box.dataset.gift;
      const unlocked = giftUnlocked(key);
      const opened = state.giftsOpened.includes(key);
      box.classList.toggle("is-unlocked", unlocked && !opened);
      box.classList.toggle("is-opened", opened);
      $(".gift-status", box).textContent = opened ? "Opened" : unlocked ? "Ready to open" : "Locked";
    });
  }

  function openGift(key) {
    if (!giftUnlocked(key)) {
      const messages = ["No cheating 😭", "Dudu said WAIT 😤", "This gift has excellent security."];
      showModal({ icon: "🔒", title: messages[Math.floor(Math.random() * messages.length)], body: "<p>Finish the little mission written on the gift, then come back.</p>" });
      return;
    }
    if (!state.giftsOpened.includes(key)) state.giftsOpened.push(key);
    saveState();
    showModal({ icon: "🎁", title: "Surprise unlocked!", body: `<p>${escapeHtml(config.surpriseRewards[key])}</p>` });
    burstConfetti(30);
  }

  function drawJarNote() {
    if (!config.reasonsILoveYou.length) return;
    let index = Math.floor(Math.random() * config.reasonsILoveYou.length);
    if (config.reasonsILoveYou.length > 1 && index === lastJarIndex) index = (index + 1) % config.reasonsILoveYou.length;
    lastJarIndex = index;
    const note = $("#jar-note");
    note.classList.remove("is-drawing");
    void note.offsetWidth;
    note.textContent = config.reasonsILoveYou[index];
    note.classList.add("is-drawing");
  }

  function setupBearReactions() {
    const messages = ["Hello Dear!", "Mwah!", "I love you!", "Stop poking me 😭", "Again??", "Bubu loves Dudu 💙", "Dudu demands cuddles."];
    $$(".js-bear").forEach((bear) => {
      const react = () => {
        state.bearTaps = Number(state.bearTaps || 0) + 1;
        saveState();
        const message = messages[Math.floor(Math.random() * messages.length)];
        const bubble = $(".reaction-bubble", bear);
        if (bubble) {
          bubble.textContent = message;
          bubble.classList.add("is-showing");
          window.setTimeout(() => bubble.classList.remove("is-showing"), 1500);
        } else {
          const pop = $("#kiss-pop");
          $("strong", pop).textContent = message;
          pop.classList.remove("is-showing");
          void pop.offsetWidth;
          pop.classList.add("is-showing");
        }
        if (state.bearTaps >= 10 && !state.achievements.includes("bubu-expert")) {
          unlockAchievement("bubu-expert");
          showModal({ icon: "🐻", title: "The bears surrender", body: "<p>Secret reward: 1,000 cuddles. Please poke responsibly.</p>" });
        }
      };
      bear.addEventListener("click", react);
      bear.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); react(); }
      });
    });
  }

  function sendKiss() {
    state.kissCount = Number(state.kissCount || 0) + 1;
    saveState();
    let message = "Mwah 😘";
    if (state.kissCount >= 20) message = "Unlimited kisses unlocked. 💋";
    else if (state.kissCount >= 10) message = "YOU’RE ADDICTED TO MY KISSES.";
    else if (state.kissCount >= 5) message = "Okay that’s enough 😭 (just kidding)";
    const pop = $("#kiss-pop");
    $("strong", pop).textContent = message;
    pop.classList.remove("is-showing");
    void pop.offsetWidth;
    pop.classList.add("is-showing");
    floatingHearts(state.kissCount >= 20 ? 16 : 5);
    if (state.kissCount >= 20) unlockAchievement("kiss-master");
  }

  function randomLoveAction(action) {
    if (action === "note") {
      const reason = config.reasonsILoveYou[Math.floor(Math.random() * config.reasonsILoveYou.length)];
      showModal({ icon: "💌", title: "A tiny love note", body: `<p>${escapeHtml(reason)}</p>` });
    } else if (action === "memory") {
      openGallery(Math.floor(Math.random() * config.memories.length));
    } else if (action === "kiss") {
      sendKiss();
    } else if (action === "song") {
      document.querySelector("#song").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      window.setTimeout(toggleSong, prefersReducedMotion ? 0 : 650);
    } else {
      showModal({ icon: "🐻", title: "Bear surprise!", body: "<p>Dudu demands one cuddle, unli foodies, and a lifetime with you.</p>" });
    }
    $("#love-menu-panel").classList.add("is-hidden");
    $("#love-menu-toggle").setAttribute("aria-expanded", "false");
  }

  function setupMoonSecret() {
    let timer = 0;
    const moon = $("#moon");
    const start = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        unlockAchievement("moon-secret");
        showModal({ icon: "🌙", title: "The moon’s secret", body: "<p>In every universe, under every sky, I would still look for you.</p>" });
      }, prefersReducedMotion ? 500 : 3000);
    };
    const stop = () => window.clearTimeout(timer);
    moon.addEventListener("pointerdown", start);
    moon.addEventListener("pointerup", stop);
    moon.addEventListener("pointercancel", stop);
    moon.addEventListener("pointerleave", stop);
    moon.addEventListener("keydown", (event) => { if ((event.key === " " || event.key === "Enter") && !event.repeat) start(); });
    moon.addEventListener("keyup", stop);
  }

  async function openFinale() {
    playSound("whoosh");
    state.reachedBottom = true;
    saveState();
    updateGiftBoxes();
    cinematicTimers.forEach(window.clearTimeout);
    cinematicTimers = [];
    const cinematic = $("#cinematic");
    $("#cinematic-title").textContent = textTemplate(config.finale.title);
    const lines = $("#cinematic-lines");
    lines.innerHTML = "";
    config.finale.lines.forEach((line, index) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      if (line.includes("STILL CHOOSE")) paragraph.className = "cinematic__declaration";
      lines.appendChild(paragraph);
      const timer = window.setTimeout(() => paragraph.classList.add("is-visible"), prefersReducedMotion ? 20 : 1000 + index * 1450);
      cinematicTimers.push(timer);
    });
    $("#one-more-thing").classList.add("is-hidden");
    cinematic.classList.remove("is-hidden");
    setBodyModal(true);
    const revealDelay = prefersReducedMotion ? 60 : 1100 + config.finale.lines.length * 1450;
    cinematicTimers.push(window.setTimeout(() => {
      $("#one-more-thing").classList.remove("is-hidden");
      burstConfetti(80);
      fireworks(5);
    }, revealDelay));
  }

  function closeCinematic() {
    cinematicTimers.forEach(window.clearTimeout);
    cinematicTimers = [];
    $("#cinematic").classList.add("is-hidden");
    setBodyModal(false);
  }

  function openForeverQuestion() {
    $("#forever-question").classList.remove("is-hidden");
    $("#forever-message").textContent = "";
    $("#no-button").style.position = "static";
    setBodyModal(true);
    window.setTimeout(() => $("#yes-button").focus(), 30);
  }

  let noAttempts = 0;
  function tryNo() {
    noAttempts += 1;
    playSound("wrong");
    const button = $("#no-button");
    if (noAttempts <= 3) {
      const wrap = $("#forever-actions");
      button.style.position = "absolute";
      button.style.left = `${8 + Math.random() * Math.max(15, wrap.clientWidth - button.offsetWidth - 16)}px`;
      button.style.top = `${5 + Math.random() * Math.max(12, wrap.clientHeight - button.offsetHeight - 10)}px`;
      $("#forever-message").textContent = ["Hey! That button is shy 😭", "Dudu moved it. Not me.", "One last chance, suspicious person 👀"][noAttempts - 1];
      return;
    }
    button.style.position = "static";
    button.style.left = "";
    button.style.top = "";
    $("#forever-message").textContent = "Too late. You’re stuck with me anyway 😂💙";
    burstConfetti(35);
  }

  function sayYes() {
    playSound("success");
    state.completed = true;
    state.reachedBottom = true;
    if (!state.giftsOpened.includes("finale")) state.giftsOpened.push("finale");
    saveState();
    unlockAchievement("best-girlfriend");
    $(".forever-question__card").innerHTML = `<div class="forever-question__bears">🐻💙🐼</div><p class="celebration-message">YAYYYYYYYYY!<br>Happy Anniversary, ${escapeHtml(config.names.nickname)}!</p><p>Another year of laughter, foodtrips, adventures, and choosing each other. 💙</p><button class="button button--primary" id="celebration-close" type="button">Back to our story</button>`;
    $("#celebration-close").addEventListener("click", () => {
      finaleCelebrationTimers.forEach(window.clearTimeout);
      finaleCelebrationTimers = [];
      $("#forever-question").classList.add("is-hidden");
      $("#cinematic").classList.add("is-hidden");
      setBodyModal(false);
    });
    runFinaleCelebration();
  }

  function setupOpening() {
    $("#open-surprise").addEventListener("click", () => {
      unlockAchievement("first-surprise");
      burstConfetti(24);
      $("#intro-screen").classList.add("is-leaving");
      window.setTimeout(() => {
        $("#intro-screen").classList.add("is-hidden");
        if (config.lock.enabled) {
          $("#lock-screen").classList.remove("is-hidden");
          $("#password-input").focus();
        } else {
          enterExperience();
        }
      }, prefersReducedMotion ? 20 : 720);
    });

    let attempts = 0;
    $("#lock-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const entered = $("#password-input").value.trim().toLocaleLowerCase();
      const correct = String(config.lock.password).trim().toLocaleLowerCase();
      if (entered === correct) {
        $("#lock-message").textContent = "YAYYYY! I knew it was you! 💙";
        $("#lock-form button[type='submit']").disabled = true;
        $(".lock-card").classList.add("is-unlocking");
        window.setTimeout(enterExperience, prefersReducedMotion ? 20 : 650);
      } else {
        attempts += 1;
        const replies = ["Hmmm… suspicious 🤨", "Are you really my girlfriend? 😂", "Bubu says try again 🐻"];
        $("#lock-message").textContent = attempts >= 3 ? config.lock.hint : replies[(attempts - 1) % replies.length];
        $("#password-input").select();
      }
    });
    $("#peek-password").addEventListener("click", () => {
      const input = $("#password-input");
      input.type = input.type === "password" ? "text" : "password";
      $("#peek-password").setAttribute("aria-label", input.type === "password" ? "Show password" : "Hide password");
    });
  }

  function enterExperience() {
    const entrance = $("#grand-entrance");
    if (!entrance.classList.contains("is-hidden")) return;
    $("#intro-screen").classList.add("is-hidden");
    $("#lock-screen").classList.add("is-hidden");
    $("#achievement-toast").classList.remove("is-showing");
    window.clearTimeout(toastTimer);
    window.scrollTo({ top: 0, behavior: "auto" });
    const musicButton = $("#grand-enter-music");
    const quietButton = $("#grand-enter-quiet");
    entrance.classList.remove("is-hidden", "is-leaving", "is-ready");
    musicButton.disabled = true;
    quietButton.disabled = true;
    buildGrandEntranceStars();
    void entrance.offsetWidth;
    entrance.classList.add("is-playing");
    setBodyModal(true);
    playSound("sparkle");
    lightHaptic([18, 35, 24]);
    window.setTimeout(() => {
      fireworks(4);
      burstSecretHearts($("#grand-entrance-portal"), 18);
    }, prefersReducedMotion ? 20 : 1750);
    window.setTimeout(() => {
      entrance.classList.add("is-ready");
      musicButton.disabled = false;
      quietButton.disabled = false;
      musicButton.focus();
    }, prefersReducedMotion ? 40 : 3600);
  }

  function buildGrandEntranceStars() {
    const field = $("#grand-entrance-stars");
    field.innerHTML = "";
    const total = prefersReducedMotion ? 18 : 42;
    for (let index = 0; index < total; index += 1) {
      const star = document.createElement("span");
      star.style.left = `${3 + Math.random() * 94}%`;
      star.style.top = `${3 + Math.random() * 91}%`;
      star.style.setProperty("--star-delay", `${Math.random() * 2.5}s`);
      star.style.setProperty("--star-size", `${2 + Math.random() * 4}px`);
      field.appendChild(star);
    }
  }

  async function finishGrandEntrance(withMusic) {
    const entrance = $("#grand-entrance");
    if (entrance.classList.contains("is-leaving")) return;
    $("#grand-enter-music").disabled = true;
    $("#grand-enter-quiet").disabled = true;
    if (withMusic) await toggleSong();
    playSound("success");
    lightHaptic([25, 35, 55]);
    entrance.classList.add("is-leaving");
    burstConfetti(80);
    floatingHearts(16);
    window.setTimeout(() => {
      entrance.classList.add("is-hidden");
      entrance.classList.remove("is-playing", "is-ready", "is-leaving");
      setBodyModal(false);
      $("#welcome").scrollIntoView({ behavior: "auto" });
      const firstDelay = Math.max(6000, Number(config.wanderingSurprises?.initialDelay) || 9000);
      scheduleWanderingSurprise(firstDelay + Math.random() * 3500);
    }, prefersReducedMotion ? 60 : 1050);
  }

  function closeMusicPrompt() {
    $("#music-prompt").classList.add("is-hidden");
    setBodyModal(false);
    $("#welcome").scrollIntoView({ behavior: "auto" });
  }

  function bindEvents() {
    setupOpening();
    const playInteractionSound = (event) => {
      const button = event.target.closest("button, [role='button']");
      if (button && button.id !== "sound-toggle" && !button.disabled) playButtonSound();
    };
    document.addEventListener("pointerdown", playInteractionSound, { passive: true });
    document.addEventListener("click", (event) => {
      if (event.detail === 0) playInteractionSound(event);
    });
    $("#sound-toggle").addEventListener("click", toggleSoundEffects);
    $("#music-yes").addEventListener("click", async () => { await toggleSong(); closeMusicPrompt(); });
    $("#music-later").addEventListener("click", closeMusicPrompt);
    $("#grand-enter-music").addEventListener("click", () => finishGrandEntrance(true));
    $("#grand-enter-quiet").addEventListener("click", () => finishGrandEntrance(false));
    $("#song-play").addEventListener("click", toggleSong);
    $("#voice-play").addEventListener("click", toggleVoice);
    $("#voice-audio").addEventListener("ended", () => { $("#voice-play").textContent = "▶ Hear My Message"; });
    $("#open-letter").addEventListener("click", openLetter);
    $("#open-letter-label").addEventListener("click", openLetter);
    $("#achievements-button").addEventListener("click", showAchievements);
    $$('[data-close-modal]').forEach((button) => button.addEventListener("click", closeModal));
    $("#modal").addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });

    $("#gallery-close").addEventListener("click", closeGallery);
    $("#gallery-prev").addEventListener("click", () => openGallery(galleryIndex - 1));
    $("#gallery-next").addEventListener("click", () => openGallery(galleryIndex + 1));
    $("#memory-secret").addEventListener("click", () => {
      const secretMessage = $("#memory-secret-text");
      secretMessage.classList.remove("is-hidden");
      $("#memory-secret").classList.add("is-hidden");
      if (!openedScrapbookSecrets.has(galleryIndex)) {
        openedScrapbookSecrets.add(galleryIndex);
        window.setTimeout(() => {
          burstSecretHearts(secretMessage);
          playSound("sparkle");
        }, prefersReducedMotion ? 20 : 70);
      }
    });
    $("#gallery-modal").addEventListener("touchstart", (event) => { galleryTouchStart = event.changedTouches[0].clientX; }, { passive: true });
    $("#gallery-modal").addEventListener("touchend", (event) => {
      if (galleryTouchStart === null) return;
      const delta = event.changedTouches[0].clientX - galleryTouchStart;
      if (Math.abs(delta) > 55) openGallery(galleryIndex + (delta < 0 ? 1 : -1));
      galleryTouchStart = null;
    }, { passive: true });

    $("#start-catch").addEventListener("click", startCatchGame);
    $("#claim-catch").addEventListener("click", () => openGift("catch"));
    const catchGame = $("#catch-game");
    catchGame.addEventListener("pointerdown", (event) => { if (catchActive) { catcherDragging = true; moveCatcher(event.clientX); catchGame.setPointerCapture?.(event.pointerId); } });
    catchGame.addEventListener("pointermove", (event) => { if (catchActive && catcherDragging) moveCatcher(event.clientX); });
    catchGame.addEventListener("pointerup", () => { catcherDragging = false; });
    catchGame.addEventListener("pointercancel", () => { catcherDragging = false; });
    $("#catcher").addEventListener("keydown", (event) => {
      if (!catchActive || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const current = parseFloat($("#catcher").style.left || `${($("#catch-game").clientWidth - 66) / 2}`);
      $("#catcher").style.left = `${Math.max(0, Math.min($("#catch-game").clientWidth - 66, current + (event.key === "ArrowLeft" ? -24 : 24)))}px`;
    });
    $("#reset-match").addEventListener("click", buildMatchGame);
    $("#quiz-next").addEventListener("click", () => { quizIndex += 1; renderQuiz(); });
    $("#shuffle-puzzle").addEventListener("click", shufflePuzzle);

    $$('[data-secret-heart]').forEach((heart) => heart.addEventListener("click", () => collectHeart(heart.dataset.secretHeart)));
    $$(".gift-box").forEach((gift) => gift.addEventListener("click", () => openGift(gift.dataset.gift)));
    $("#pick-note").addEventListener("click", drawJarNote);
    setupMoonSecret();
    setupBearReactions();

    $("#brand-mark").addEventListener("click", () => {
      state.logoTaps = Number(state.logoTaps || 0) + 1;
      saveState();
      if (state.logoTaps >= 7 && !state.achievements.includes("logo-secret")) {
        unlockAchievement("logo-secret");
        showModal({ icon: "💍", title: "You found a secret!", body: "<p>Bubu says we should keep choosing each other forever. Very subtle, Bubu. 😭💙</p>" });
      }
    });
    $("#kiss-button").addEventListener("click", sendKiss);
    $("#love-menu-toggle").addEventListener("click", () => {
      const panel = $("#love-menu-panel");
      const opening = panel.classList.contains("is-hidden");
      panel.classList.toggle("is-hidden", !opening);
      $("#love-menu-toggle").setAttribute("aria-expanded", String(opening));
    });
    $$('[data-love-action]').forEach((button) => button.addEventListener("click", () => randomLoveAction(button.dataset.loveAction)));

    $("#open-finale").addEventListener("click", openFinale);
    $("#open-finale-label").addEventListener("click", openFinale);
    $("#cinematic-close").addEventListener("click", closeCinematic);
    $("#one-more-thing").addEventListener("click", openForeverQuestion);
    $("#no-button").addEventListener("click", tryNo);
    $("#yes-button").addEventListener("click", sayYes);
    $("#reset-progress").addEventListener("click", () => {
      showModal({
        icon: "↺",
        title: "Start this device over?",
        body: "<p>This clears found hearts, games, coupons, gifts, and achievements on this device only.</p>",
        actions: [
          { label: "Keep everything", onClick: closeModal },
          { label: "Reset progress", primary: true, onClick: () => { localStorage.removeItem(STORAGE_KEY); location.reload(); } }
        ]
      });
    });
    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!$("#gallery-modal").classList.contains("is-hidden")) closeGallery();
      else if (!$("#modal").classList.contains("is-hidden")) closeModal();
      else if (!$("#cinematic").classList.contains("is-hidden")) closeCinematic();
    });
  }

  function restoreProgressUI() {
    updateAchievementCount();
    updateHiddenHearts();
    updateGiftBoxes();
    updateCatchUI();
    if (state.letterOpened) {
      $("#envelope-wrap").classList.add("is-open");
      $("#open-letter-label").classList.add("is-hidden");
      const letter = $("#love-letter");
      letter.classList.remove("is-hidden");
      letter.innerHTML = config.loveLetter.map((paragraph) => `<p>${escapeHtml(textTemplate(paragraph)).replaceAll("\n", "<br>")}</p>`).join("");
    }
  }

  function initialize() {
    preloadButtonSound();
    applyConfig();
    renderTimeline();
    renderGallery();
    renderCoupons();
    renderFunny();
    renderStars();
    setupMedia();
    buildMatchGame();
    renderQuiz();
    shufflePuzzle();
    restoreProgressUI();
    updateSoundToggle();
    bindEvents();
    setupReveal();
    setupTactileInteractions();
    setupBottomObserver();
    updateCounter();
    window.setInterval(updateCounter, 1000);
    updateScrollProgress();
  }

  initialize();
})();
