(() => {
  "use strict";

  /* ---------- Wedding data ---------- */
  const WEDDING = {
    start: new Date("2027-06-12T18:00:00+05:00"),   // Tashkent time
    end: new Date("2027-06-13T00:00:00+05:00"),
    title: "Wedding of Jasur & Madina",
    location: "Bahor Wedding Hall, Chilonzor District",
    mapUrl: "https://maps.google.com/?q=Chilonzor,Tashkent",
  };

  /* Put the song file into /music with exactly this name. */
  const SONG = { title: "Snowman", artist: "Sia", src: "music/snowman.mp3" };

  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Fit envelope and card to any screen (no scrolling) ---------- */
  const stage = $("stage");
  const cardFit = $("cardFit");
  const MARGIN = 16;

  function fit() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // landscape screens get the side-by-side card
    document.body.classList.toggle("is-wide", vw > vh * 1.1 && vw >= 560);

    stage.style.setProperty("--fit", Math.min(vw / 380, vh / 520, 1.35).toFixed(4));

    // keep the music player (top-right) clear of the card
    const wide = document.body.classList.contains("is-wide");
    const top = wide ? 76 : 74;
    const cw = cardFit.offsetWidth;
    const ch = cardFit.offsetHeight;
    const s = Math.min((vw - MARGIN * 2) / cw, (vh - top - MARGIN) / ch, 1.3);
    cardFit.style.setProperty("--fit", s.toFixed(4));
    cardFit.style.top = `${top + (vh - top - MARGIN) / 2}px`;
  }
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  /* ---------- Languages ---------- */
  const I18N = {
    en: {
      pageTitle: "Wedding Invitation",
      letter: "A letter for you",
      tap: "Tap the seal to open",
      openAria: "Open the invitation",
      photoAlt: "The couple, hand in hand",
      lead: "Together with their families",
      invite: "invite you to celebrate their wedding",
      dateAria: "Saturday, 12 June 2027, at 18:00",
      weekday: "Saturday",
      month: "June",
      time: "2027 · at 18:00",
      venue: "Bahor Wedding Hall",
      area: "Chilonzor District",
      days: "days", hrs: "hrs", min: "min", sec: "sec",
      today: "Today is the day!",
      map: "Show on map",
      cal: "Save the date",
      calAria: "Add the wedding to your calendar",
      play: "Play music",
      pause: "Pause music",
      eventTitle: "Wedding of Jasur & Madina",
      eventPlace: "Bahor Wedding Hall, Chilonzor District",
      eventNote: "We can't wait to celebrate with you!",
    },
    uz: {
      pageTitle: "Nikoh toʻyi uchun taklifnoma",
      letter: "Sizga maktub",
      tap: "Ochish uchun muhrni bosing",
      openAria: "Taklifnomani ochish",
      photoAlt: "Kelin va kuyov qo‘l ushlashib turibdi",
      lead: "Qadrli mehmon!",
      invite: "Sizni nikoh to‘yimizga lutfan taklif etamiz",
      dateAria: "2027-yil 12-iyun, shanba, soat 18:00",
      weekday: "Shanba",
      month: "Iyun",
      time: "2027 · soat 18:00 da",
      venue: "«Bahor» to‘yxonasi",
      area: "Chilonzor tumani",
      days: "kun", hrs: "soat", min: "daqiqa", sec: "soniya",
      today: "Bugun to‘y kuni!",
      map: "Manzil",
      cal: "Kalendarga",
      calAria: "To‘y sanasini kalendarga qo‘shish",
      play: "Musiqani yoqish",
      pause: "Musiqani to‘xtatish",
      eventTitle: "Jasur va Madinaning nikoh to‘yi",
      eventPlace: "«Bahor» to‘yxonasi, Chilonzor tumani",
      eventNote: "Sizni intiqlik bilan kutamiz!",
    },
  };

  const store = {
    get() { try { return localStorage.getItem("lang"); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem("lang", v); } catch (e) { /* private mode */ } },
  };
  let lang = store.get() === "en" ? "en" : "uz";      // Uzbek by default
  const t = (key) => I18N[lang][key];

  const langBox = document.querySelector(".lang");

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t("pageTitle");
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => (el.alt = t(el.dataset.i18nAlt)));
    langBox.dataset.active = lang;
    langBox.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    if (typeof setPaused === "function" && !music.hidden) setPaused(audio.paused);
    fit();
  }

  langBox.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang]");
    if (!btn || btn.dataset.lang === lang) return;
    lang = btn.dataset.lang;
    store.set(lang);
    document.body.classList.add("is-switching");
    setTimeout(() => {
      applyLang();
      document.body.classList.remove("is-switching");
    }, 200);
  });

  /* ---------- Music ---------- */
  const audio = $("audio");
  const music = $("music");
  $("trackTitle").textContent = SONG.title;
  $("trackArtist").textContent = SONG.artist;

  const progress = $("progress");
  const RING = 154;
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    progress.style.strokeDashoffset = (RING * (1 - audio.currentTime / audio.duration)).toFixed(1);
  });
  audio.src = SONG.src;
  audio.volume = 0.7;

  function setPaused(paused) {
    music.classList.toggle("is-paused", paused);
    music.setAttribute("aria-label", paused ? t("play") : t("pause"));
  }
  function play() {
    const p = audio.play();
    if (p && p.catch) p.catch(() => setPaused(true));
  }

  music.addEventListener("click", () => (audio.paused ? play() : audio.pause()));
  audio.addEventListener("play", () => setPaused(false));
  audio.addEventListener("pause", () => setPaused(true));
  let noSong = false;
  audio.addEventListener("error", () => { noSong = true; music.hidden = true; });   // no song file yet

  let pausedByHide = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && !audio.paused) { pausedByHide = true; audio.pause(); }
    else if (!document.hidden && pausedByHide) { pausedByHide = false; play(); }
  });

  applyLang();

  /* ---------- Opening the envelope ---------- */
  const envelope = $("envelope");
  envelope.addEventListener("click", () => {
    play();                              // must start inside the tap on phones
    music.hidden = noSong;
    document.body.classList.add("is-open");
    $("card").removeAttribute("aria-hidden");
    envelope.setAttribute("aria-hidden", "true");
    envelope.tabIndex = -1;
    setTimeout(() => { envelope.hidden = true; $("hint").hidden = true; }, reduceMotion ? 600 : 1700);
  }, { once: true });
  envelope.focus({ preventScroll: true });

  /* ---------- Countdown ---------- */
  const units = {};
  document.querySelectorAll("[data-unit]").forEach((el) => (units[el.dataset.unit] = el));
  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const diff = WEDDING.start - Date.now();
    if (diff <= 0) {
      $("countdown").innerHTML = `<span data-i18n="today">${t("today")}</span>`;
      return;
    }
    const s = Math.floor(diff / 1000);
    units.d.textContent = pad(Math.floor(s / 86400));
    units.h.textContent = pad(Math.floor((s % 86400) / 3600));
    units.m.textContent = pad(Math.floor((s % 3600) / 60));
    units.s.textContent = pad(s % 60);
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  /* ---------- Add to calendar ----------
     iPhone/iPad: an .ics file opens Apple Calendar's "Add event" sheet directly.
     Everyone else: open Google Calendar with the event pre-filled (no file download). */
  const icsDate = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  function googleCalendarUrl() {
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: t("eventTitle"),
      dates: `${icsDate(WEDDING.start)}/${icsDate(WEDDING.end)}`,
      location: t("eventPlace"),
      details: `${t("eventNote")}\n${WEDDING.mapUrl}`,
      ctz: "Asia/Tashkent",
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  }

  function downloadIcs() {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Taklifnoma//Wedding//EN",
      "BEGIN:VEVENT",
      "UID:jasur-madina-20270612@wedding",
      "DTSTAMP:" + icsDate(new Date()),
      "DTSTART:" + icsDate(WEDDING.start),
      "DTEND:" + icsDate(WEDDING.end),
      "SUMMARY:" + t("eventTitle"),
      "LOCATION:" + t("eventPlace").replace(/,/g, "\\,"),
      "DESCRIPTION:Map: " + WEDDING.mapUrl,
      "BEGIN:VALARM",
      "TRIGGER:-PT3H",
      "ACTION:DISPLAY",
      "DESCRIPTION:" + t("eventTitle"),
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "wedding.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $("calBtn").addEventListener("click", () => {
    if (isApple) downloadIcs();
    else window.open(googleCalendarUrl(), "_blank", "noopener");
  });

  /* ---------- Falling snow ---------- */
  const canvas = $("snow");
  const ctx = canvas.getContext("2d");
  let flakes = [];
  let W = 0, H = 0, dpr = 1;

  function resizeSnow() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(110, (W * H) / 9000));
    flakes = Array.from({ length: count }, () => newFlake(true));
  }

  function newFlake(anywhere) {
    const r = Math.random() * 2.4 + 0.8;
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : -10,
      r,
      vy: r * 0.32 + 0.25,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.012 + 0.004,
      alpha: Math.random() * 0.5 + 0.35,
    };
  }

  function drawSnow() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.sway += f.swaySpeed;
      f.y += f.vy;
      f.x += Math.sin(f.sway) * 0.35;
      if (f.y > H + 10) flakes[i] = newFlake(false);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 250, 246, ${f.alpha})`;
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(drawSnow);
  }

  resizeSnow();
  window.addEventListener("resize", resizeSnow);
  if (!reduceMotion) requestAnimationFrame(drawSnow);
})();
