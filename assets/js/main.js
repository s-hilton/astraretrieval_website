(function () {
  var views = [].slice.call(document.querySelectorAll("[data-view]"));
  var navLinks = [].slice.call(document.querySelectorAll(".nav a"));
  var nav = document.getElementById("nav"), menuBtn = document.getElementById("menu-btn");
  function route() {
    var id = (location.hash || "#home").slice(1);
    var view = document.querySelector('[data-view="' + id.replace(/[^\w-]/g, "") + '"]');
    var target = view ? null : document.getElementById(id);
    if (!view && target) view = target.closest("[data-view]");
    if (!view) { view = views[0]; target = null; }
    views.forEach(function (v) { v.hidden = v !== view; });
    navLinks.forEach(function (a) { if (a.getAttribute("href") === "#" + view.dataset.view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false");
    if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
  menuBtn.addEventListener("click", function () { var o = nav.classList.toggle("open"); menuBtn.setAttribute("aria-expanded", String(o)); });
  var copy = document.getElementById("copy"), out = document.getElementById("copied"), addr = document.getElementById("addr");
  copy.addEventListener("click", function () {
    function fallback() { var r = document.createRange(); r.selectNodeContents(addr); var s = getSelection(); s.removeAllRanges(); s.addRange(r); out.textContent = "Selected. Press Ctrl+C (or ⌘C) to copy."; }
    try { navigator.clipboard.writeText(addr.textContent).then(function () { out.textContent = "Copied to clipboard."; }, fallback); } catch (e) { fallback(); }
  });
})();


/* ---------------- appear: fire once when an element is actually on the visitor's screen ----------------
   IntersectionObserver measures against the real screen even when this page sits inside a tall frame,
   so nothing plays early. A scroll check covers browsers without it. Hidden pages never fire until shown. */
(function () {
  var fallback = [];
  function rectVisible(el, frac) {
    var r = el.getBoundingClientRect(), h = innerHeight || document.documentElement.clientHeight;
    return (r.width || r.height) && r.bottom > 0 && r.top < h * (1 - frac);
  }
  function sweep() { for (var i = fallback.length - 1; i >= 0; i--) if (rectVisible(fallback[i].el, fallback[i].frac)) fallback.splice(i, 1)[0].go(); }
  if (!("IntersectionObserver" in window)) { addEventListener("scroll", sweep, { passive: true }); addEventListener("resize", sweep); addEventListener("hashchange", function () { requestAnimationFrame(sweep); }); }
  window.__appear = function (el, cb, frac) {
    frac = frac == null ? 0.12 : frac;           // how far into the screen it must come before playing
    var done = false;
    function go() { if (!done) { done = true; cb(el); } }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); go(); } });
      }, { rootMargin: "0px 0px -" + Math.round(frac * 100) + "% 0px", threshold: 0 });
      io.observe(el);
    } else { fallback.push({ el: el, frac: frac, go: go }); requestAnimationFrame(sweep); }
  };
})();
/* ---------------- motion (ported from the live site) ---------------- */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var appear = window.__appear;
  function settle(el, cls) { el.classList.add(cls, "no-anim"); void el.offsetWidth; el.classList.remove("no-anim"); }

  // 1. sections fade in as they appear on screen
  document.querySelectorAll(".sec-head, .card, .stat, .product > *, .banner, .lanes").forEach(function (el) {
    if (el.closest(".hero")) return;
    settle(el, "reveal");
    appear(el, function () { el.classList.add("in"); }, 0.08);
  });

  // 2. statistics count up
  document.querySelectorAll(".count[data-to]").forEach(function (el) {
    if (el.closest(".supply")) return;   // supply bars count in step with their own bar
    var to = +el.dataset.to, dec = +(el.dataset.dec || 0);
    function fmt(n) { return dec ? n.toFixed(dec) : Math.round(n).toLocaleString("en-US"); }
    el.textContent = fmt(0);
    appear(el, function () {
      var t0 = null;
      (function tick(now) {
        if (t0 === null) t0 = now;
        var k = Math.min(1, (now - t0) / 1600);
        el.textContent = fmt(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      })(performance.now());
    }, 0.1);
  });

  // 3. roadmap: route draws, progress fills, marker pops
  document.querySelectorAll(".track").forEach(function (tr) {
    settle(tr, "ready");
    appear(tr, function () { tr.classList.add("play"); }, 0.15);
  });

  // 4. mission icons draw themselves in sequence
  document.querySelectorAll(".steps").forEach(function (st) {
    settle(st, "ready");
    appear(st, function () {
      st.querySelectorAll(".ico :not(use)").forEach(function (sh) {
        var len = 100; try { len = Math.ceil(sh.getTotalLength()) + 1; } catch (e) {}
        sh.style.setProperty("--len", len + "px");
      });
      void st.offsetWidth;
      requestAnimationFrame(function () { st.classList.add("play"); });
    }, 0.12);
  });

  // 5. asteroid-type cards tilt toward the cursor
  if (fine) document.querySelectorAll(".type").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.classList.remove("tilt-reset"); card.classList.add("tilting");
      card.style.transform = "perspective(900px) rotateX(" + ((.5 - y) * 7).toFixed(2) + "deg) rotateY(" + ((x - .5) * 7).toFixed(2) + "deg)";
      card.style.setProperty("--gx", (x * 100).toFixed(1) + "%"); card.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
    });
    card.addEventListener("mouseleave", function () { card.classList.remove("tilting"); card.classList.add("tilt-reset"); card.style.transform = ""; });
  });

  // 6. hero photo: slower-than-page scroll plus a gentle lean away from the cursor
  var hero = document.querySelector(".hero"), photo = document.querySelector(".hero-photo");
  if (hero && photo) {
    var mx = 0, my = 0, tx = 0, ty = 0, running = false;
    function frame() {
      mx += (tx - mx) * .06; my += (ty - my) * .06;
      var r = hero.getBoundingClientRect(), y = Math.max(0, -r.top) * .35;
      photo.style.transform = "translate3d(" + mx.toFixed(2) + "px," + (y + my).toFixed(2) + "px,0)";
      running = r.height > 0 && r.bottom > 0 && (Math.abs(tx - mx) > .1 || Math.abs(ty - my) > .1);
      if (running) requestAnimationFrame(frame);
    }
    function wake() { if (!running) { running = true; requestAnimationFrame(frame); } }
    window.addEventListener("scroll", wake, { passive: true });
    if (fine) {
      hero.addEventListener("mousemove", function (e) { tx = (e.clientX / innerWidth - .5) * -28; ty = (e.clientY / innerHeight - .5) * -20; wake(); });
      hero.addEventListener("mouseleave", function () { tx = 0; ty = 0; wake(); });
    }
  }
})();

/* ---------------- platform diagram: connectors drawn from the real card positions ---------------- */
(function () {
  var stack = document.querySelector(".stack");
  if (!stack) return;
  var flow = stack.querySelector(".flow"), svg = flow.querySelector("svg");
  var rails = [].slice.call(svg.querySelectorAll(".rails path")), draws = [].slice.call(svg.querySelectorAll(".draw path"));
  var hub = svg.querySelector(".hub");
  var layers = [].slice.call(stack.querySelectorAll(".layer")), outs = [].slice.call(stack.querySelectorAll(".out"));
  layers.forEach(function (el, i) { el.style.setProperty("--k", i); });
  outs.forEach(function (el, i) { el.style.setProperty("--k", i); });

  function layout() {
    var f = flow.getBoundingClientRect();
    if (!f.width) return;                       // page hidden
    var W = f.width, H = f.height, d = [];
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var vertical = getComputedStyle(stack).gridTemplateColumns.split(" ").length < 3;
    if (vertical) {                             // phones: one line down through the hub, splitting to the deliverables
      var cx = W / 2, hy = H / 2;
      d = ["M" + cx + " 0 V" + hy, "M" + (cx - 0.01) + " 0 V" + hy, "M" + (cx + 0.01) + " 0 V" + hy,
           "M" + cx + " " + hy + " V" + H, "M" + (cx + 0.01) + " " + hy + " V" + H];
      hub.setAttribute("cx", cx); hub.setAttribute("cy", hy);
    } else {
      var hx = W * 0.5, hy2 = H / 2, g = parseFloat(getComputedStyle(stack).columnGap) || 0;   // reach the card edges across the grid gap
      layers.forEach(function (el) { var r = el.getBoundingClientRect(), y = r.top + r.height / 2 - f.top;
        d.push("M" + (-g) + " " + y.toFixed(1) + " C" + (hx * .7).toFixed(1) + " " + y.toFixed(1) + " " + (hx * .45).toFixed(1) + " " + hy2 + " " + hx + " " + hy2); });
      outs.forEach(function (el) { var r = el.getBoundingClientRect(), y = r.top + r.height / 2 - f.top;
        d.push("M" + hx + " " + hy2 + " C" + (hx + (W - hx) * .55).toFixed(1) + " " + hy2 + " " + (hx + (W - hx) * .3).toFixed(1) + " " + y.toFixed(1) + " " + (W + g) + " " + y.toFixed(1)); });
      hub.setAttribute("cx", hx); hub.setAttribute("cy", hy2);
    }
    d.forEach(function (p, i) {
      rails[i].setAttribute("d", p); draws[i].setAttribute("d", p);
      var L = Math.ceil(draws[i].getTotalLength()) + 2; draws[i].style.setProperty("--l", L + "px");
    });
  }
  // hovering a product lights its connector
  layers.forEach(function (el, i) {
    el.addEventListener("mouseenter", function () { rails[i].classList.add("hot"); });
    el.addEventListener("mouseleave", function () { rails[i].classList.remove("hot"); });
  });
  window.addEventListener("resize", layout);
  window.addEventListener("load", layout);
  window.addEventListener("hashchange", function () { requestAnimationFrame(layout); });
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  stack.classList.add("ready");
  window.__appear(stack, function () { layout(); stack.classList.add("play"); }, 0.15);
})();

/* supply bars on the Mission page */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var card = document.querySelector(".supply");
  if (!card) return;
  card.classList.add("ready");
  var nums = [].slice.call(card.querySelectorAll(".count"));
  nums.forEach(function (el) { el.textContent = "0"; });
  function countUp(el, delay) {
    var to = +el.dataset.to, t0 = null;
    setTimeout(function () {
      (function tick(now) { if (t0 === null) t0 = now; var k = Math.min(1, (now - t0) / 1300); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); })(performance.now());
    }, delay);
  }
  function play() {
    card.classList.add("play");
    nums.forEach(function (el, i) { countUp(el, 200 + i * 350); });   // same timing as each bar's fill
  }
  // wait until the card is mostly on screen and the visitor has paused on it, so the bars fill while being watched
  var played = false, timer = null;
  function arm(on) {
    if (played) return;
    if (on && !timer) timer = setTimeout(function () { played = true; if (io) io.disconnect(); play(); }, 450);
    if (!on && timer) { clearTimeout(timer); timer = null; }
  }
  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (es) {
      // the whole card is on screen (ratio only: rootMargin is ignored inside a cross-origin frame)
      es.forEach(function (e) { arm(e.isIntersecting && e.intersectionRatio >= 0.98); });
    }, { threshold: [0, .5, .9, .98, 1] });
    io.observe(card);
  } else {
    window.__appear(card, play, 0.35);
  }
})();
