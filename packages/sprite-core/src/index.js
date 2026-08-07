// sprite-core — framework-agnostic sprite data, palette math, and canvas
// rendering shared by the Dodo apps (Electron widget + web preview). No
// Electron/Next/DOM globals live here, so both apps import the exact same
// logic and render pixel-for-pixel identically.

import {
  ANCHORS,
  GRID_H,
  GRID_W,
  TINTABLE,
  baseGridFor,
} from './sprite-data.js';
import { buildPalette } from './palette.js';

// traits -> full sprite object the app can render: { meta, grid, palette,
// anchors, tintable }.
export function buildSprite(traits = {}) {
  return {
    meta: { species: traits.species || 'dog', name: traits.name || null },
    grid: baseGridFor(traits.species),
    palette: buildPalette(traits),
    anchors: ANCHORS,
    tintable: TINTABLE,
  };
}

// Guardrail: confirm a generated sprite is renderable and interaction-safe.
export function validateSprite(sprite) {
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

// --- public API ---
export {
  BASE_DOG,
  GRID_W,
  GRID_H,
  ANCHORS,
  TINTABLE,
  baseGridFor,
} from './sprite-data.js';
export {
  buildPalette,
  shift,
  lerp,
  lerpColor,
  tint,
  hexToRgb,
  rgbToHex,
} from './palette.js';
export { drawSprite, drawEyes, drawTongue } from './render.js';
