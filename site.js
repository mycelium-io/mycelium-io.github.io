/* ── mycelium · site ──
 *
 * One scroll loop drives everything scroll-linked: the glass scene (merge /
 * dusk / opacity), the converge beats, and the horizontal "how" rail. The
 * rest is small: reveals, counters, the product tour, the install block.
 */
(function () {
  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  // ── SCROLL SCENES ─────────────────────────────────────────────────────
  var nav = $('#nav');
  var converge = $('#converge');
  var beats = $$('.beat');
  var hud = $('.hud');
  var beatBar = $('.beat-progress span');
  var cta = $('#install');
  var how = $('#how');
  var rail = $('#how-rail');
  var howIdx = $('#how-idx');
  var cards = $$('.card', rail);
  var railOn = false;
  var lastBeat = -1;

  function sizeRail() {
    railOn = !reduced && window.innerWidth >= 860;
    how.classList.toggle('is-pinned', railOn);
    if (!railOn) { how.style.height = ''; rail.style.transform = ''; return; }
    var travel = rail.scrollWidth - window.innerWidth;
    how.style.height = (window.innerHeight + Math.max(travel, 0)) + 'px';
  }

  function glass(s) {
    if (window.Glass) window.Glass.set(s);
    if (s.alpha != null) root.style.setProperty('--glass-alpha', s.alpha);
    if (s.dusk != null) root.style.setProperty('--dusk', s.dusk);
  }

  // ── THE GLASS'S PATH ──────────────────────────────────────────────────
  // The scene travels the whole page. Each stop is a scroll position and the
  // scene's state there; between stops it's interpolated. Stops are measured
  // from the live layout, so they hold at any size, and narrow screens get
  // their own route (no margins to sit in, so the glass keeps to open space).
  var stops = [];
  function docTop(el) { return el.getBoundingClientRect().top + window.scrollY; }
  // The scroll position at which `el` sits centred in the viewport.
  function centred(el) { return docTop(el) + el.offsetHeight / 2 - window.innerHeight / 2; }

  function buildStops() {
    var vh = window.innerHeight, vw = window.innerWidth, aspect = vw / vh;
    var narrow = aspect <= 1.05;
    // Mirrors glass.js: the scene's base scale for this viewport.
    var base = narrow ? clamp(aspect * 0.9, 0.4, 0.5) : (aspect < 1.4 ? 0.56 : 0.66);
    var toWorld = 3.75 / vh;   // world units per CSS pixel on the scene's plane
    // Free-floating placements sit 4rem lower than their layout maths puts
    // them, clear of the nav. (The product ring and trust drop are centred
    // on page elements, so they don't take it.)
    var LOWER = 64 / vh;
    var HERO = {
      merge: 0, dusk: 0, alpha: 1, scale: 1, veins: 0.2, halo: 0, logo: 0,
      x: narrow ? 0.5 : 0.77,
      y: (narrow ? 0.5 - (1.625 - 1.56 * base) / 3.75 : 0.45) + LOWER,
    };
    function at(o) { var r = {}, k; for (k in HERO) r[k] = HERO[k]; for (k in o) r[k] = o[k]; return r; }
    var DROP = { merge: 1, dusk: 1, veins: 1 };
    function drop(o) { var r = at(DROP), k; for (k in o) r[k] = o[k]; return r; }

    var ct = docTop(converge), ch = converge.offsetHeight - vh;
    var proof = $('#proof'), win = $('.window'), reads = $('.readouts');
    var inter = $('#interlude'), fit = $('#fit'), yours = $('#yours');
    var it = docTop(inter), ih = inter.offsetHeight - vh;

    var list = [
      [0, at({})],
      [ct + ch * 0.06, at({})],
      // Mid-negotiation: the aligner's halo is up and the peers are drawing in.
      [ct + ch * 0.45, at({ merge: 0.42, dusk: 0.35, halo: 1, veins: 0.5 })],
      [ct + ch * 0.8, at({ merge: 1, dusk: 0.88, veins: 0.95 })],
      [ct + ch, at(DROP)],
    ];

    // Product: the peers ring the app window, peeking out around its edges.
    var ringScale = (0.5 * win.offsetWidth * toWorld) / (1.3 * base);
    function product(alpha) { return drop({ merge: 0, veins: 0.6, x: 0.5, y: 0.5, scale: ringScale, alpha: alpha }); }

    if (!narrow) {
      // Results: beside the heading, then behind the stat cards as they rise.
      list.push([docTop(proof) + vh * 0.12, drop({ x: 0.8, y: 0.34 + LOWER, scale: 0.85 })]);
      list.push([docTop(how) - vh * 0.25, drop({ x: 0.8, y: 0.34 + LOWER, scale: 0.85 })]);
    } else {
      list.push([docTop(proof) + vh * 0.12, drop({ alpha: 0, y: 0.12 + LOWER, scale: 0.8 })]);
    }
    // The plates carry "how it works"; the scene steps aside, then waits by
    // the product window while unseen.
    list.push([docTop(how) + vh * 0.1, drop({ alpha: 0, x: 0.8, y: 0.34 + LOWER, scale: 0.85 })]);
    // Faded in late, once the window covers the middle, so the ring never
    // sits under the section's heading.
    list.push([centred(win) - vh * 0.4, product(0)]);
    list.push([centred(win) - vh * 0.05, product(1)]);
    list.push([centred(win) + vh * 0.2, product(1)]);

    // On phones the split-back ring is large, so it sits lower still.
    var inPos = narrow ? { x: 0.5, y: 0.31 + LOWER, scale: 1.25 } : { x: 0.72, y: 0.47 + LOWER, scale: 1.15 };
    if (!narrow) {
      // Trust: one drop, glowing around the edges of the two readouts.
      var rr = reads.getBoundingClientRect();
      var trustScale = (0.62 * rr.width * toWorld) / (1.26 * base);
      list.push([centred(reads), drop({ x: (rr.left + rr.width / 2) / vw, y: 0.5, scale: trustScale })]);
    } else {
      list.push([centred(reads) - vh * 0.2, drop({ alpha: 0, x: inPos.x, y: inPos.y, scale: inPos.scale })]);
    }

    // Interlude: pinned, and the drop splits back into its agents.
    list.push([it + ih * 0.12, drop(inPos)]);
    list.push([it + ih * 0.85, drop({ merge: 0, veins: 0.85, x: inPos.x, y: inPos.y, scale: inPos.scale })]);

    if (!narrow) {
      // Fit: the peers, beside "Built for peers".
      list.push([docTop(fit) + vh * 0.05, drop({ merge: 0, veins: 0.8, x: 0.8, y: 0.3 + LOWER, scale: 0.75 })]);
      list.push([docTop(yours) - vh * 0.1, drop({ merge: 0, veins: 0.8, x: 0.8, y: 0.3 + LOWER, scale: 0.75 })]);
    } else {
      list.push([it + ih + vh * 0.4, drop({ merge: 0, veins: 0.85, alpha: 0, x: inPos.x, y: inPos.y, scale: inPos.scale })]);
    }
    list.push([docTop(yours) + vh * 0.25, drop({ merge: 0.6, alpha: 0, x: HERO.x, y: HERO.y })]);

    // Dawn: the field comes back up behind the last call, the drop whole and
    // the mark suspended in it. Its veins step back so the mark reads.
    list.push([docTop(cta) - vh * 1.0, drop({ alpha: 0, veins: 0.15, logo: 1, x: HERO.x, y: HERO.y })]);
    list.push([docTop(cta) - vh * 0.2, at({ merge: 1, veins: 0.1, logo: 1 })]);

    stops = list.sort(function (a, b) { return a[0] - b[0]; });
  }

  function sceneAt(y) {
    if (!stops.length) return null;
    if (y <= stops[0][0]) return stops[0][1];
    for (var i = 0; i < stops.length - 1; i++) {
      var a = stops[i], b = stops[i + 1];
      if (y < b[0]) {
        var f = ease((y - a[0]) / Math.max(b[0] - a[0], 1)), out = {};
        for (var k in a[1]) out[k] = a[1][k] + (b[1][k] - a[1][k]) * f;
        return out;
      }
    }
    return stops[stops.length - 1][1];
  }

  var lastY = window.scrollY, lastT = performance.now();

  function onScroll() {
    var vh = window.innerHeight;
    nav.classList.toggle('is-scrolled', window.scrollY > 24);

    var now = performance.now();
    var vel = (window.scrollY - lastY) / Math.max(now - lastT, 1) * 1000;
    lastY = window.scrollY; lastT = now;

    // Converge: 0 at the top of the pin, 1 when it releases.
    var cr = converge.getBoundingClientRect();
    var p = clamp(-cr.top / (cr.height - vh), 0, 1);
    var beat = p < 0.34 ? 0 : p < 0.68 ? 1 : 2;
    if (beat !== lastBeat) {
      beats.forEach(function (b, i) { b.classList.toggle('is-active', i === beat); });
      if (hud) hud.setAttribute('data-stage', beat);
      lastBeat = beat;
    }
    if (beatBar) beatBar.style.transform = 'scaleX(' + p + ')';

    var scene = sceneAt(window.scrollY);
    if (scene) { scene.vel = vel; glass(scene); }

    // How: pin, then slide the rail sideways by the scrolled distance.
    if (railOn) {
      var hr = how.getBoundingClientRect();
      var travel = rail.scrollWidth - window.innerWidth;
      var hp = clamp(-hr.top / Math.max(hr.height - vh, 1), 0, 1);
      rail.style.transform = 'translate3d(' + (-hp * travel) + 'px,0,0)';
      var mid = window.innerWidth / 2, best = 0, bestD = 1e9;
      cards.forEach(function (c, i) {
        var r = c.getBoundingClientRect();
        var d = Math.abs(r.left + r.width / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
        // Plates drift against the rail a little, so they read as depth.
        var off = (r.left + r.width / 2 - mid) / window.innerWidth;
        var img = c.querySelector('img');
        if (img) img.style.transform = 'translate3d(' + (off * -60) + 'px,0,0) scale(1.12)';
      });
      if (howIdx) howIdx.textContent = '0' + (best + 1);
      cards.forEach(function (c, i) { c.classList.toggle('is-current', i === best); });
    }
  }

  var ticking = false;
  function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScroll(); });
  }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', function () { sizeRail(); buildStops(); requestTick(); });
  // Scroll velocity decays to zero once the page stops, so the wobble settles.
  setInterval(function () { if (performance.now() - lastT > 120) glass({ vel: 0 }); }, 150);

  // ── CARD TILT ─────────────────────────────────────────────────────────
  // The "how" cards are panes of glass that lean slightly toward the
  // pointer; their rim and reflection turn with the tilt (see .card in
  // site.css). Mouse and trackpad only: touch and reduced-motion readers
  // get the cards still.
  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    cards.forEach(function (card) {
      var raf = 0, px = 0, py = 0;
      function apply() {
        raf = 0;
        var r = card.getBoundingClientRect();
        var fx = clamp((px - r.left) / r.width, 0, 1), fy = clamp((py - r.top) / r.height, 0, 1);
        card.style.setProperty('--tx', ((fx - 0.5) * 2).toFixed(3));
        card.style.setProperty('--ty', ((fy - 0.5) * 2).toFixed(3));
        card.style.setProperty('--glare', '1');
      }
      card.addEventListener('pointermove', function (e) {
        px = e.clientX; py = e.clientY;
        card.classList.add('is-tilting');
        if (!raf) raf = requestAnimationFrame(apply);
      });
      card.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        card.classList.remove('is-tilting');
        card.style.setProperty('--tx', '0');
        card.style.setProperty('--ty', '0');
        card.style.setProperty('--glare', '0');
      });
    });
  }

  // Clicking "Watch them converge" should land at the start of the story.
  // (Anchor + sticky already does that; nothing to add.)

  // ── REVEALS & COUNTERS ────────────────────────────────────────────────
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    if (reduced || to === 0) { el.textContent = to.toFixed(dec); return; }
    var t0 = performance.now(), dur = 1400;
    (function step(now) {
      var k = clamp((now - t0) / dur, 0, 1);
      k = 1 - Math.pow(1 - k, 3);
      el.textContent = (to * k).toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('[data-count]', e.target).forEach(countUp);
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }) : null;
  $$('.reveal').forEach(function (el, i) {
    // Siblings stagger; a new group restarts the clock.
    var sibs = $$('.reveal', el.parentElement);
    el.style.setProperty('--d', (sibs.indexOf(el) * 90) + 'ms');
    if (io && !reduced) io.observe(el);
    else { el.classList.add('in'); }
  });
  if (!io || reduced) $$('[data-count]').forEach(function (el) { el.textContent = parseFloat(el.getAttribute('data-count')).toFixed(parseInt(el.getAttribute('data-dec') || '0', 10)); });

  // ── CLICK SOUND ──
  // A 4ms decaying noise impulse through a resonant bandpass: a small, dry
  // "tick" on the install tabs and copy button. Skipped for reduced motion.
  var actx, afilter, again, abuf;
  function tick() {
    if (reduced) return;
    try {
      if (!actx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
        afilter = actx.createBiquadFilter(); afilter.type = 'bandpass'; afilter.Q.value = 8;
        again = actx.createGain();
        afilter.connect(again); again.connect(actx.destination);
        abuf = actx.createBuffer(1, Math.round(0.004 * actx.sampleRate), actx.sampleRate);
        var d = abuf.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = (2 * Math.random() - 1) * Math.exp(-i / 25);
      }
      if (actx.state === 'suspended') actx.resume();
      again.gain.value = 0.42;
      afilter.frequency.value = 3800 * (1 + (Math.random() - 0.5) * 0.3);
      var src = actx.createBufferSource();
      src.buffer = abuf; src.connect(afilter); src.start();
    } catch (e) {}
  }

  // ── INSTALL ───────────────────────────────────────────────────────────
  // Both install blocks share one tab, so a pick up top holds at the bottom.
  var CMDS = {
    prompt: 'Use curl to read https://mycelium-io.github.io/mycelium/agents.md and perform the setup to install Mycelium',
    curl: 'curl -fsSL https://mycelium-io.github.io/mycelium/install.sh | bash',
    brew: 'brew install mycelium-io/tap/mycelium',
  };
  function setTab(tab) {
    $$('[data-install-code]').forEach(function (c) { c.textContent = CMDS[tab]; });
    $$('.install-tab').forEach(function (t) {
      var on = t.getAttribute('data-tab') === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }
  $$('.install-tab').forEach(function (t) {
    t.addEventListener('mousedown', tick);
    t.addEventListener('click', function () { setTab(t.getAttribute('data-tab')); });
  });
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('mousedown', tick);
    btn.addEventListener('click', function () {
      var code = btn.parentElement.querySelector('code');
      if (!code || !navigator.clipboard) return;
      navigator.clipboard.writeText(code.textContent).then(function () {
        btn.classList.add('is-copied');
        setTimeout(function () { btn.classList.remove('is-copied'); }, 1800);
      });
    });
  });

  // ── VERSION ───────────────────────────────────────────────────────────
  // release.json is kept current by .github/workflows/release-info.yml, so
  // the page never calls GitHub's API itself (its per-IP limit is shared by
  // a whole office network). The Mac buttons link to releases/latest; their
  // version is only shown when that release carries the .dmg, so the label
  // never names a version the button can't deliver.
  fetch('release.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.tag) return;
      $('#version-link').textContent = 'Releases · ' + d.tag;
      if (!d.dmg) return;
      $$('.mac-dl').forEach(function (btn) {
        var v = document.createElement('span');
        v.textContent = d.tag;
        v.style.opacity = '0.6';
        btn.appendChild(v);
        btn.setAttribute('aria-label', 'Download Mycelium ' + d.tag + ' for Mac');
      });
    })
    .catch(function () {});

  // ── PRODUCT TOUR ──────────────────────────────────────────────────────
  // Auto-advances with a progress fill on the active tab; any click takes
  // over for good. Pauses on hover and while off-screen.
  (function () {
    var tour = $('#tour');
    if (!tour) return;
    var tabs = $$('.tour-tab', tour), shots = $$('.shot', tour), cap = $('#tour-caption');
    var idx = 0, auto = !reduced, DUR = 6500, t0 = 0, paused = true, acc = 0;

    function show(i) {
      idx = (i + shots.length) % shots.length;
      shots.forEach(function (s, j) {
        s.classList.toggle('is-active', j === idx);
        s.setAttribute('aria-hidden', j === idx ? 'false' : 'true');
      });
      tabs.forEach(function (t, j) {
        t.classList.toggle('is-active', j === idx);
        t.setAttribute('aria-selected', j === idx ? 'true' : 'false');
        // Roving tabindex: Tab lands on the selected view; arrows move between.
        t.tabIndex = j === idx ? 0 : -1;
        t.style.setProperty('--p', 0);
      });
      if (cap) cap.textContent = shots[idx].getAttribute('data-caption');
      acc = 0;
    }
    function choose(i, focus) {
      auto = false;
      show(i);
      tabs[idx].style.setProperty('--p', 1);
      if (focus) tabs[idx].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { choose(i); });
      t.addEventListener('keydown', function (e) {
        var to = { ArrowRight: idx + 1, ArrowLeft: idx - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to == null) return;
        e.preventDefault();
        choose(to, true);
      });
    });
    tour.addEventListener('mouseenter', function () { paused = true; });
    tour.addEventListener('mouseleave', function () { paused = false; });
    // Moving content must be stoppable: keyboard or screen-reader focus ends autoplay.
    tour.addEventListener('focusin', function () { if (auto) choose(idx); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { paused = !es[0].isIntersecting; }, { threshold: 0.35 }).observe(tour);
    }
    var last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      var dt = now - last; last = now;
      if (!auto || paused) return;
      acc += dt;
      tabs[idx].style.setProperty('--p', clamp(acc / DUR, 0, 1));
      if (acc >= DUR) show(idx + 1);
    })(last);
    if (!auto) tabs[0].style.setProperty('--p', 1);

    // Lightbox: the 2x frame, full-size.
    var box = $('#lightbox'), boxImg = $('img', box);
    shots.forEach(function (s) {
      var img = $('img', s);
      img.addEventListener('click', function () {
        var hi = (img.getAttribute('srcset') || '').split(',').map(function (x) { return x.trim(); })
          .filter(function (x) { return /2x$/.test(x); })[0];
        boxImg.src = hi ? hi.split(' ')[0] : img.src;
        boxImg.alt = img.alt;
        box.classList.add('is-open');
        box.setAttribute('aria-hidden', 'false');
      });
    });
    function close() { box.classList.remove('is-open'); box.setAttribute('aria-hidden', 'true'); }
    box.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();

  // ── BOOT ──────────────────────────────────────────────────────────────
  sizeRail();
  buildStops();
  onScroll();
  // Images and fonts shift the layout once loaded; re-measure the route.
  window.addEventListener('load', function () { sizeRail(); buildStops(); onScroll(); root.classList.add('is-loaded'); });
  requestAnimationFrame(function () { root.classList.add('is-ready'); });
})();
