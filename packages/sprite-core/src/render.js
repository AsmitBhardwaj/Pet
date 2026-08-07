// render.js — canvas-agnostic pixel drawing. Every function takes a 2D drawing
// context plus a plain `state` object and nothing else (no DOM, Electron, or
// module-level app state), so the same code renders the live app and the web
// preview identically.

import { tint } from './palette.js';

// Fill one grid cell (or a w×h block of cells) at integer device pixels.
function px(ctx, scale, x, y, w = 1, h = 1) {
  ctx.fillRect(
    Math.round(x * scale),
    Math.round(y * scale),
    Math.round(w * scale),
    Math.round(h * scale)
  );
}

// state: { grid, palette, tintable, scale, heat, isEyeCell }
// Eye cells are skipped here so the caller can draw pupils that track the
// cursor via drawEyes().
export function drawSprite(ctx, state) {
  const { grid, palette, tintable, scale, heat, isEyeCell } = state;
  for (let row = 0; row < grid.length; row++) {
    const line = grid[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === '.') continue;
      if (isEyeCell(col, row)) continue;
      const color = palette[ch];
      if (!color) continue;
      // tint only the coat colors, not outline/nose/white/tongue
      const shouldTint = tintable.includes(ch);
      ctx.fillStyle = shouldTint ? tint(color, heat) : color;
      px(ctx, scale, col, row);
    }
  }
}

// state adds: { eyes, cursorDX, cursorDY, blinking }
export function drawEyes(ctx, state) {
  const { palette, scale, eyes, cursorDX, cursorDY, blinking } = state;
  const dir = Math.atan2(cursorDY, cursorDX);
  // pupil can shift within the 3x3 white by up to 1 cell toward the cursor
  const ox = Math.max(-1, Math.min(1, Math.round(Math.cos(dir))));
  const oy = Math.max(-1, Math.min(1, Math.round(Math.sin(dir) * 0.7)));
  for (const eye of eyes) {
    if (!blinking) {
      // 3x3 white
      ctx.fillStyle = palette.W;
      px(ctx, scale, eye.x, eye.y, 3, 3);
      // 1x1 pupil, centered then nudged toward the cursor
      ctx.fillStyle = palette.K;
      px(ctx, scale, eye.x + 1 + ox, eye.y + 1 + oy, 1, 1);
    } else {
      // closed eye: a soft dark line across the middle row
      ctx.fillStyle = palette.O;
      px(ctx, scale, eye.x, eye.y + 1, 3, 1);
    }
  }
}

// state adds: { mouth, tongue: { length, dirX, dirY } }
export function drawTongue(ctx, state) {
  const { palette, scale, mouth, tongue } = state;
  const { length, dirX, dirY } = tongue;
  const segments = Math.max(2, Math.round(length));
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * length;
    const gx = mouth.x + dirX * t;
    const gy = mouth.y + dirY * t;
    ctx.fillStyle = palette.P;
    px(ctx, scale, gx - 1, gy, 2, 1.1);
  }
  // rounded tip
  const tipX = mouth.x + dirX * length;
  const tipY = mouth.y + dirY * length;
  ctx.fillStyle = palette.P;
  px(ctx, scale, tipX - 1.5, tipY - 0.5, 3, 2);
  // center crease
  ctx.fillStyle = '#c65670';
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * length;
    const gx = mouth.x + dirX * t;
    const gy = mouth.y + dirY * t;
    px(ctx, scale, gx - 0.15, gy, 0.3, 1);
  }
}
