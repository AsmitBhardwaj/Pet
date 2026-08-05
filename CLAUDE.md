# Dodo — Project Context for Claude Code

This file is the persistent source of truth for this project. Read it in
full at the start of every session before touching code. Update the
**Status** and **Open Issues** sections at the end of any session where
something meaningfully changed — stale context here is worse than no
context, so keep it honest rather than aspirational.

## What Dodo is

A desktop pet app (Electron, macOS/Windows) that renders a small pixel-art
animal in the corner of the screen. It reacts to the user's mouse and
keyboard and has an interactive stretchy tongue. The product pivot: users
upload a photo of their real pet, pick a species/shape, and get a
personalized version of the sprite (color-matched to their pet) as their
desktop companion.

## Repo layout (monorepo)

```
packages/
  sprite-core/      framework-agnostic sprite logic — NO Electron or Next
                     imports allowed in here. Consumed by both apps.
    src/sprite-data.js   SPRITE pixel grids, one per species/shape
    src/palette.js       palette roles + lerpColor/tint math
    src/render.js        canvas-agnostic draw(ctx, spriteState)
    src/color-extract.js photo -> 2-3 dominant colors (client-side bucketing)
apps/
  dodo/              Electron app (existing, was standalone repo)
  dodo-web/          Next.js site (new): upload, preview, download
```

**Rule:** if you're about to write sprite grid data, palette/tint math, or
color-extraction logic inside `apps/dodo` or `apps/dodo-web` directly,
stop — it belongs in `packages/sprite-core` and should be imported, not
duplicated. This project has already hit a real bug (sprite-version
confusion) caused by having two copies of similar logic in different
places. Do not recreate that.

## Product direction

- **Species:** Dog, Cat, Bear.
- **Dog** needs 2 shape variants: floppy-eared/retriever-build and
  pointy-eared/shepherd-build. Shape variant + color together, since
  color alone doesn't sell breed identity.
- **Cat** = 1 shape, color-swap only.
- **Bear** = reuses the existing pointy-eared sprite as-is, just recolor.
  (This sprite was originally built as "the dog" — it's being repurposed
  as the bear. See Open Issues below for why this matters.)
- **Color extraction:** entirely client-side, no ML/AI service. Sample
  the uploaded photo, extract 2-3 dominant colors via basic bucketing,
  map onto the sprite's existing palette *roles* — main coat, light coat,
  dark shadow. Outline, nose, eyes, and tongue colors stay fixed; only
  coat tones change.
- **Distribution model:** NOT per-user compiled binaries (too much infra
  — build farm, per-user signing/notarization, storage). Instead: ONE
  universal installer (built/signed once) + a small personalized JSON
  config file (species, shape, extracted palette colors) that the app
  imports on first launch to skin itself. The website generates this
  config client-side and offers it as a download alongside the installer
  link.
- **Monetization:** free for now, not a current concern.
- **Hosting:** dodo-web deploys to Vercel free tier, no
  backend/database/auth/payments. Installer binaries (90MB+) are hosted
  as GitHub Releases on this repo, not on Vercel — the website links out
  to the release asset.

## Electron app architecture (apps/dodo)

- `main.js` — transparent, frameless, always-on-top BrowserWindow. Uses
  `uiohook-napi` for GLOBAL mouse/keyboard tracking (works even when the
  window isn't focused).
- `preload.js` — contextBridge exposing cursor-update and typing-tick
  events to the renderer.
- `renderer/dog.js` — draws the pet on canvas. Should eventually just
  call into `packages/sprite-core` rather than owning grid/palette data
  itself.
  - Eyes (`EYES` array of {x,y} grid coords) track cursor direction.
  - "Heat" value ramps up while typing, decays when idle, tints coat
    colors toward red via `lerpColor`/`tint` — same math needed for
    photo-based recoloring, hence belongs in sprite-core.
  - Tongue: damped-spring physics, anchored at `MOUTH` {x,y}, driven by
    local pointer events (not the global hook) — drag near mouth to
    stretch, release to snap back.
  - Idle blink + tail motion.
  - Canvas is `no-drag` (needed so the tongue can capture pointer
    events). Window dragging currently only works via a small
    translucent tab at the top.

## dodo-web (apps/dodo-web)

Not yet built. Phased plan already given to Claude Code:
1. Scaffold + deploy (bare Next.js app live on Vercel).
2. Photo upload + client-side color extraction.
3. Species/shape picker + live preview canvas.
4. Download flow (universal installer link + generated JSON config).

The live-preview canvas must use `packages/sprite-core`'s `render.js` so
the web preview matches the real Electron app pixel-for-pixel — no
separate reimplementation.

## Known gotchas

- **`uiohook-napi` + spaces in path**: native builds broke when the
  project lived in a path containing spaces. Keep the project in a
  space-free path.
- **Dev binary corruption / Gatekeeper flags** during raw `npm start`
  have happened before. Packaging via `electron-builder`
  (`npm run dist:mac`) sidesteps this since it downloads its own clean
  Electron copy. Build unsigned first:
  `CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac`
  before dealing with code signing/notarization ($99/yr Apple Developer
  account — see BUILD.md for the full sequence).
- **macOS permissions**: eye-tracking/typing-heat require Accessibility +
  Input Monitoring (System Settings → Privacy & Security) granted to
  whatever process runs the app. In dev that's the terminal; in a
  packaged build it's Dodo.app itself — more stable, so prefer testing
  packaged builds over `npm start` when debugging permission-dependent
  behavior.
- `.gitignore` should exclude `node_modules/`, `dist/`, `.DS_Store` in
  every package/app.

## Status (update this section each session)

- Electron app: functional prototype (cursor tracking, tongue physics,
  heat tinting, idle blink/tail). Full-body window dragging NOT yet
  implemented — only a small handle tab works.
- Only two sprite shapes exist so far: the original pointy-eared shape
  (now slated to become the Bear) and one floppy-eared retriever shape.
  The 2nd dog shape (shepherd-build) and the cat shape are not yet made.
- dodo-web: not yet started / placeholder only.
- sprite-core package: not yet extracted — sprite/palette logic still
  lives inside `apps/dodo`'s renderer, and a placeholder duplicate may
  exist in dodo-web scaffolding. Extracting this into a real shared
  package is the top priority before dodo-web goes past Phase 1.

## Open issues / next steps, in rough order

1. Confirm what sprite is actually live in `apps/dodo/renderer/dog.js`
   right now (there was unresolved confusion about whether the newer
   floppy-eared sprite made it in, or whether `npm start` is still
   showing the older pointy-eared one). This may be moot now that the
   pointy-ear shape is being repurposed as the Bear — but explicitly
   confirm which grid is which before building on top of it.
2. Extract `packages/sprite-core` from the existing renderer code (grids,
   palette, tint math) so there is one source of truth.
3. Build dodo-web Phase 1 (scaffold + Vercel deploy) importing
   sprite-core for its placeholder preview from day one — don't let a
   second placeholder implementation happen.
4. Build the remaining shape templates: 2nd dog shape (shepherd-build),
   1 cat shape.
5. dodo-web Phases 2-4: upload + color extraction, species/shape picker
   + live preview, download flow (installer link + JSON config export).
6. Implement full-body dragging in the Electron app: mousedown outside
   the tongue's hit-radius near the mouth → track deltas → ipc to main
   process to reposition window. (Can't use simple
   `-webkit-app-region: drag` everywhere since that would break tongue
   dragging.)
7. Wire up the Electron app's onboarding flow to import the JSON config
   exported by the website.

## Design system (dodo-web)

The site is a full retro black-and-white pixel aesthetic. This replaced
an earlier warm/amber theme — do not reintroduce amber, gold, or any
other accent color into the theme. If you're about to add a color
variable that isn't black, white, or a single mid-gray, stop and check
this section first.

**Core rule:** the site itself is strictly black and white/grayscale.
The ONLY color allowed anywhere is the pet's own extracted coat colors,
and only inside sprite preview frames. Buttons, badges, icons, and
backgrounds never use color.

- **Background:** `#000000`. **Primary text/borders/icons:** `#FFFFFF`.
  **Secondary/muted text:** one mid-gray, e.g. `#888888`. No accent
  token.
- **Headings/nav logo/button labels:** pixel font, "Press Start 2P"
  (Google Fonts). Keep headline text short — this font is wide.
- **Body copy:** stays the normal sans font already in use. Never put
  paragraph text in the pixel font — unreadable at small sizes.
- **Buttons:** blocky/stepped corners (clip-path, no border-radius),
  hard offset shadow (e.g. `4px 4px 0 #555`, no blur). Primary =
  white-fill/black-text, secondary = black-fill/white-border.
- **Cards:** 2-3px solid white border, sharp or minimally stepped
  corners, no shadow blur.
- **Icons:** monochrome/1-bit pixel-style glyphs, not smooth vector
  icons or emoji.
- **Sprite preview frames:** the one place color is allowed — framed
  like a small monitor (thick border, dark interior) so the pet's real
  color reads as intentional contrast, not inconsistency.
- **Retro/CRT texture:** subtle scanline overlay (~4-8% opacity), faint
  pixel-grid section backgrounds, soft corner vignette. All effects stay
  cheap/non-distracting and respect `prefers-reduced-motion` (static,
  no animation, if that's set). Never let texture reduce text contrast.

If a future request would move the site away from this system, treat it
as a deliberate redesign decision to flag back to the user, not a small
tweak to just make.

## Working conventions

- This is a solo project; keep tooling simple (no CI/CD complexity, no
  premature abstraction) unless a specific pain point demands it.
- Prefer editing/extending existing files over rewriting from scratch.
- When a decision in this file turns out to be wrong or outdated, update
  the file — don't silently work around it and leave stale context for
  the next session.
