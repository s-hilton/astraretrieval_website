(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Solid header once the page scrolls
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  function setMenu(open) {
    links.classList.toggle("open", open);
    header.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () { setMenu(!links.classList.contains("open")); });
  links.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // Fade sections in as they scroll into view
  var targets = document.querySelectorAll(".section-head, .panel, .stat, .flow, .contact-inner > *");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -60px 0px" });
    targets.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }

  // Roadmap progress line: route draws, progress fills to "We are here", marker pops (once, on first view)
  var roadmap = document.querySelector(".rm");
  if (roadmap && "IntersectionObserver" in window && !reduceMotion) {
    // Jump straight to the hidden start state (no transition), so nothing lingers if the visitor arrives fast
    roadmap.classList.add("rm-ready", "rm-init");
    void roadmap.offsetWidth;
    roadmap.classList.remove("rm-init");
    var rmIO = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      roadmap.classList.add("play");
      rmIO.disconnect();
    }, { threshold: 0.35 });
    rmIO.observe(roadmap);
  }

  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Count-up statistics: numbers roll up from 0 the first time they scroll into view
  var counts = document.querySelectorAll(".count[data-to]");
  if (counts.length && "IntersectionObserver" in window && !reduceMotion) {
    var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        var el = entry.target, to = +el.dataset.to, start = null, dur = 1600;
        function tick(now) {
          if (start === null) start = now;
          var k = Math.min(1, (now - start) / dur);
          el.textContent = fmt(to * (1 - Math.pow(1 - k, 3)));   // ease-out
          if (k < 1) requestAnimationFrame(tick);
        }
        el.textContent = "0";
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { countIO.observe(el); });
  }

  // Tilt cards: asteroid-type cards lean toward the cursor (mouse/trackpad only)
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".type-card").forEach(function (card) {
      var max = 7;   // degrees
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.classList.remove("tilt-reset");
        card.classList.add("tilting");
        card.style.transform = "perspective(900px) rotateX(" + ((0.5 - y) * max).toFixed(2) + "deg) rotateY(" + ((x - 0.5) * max).toFixed(2) + "deg) translateZ(0)";
        card.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
      });
      card.addEventListener("mouseleave", function () {
        card.classList.remove("tilting");
        card.classList.add("tilt-reset");
        card.style.transform = "";
      });
    });
  }

  // Hero photo drift: slower-than-page scroll (parallax) plus a gentle lean toward the cursor
  var heroPhoto = document.querySelector(".hero-photo");
  var hero = document.querySelector(".hero");
  if (heroPhoto && hero && !reduceMotion) {
    var heroVisible = true, mx = 0, my = 0, tx = 0, ty = 0, running = false;
    function heroFrame() {
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      var y = Math.min(window.scrollY, hero.offsetHeight) * 0.35;
      heroPhoto.style.transform = "translate3d(" + mx.toFixed(2) + "px," + (y + my).toFixed(2) + "px,0)";
      var settling = Math.abs(tx - mx) > 0.1 || Math.abs(ty - my) > 0.1;
      running = heroVisible && (settling || window.scrollY < hero.offsetHeight);
      if (running) requestAnimationFrame(heroFrame);
    }
    function wake() { if (!running && heroVisible) { running = true; requestAnimationFrame(heroFrame); } }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; wake(); }).observe(hero);
    }
    window.addEventListener("scroll", wake, { passive: true });
    if (finePointer) {
      hero.addEventListener("mousemove", function (e) {
        tx = (e.clientX / window.innerWidth - 0.5) * -28;   // up to ±14px, opposite the cursor
        ty = (e.clientY / window.innerHeight - 0.5) * -20;  // up to ±10px
        wake();
      });
      hero.addEventListener("mouseleave", function () { tx = 0; ty = 0; wake(); });
    }
    wake();
  }

  // Copy email to clipboard
  var copyBtn = document.getElementById("copy-email");
  var status = document.getElementById("copy-status");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.dataset.email;
      function done(ok) {
        status.textContent = ok ? "Email copied to clipboard." : email;
        setTimeout(function () { status.textContent = ""; }, 3000);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  }
})();
