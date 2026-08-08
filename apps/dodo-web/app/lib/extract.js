// extract.js — dodo-web's DOM glue around sprite-core's color extraction.
//
// This is the ONLY color-related code that lives in the web app, and it does no
// color math: it just reads pixels off a canvas and hands them to sprite-core.
// The bucketing/clustering and the shift()-based coat derivation both live in
// packages/sprite-core (color-extract.js), so the web preview and the Electron
// app agree pixel-for-pixel. Do not reimplement color logic here.
//
// Everything runs in the browser — no image ever leaves the device, no network
// request is made. The whole pipeline is <canvas> + getImageData.

import { extractDominantColor, deriveCoat } from "sprite-core";

// Size of the offscreen canvas we downscale the cropped region to before
// sampling. Small = fast (a few thousand pixels) and the downscale itself
// averages neighbouring pixels, which pre-clusters coat tones.
const SAMPLE_SIZE = 50;

// coatFromCrop(img, crop) -> { base, light, shade }
//
// img:  a loaded HTMLImageElement.
// crop: the region the user confirmed is fur, in NATURAL image pixels:
//       { sx, sy, size } (square — sprite coats come from one square sample).
//
// Draws that square down to SAMPLE_SIZE x SAMPLE_SIZE, reads it back, and asks
// sprite-core for the dominant coat tone + derived light/shade.
export function coatFromCrop(img, crop) {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  // Smoothing ON (the default) so downscaling averages pixels — desirable here.
  ctx.drawImage(
    img,
    crop.sx,
    crop.sy,
    crop.size,
    crop.size,
    0,
    0,
    SAMPLE_SIZE,
    SAMPLE_SIZE
  );
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const base = extractDominantColor(data);
  return deriveCoat(base);
}
