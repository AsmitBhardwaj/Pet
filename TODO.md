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

## In progress / current focus 🔧
- [ ] **Perfect the current single-dog widget** — polish interactions and feel before adding new systems.

## User action required ⚠️
- [ ] Grant macOS **Input Monitoring** (and likely **Accessibility**) so typing-heat + eye-tracking fire. System Settings → Privacy & Security. In dev this attaches to the terminal app; a packaged build attaches to `Dodo.app`.

## Next 🟡
- [ ] Make sprites **data-driven**: move `SPRITE` + palette + anchors into `sprites/*.json` and load dynamically. Foundation for multi-pet + downloads.
- [ ] **Sprite picker** to switch between pets.

## Backlog / later 🔭
- [ ] Optional **menu-bar (tray) icon** with Quit/Hide/Show (needs a small icon asset).
- [ ] **Photo → pixel-sprite** pipeline for custom pets. Recommended **template-based** (fixed pose + eye/mouth regions; photo drives coat colors/markings/ears) so interactions keep working. Consider bumping the grid to ~48–64 for likeness.
- [ ] Per-pet **distribution**: once sprites are data files, a "pet" is just a small downloadable file — no per-pet app rebuild.
- [ ] Decide whether to remove the now-redundant legacy `#drag-handle`.

## Gotchas to remember
- Frameless + `skipTaskbar` ⇒ **no OS close button**; quitting must be app-provided.
- If `npm start` fails with an Electron launch error, suspect the extract-zip corruption again — re-extract the cached zip (see `plan.json`).
- IPC/preload namespace is `window.comnyang` (legacy name from a cat-widget predecessor) — don't be surprised by it.
- Global input is best-effort: `main.js` wraps `uiohook-napi` in try/catch, so the app runs even if hooks/permissions fail — the reactions just go silent.
