# Dodo — TODO & Context

> A tiny pixel golden-retriever that lives on the desktop and reacts to the mouse and typing.
> Electron widget. Full architecture + decisions live in [`plan.json`](./plan.json) — read that first.

_Last updated: 2026-08-04_

## Quick orientation for agents
- **Entry:** `main.js` (window + global input + IPC) · **Bridge:** `preload.js` · **Art/logic:** `renderer/dog.js` · **Styles:** `renderer/style.css`
- **Sprite:** ASCII grid (`const SPRITE`) at 32×36, SCALE 4, drawn on canvas. Palette is `const C`.
- **Anchors are load-bearing:** eyes rows 10–12 / cols 9–11 & 19–21, mouth (15,19). Any sprite swap must keep these or update `drawEyes`/`drawTongue`/`MOUTH`/`EYES` to match.
- **Run:** `npm start`. **Quit:** right-click the dog → *Quit Dodo* (or Cmd+Q).

## Done ✅
- [x] Fixed broken `npm start` — corrupt `node_modules/electron` (extract-zip produced a stub app). Re-extracted the valid cached zip with system `unzip` + wrote `path.txt`. Electron v33.4.11 verified. _(see `plan.json` → knownIssues.electron-extract-corruption)_
- [x] Confirmed `uiohook-napi` loads (darwin-arm64 prebuild present).
- [x] Swapped in the current `SPRITE` grid per user request.
- [x] Whole-body **drag** — click+drag anywhere on the dog moves the window anywhere on screen (movement-delta based; grab/grabbing cursor). Mouth still pulls the tongue.
- [x] **Quit** — right-click → native *Quit Dodo* menu + Cmd+Q. First discoverable way to remove the widget.
- [x] **First-run onboarding card** — one-time "Drag me / Right-click to quit / reacts to mouse & typing" (persists `onboarded` flag).
- [x] **macOS permission helper** — functional detection (no input events within 4s ⇒ prompt); card with "Open Settings" deep-link + "Restart Dodo"; self-dismisses when events start.
- [x] **Window position persistence** — saved to `userData/settings.json`, restored on launch if still on-screen.

## In progress / current focus 🔧
- [ ] **Perfect the current single-dog widget** — polish interactions and feel before adding new systems.

## User action required ⚠️
- [ ] Grant macOS **Input Monitoring** (and likely **Accessibility**) so typing-heat + eye-tracking fire. The in-app permission card now guides this: **Open Settings** (deep-links to the pane) → enable Dodo → **Restart Dodo**. In dev the permission attaches to the terminal app; a packaged build attaches to `Dodo.app`.

## Custom pets — decided approach: TEMPLATE + TRAITS 🐾
Chosen 2026-08-04. Photo → Claude vision → small traits JSON → deterministic template renderer → valid sprite. v1 recolors a fixed base shape (anchors never move); markings + ear variants are v2.
- [x] **Template renderer** (`lib/spriteTemplate.js`, UMD — Node + browser global) — `buildSprite(traits)` → `{ grid, palette, anchors }` with derived shade/light/outline + `validateSprite()`. Demo: `node scripts/demo-sprite.js`.
- [x] Step 3 — **App is data-driven**: `renderer/dog.js` renders from a sprite object via `applySprite()` (grid/palette/anchors/tintable), default built from the template (exact original colors). Base grid lives once in `lib/spriteTemplate.js`. Live demo: right-click → **Try a pet** swaps sprites via the `set-sprite` IPC. `lib/**` added to build `files`.
- [ ] Step 4 — **Vision step**: photo → traits JSON via Claude (load the claude-api reference before building).
- [ ] v2 — markings (chest patch), ear variants (floppy/pointy), more species (cat).
- [ ] **Sprite picker** + per-pet download (a pet = one small JSON file).

## Backlog / later 🔭
- [ ] Optional **menu-bar (tray) icon** with Quit/Hide/Show (needs a small icon asset).
- [ ] **Photo → pixel-sprite** pipeline for custom pets. Recommended **template-based** (fixed pose + eye/mouth regions; photo drives coat colors/markings/ears) so interactions keep working. Consider bumping the grid to ~48–64 for likeness.
- [ ] Per-pet **distribution**: once sprites are data files, a "pet" is just a small downloadable file — no per-pet app rebuild.
- [ ] Decide whether to remove the now-redundant legacy `#drag-handle`.
- [ ] **Launch-at-login** toggle in the right-click menu (`app.setLoginItemSettings`).
- [ ] macOS **usage-description string** for input monitoring via `build.mac.extendInfo` (nicer permission prompt).
- [ ] Fix **BUILD.md name drift** ("Comnyang" → "Dodo"; dmg is `Dodo-0.1.0-arm64.dmg`).
- [ ] Optional: add a **Content-Security-Policy** meta to `index.html` to silence the Electron dev CSP warning.

## Gotchas to remember
- Frameless + `skipTaskbar` ⇒ **no OS close button**; quitting must be app-provided.
- If `npm start` fails with an Electron launch error, suspect the extract-zip corruption again — re-extract the cached zip (see `plan.json`).
- IPC/preload namespace is `window.comnyang` (legacy name from a cat-widget predecessor) — don't be surprised by it.
- Global input is best-effort: `main.js` wraps `uiohook-napi` in try/catch, so the app runs even if hooks/permissions fail — the reactions just go silent.
