/* ── mycelium · splash ──
 *
 * Page behaviour, then the mycelial background canvas. The canvas is ported
 * from the docs site (site.js) so both surfaces run the same organism on the
 * same single-accent ink; the splash only differs in that it runs livelier over
 * the title page and settles once you scroll into the reading sections.
 */

// ── THEME ──
// Shares the 'mycelium-theme' key with the docs site (same origin), so the
// landing -> docs jump never flashes or forgets the reader's choice.

function currentPref() {
  try { return localStorage.getItem('mycelium-theme') || 'dark'; } catch (e) { return 'dark'; }
}

function applyTheme(pref) {
  var dark = pref === 'dark'
    || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  var btn = document.getElementById('theme-btn');
  if (btn) btn.innerHTML = '<i data-lucide="' + (dark ? 'moon' : 'sun') + '"></i>';
  document.querySelectorAll('[data-theme-set]').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-theme-set') === pref);
  });
  if (window.lucide) window.lucide.createIcons();
  window.dispatchEvent(new CustomEvent('mycelium:theme'));
}

function setTheme(pref) {
  try { localStorage.setItem('mycelium-theme', pref); } catch (e) {}
  applyTheme(pref);
}

function toggleThemeMenu(e) {
  e.stopPropagation();
  var menu = document.getElementById('theme-menu');
  if (menu) menu.classList.toggle('open');
}

document.addEventListener('click', function () {
  var menu = document.getElementById('theme-menu');
  if (menu) menu.classList.remove('open');
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
  if (currentPref() === 'system') applyTheme('system');
});

// ── INSTALL BLOCK ──
// Both install blocks (title page and § 05) stay on the same tab, so a reader
// who picked `brew` up top still sees `brew` at the bottom.

var CMDS = {
  prompt: 'Use curl to read https://mycelium-io.github.io/mycelium/agents.md and perform the setup to install Mycelium',
  curl: 'curl -fsSL https://mycelium-io.github.io/mycelium/install.sh | bash',
  brew: 'brew install mycelium-io/tap/mycelium',
};

function setTab(tab, el) {
  document.querySelectorAll('#install-cmd, #install-cmd-2').forEach(function (node) {
    node.textContent = CMDS[tab];
  });
  document.querySelectorAll('.toggle-tab').forEach(function (t) {
    var on = t.textContent.trim() === tab;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('.install-cmd .copy-btn').forEach(resetCopyBtn);
}

function resetCopyBtn(btn) {
  btn.innerHTML = '<i data-lucide="copy"></i>';
  btn.classList.remove('copied');
  if (window.lucide) window.lucide.createIcons();
}

function copyInstall(btn) {
  var code = btn.parentElement.querySelector('code');
  if (!code) return;
  navigator.clipboard.writeText(code.textContent).then(function () {
    btn.innerHTML = '<i data-lucide="check"></i>';
    btn.classList.add('copied');
    if (window.lucide) window.lucide.createIcons();
    setTimeout(function () { resetCopyBtn(btn); }, 2000);
  });
}

// ── PLATES ──
// A plate whose art hasn't been generated yet falls back to a labelled frame
// rather than a broken image, so adding art is a file drop with no markup edit.

function markPlateMissing(img) {
  var cell = img.closest('.plate');
  if (!cell) return;
  cell.classList.add('missing');
  var frame = cell.querySelector('.plate-pending');
  if (!frame || frame.childElementCount) return;
  var file = cell.getAttribute('data-plate-file') || img.getAttribute('src');
  var hint = cell.getAttribute('data-plate-hint') || '';
  frame.innerHTML =
    '<span class="pp-tag">plate pending</span>' +
    '<span class="pp-file">' + file + '</span>' +
    (hint ? '<span class="pp-hint">' + hint + '</span>' : '');
}

function wirePlates() {
  document.querySelectorAll('.plate .cell-media').forEach(function (img) {
    // complete + naturalWidth 0 means it already failed before this ran.
    if (img.complete && img.naturalWidth === 0) markPlateMissing(img);
    img.addEventListener('error', function () { markPlateMissing(img); });
  });
}

// ── SCROLL STATE ──
// One flag drives the running head, the canvas strength and the hero mask, so
// they cross over together instead of drifting apart.

function wireScroll() {
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;bottom:120px;height:1px;width:1px;';
  hero.appendChild(sentinel);
  new IntersectionObserver(function (entries) {
    document.body.classList.toggle('past-hero', !entries[0].isIntersecting);
  }, { threshold: 0 }).observe(sentinel);
}

function wireReveal() {
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (e) { e.classList.add('in'); });
    return;
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  els.forEach(function (e) { obs.observe(e); });
}

// ── BENTO STAGGER ──
// Each cell fades in as it crosses into view, staggered by position,
// instead of the whole grid appearing at once.

function wireBentoReveal() {
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.bento').forEach(function (grid) {
    var cells = grid.querySelectorAll('.cell');
    if (reduced || !('IntersectionObserver' in window)) {
      cells.forEach(function (c) { c.classList.add('in'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var i = Array.prototype.indexOf.call(cells, entry.target);
        entry.target.style.setProperty('--stagger', i % 6);
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    cells.forEach(function (c) { obs.observe(c); });
  });
}

// ── VERSION ──

function wireVersion() {
  var badge = document.getElementById('version-badge');
  if (!badge) return;
  fetch('https://api.github.com/repos/mycelium-io/mycelium/releases/latest')
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.tag_name) badge.textContent = d.tag_name; })
    .catch(function () {});
}

document.addEventListener('DOMContentLoaded', function () {
  applyTheme(currentPref());
  wirePlates();
  wireScroll();
  wireReveal();
  wireBentoReveal();
  wireVersion();
  if (window.lucide) window.lucide.createIcons();
});
// lucide is deferred, so its icons may not exist at DOMContentLoaded.
window.addEventListener('load', function () { if (window.lucide) window.lucide.createIcons(); });


/* ══════════════════════════════════════════════════════════════════════
 * MYCELIAL BACKGROUND
 *
 * Two layers, same as the docs canvas:
 *   1. Tip-growth (Meškauskas et al.) lays down a permanent hyphal network.
 *   2. Physarum-style nutrient agents flow through what layer 1 built.
 *
 * The palette is read from CSS custom properties, so it tracks the active
 * theme: one accent at three depths rather than three unrelated hues.
 * ══════════════════════════════════════════════════════════════════════ */
(function () {
  var canvas = document.getElementById('mycelium-bg');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var CELL = 8;
  var cols = 480, rows = 270;
  var structure = new Float32Array(cols * rows);   // permanent hypha map
  var trail = new Float32Array(cols * rows);       // animated nutrient flow
  var colorIdx = new Uint8Array(cols * rows);

  // ── Palette ──
  var BG = { r: 12, g: 14, b: 17 };
  var COLORS = [{ r: 92, g: 199, b: 210 }, { r: 92, g: 199, b: 210 }, { r: 92, g: 199, b: 210 }];
  var INK_ALPHA = 1;

  function hexToRgb(hex) {
    var h = hex.trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  function mix(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  function readPalette() {
    var cs = getComputedStyle(document.documentElement);
    var bg = cs.getPropertyValue('--canvas-bg');
    var ink = cs.getPropertyValue('--canvas-ink').split(',');
    var alpha = parseFloat(cs.getPropertyValue('--canvas-alpha'));
    if (bg) BG = hexToRgb(bg);
    if (ink.length === 3) {
      var base = { r: +ink[0], g: +ink[1], b: +ink[2] };
      // Three depths of one accent: enough variation to read as separate
      // colonies, without spending a second hue.
      COLORS = [base, mix(base, BG, 0.28), mix(base, BG, 0.5)];
    }
    if (!isNaN(alpha)) INK_ALPHA = alpha;
  }

  readPalette();
  window.addEventListener('mycelium:theme', readPalette);

  canvas.style.imageRendering = 'pixelated';

  var viewCols, viewRows;
  function resize() {
    viewCols = Math.min(Math.ceil(window.innerWidth / CELL), cols);
    viewRows = Math.min(Math.ceil(window.innerHeight / CELL), rows);
    canvas.width = viewCols;
    canvas.height = viewRows;
  }
  window.addEventListener('resize', resize);
  resize();

  // ── LAYER 1: tip-growth ──

  var TIP_SPEED = 0.25;
  var BRANCH_PROB = 0.015;
  var BRANCH_ANGLE_MIN = 0.4;
  var BRANCH_ANGLE_MAX = 1.1;
  var WANDER = 0.1;
  var MAX_TIPS = 1200;

  var tips = [];

  function depositStructure(x, y, ci, gen) {
    var gx = Math.floor(x), gy = Math.floor(y);
    var strength = 0.5 / (1 + gen * 0.25);
    var radius = gen < 2 ? 1 : 0;
    for (var dy = -radius; dy <= radius; dy++) {
      for (var dx = -radius; dx <= radius; dx++) {
        var px = gx + dx, py = gy + dy;
        if (px >= 0 && px < cols && py >= 0 && py < rows) {
          var idx = py * cols + px;
          var str = (dx === 0 && dy === 0) ? strength : strength * 0.4;
          structure[idx] = Math.min(1.0, structure[idx] + str);
          colorIdx[idx] = ci;
        }
      }
    }
  }

  function isOccupied(x, y) {
    var gx = Math.floor(x), gy = Math.floor(y);
    if (gx < 0 || gx >= cols || gy < 0 || gy >= rows) return true;
    return structure[gy * cols + gx] > 0.2;
  }

  function seedColony(cx, cy, ci, n) {
    for (var i = 0; i < n; i++) {
      var angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.5;
      tips.push({
        x: cx + Math.cos(angle) * 2,
        y: cy + Math.sin(angle) * 2,
        angle: angle, ci: ci, age: 0, gen: 0,
        maxAge: 1500 + Math.floor(Math.random() * 3000),
        speed: TIP_SPEED * (0.7 + Math.random() * 0.6),
      });
    }
    depositStructure(cx, cy, ci, 0);
  }

  function growStep() {
    var newTips = [];
    for (var i = tips.length - 1; i >= 0; i--) {
      var t = tips[i];
      t.age++;
      t.angle += (Math.random() - 0.5) * WANDER * 2;

      var nx = t.x + Math.cos(t.angle) * t.speed;
      var ny = t.y + Math.sin(t.angle) * t.speed;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || t.age > t.maxAge) {
        tips.splice(i, 1);
        continue;
      }
      if (t.age > 50 && isOccupied(nx, ny)) {
        depositStructure(nx, ny, t.ci, t.gen);
        tips.splice(i, 1);
        continue;
      }

      depositStructure(t.x, t.y, t.ci, t.gen);
      t.x = nx; t.y = ny;

      if (t.age > 300 && t.age % 150 === 0 && Math.random() < 0.12) {
        seedColony(t.x, t.y, t.ci, 2);
      }
      if (tips.length + newTips.length < MAX_TIPS && Math.random() < BRANCH_PROB && t.age > 10) {
        var bAngle = BRANCH_ANGLE_MIN + Math.random() * (BRANCH_ANGLE_MAX - BRANCH_ANGLE_MIN);
        var sign = Math.random() < 0.5 ? -1 : 1;
        newTips.push({
          x: t.x, y: t.y, angle: t.angle + sign * bAngle,
          ci: t.ci, age: 0, gen: t.gen + 1,
          maxAge: 600 + Math.floor(Math.random() * 1500),
          speed: t.speed * (0.75 + Math.random() * 0.25),
        });
      }
    }
    for (var j = 0; j < newTips.length; j++) {
      if (tips.length < MAX_TIPS) tips.push(newTips[j]);
    }
  }

  // ── LAYER 2: nutrient agents ──

  var agents = [];
  var MAX_AGENTS = 900;
  var SENSOR_DIST = 6;
  var SENSOR_ANGLE = 0.6;

  function spawnAgentOnNetwork() {
    for (var attempt = 0; attempt < 20; attempt++) {
      var x = Math.random() * viewCols;
      var y = Math.random() * viewRows;
      var gx = Math.floor(x), gy = Math.floor(y);
      if (gx >= 0 && gx < cols && gy >= 0 && gy < rows && structure[gy * cols + gx] > 0.1) {
        agents.push({
          x: x, y: y,
          angle: Math.random() * Math.PI * 2,
          ci: colorIdx[gy * cols + gx],
          speed: 0.08 + Math.random() * 0.1,
        });
        return;
      }
    }
  }

  function senseTrail(ax, ay, angle, offset) {
    var sx = Math.floor(ax + Math.cos(angle + offset) * SENSOR_DIST);
    var sy = Math.floor(ay + Math.sin(angle + offset) * SENSOR_DIST);
    if (sx < 0 || sx >= cols || sy < 0 || sy >= rows) return 0;
    return structure[sy * cols + sx] * 0.5 + trail[sy * cols + sx];
  }

  function stepAgents() {
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];
      var sL = senseTrail(a.x, a.y, a.angle, -SENSOR_ANGLE);
      var sC = senseTrail(a.x, a.y, a.angle, 0);
      var sR = senseTrail(a.x, a.y, a.angle, SENSOR_ANGLE);
      var turn = 0.08 + Math.random() * 0.06;
      if (sC >= sL && sC >= sR) a.angle += (Math.random() - 0.5) * 0.3;
      else if (sL > sR) a.angle -= turn;
      else a.angle += turn;

      a.x += Math.cos(a.angle) * a.speed;
      a.y += Math.sin(a.angle) * a.speed;
      if (a.x < 0) a.x += cols;
      if (a.x >= cols) a.x -= cols;
      if (a.y < 0) a.y += rows;
      if (a.y >= rows) a.y -= rows;

      var gx = Math.floor(a.x), gy = Math.floor(a.y);
      // An agent that has wandered off the network is re-seeded onto it, so
      // density stays even instead of pooling in the empty corners.
      if (gx >= 0 && gx < cols && gy >= 0 && gy < rows && structure[gy * cols + gx] < 0.05) {
        for (var att = 0; att < 30; att++) {
          var rx = Math.floor(Math.random() * viewCols), ry = Math.floor(Math.random() * viewRows);
          if (structure[ry * cols + rx] > 0.1) {
            a.x = rx; a.y = ry;
            a.angle = Math.random() * Math.PI * 2;
            a.ci = colorIdx[ry * cols + rx];
            gx = rx; gy = ry;
            break;
          }
        }
      }
      if (gx >= 0 && gx < cols && gy >= 0 && gy < rows) {
        var idx = gy * cols + gx;
        trail[idx] = Math.min(1.0, trail[idx] + 0.04);
        colorIdx[idx] = a.ci;
      }
    }
  }

  // ── PRE-WARM ──
  // The network is already grown when the page paints; nobody should watch it
  // sprout from nothing.
  var numColonies = 15 + Math.floor(Math.random() * 8);
  for (var c = 0; c < numColonies; c++) {
    seedColony(
      15 + Math.random() * (viewCols - 30),
      15 + Math.random() * (viewRows - 30),
      Math.floor(Math.random() * COLORS.length),
      2 + Math.floor(Math.random() * 3)
    );
  }
  for (var warm = 0; warm < 4000; warm++) growStep();
  for (var a0 = 0; a0 < MAX_AGENTS; a0++) spawnAgentOnNetwork();
  for (var warm2 = 0; warm2 < 200; warm2++) {
    for (var w = 0; w < trail.length; w++) trail[w] *= 0.995;
    stepAgents();
  }

  // ── ANIMATION LOOP ──
  var lastFrame = 0;
  var frameInterval = 1000 / 20;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function paint() {
    ctx.fillStyle = 'rgb(' + BG.r + ',' + BG.g + ',' + BG.b + ')';
    ctx.fillRect(0, 0, viewCols, viewRows);
    var rw = Math.min(viewCols, cols), rh = Math.min(viewRows, rows);
    for (var y = 0; y < rh; y++) {
      for (var x = 0; x < rw; x++) {
        var idx = y * cols + x;
        var sVal = structure[idx], tVal = trail[idx];
        if (sVal < 0.01 && tVal < 0.01) continue;
        var col = COLORS[colorIdx[idx]];
        // Structure is dim and permanent; flow is brighter and animated.
        var alpha = (sVal * 0.02 + tVal * 0.2) * INK_ALPHA;
        ctx.fillStyle = 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + alpha + ')';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function animate(timestamp) {
    requestAnimationFrame(animate);
    if (timestamp - lastFrame < frameInterval) return;
    lastFrame = timestamp;

    growStep();
    if (tips.length < 8) {
      seedColony(
        10 + Math.random() * (viewCols - 20),
        10 + Math.random() * (viewRows - 20),
        Math.floor(Math.random() * COLORS.length),
        2 + Math.floor(Math.random() * 2)
      );
    }
    for (var i = 0; i < trail.length; i++) {
      trail[i] *= 0.99;
      if (trail[i] < 0.005) trail[i] = 0;
    }
    stepAgents();
    paint();
  }

  if (reduced.matches) {
    // Grown, but still: the network is branding, the motion is optional.
    paint();
  } else {
    requestAnimationFrame(animate);
  }
})();
