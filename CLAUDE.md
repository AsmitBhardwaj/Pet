# Dodo — Project Context for Claude Code (monorepo root)

This file is the **single source of truth** for the whole Dodo project. Read it
in full at the start of every session before touching code. The two apps each
have a short scoped `CLAUDE.md` that points back here — this is the file to
keep current. Update the **Status** and **Open issues** sections at the end of
any session where something meaningfully changed; stale context here is worse
than none, so keep it honest rather than aspirational.

## What Dodo is

A desktop pet app (Electron, macOS/Windows) that renders a small pixel-art
animal in the corner of the screen. It reacts to the user's mouse and keyboard
and has an interactive stretchy tongue. The product pivot: users upload a photo
of their real pet on the **website**, pick a species/shape, and download a
personalized JSON config (color-matched to their pet) that the desktop app
imports to skin itself.

## Repo layout (npm workspaces monorepo)

```
package.json          root; workspaces = ["apps/*", "packages/*"]
packages/
  sprite-core/        framework-agnostic sprite logic — NO Electron or Next
                       imports allowed in here. Consumed by both apps.
    src/index.js         public exports (buildSprite, drawSprite, drawEyes, …)
    src/sprite-data.js   SPRITE pixel grids + load-bearing anchors
    src/palette.js       palette roles + lerp/tint math
    src/render.js        canvas-agnostic draw functions
    (src/color-extract.js — PLANNED, not yet created: photo → 2-3 colors)
apps/
  dodo/               Electron app (the original standalone repo, now a workspace)
  dodo-web/           Next.js site (folded in from its own repo, history preserved)
```

Both apps and `sprite-core` are real, present workspace members (verified via
`npm query .workspace`). `apps/dodo-web` was folded in from a previously
separate repo with history preserved.

**Rule:** if you're about to write sprite grid data, palette/tint math, or
color-extraction logic inside `apps/dodo` or `apps/dodo-web` directly, stop —
it belongs in `packages/sprite-core` and should be imported, not duplicated.
This project already hit a real bug (sprite-version confusion) caused by two
copies of similar logic in different places. Do not recreate that.

## Commands (run from the repo root)

- `npm install` — installs all workspaces (run after any dependency change).
- `npm start` — build + launch the Electron app (`-w apps/dodo`).
- `npm run dist:mac` / `dist:win` / `dist:all` — package the desktop app.
- `npm run dev:web` — Next.js dev server for the site (`-w apps/dodo-web`).
- `npm run build:web` — production build of the site.
- `npm run build:renderer` — esbuild bundle of the Electron renderer + sprite-core.

## Product direction

- **Species:** Dog, Cat, Bear.
- **Dog** needs 2 shape variants: floppy-eared/retriever-build and
  pointy-eared/shepherd-build. Shape variant + color together, since color
  alone doesn't sell breed identity.
- **Cat** = 1 shape, color-swap only.
- **Bear** = reuses the existing pointy-eared sprite as-is, just recolor. (This
  sprite was originally built as "the dog" — it's being repurposed as the bear.)
- **Color extraction:** entirely client-side, no ML/AI service. Sample the
  uploaded photo, extract 2-3 dominant colors via basic bucketing, map onto the
  sprite's existing palette *roles* — main coat, light coat, dark shadow.
  Outline, nose, eyes, and tongue colors stay fixed; only coat tones change.
- **Distribution model:** NOT per-user compiled binaries (too much infra).
  Instead: ONE universal installer (built/signed once) + a small personalized
  JSON config file (species, shape, extracted palette colors) that the app
  imports on first launch to skin itself. The website generates this config
  client-side and offers it as a download alongside the installer link.
- **Monetization:** free for now, not a current concern.
- **Hosting:** dodo-web deploys to Vercel free tier, no
  backend/database/auth/payments. Installer binaries (90MB+) are hosted as
  GitHub Releases, not on Vercel — the website links out to the release asset.

## Electron app architecture (apps/dodo)

See `apps/dodo/CLAUDE.md`, `apps/dodo/plan.json`, and `apps/dodo/TODO.md` for
the app-scoped detail. Summary:

- `main.js` — transparent, frameless, always-on-top BrowserWindow. Uses
  `uiohook-napi` for GLOBAL mouse/keyboard tracking (works even when unfocused;
  wrapped in try/catch so the app still runs if hooks/permissions fail).
- `preload.js` — contextBridge (namespace `window.comnyang`, a legacy name)
  exposing cursor-update / typing-tick events to the renderer.
- `renderer/dog.js` — draws the pet on canvas. **Sprite logic lives in
  `sprite-core`**, imported (`buildSprite`, `drawSprite`, `drawEyes`,
  `drawTongue`, `lerp`) — no local `const SPRITE`/`const C`. The renderer is
  bundled by esbuild (`renderer/dog.js` + sprite-core → `renderer/dog.bundle.js`,
  gitignored) because there's no bundler under `contextIsolation`.
  - Eyes track cursor direction; typing ramps a "heat" value that tints coat
    colors toward red via sprite-core's lerp/tint (same math photo-recoloring
    needs, hence it lives in sprite-core).
  - Tongue: damped-spring physics anchored at the mouth, driven by local
    pointer events — drag near the mouth to stretch, release to snap back.
  - **Full-body window dragging is implemented**: pointer-down anywhere on the
    body outside the tongue hit-radius → renderer sends `window-move-by` IPC →
    `main.js` repositions the frameless window 1:1 with the cursor.
- **Onboarding:** on first launch (no saved `petConfig`) the renderer shows a
  single **import step** — an `<input type="file">` dropzone that reads the
  website's `.json` config (`{ version, species, shape, coat:{base,light,shade} }`),
  validates it, then `savePetConfig` → `renderSavedPet`. No in-app photo/
  species/shape wizard — that's on the website by design. File-picking is
  renderer-side only (no native `dialog.showOpenDialog` IPC).
- **Right-click menu** (the only way to close the frameless widget): **"Get a
  new pet…"** (opens dodo-web via `DODO_WEB_URL`), **"Import new pet…"** (opens
  the import card), separator, **"Quit Dodo"** (Cmd+Q).
- **Packaging:** `npm run dist:mac` bundles the renderer, then runs the
  **workspace-safe** packager `scripts/package.mjs` (staging copy in a
  space-free temp; plain `electron-builder` breaks under npm workspaces).
  Output → `apps/dodo/dist/`. See `apps/dodo/BUILD.md`.

## dodo-web (apps/dodo-web)

Next.js (JavaScript) + Tailwind. **Phase 1 only:** bare scaffold + landing page,
restyled to the retro B&W pixel theme (see Design system below). Now a workspace
in this monorepo (was a standalone repo). Boots via `npm run dev:web`.

- It currently uses its **own placeholder** `app/components/PixelDodo.js`, NOT
  `sprite-core`. When the live-preview canvas is built (Phase 3) it MUST use
  `sprite-core`'s render functions so the web preview matches the Electron app
  pixel-for-pixel — do not reimplement. Reconcile the placeholder then.
- Vercel deploy is left for the user to connect/confirm.
- `AGENTS.md` in that folder is auto-generated/re-added by `next dev` (a Next.js
  agent-rules block) — not hand-maintained context.

Phased plan (2–4 not yet built):
1. Scaffold + deploy (bare Next.js on Vercel). — **done (scaffold + landing + B&W)**
2. Photo upload + client-side color extraction (via sprite-core).
3. Species/shape picker + live preview canvas (via sprite-core `render`).
4. Download flow (universal installer link + generated JSON config).

## Known gotchas

- **Spaces in path broke `uiohook-napi` native builds.** The project was moved
  to a space-free path (currently `~/Documents/Dodo-widget/Dodo/Dodo2`) and
  `npm run dist:mac` now rebuilds `uiohook-napi` for arm64 and produces the dmg
  cleanly. **Keep the project in a space-free path.**
- **Dev binary corruption / Gatekeeper flags** during raw `npm start` have
  happened (corrupt `node_modules/electron/dist` from extract-zip). If Electron
  fails to launch, re-extract the cached zip with system `unzip` + write
  `path.txt` (see `apps/dodo/plan.json` → knownIssues). Packaging via
  `electron-builder` sidesteps this since it downloads its own clean Electron.
  Build unsigned first: `CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac`.
- **macOS permissions**: eye-tracking/typing-heat require Accessibility + Input
  Monitoring (System Settings → Privacy & Security) granted to whatever process
  runs the app — the terminal in dev, `Dodo.app` in a packaged build. Prefer
  testing packaged builds when debugging permission-dependent behavior.
- `.gitignore` should exclude `node_modules/`, `dist/`, `.DS_Store`, and the
  generated `apps/dodo/renderer/dog.bundle.js`. Do NOT commit a per-app
  `package-lock.json` inside a workspace — the root lockfile is authoritative.

## Status (update this section each session)

- **Monorepo:** npm workspaces (`apps/*`, `packages/*`). All three members —
  `apps/dodo`, `apps/dodo-web`, `packages/sprite-core` — resolve and install
  from the root lockfile.
- **Space-free move:** done. Project lives at `~/Documents/Dodo-widget/Dodo/Dodo2`.
- **dodo-web fold-in:** done (history preserved) and registered as a workspace;
  a stale standalone `package-lock.json` was removed and the root lockfile
  regenerated.
- **sprite-core:** extracted. Sprite grids/anchors, palette roles, and tint math
  live here; `apps/dodo`'s renderer imports it (esbuild-bundled). `color-extract`
  is not yet added.
- **Electron app:** functional prototype (cursor tracking, tongue physics, heat
  tinting, idle blink/tail). **Full-body window dragging implemented.** Onboarding
  is a single JSON-config import step (wizard removed). Right-click menu is the
  two-item "Get a new pet…" / "Import new pet…" + Quit. `npm start` launches and
  `npm run dist:mac` builds `Dodo-0.1.0-arm64.dmg` cleanly from the new path.
- **dodo-web:** Phase 1 (Next.js/Tailwind scaffold + B&W landing page), boots via
  `npm run dev:web`. Uses its own placeholder `PixelDodo`, not sprite-core yet.
  Phases 2–4 not built. Vercel deploy not yet connected.
- Only two sprite shapes exist: the original pointy-eared shape (slated to become
  the Bear) and one floppy-eared retriever shape. The 2nd dog shape
  (shepherd-build) and the cat shape are not yet made.

## Open issues / next steps, in rough order

1. **Reconcile dodo-web to use `sprite-core`** for its preview instead of the
   placeholder `PixelDodo`, so a second sprite implementation doesn't linger.
2. Add `sprite-core/src/color-extract.js` (photo → 2-3 dominant coat colors,
   client-side bucketing) shared by the web upload flow.
3. Build the remaining shape templates: 2nd dog shape (shepherd-build), 1 cat
   shape.
4. dodo-web Phases 2–4: upload + color extraction, species/shape picker + live
   preview (sprite-core `render`), download flow (installer link + JSON config
   export). Phase 4's exported JSON is what the app's import step consumes.
5. Connect/confirm the Vercel deploy and set the real `DODO_WEB_URL` in
   `apps/dodo/main.js` (currently the placeholder `https://dodo-web.vercel.app`).

## Design system (dodo-web)

The site is a full retro black-and-white pixel aesthetic. This replaced an
earlier warm/amber theme — do not reintroduce amber, gold, or any other accent
color. If you're about to add a color variable that isn't black, white, or a
single mid-gray, stop and check this section first.

**Core rule:** the site itself is strictly black and white/grayscale. The ONLY
color allowed anywhere is the pet's own extracted coat colors, and only inside
sprite preview frames. Buttons, badges, icons, and backgrounds never use color.

- **Background:** `#000000`. **Primary text/borders/icons:** `#FFFFFF`.
  **Secondary/muted text:** one mid-gray, e.g. `#888888`. No accent token.
- **Headings/nav logo/button labels:** pixel font, "Press Start 2P" (Google
  Fonts). Keep headline text short — this font is wide.
- **Body copy:** the normal sans font already in use. Never put paragraph text
  in the pixel font — unreadable at small sizes.
- **Buttons:** blocky/stepped corners (clip-path, no border-radius), hard offset
  shadow (e.g. `4px 4px 0 #555`, no blur). Primary = white-fill/black-text,
  secondary = black-fill/white-border.
- **Cards:** 2-3px solid white border, sharp or minimally stepped corners, no
  shadow blur.
- **Icons:** monochrome/1-bit pixel-style glyphs, not smooth vector icons or emoji.
- **Sprite preview frames:** the one place color is allowed — framed like a
  small monitor (thick border, dark interior) so the pet's real color reads as
  intentional contrast.
- **Retro/CRT texture:** subtle scanline overlay (~4-8% opacity), faint
  pixel-grid section backgrounds, soft corner vignette. All effects stay
  cheap/non-distracting and respect `prefers-reduced-motion`. Never let texture
  reduce text contrast.

If a future request would move the site away from this system, treat it as a
deliberate redesign decision to flag back to the user, not a small tweak.

## Working conventions

- Solo project; keep tooling simple (no CI/CD complexity, no premature
  abstraction) unless a specific pain point demands it.
- Prefer editing/extending existing files over rewriting from scratch.
- When a decision in this file turns out to be wrong or outdated, update the
  file — don't silently work around it and leave stale context for next session.
