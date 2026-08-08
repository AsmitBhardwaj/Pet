// color-extract.js — client-side dominant-color extraction from raw pixel data.
//
// Framework-agnostic on purpose: these functions take a flat RGBA array (e.g.
// from a canvas `ImageData.data`, but they don't know or care that it came from
// a canvas) and return coat colors. The DOM work — reading pixels off a canvas,
// downscaling a photo — stays in the apps; only the *color math* lives here,
// next to palette.js's shift(). This is the "photo → 2-3 dominant coat colors,
// client-side bucketing" step from the product plan (see root CLAUDE.md).
//
// No ML, no service calls: a coarse bucket clustering finds the single most
// common coat tone, and the light/shade tones are derived from it with shift()
// rather than detected separately (far more reliable — see CLAUDE.md).

import { shift, rgbToHex } from './palette.js';

// Sprite-core's default coat base — used as the fallback when there are no
// opaque pixels to sample (empty crop, fully transparent image).
const FALLBACK_BASE = '#e0a860';

// extractDominantColor(rgba, opts) -> "#rrggbb"
//
// rgba: a flat array of 8-bit RGBA samples (length a multiple of 4), such as a
//       canvas ImageData's `.data`. Downscale before calling for speed (~50x50
//       is plenty) — averaging during downscale also pre-clusters the pixels.
//
// Algorithm: quantize each channel to `1 << bits` levels, tally how many pixels
// land in each (r,g,b) bucket, then take the mean of the *actual* pixel values
// in the most-populated bucket. Quantizing clusters near-identical tones
// together; averaging within the winner recovers sub-bucket precision so the
// returned color is a real coat tone, not a coarse bucket center. This is the
// deliberately-simple "doesn't need to be k-means-perfect" approach from the
// product plan.
export function extractDominantColor(rgba, { bits = 4, alphaThreshold = 128 } = {}) {
  if (!rgba || rgba.length < 4) return FALLBACK_BASE;
  const shiftBits = 8 - bits; // e.g. bits=4 -> 16 levels/channel, bucket width 16
  // key -> running { count, sum r/g/b }. A Map keeps it sparse (only buckets
  // that actually occur), so this scales with distinct colors, not 2^(3*bits).
  const buckets = new Map();
  let best = null;

  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < alphaThreshold) continue; // skip transparent pixels
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    const key =
      ((r >> shiftBits) << (bits * 2)) |
      ((g >> shiftBits) << bits) |
      (b >> shiftBits);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { count: 0, r: 0, g: 0, b: 0 };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    if (best === null || bucket.count > best.count) best = bucket;
  }

  if (!best) return FALLBACK_BASE; // no opaque pixels
  return rgbToHex({
    r: best.r / best.count,
    g: best.g / best.count,
    b: best.b / best.count,
  });
}

// deriveCoat(base) -> { base, light, shade }
//
// Turns a single extracted base tone into the three-tone coat the pet config
// schema needs. Uses the SAME shift() amounts buildPalette() applies when it
// derives missing tones (light +0.35, shade -0.28), so a config exported from
// the web renders pixel-for-pixel identically to how the app would render the
// same base. Deriving beats detecting three separate dominant colors from a
// photo — highlights/shadows are unreliable to isolate (see CLAUDE.md).
export function deriveCoat(base) {
  return {
    base,
    light: shift(base, 0.35),
    shade: shift(base, -0.28),
  };
}
