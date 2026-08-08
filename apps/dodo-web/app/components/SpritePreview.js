"use client";

// SpritePreview — renders a pet from a coat palette using sprite-core's own
// draw functions, the SAME ones apps/dodo's renderer calls. This is the payoff
// of sprite-core: the web preview is pixel-for-pixel what the app will draw for
// the exported config. Do NOT hand-draw the sprite here — go through sprite-core.
//
// We reproduce the app's resting frame (renderer/dog.js drawDog): tongue behind
// the head, body, then eyes on top; heat 0, no cursor tracking, not blinking.

import { useEffect, useRef } from "react";
import {
  buildSprite,
  drawSprite,
  drawEyes,
  drawTongue,
} from "sprite-core";

// Device-pixel scale per grid cell. 32x36 grid -> 256x288 canvas. Rendered
// crisp (imageSmoothingEnabled=false) and upscaled by CSS with pixelation.
const SCALE = 8;

export default function SpritePreview({ coat, className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    // Build the sprite exactly as the app does: species + coat -> full sprite.
    // Fixed roles (outline/nose/eye/tongue) fall back to sprite-core defaults,
    // matching the app's default pet.
    const sprite = buildSprite({ species: "dog", coat });
    const eyes = sprite.anchors.eyes;
    const isEyeCell = (col, row) =>
      eyes.some(
        (e) => col >= e.x && col <= e.x + 2 && row >= e.y && row <= e.y + 2
      );

    // The plain state object sprite-core's renderer consumes — same shape as
    // renderer/dog.js spriteState(), at rest.
    const state = {
      grid: sprite.grid,
      palette: sprite.palette,
      tintable: sprite.tintable,
      scale: SCALE,
      heat: 0,
      isEyeCell,
      eyes,
      mouth: sprite.anchors.mouth,
      cursorDX: 0,
      cursorDY: 0,
      blinking: false,
      tongue: { length: 2, dirX: 0, dirY: 1 },
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTongue(ctx, state); // behind the head so it comes "out" of the mouth
    drawSprite(ctx, state);
    drawEyes(ctx, state);
  }, [coat]);

  return (
    <canvas
      ref={canvasRef}
      width={32 * SCALE}
      height={36 * SCALE}
      className={`pixelated ${className}`}
      aria-label="Live preview of your pet"
    />
  );
}
