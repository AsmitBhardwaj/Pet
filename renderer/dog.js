const canvas = document.getElementById('dog-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// --- sprite (data-driven) ---
// The shape + colors come from a sprite object built by the shared template
// module (lib/spriteTemplate.js, loaded as the global `window.SpriteTemplate`).
// This lets the widget render any generated pet, not just a hardcoded dog.
// A 32x36 grid at SCALE=4 fills the 128x144 canvas.
const SCALE = 4;

let SPRITE = [];               // grid rows (each a string of palette letters)
let C = {};                    // palette: letter -> hex (or null for '.')
let TINTABLE = ['G', 'L', 'D']; // palette letters typing-heat tints
let EYES = [];                 // eye anchors [{x,y}] — 3x3 white blocks
let MOUTH = { x: 15, y: 19 };  // tongue anchor + tongue-pull hit region
let isEyeCell = () => false;   // derived from EYES

// Swap in a sprite (default pet, or a live pick from the tray/menu).
function applySprite(s) {
  if (!s || !s.grid || !s.palette || !s.anchors) return;
  SPRITE = s.grid;
  C = s.palette;
  TINTABLE = s.tintable || ['G', 'L', 'D'];
  EYES = s.anchors.eyes;
  MOUTH = s.anchors.mouth;
  // Eyes are drawn dynamically (pupils track the cursor), so drawSprite skips
  // the 3x3 white block at each eye anchor.
  isEyeCell = (col, row) =>
    EYES.some((e) => col >= e.x && col <= e.x + 2 && row >= e.y && row <= e.y + 2);
}

// Default pet: the original golden retriever (exact original palette).
applySprite(
  window.SpriteTemplate.buildSprite({
    species: 'dog',
    coat: { base: '#e0a860', shade: '#b5793a', light: '#f2d19a' },
    outline: '#3a2415',
    nose: '#2a1a10',
    eye: '#1a1008',
    tongue: '#e8748a',
  })
);

// --- interaction state ---
let heat = 0;
let lastTypingTime = 0;
let cursorDX = 0;
let cursorDY = 0;
let tailPhase = 0;
let blinkTimer = 0;
let blinking = false;

// --- tongue state (anchored at the mouth; MOUTH is set by applySprite) ---
const TONGUE_MAX_LENGTH = 12;
const TONGUE_REST_LENGTH = 2;
let tongueLength = TONGUE_REST_LENGTH;
let tongueDirX = 0;
let tongueDirY = 1;
let tongueVelocity = 0;
let isDragging = false;        // pulling the tongue
let isWindowDragging = false;  // moving the whole window

function lerp(a, b, t) { return a + (b - a) * t; }

function lerpColor(a, b, t) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

// Heat tints the golden coat toward warm red as you type.
function tint(hex) {
  if (heat <= 0.01) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const hot = [214, 60, 32];
  const [nr, ng, nb] = lerpColor([r, g, b], hot, heat * 0.6);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

function px(x, y, w = 1, h = 1) {
  ctx.fillRect(
    Math.round(x * SCALE),
    Math.round(y * SCALE),
    Math.round(w * SCALE),
    Math.round(h * SCALE)
  );
}

function drawSprite() {
  for (let row = 0; row < SPRITE.length; row++) {
    const line = SPRITE[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === '.') continue;
      // skip the eye cells; the eyes are drawn dynamically below so the
      // pupils can track the cursor (derived from the sprite's eye anchors).
      if (isEyeCell(col, row)) continue;
      const color = C[ch];
      if (!color) continue;
      // tint only the coat colors, not outline/nose/white/tongue
      const shouldTint = TINTABLE.includes(ch);
      ctx.fillStyle = shouldTint ? tint(color) : color;
      px(col, row);
    }
  }
}

function drawEyes() {
  const dir = Math.atan2(cursorDY, cursorDX);
  // pupil can shift within the 3x3 white by up to 1 cell toward the cursor
  const ox = Math.max(-1, Math.min(1, Math.round(Math.cos(dir))));
  const oy = Math.max(-1, Math.min(1, Math.round(Math.sin(dir) * 0.7)));
  for (const eye of EYES) {
    if (!blinking) {
      // 3x3 white
      ctx.fillStyle = C.W;
      px(eye.x, eye.y, 3, 3);
      // 1x1 pupil, centered then nudged toward the cursor
      ctx.fillStyle = C.K;
      px(eye.x + 1 + ox, eye.y + 1 + oy, 1, 1);
    } else {
      // closed eye: a soft dark line across the middle row
      ctx.fillStyle = C.O;
      px(eye.x, eye.y + 1, 3, 1);
    }
  }
}

function drawTongue() {
  const segments = Math.max(2, Math.round(tongueLength));
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * tongueLength;
    const gx = MOUTH.x + tongueDirX * t;
    const gy = MOUTH.y + tongueDirY * t;
    ctx.fillStyle = C.P;
    px(gx - 1, gy, 2, 1.1);
  }
  // rounded tip
  const tipX = MOUTH.x + tongueDirX * tongueLength;
  const tipY = MOUTH.y + tongueDirY * tongueLength;
  ctx.fillStyle = C.P;
  px(tipX - 1.5, tipY - 0.5, 3, 2);
  // center crease
  ctx.fillStyle = '#c65670';
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * tongueLength;
    const gx = MOUTH.x + tongueDirX * t;
    const gy = MOUTH.y + tongueDirY * t;
    px(gx - 0.15, gy, 0.3, 1);
  }
}

function drawDog() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTongue();  // behind the head so it comes "out" of the mouth
  drawSprite();
  drawEyes();
}

function updateTongue() {
  if (isDragging) return;
  const target = TONGUE_REST_LENGTH;
  const k = 0.02;
  const damping = 0.18;
  const displacement = tongueLength - target;
  const accel = -k * displacement - damping * tongueVelocity;
  tongueVelocity += accel;
  tongueLength += tongueVelocity;
  if (tongueLength < target && Math.abs(tongueVelocity) < 0.02) {
    tongueLength = target;
    tongueVelocity = 0;
  }
  tongueDirX = lerp(tongueDirX, 0, 0.15);
  tongueDirY = lerp(tongueDirY, 1, 0.15);
}

function tick() {
  const now = performance.now();
  const sinceTyping = now - lastTypingTime;
  if (sinceTyping < 4000) {
    heat = Math.min(1, heat + 0.04);
  } else {
    heat = Math.max(0, heat - 0.01);
  }
  tailPhase += 0.12;
  blinkTimer += 1;
  if (blinkTimer > 150) {
    blinking = true;
    if (blinkTimer > 158) {
      blinking = false;
      blinkTimer = 0;
    }
  }
  updateTongue();
  drawDog();
  requestAnimationFrame(tick);
}

// --- pointer interaction for the stretchy tongue ---
function toGridCoords(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) / SCALE,
    y: (evt.clientY - rect.top) / SCALE,
  };
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

canvas.addEventListener('pointerdown', (evt) => {
  const p = toGridCoords(evt);
  if (distance(p.x, p.y, MOUTH.x, MOUTH.y) < 6) {
    // near the mouth: pull the tongue
    isDragging = true;
    canvas.setPointerCapture(evt.pointerId);
  } else if (window.comnyang && window.comnyang.moveBy) {
    // anywhere else on the body: drag the whole window
    isWindowDragging = true;
    canvas.setPointerCapture(evt.pointerId);
    canvas.style.cursor = 'grabbing';
  }
});

canvas.addEventListener('pointermove', (evt) => {
  if (isWindowDragging) {
    // movementX/Y are physical pointer deltas, unaffected by the window
    // moving underneath the cursor, so dragging stays 1:1 and drift-free.
    if (evt.movementX || evt.movementY) {
      window.comnyang.moveBy(evt.movementX, evt.movementY);
    }
    return;
  }
  if (!isDragging) return;
  const p = toGridCoords(evt);
  const dx = p.x - MOUTH.x;
  const dy = p.y - MOUTH.y;
  const dist = Math.max(0.001, Math.hypot(dx, dy));
  tongueLength = Math.min(TONGUE_MAX_LENGTH, dist);
  tongueDirX = dx / dist;
  tongueDirY = dy / dist;
});

function releaseTongue(evt) {
  if (!isDragging) return;
  isDragging = false;
  tongueVelocity = 0.15;
  if (evt && evt.pointerId !== undefined) {
    try { canvas.releasePointerCapture(evt.pointerId); } catch (e) {}
  }
}

canvas.addEventListener('pointerup', releaseTongue);
canvas.addEventListener('pointercancel', releaseTongue);

function endWindowDrag(evt) {
  if (!isWindowDragging) return;
  isWindowDragging = false;
  canvas.style.cursor = 'grab';
  if (evt && evt.pointerId !== undefined) {
    try { canvas.releasePointerCapture(evt.pointerId); } catch (e) {}
  }
}

canvas.addEventListener('pointerup', endWindowDrag);
canvas.addEventListener('pointercancel', endWindowDrag);

// Right-click anywhere on the dog to open the Quit menu.
window.addEventListener('contextmenu', (evt) => {
  evt.preventDefault();
  if (window.comnyang && window.comnyang.showContextMenu) {
    window.comnyang.showContextMenu();
  }
});

if (window.comnyang) {
  window.comnyang.onCursorUpdate(({ dx, dy }) => {
    cursorDX = dx;
    cursorDY = dy;
  });
  window.comnyang.onTypingTick(() => {
    lastTypingTime = performance.now();
  });
}

// --- config import + saved-pet rendering + macOS permission helper ---
(function setup() {
  const bridge = window.comnyang;
  if (!bridge) return; // running without the preload bridge (e.g. bare browser)

  const panelEl = document.getElementById('panel');
  const importEl = document.getElementById('import');
  const permissionEl = document.getElementById('permission');

  // Both cards are small now — the import card is a single dropzone step.
  const IMPORT_SIZE = { w: 340, h: 320 };
  const PERM_SIZE = { w: 360, h: 260 };

  let platform = 'darwin';
  let importActive = false;
  let permissionQueued = false;

  // Colors that stay fixed regardless of the pet (constraint): only the coat
  // tones (base/light/shade) come from the imported config.
  const FIXED_COLORS = {
    outline: '#3a2415',
    nose: '#2a1a10',
    eye: '#1a1008',
    tongue: '#e8748a',
  };

  // Build a renderable sprite from a saved pet config.
  function spriteFromConfig(cfg) {
    return window.SpriteTemplate.buildSprite({
      species: cfg.species,
      shape: cfg.shape,
      coat: cfg.coat,
      outline: FIXED_COLORS.outline,
      nose: FIXED_COLORS.nose,
      eye: FIXED_COLORS.eye,
      tongue: FIXED_COLORS.tongue,
    });
  }

  function renderSavedPet(cfg) {
    applySprite(spriteFromConfig(cfg));
  }

  // --- panel helpers ---
  function openCard(which, size) {
    document.body.classList.add('panel-open');
    panelEl.classList.remove('hidden');
    importEl.classList.toggle('hidden', which !== 'import');
    permissionEl.classList.toggle('hidden', which !== 'permission');
    bridge.enterPanel(size.w, size.h);
  }
  function closePanel() {
    panelEl.classList.add('hidden');
    importEl.classList.add('hidden');
    permissionEl.classList.add('hidden');
    document.body.classList.remove('panel-open');
    bridge.exitPanel();
  }

  function showPermission() {
    if (platform !== 'darwin') return;
    openCard('permission', PERM_SIZE);
  }

  // --- import step: read the .json pet config the website generates ---
  const dropzone = document.getElementById('dropzone');
  const configInput = document.getElementById('config-input');
  const importError = document.getElementById('import-error');

  function startImport() {
    importActive = true;
    importError.classList.add('hidden');
    importError.textContent = '';
    configInput.value = ''; // allow re-selecting the same file
    openCard('import', IMPORT_SIZE);
  }

  function showImportError(msg) {
    importError.textContent = msg;
    importError.classList.remove('hidden');
  }

  // Expected shape: { version, species, shape, coat: { base, light, shade } }.
  // shape is null for species without variants (cat/bear); species and the
  // coat tones are load-bearing for rendering, so those are validated strictly.
  function isValidConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return false;
    if (typeof cfg.species !== 'string' || !cfg.species) return false;
    const coat = cfg.coat;
    if (!coat || typeof coat !== 'object') return false;
    return (
      typeof coat.base === 'string' &&
      typeof coat.light === 'string' &&
      typeof coat.shade === 'string'
    );
  }

  function loadConfigFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let cfg;
      try {
        cfg = JSON.parse(reader.result);
      } catch (e) {
        showImportError("That file isn't valid JSON. Download a pet file from the Dodo website and try again.");
        return;
      }
      if (!isValidConfig(cfg)) {
        showImportError("That doesn't look like a Dodo pet file. Make sure you picked the .json you downloaded.");
        return;
      }
      importError.classList.add('hidden');
      Promise.resolve(bridge.savePetConfig(cfg)).finally(() => {
        importActive = false;
        renderSavedPet(cfg);
        closePanel();
        if (permissionQueued) {
          permissionQueued = false;
          showPermission();
        }
      });
    };
    reader.onerror = () => showImportError("Couldn't read that file. Try again.");
    reader.readAsText(file);
  }

  configInput.addEventListener('change', (e) => loadConfigFile(e.target.files[0]));
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    loadConfigFile(e.dataTransfer.files[0]);
  });

  // --- app lifecycle ---
  bridge.onAppInit(({ petConfig, platform: plat }) => {
    if (plat) platform = plat;
    if (petConfig) renderSavedPet(petConfig);
    else startImport();
  });
  bridge.onStartSetup(() => startImport());

  bridge.onPermissionNeeded(() => {
    // Defer the permission card until import is finished, if it's open.
    if (importActive) permissionQueued = true;
    else showPermission();
  });
  bridge.onHooksActive(() => {
    permissionQueued = false;
    if (!importActive && !permissionEl.classList.contains('hidden')) closePanel();
  });

  // permission card buttons
  document.getElementById('perm-open').addEventListener('click', () => bridge.openInputMonitoringSettings());
  document.getElementById('perm-restart').addEventListener('click', () => bridge.restartApp());
  document.getElementById('perm-dismiss').addEventListener('click', closePanel);
})();

requestAnimationFrame(tick);
