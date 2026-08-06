// Template-based sprite generator (v1: recolor).
//
// Turns a small "traits" object (the kind a vision model can extract from a
// pet photo) into a ready-to-render sprite: { grid, palette, anchors, meta }.
//
// v1 keeps the base SHAPE fixed and only recolors it, so the eye/mouth anchors
// never move and every generated pet stays compatible with the app's
// eye-tracking / tongue / heat interactions. Markings + ear variants are v2.
//
// UMD: works as a Node `require` (main process) AND as a browser <script>
// global `window.SpriteTemplate` (renderer, which has no bundler).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SpriteTemplate = factory();
})(typeof self !== 'undefined' ? self : this, function () {

// The sitting-dog base shape. This is the silhouette + feature layout; colors
// come entirely from the palette. Keep in sync with the app's base grid when
// sprites become data-driven (step 3).
const BASE_DOG = [
  '................................',
  '..............OOOO..............',
  '............OOGGGGOO............',
  '...OO......OGGGGGGGGO......OO...',
  '..ODDO....OGGGGGGGGGGO....ODDO..',
  '.ODDDDO..OGGGGGGGGGGGGO..ODDDDO.',
  '.ODDDDDO.OGGGGGGGGGGGGO.ODDDDDO.',
  '.ODDDDDDOGGGGGGGGGGGGGGODDDDDDO.',
  '.ODDDDDGGGGGGGGGGGGGGGGGGDDDDDO.',
  '.ODDDDGGGGGGGGGGGGGGGGGGGGDDDDO.',
  '.ODDDGGGGWWWGGGGGGGGWWWGGGDDDO..',
  '..ODDGGGGWKWGGGGGGGGWKWGGGDDO...',
  '..ODDGGGGWWWGGGGGGGGWWWGGGDDO...',
  '..OGGGGGGGGGGGGGGGGGGGGGGGGGO...',
  '..OGGGGGGGGGGGLLLLGGGGGGGGGGO...',
  '...OGGGGGGGGGLLLLLLGGGGGGGGO....',
  '...OGGGGGGGGGLLNNLLGGGGGGGGO....',
  '...OGGGGGGGGGGLNNLGGGGGGGGGO....',
  '....OGGGGGGGGGLLLLGGGGGGGGO.....',
  '....OGGGGGGGGGGPPPPGGGGGGGO.....',
  '.....OGGGGGGGGGGGGGGGGGGGO......',
  '.....OLLGGGGGGGGGGGGGGGLLO......',
  '....OLLLLLGGGGGGGGGGGLLLLLO.....',
  '...OLLLLLLLLLLLLLLLLLLLLLLLO....',
  '..ODLLLLLLLLLLLLLLLLLLLLLLLDO...',
  '..ODDLLLLLLLLLLLLLLLLLLLLLLDDO..',
  '.ODDDLLLLLLLLLLLLLLLLLLLLLDDDO..',
  '.ODDDDDLLLLLLLLLLLLLLLLLLDDDDO..',
  '.ODDDDDDLLLLLLLLLLLLLLLLDDDDDO..',
  '.ODDDDDDGGGGGGGGGGGGGGGGDDDDDO..',
  '.ODDDDDGGGGGGGGGGGGGGGGGGDDDDO..',
  '..ODDDOGGGGGGGGGGGGGGGGGGODDDO..',
  '...OOO.OGGGGGGGGGGGGGGGGO.OOO...',
  '.......OGGGOGGGGGGGGOGGGO.......',
  '.......OOOOO......OOOOOO........',
  '................................',
];

const GRID_W = 32;
const GRID_H = 36;

// Fixed interaction anchors (must survive any recolor).
const ANCHORS = {
  eyes: [
    { x: 9, y: 10 },
    { x: 19, y: 10 },
  ],
  mouth: { x: 15, y: 19 },
};

// Which palette letters are "coat" (get tinted by typing-heat in the app).
const TINTABLE = ['G', 'L', 'D'];

// --- tiny color helpers (no deps) ---
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function rgbToHex({ r, g, b }) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
// amount in [-1, 1]: negative darkens toward black, positive lightens toward white.
function shift(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const target = amount < 0 ? 0 : 255;
  const a = Math.abs(amount);
  return rgbToHex({
    r: r + (target - r) * a,
    g: g + (target - g) * a,
    b: b + (target - b) * a,
  });
}

// Build the 9-slot palette from traits, deriving shade/light/outline from the
// base coat when they aren't provided (so the vision step can output as little
// as a single base color + nose + eye).
function buildPalette(traits = {}) {
  const coat = traits.coat || {};
  const base = coat.base || traits.baseCoat || '#e0a860';
  const shade = coat.shade || shift(base, -0.28);
  const light = coat.light || shift(base, 0.35);
  const outline = traits.outline || shift(base, -0.72);
  return {
    _: null,
    O: outline,
    D: shade,
    G: base,
    L: light,
    W: '#ffffff',
    N: traits.nose || '#2a1a10',
    P: traits.tongue || '#e8748a',
    K: traits.eye || '#1a1008',
  };
}

function baseGridFor(species) {
  // Only the dog base exists today; cat/other come later.
  return BASE_DOG;
}

// traits -> full sprite object the app can render.
function buildSprite(traits = {}) {
  return {
    meta: { species: traits.species || 'dog', name: traits.name || null },
    grid: baseGridFor(traits.species),
    palette: buildPalette(traits),
    anchors: ANCHORS,
    tintable: TINTABLE,
  };
}

// Guardrail: confirm a generated sprite is renderable and interaction-safe.
function validateSprite(sprite) {
  const errors = [];
  const g = sprite.grid;
  if (!Array.isArray(g) || g.length !== GRID_H) {
    errors.push(`grid must have ${GRID_H} rows, got ${g && g.length}`);
    return { ok: false, errors };
  }
  const legal = new Set(Object.keys(sprite.palette).concat(['.']));
  g.forEach((row, y) => {
    if (row.length !== GRID_W) errors.push(`row ${y} width ${row.length} != ${GRID_W}`);
    for (const ch of row) {
      if (!legal.has(ch === '.' ? '.' : ch)) errors.push(`row ${y}: illegal char "${ch}"`);
    }
  });
  // Anchors must sit on non-transparent cells so eyes/mouth actually exist.
  const cell = (x, y) => (g[y] ? g[y][x] : '.');
  for (const e of sprite.anchors.eyes) {
    if (cell(e.x + 1, e.y + 1) === '.') errors.push(`eye anchor (${e.x},${e.y}) is empty`);
  }
  const m = sprite.anchors.mouth;
  if (cell(m.x, m.y) === '.') errors.push(`mouth anchor (${m.x},${m.y}) is empty`);
  return { ok: errors.length === 0, errors };
}

return {
  BASE_DOG,
  GRID_W,
  GRID_H,
  ANCHORS,
  TINTABLE,
  buildPalette,
  buildSprite,
  validateSprite,
  shift,
};

});
