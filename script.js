(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const canHover = window.matchMedia("(hover: hover)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  $("#year").textContent = new Date().getFullYear();

  /* ================= Язык (EN / UA) ================= */
  const EN = {};                       // английский берём из самой страницы
  $$("[data-i18n]").forEach((el) => { EN[el.dataset.i18n] = el.textContent; });
  $$("[data-i18n-label]").forEach((el) => { EN[el.dataset.i18nLabel] = el.getAttribute("aria-label"); });
  EN["meta.title"] = document.title;
  EN["contact.copied"] = "Copied";
  EN["portfolio.watch"] = "Watch";
  EN["portfolio.view"] = "View";
  const UK = window.I18N_UK || {};
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // По умолчанию всегда EN. UA включается только кнопкой или ссылкой с ?lang=uk
  function detectLang() {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    return fromUrl === "uk" || fromUrl === "ua" ? "uk" : "en";
  }

  let lang = detectLang();
  const t = (key) => (lang === "uk" && UK[key]) || EN[key] || "";

  function applyLang(next) {
    lang = next;
    document.documentElement.lang = lang;
    document.title = t("meta.title");
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-label]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nLabel)); });
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    // Месяцы в датах опыта: Jun 2025 → черв. 2025
    const ukMonths = (UK.months || "").split(",");
    $$(".role__when span").forEach((el) => {
      if (!el.dataset.en) el.dataset.en = el.textContent;
      el.textContent = lang === "uk" && ukMonths.length === 12
        ? el.dataset.en.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (m) => ukMonths[MONTHS.indexOf(m)])
        : el.dataset.en;
    });
    // Запоминаем выбор в адресе (?lang=uk), чтобы он сохранялся при обновлении и в ссылке
    const url = new URL(location.href);
    if (lang === "uk") url.searchParams.set("lang", "uk"); else url.searchParams.delete("lang");
    history.replaceState(null, "", url);
    renderWorks();
    if (!lightbox.hidden) showWork();
  }

  $$(".lang button").forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang)));

  /* ================= Навигация ================= */
  const nav = $(".nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Подсветка текущего раздела в меню
  if ("IntersectionObserver" in window) {
    const links = $$(".nav__links a");
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["top", "portfolio", "experience", "skills", "contact"].forEach((id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ================= Счётчики в блоке результатов ================= */
  const counters = $$("[data-count]");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        const el = e.target, end = Number(el.dataset.count), pre = el.dataset.prefix || "";
        const start = performance.now(), dur = 1200;
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          el.textContent = pre + Math.round(end * (1 - Math.pow(1 - p, 3))) + "%";
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  }

  /* ================= Копирование контактов ================= */
  const toast = $("#toast");
  let toastTimer;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 1800);
  }
  $$("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copy); showToast(t("contact.copied")); }
    catch { showToast(btn.dataset.copy); }
  }));

  /* ================= Портфолио ================= */
  const worksEl = $("#works");
  let works = [];
  const pick = (v) => (v && typeof v === "object" ? v[lang] || v.en || "" : v || "");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
  const isImage = (w) => w.type === "image";
  const expandIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
  const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg>';

  const reveal = "IntersectionObserver" in window && !reduceMotion
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); reveal.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -8% 0px" })
    : null;

  function renderWorks() {
    if (!works.length) return;
    worksEl.innerHTML = works.map((w, i) => `
      <button class="work${w.format === "landscape" ? " work--wide" : ""}${reveal ? "" : " is-visible"}" type="button" data-index="${i}"
        aria-label="${esc(t(isImage(w) ? "portfolio.view" : "portfolio.watch"))}: ${esc(pick(w.title))}">
        <div class="work__media">
          <img src="${esc(w.poster)}" alt="" loading="lazy" decoding="async">
          <span class="work__num">${String(i + 1).padStart(2, "0")}</span>
          ${w.badge ? `<span class="work__badge">${esc(pick(w.badge))}</span>` : ""}
          <span class="work__play${isImage(w) ? " work__play--expand" : ""}" aria-hidden="true">${isImage(w) ? expandIcon : playIcon}</span>
        </div>
        <div class="work__body">
          <h3 class="work__title">${esc(pick(w.title))}</h3>
          <p class="work__cat">${esc(pick(w.category))}</p>
        </div>
      </button>`).join("");

    $$(".work", worksEl).forEach((card) => {
      if (reveal) reveal.observe(card);
      card.addEventListener("click", () => openWork(Number(card.dataset.index)));
      if (canHover && !isImage(works[Number(card.dataset.index)])) {
        card.addEventListener("mouseenter", () => startPreview(card));
        card.addEventListener("mouseleave", () => stopPreview(card));
      }
    });
  }

  // Видео-превью создаётся только при наведении, чтобы не грузить 9 роликов сразу
  function startPreview(card) {
    const w = works[Number(card.dataset.index)];
    let v = $("video", card);
    if (!v) {
      v = document.createElement("video");
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto";
      v.src = w.src;
      v.addEventListener("playing", () => card.classList.add("is-playing"));
      $(".work__media", card).insertBefore(v, $(".work__num", card));
    }
    v.play().catch(() => {});
  }
  function stopPreview(card) {
    const v = $("video", card);
    if (v) v.pause();
    card.classList.remove("is-playing");
  }

  /* ================= Лайтбокс ================= */
  const lightbox = $("#lightbox");
  const lbMedia = $(".lightbox__media", lightbox);
  let current = 0, lastFocus = null;

  function openWork(i) {
    current = i;
    lastFocus = document.activeElement;
    $$(".work").forEach(stopPreview);
    lightbox.hidden = false;
    document.body.classList.add("no-scroll");
    showWork();
    $(".lightbox__close", lightbox).focus();
  }
  function closeWork() {
    lightbox.hidden = true;
    lbMedia.innerHTML = "";
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  }
  function stepWork(d) {
    current = (current + d + works.length) % works.length;
    showWork();
  }
  function showWork() {
    const w = works[current];
    lightbox.classList.toggle("is-landscape", w.format === "landscape");
    const existing = $("[data-src]", lbMedia);
    if (!existing || existing.dataset.src !== w.src) {
      lbMedia.innerHTML = isImage(w)
        ? `<img src="${esc(w.src)}" data-src="${esc(w.src)}" alt="${esc(pick(w.title))}">`
        : `<video src="${esc(w.src)}" data-src="${esc(w.src)}" poster="${esc(w.poster)}" controls autoplay playsinline></video>`;
    }
    $(".lightbox__count", lightbox).textContent = `${String(current + 1).padStart(2, "0")} / ${String(works.length).padStart(2, "0")}`;
    $(".lightbox__title", lightbox).textContent = pick(w.title);
    $(".lightbox__cat", lightbox).textContent = pick(w.category);
    const badge = $(".lightbox__badge", lightbox);
    badge.textContent = pick(w.badge);
    badge.hidden = !w.badge;
    $(".lightbox__desc", lightbox).textContent = pick(w.description);
  }

  $(".lightbox__close", lightbox).addEventListener("click", closeWork);
  $(".lightbox__nav--prev", lightbox).addEventListener("click", () => stepWork(-1));
  $(".lightbox__nav--next", lightbox).addEventListener("click", () => stepWork(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox__inner")) closeWork();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeWork();
    else if (e.key === "ArrowRight") stepWork(1);
    else if (e.key === "ArrowLeft") stepWork(-1);
    else if (e.key === "Tab") {
      const f = $$("button, video[controls]", lightbox).filter((el) => el.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Свайп влево/вправо на телефоне
  let tx = null, ty = null;
  lightbox.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) stepWork(dx < 0 ? 1 : -1);
    tx = ty = null;
  });

  /* ================= Старт ================= */
  applyLang(lang);

  fetch("data/works.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => { works = data; renderWorks(); })
    .catch(() => {
      worksEl.innerHTML = '<p style="color:var(--muted)">Could not load the portfolio. If you opened the file from disk, run a local server (see README).</p>';
    });
})();
