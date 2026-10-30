/* ── mycelium · site ──
 *
 * One scroll loop drives the glass scene (merge / dusk / opacity) along the
 * page. The rest is small: reveals, the install block, the release's version
 * and downloads.
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
  var cta = $('#install');
  var story = $('#how');
  var beats = $$('.beat', story);
  var beatBar = $('.beat-progress span', story);
  var agree = $('#agree');
  var lastBeat = 0;
  // The story pins only where it has room and motion is welcome; otherwise
  // its steps are a plain stack (see .story in site.css).
  function pinned() { return !reduced && window.innerWidth > 860; }

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

  function buildStops() {
    var vh = window.innerHeight, vw = window.innerWidth, aspect = vw / vh;
    var narrow = aspect <= 1.05;
    // Mirrors glass.js: the scene's base scale for this viewport.
    var base = narrow ? clamp(aspect * 0.9, 0.4, 0.5) : (aspect < 1.4 ? 0.56 : 0.66);
    // Free-floating placements sit 4rem lower than their layout maths puts
    // them, clear of the nav.
    var LOWER = 64 / vh;
    var HERO = {
      merge: 0, dusk: 0, alpha: 1, scale: 1, veins: 0.2, halo: 0, logo: 0,
      x: narrow ? 0.5 : 0.77,
      y: (narrow ? 0.5 - (1.625 - 1.56 * base) / 3.75 : 0.45) + LOWER,
    };
    function at(o) { var r = {}, k; for (k in HERO) r[k] = HERO[k]; for (k in o) r[k] = o[k]; return r; }
    var DROP = { merge: 1, dusk: 1, veins: 1 };
    function drop(o) { var r = at(DROP), k; for (k in o) r[k] = o[k]; return r; }

    var yours = $('#yours');
    var st = docTop(story), sh = Math.max(story.offsetHeight - vh, 1);
    var at_ = docTop(agree), ah = agree.offsetHeight;
    // Beside the "agree" heading: the agents, apart, then drawn into one.
    // Small and high, so it sits clear of the cards under the heading.
    var side = { x: 0.86, y: 0.18 + LOWER, scale: 0.4 };
    function peers(o) { var r = drop({ merge: 0, veins: 0.8, x: side.x, y: side.y, scale: side.scale }), k; for (k in o) r[k] = o[k]; return r; }

    var list = [[0, at({})]];
    if (pinned()) {
      // The story: the glass plays each step in the right half, which nothing
      // covers, while night falls. One stop at the middle of each step.
      var behind = { x: 0.76, y: 0.5 + LOWER / 2, scale: narrow ? 1 : 1.05 };
      function step(i, o) {
        var r = at({ x: behind.x, y: behind.y, scale: behind.scale }), k;
        for (k in o) r[k] = o[k];
        return [st + sh * (i + 0.5) / beats.length, r];
      }
      list.push([st, at({ x: behind.x, y: behind.y, scale: behind.scale })]);
      // 01 on your machine: each agent its own drop, apart.
      list.push(step(0, { merge: 0, veins: 0.15, dusk: 0.2 }));
      // 02 in a room: drawn together, the veins between them lit.
      list.push(step(1, { merge: 0.25, veins: 0.75, dusk: 0.5 }));
      // 03 a task: the halo up around them while they work it.
      list.push(step(2, { merge: 0.2, veins: 0.85, halo: 1, dusk: 0.8 }));
      // 04 they wake each other: the halo down; site.js wobbles the drops.
      list.push(step(3, { merge: 0.1, veins: 0.6, halo: 0.2, dusk: 1 }));
      // 05 what an agent sees: the drops still, close, the veins between them bright.
      list.push(step(4, { merge: 0.45, veins: 0.95, halo: 0, dusk: 1 }));
      // 06 what they learn stays: one drop, every vein lit.
      list.push(step(5, { merge: 1, veins: 1, halo: 0, dusk: 1 }));
      list.push([st + sh, drop({ alpha: 0, merge: 1, x: behind.x, y: behind.y, scale: behind.scale })]);
    } else {
      // Unpinned, the steps carry their own pictures: the scene steps aside.
      list.push([st - vh * 0.4, at({ dusk: 0.5 })]);
      list.push([st + vh * 0.2, drop({ alpha: 0, x: side.x, y: side.y, scale: side.scale })]);
    }

    if (!narrow) {
      // When they need to agree: the peers come back beside the heading, a
      // halo up while they work it out, and are one drop by the section's end.
      list.push([at_ - vh * 0.5, peers({ alpha: 0 })]);
      list.push([at_ - vh * 0.05, peers({ halo: 0.6 })]);
      // One drop by the time the second row of cards comes up, and gone
      // before it would sit over them.
      list.push([at_ + ah * 0.3, peers({ merge: 1, halo: 0, veins: 0.95 })]);
      list.push([at_ + ah * 0.45, peers({ merge: 1, alpha: 0 })]);
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

    // The story: 0 at the top of the pin, 1 when it releases; each step an
    // equal share of the way.
    if (pinned()) {
      var sr = story.getBoundingClientRect();
      var p = clamp(-sr.top / Math.max(sr.height - vh, 1), 0, 1);
      var beat = Math.min(beats.length - 1, Math.floor(p * beats.length));
      if (beat !== lastBeat) {
        beats.forEach(function (b, i) { b.classList.toggle('is-active', i === beat); });
        // Being asked: the drops start, as an agent does when it's woken.
        if (beat === 3) vel += 2400;
        lastBeat = beat;
      }
      if (beatBar) beatBar.style.transform = 'scaleX(' + p + ')';
    }

    var scene = sceneAt(window.scrollY);
    if (scene) { scene.vel = vel; glass(scene); }
  }

  var ticking = false;
  function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScroll(); });
  }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', function () { buildStops(); requestTick(); });
  // Scroll velocity decays to zero once the page stops, so the wobble settles.
  setInterval(function () { if (performance.now() - lastT > 120) glass({ vel: 0 }); }, 150);

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
    prompt: 'Use curl to read https://mycelium-io.github.io/mycelium/agents.md and follow its steps to install Mycelium',
    curl: 'curl -fsSL https://mycelium-io.github.io/mycelium/install.sh | bash',
    brew: 'brew tap mycelium-io/tap && brew trust mycelium-io/tap && brew install mycelium',
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

  // ── VERSION + DOWNLOADS ───────────────────────────────────────────────
  // release.json is kept current by .github/workflows/release-info.yml, so
  // the page never calls GitHub's API itself (its per-IP limit is shared by
  // a whole office network). It also says which builds of the app the latest
  // release carries. The download buttons are the Mac app's in the page, so
  // they work without script; a visitor on Windows or Linux gets their own
  // build instead, and a version, only when that release carries it, so a
  // button never points at a file that isn't there.
  var LATEST = 'https://github.com/mycelium-io/mycelium/releases/latest/download/';
  var APPS = {
    Mac: { asset: 'Mycelium-macos-arm64.dmg', has: 'dmg' },
    Windows: { asset: 'Mycelium-windows-x86_64-setup.exe', has: 'windows' },
    Linux: { asset: 'Mycelium-linux-x86_64.AppImage', has: 'appimage' }
  };
  // The system this browser runs on, if the app runs there: none on a phone,
  // a tablet (an iPad's Safari says Macintosh, but has a touch screen) or
  // ChromeOS.
  function platform() {
    var ua = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod|CrOS/.test(ua)) return null;
    if (/Windows NT/.test(ua)) return 'Windows';
    if (/Macintosh/.test(ua)) return navigator.maxTouchPoints > 1 ? null : 'Mac';
    if (/Linux|X11/.test(ua)) return 'Linux';
    return null;
  }
  fetch('release.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.tag) return;
      $('#version-link').textContent = 'Releases · ' + d.tag;
      var mine = platform();
      var app = mine && d[APPS[mine].has] ? mine : d.dmg ? 'Mac' : null;
      if (!app) return;
      $$('.app-dl').forEach(function (btn) {
        btn.href = LATEST + APPS[app].asset;
        $('[data-app-label]', btn).textContent = 'Download for ' + app;
        var v = document.createElement('span');
        v.textContent = d.tag;
        v.style.opacity = '0.6';
        btn.appendChild(v);
        btn.setAttribute('aria-label', 'Download Mycelium ' + d.tag + ' for ' + app);
      });
      // The other systems the release has a build for, beside the button.
      var others = Object.keys(APPS).filter(function (p) { return p !== app && d[APPS[p].has]; });
      var line = $('[data-app-platforms]');
      if (!line || !others.length) return;
      line.appendChild(document.createTextNode('Also for '));
      others.forEach(function (p, i) {
        if (i) line.appendChild(document.createTextNode(' · '));
        var a = document.createElement('a');
        a.href = LATEST + APPS[p].asset;
        a.textContent = p;
        line.appendChild(a);
      });
      if (others.some(function (p) { return p !== 'Mac'; })) {
        line.appendChild(document.createTextNode(' (Windows and Linux are in preview)'));
      }
      line.hidden = false;
    })
    .catch(function () {});

  // ── BOOT ──────────────────────────────────────────────────────────────
  buildStops();
  onScroll();
  // Images and fonts shift the layout once loaded; re-measure the route.
  window.addEventListener('load', function () { buildStops(); onScroll(); root.classList.add('is-loaded'); });
  requestAnimationFrame(function () { root.classList.add('is-ready'); });
})();

// ── Driven from a frame ──
// When this page is shown inside another (the Mycelium workshop deck), that
// page can't scroll it, so it asks: "hello" is answered with "ready", and
// "autoscroll" glides to the bottom at a steady pace until it gets there, the
// deck says "stop", or the viewer touches the page. Only scrolling is offered.
(function () {
  if (window.parent === window) return;
  var raf = 0;
  var tell = function (type) { parent.postMessage({ source: 'mycelium-site', type: type }, '*'); };
  var stop = function () { if (raf) cancelAnimationFrame(raf); raf = 0; };
  addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.source !== 'mycelium-deck') return;
    if (d.type === 'hello') { tell('ready'); return; }
    if (d.type === 'stop') { stop(); return; }
    if (d.type !== 'autoscroll') return;
    stop();
    var speed = Math.max(20, Math.min(800, +d.pxPerSec || 120));
    var y = window.scrollY, last = 0;
    var tick = function (t) {
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      y = Math.min(max, y + speed * dt);
      window.scrollTo({ top: y, behavior: 'instant' });
      if (y >= max) { raf = 0; tell('autoscroll-done'); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  });
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (n) {
    addEventListener(n, function () { if (raf) { stop(); tell('autoscroll-done'); } }, { passive: true });
  });
})();
