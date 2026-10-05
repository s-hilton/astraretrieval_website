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

  // Follow our progress: subscribe to updates (Buttondown), with an email fallback until it's configured
  var followForm = document.getElementById("follow-form");
  if (followForm) {
    var followEmail = document.getElementById("follow-email");
    var followTag = document.getElementById("follow-tag");
    var followStatus = document.getElementById("follow-status");
    var followBtn = followForm.querySelector("button[type=submit]");
    var CONTACT = "Stephen.Hilton@astraretrieval.com";

    followTag.addEventListener("change", function () { followTag.classList.toggle("chosen", !!followTag.value); });
    followEmail.addEventListener("input", function () { followEmail.classList.remove("invalid"); });

    function say(msg, isErr) {
      followStatus.textContent = msg;
      followStatus.classList.toggle("err", !!isErr);
    }

    followForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = followEmail.value.trim();
      if (!email || !followEmail.checkValidity()) {
        followEmail.classList.add("invalid");
        say("Please enter a valid email address.", true);
        followEmail.focus();
        return;
      }
      var role = followTag.value ? followTag.options[followTag.selectedIndex].text : "";

      // Not hooked up to a newsletter service yet: ask to be added by email instead
      if (followForm.action.indexOf("YOUR-BUTTONDOWN-USERNAME") !== -1) {
        var body = "Please add " + email + " to Astra Retrieval's progress updates." + (role ? "\n\nFollowing as: " + role : "");
        window.location.href = "mailto:" + CONTACT + "?subject=" + encodeURIComponent("Follow Astra Retrieval's progress") + "&body=" + encodeURIComponent(body);
        say("Opening your email app to finish signing up…");
        return;
      }

      followBtn.disabled = true;
      say("Signing you up…");
      fetch(followForm.action, { method: "POST", mode: "no-cors", body: new URLSearchParams(new FormData(followForm)) })   // same encoding as a normal form post
        .then(function () {
          say("Thanks! Check your inbox to confirm your subscription.");
          followForm.reset();
          followTag.classList.remove("chosen");
        })
        .catch(function () {
          // Network/blocked request: fall back to a normal form post in a new tab
          followForm.setAttribute("target", "_blank");
          followForm.submit();
          say("Finish signing up in the new tab.");
        })
        .then(function () { followBtn.disabled = false; });
    });
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
