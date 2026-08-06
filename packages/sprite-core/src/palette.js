// palette.js — coat/fixed-color roles and the color math. Framework-agnostic.
// Coat tones (base/light/shade) come from the pet; outline/nose/eye/tongue and
// white are fixed roles.

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

// amount in [-1, 1]: negative darkens toward black, positive lightens toward white.
export function shift(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const target = amount < 0 ? 0 : 255;
  const a = Math.abs(amount);
  return rgbToHex({
    r: r + (target - r) * a,
    g: g + (target - g) * a,
    b: b + (target - b) * a,
  });
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpColor(a, b, t) {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

// Typing-heat tint: warms a hex coat color toward red. heat in [0, 1].
// Returns the original hex unchanged when heat is negligible.
export function tint(hex, heat) {
  if (heat <= 0.01) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const hot = [214, 60, 32];
  const [nr, ng, nb] = lerpColor([r, g, b], hot, heat * 0.6);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

// Build the 9-slot palette from traits, deriving shade/light/outline from the
// base coat when they aren't provided (so the vision step can output as little
// as a single base color + nose + eye).
export function buildPalette(traits = {}) {
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
