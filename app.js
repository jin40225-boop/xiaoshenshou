/* ============================================================
   我家小神獸 — cinematic scroll engine v2
   Lenis + GSAP ScrollTrigger + SplitType (graceful fallback)
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var html = document.documentElement;

  /* ---------------------------------------------------------
     0. Lenis smooth scroll (premium inertia)
     --------------------------------------------------------- */
  var lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduce) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  /* ---------------------------------------------------------
     1. GSAP path — armed enhancements
     --------------------------------------------------------- */
  if (hasGSAP && !reduce) {
    html.classList.add("is-armed");
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    // ---- HERO: per-char title rise + blur, then supporting lines ----
    var heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    var heroChars = [];
    document.querySelectorAll(".hero-title [data-split]").forEach(function (line) {
      var txt = line.textContent; line.textContent = "";
      txt.split("").forEach(function (ch) {
        var s = document.createElement("span");
        s.className = "char"; s.textContent = ch;
        line.appendChild(s); heroChars.push(s);
      });
    });
    heroTl
      .fromTo(".hero-org", { y: -14, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.7 }, 0.1)
      .fromTo(".hero-plan", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.25)
      .fromTo(heroChars, { yPercent: 55, opacity: 0, filter: "blur(10px)" },
              { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.05, ease: "power4.out" }, 0.35)
      .fromTo(".hero-sub", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 0.9)
      .fromTo(".hero-poem", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 1.05)
      .to(".hero-bloom", { opacity: 0.95, duration: 1.6, ease: "sine.out" }, 0.4);

    // ---- generic reveal (Act II blocks) ----
    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      var d = parseFloat(el.getAttribute("data-delay") || 0) * 0.08;
      gsap.to(el, {
        y: 0, opacity: 1, duration: 0.95, ease: "power3.out", delay: d,
        scrollTrigger: { trigger: el, start: "top 86%" }
      });
    });

    // ---- scene .active toggling (breathing / rays / glow) ----
    gsap.utils.toArray(".cine, .lumen").forEach(function (sec) {
      ScrollTrigger.create({ trigger: sec, start: "top 60%", end: "bottom 40%",
        onEnter: function () { sec.classList.add("active"); },
        onEnterBack: function () { sec.classList.add("active"); } });
    });

    // ---- scene content reveal (cinematic enter for each scene) ----
    gsap.utils.toArray(".cine:not(.hero) .cine-content").forEach(function (c) {
      gsap.from(c.children, {
        y: 38, opacity: 0, duration: 1.05, ease: "power3.out", stagger: 0.12,
        scrollTrigger: { trigger: c.closest(".cine"), start: "top 55%" }
      });
    });
    gsap.utils.toArray(".lumen .lumen-in").forEach(function (c) {
      gsap.from(c, { y: 34, opacity: 0, duration: 1.05, ease: "power3.out",
        scrollTrigger: { trigger: c.closest(".lumen"), start: "top 62%" } });
    });

    // ---- parallax: scene backgrounds drift slower than content ----
    gsap.utils.toArray("[data-par-bg]").forEach(function (bg) {
      var sp = parseFloat(bg.getAttribute("data-par-bg")) || 0.12;
      gsap.fromTo(bg, { yPercent: -sp * 50 }, {
        yPercent: sp * 50, ease: "none",
        scrollTrigger: { trigger: bg.closest("section"), start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    // ---- timeline river: fill the line as you pass ----
    var tlFill = document.querySelector(".tl-line i");
    if (tlFill) {
      gsap.to(tlFill, { height: "100%", ease: "none",
        scrollTrigger: { trigger: ".timeline", start: "top 70%", end: "bottom 75%", scrub: 0.5 } });
    }
  } else {
    // No GSAP / reduced motion → make sure everything is visible
    html.classList.remove("is-armed");
    document.querySelectorAll(".cine, .lumen").forEach(function (s) { s.classList.add("active"); });
  }

  /* ---------------------------------------------------------
     2. Budget bars + counters (work with or without GSAP)
     --------------------------------------------------------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count")), dur = 1500, start = null;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / dur, 1), e = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * e).toLocaleString("en-US");
      if (t < 1) requestAnimationFrame(step); else el.textContent = target.toLocaleString("en-US");
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target.classList.contains("brow")) e.target.classList.add("in");
        if (e.target.hasAttribute("data-count")) { if (!reduce) countUp(e.target); else e.target.textContent = parseFloat(e.target.getAttribute("data-count")).toLocaleString("en-US"); }
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll(".brow, [data-count]").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".brow").forEach(function (el) { el.classList.add("in"); });
    document.querySelectorAll("[data-count]").forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  }

  /* ---------------------------------------------------------
     3. Progress bar + minilogo + active chapter
     --------------------------------------------------------- */
  var bar = document.querySelector(".progress i");
  var minilogo = document.querySelector(".minilogo");
  var chapLinks = [].slice.call(document.querySelectorAll(".chapters a"));
  var chapTargets = chapLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  function onScroll() {
    var st = window.scrollY || html.scrollTop;
    var h = html.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? (st / h) * 100 : 0) + "%";
    if (minilogo) minilogo.classList.toggle("show", st > window.innerHeight * 0.6);
    var mid = st + window.innerHeight * 0.4, idx = 0;
    chapTargets.forEach(function (t, i) { if (t && t.offsetTop <= mid) idx = i; });
    chapLinks.forEach(function (a, i) { a.classList.toggle("active", i === idx); });
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(function () { onScroll(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     4. Smooth nav (use Lenis when present)
     --------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var id = a.getAttribute("href"); if (id.length < 2) return;
      var t = document.querySelector(id); if (!t) return;
      ev.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.2 });
      else t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });

  /* ---------------------------------------------------------
     5. Dew cursor glow (follows pointer)
     --------------------------------------------------------- */
  var dew = document.querySelector(".dewcursor");
  if (dew && !reduce && window.matchMedia("(hover: hover)").matches) {
    var dx = window.innerWidth / 2, dy = window.innerHeight / 2, cx = dx, cy = dy, shown = false;
    window.addEventListener("pointermove", function (e) {
      dx = e.clientX; dy = e.clientY;
      if (!shown) { dew.classList.add("on"); shown = true; }
    }, { passive: true });
    (function loop() {
      cx += (dx - cx) * 0.12; cy += (dy - cy) * 0.12;
      dew.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------------------------------------------------
     6. Lightweight 3D tilt on .tilt cards
     --------------------------------------------------------- */
  if (!reduce && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(800px) rotateY(" + (px * 6).toFixed(2) + "deg) rotateX(" + (-py * 6).toFixed(2) + "deg) translateY(-6px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------------------------------------------------------
     7. Video graceful (when source missing)
     --------------------------------------------------------- */
  var vph = document.querySelector(".video-ph");
  if (vph) {
    var v = document.querySelector(".video-frame video");
    var src = v && v.getAttribute("src");
    var ready = false;
    function markSoon() {
      vph.classList.add("soon");
      var cap = vph.querySelector(".pcap");
      if (cap) cap.textContent = "前導影片 · 即將上線";
    }
    if (!src) { markSoon(); }
    else {
      fetch(src, { method: "HEAD" }).then(function (r) { if (r && r.ok) ready = true; else markSoon(); })
        .catch(function () { markSoon(); });
      v.addEventListener("error", markSoon);
    }
    vph.addEventListener("click", function () {
      if (!ready || vph.classList.contains("soon")) return;
      vph.style.display = "none"; v.play().catch(function () {});
    });
  }

  /* ---------------------------------------------------------
     8. Particle canvas — drifting warm light motes + dew
     --------------------------------------------------------- */
  if (!reduce) {
    var c = document.getElementById("fx");
    if (c) {
      var ctx = c.getContext("2d"), W, H, dpr = Math.min(window.devicePixelRatio || 1, 2), parts = [];
      function resize() { W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr; c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px"; }
      resize(); window.addEventListener("resize", resize, { passive: true });
      var N = Math.min(58, Math.round(innerWidth / 24));
      var cols = ["255,225,160", "255,238,200", "245,216,161", "180,216,225"];
      for (var i = 0; i < N; i++) {
        parts.push({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 2.4 + 0.8) * dpr,
          vx: (Math.random() - 0.5) * 0.18 * dpr, vy: (-Math.random() * 0.25 - 0.05) * dpr,
          a: Math.random() * 0.5 + 0.15, tw: Math.random() * Math.PI * 2, tws: Math.random() * 0.02 + 0.006,
          col: cols[(Math.random() * cols.length) | 0] });
      }
      (function draw() {
        ctx.clearRect(0, 0, W, H);
        for (var k = 0; k < parts.length; k++) {
          var p = parts[k];
          p.x += p.vx; p.y += p.vy; p.tw += p.tws;
          if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
          if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
          var al = p.a * (0.55 + 0.45 * Math.sin(p.tw));
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
          g.addColorStop(0, "rgba(" + p.col + "," + al + ")");
          g.addColorStop(1, "rgba(" + p.col + ",0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2); ctx.fill();
        }
        requestAnimationFrame(draw);
      })();
    }
  }
})();
