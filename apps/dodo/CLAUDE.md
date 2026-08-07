# Dodo (apps/dodo) — agent context

Dodo is an **Electron desktop-pet widget**: a tiny pixel golden-retriever that lives on the
desktop and reacts to the mouse and typing. This is the app package inside the **monorepo**
(npm workspaces).

## Read these first (required context)
- **Root [`CLAUDE.md`](../../CLAUDE.md)** — the cross-app source of truth: monorepo repo layout,
  architecture, Status, Open issues, Known gotchas, Design system. Read it before the files below.
- **[`plan.json`](./plan.json)** — architecture, IPC channels, sprite format, interactions,
  decisions, known issues, roadmap.
- **[`TODO.md`](./TODO.md)** — current status and what's next.

Keep `plan.json`/`TODO.md` and the root CLAUDE.md updated when architecture/decisions/roadmap change.

## Fast facts
- **Files:** `main.js` (window + global input + IPC) · `preload.js` (bridge, namespace `window.comnyang`) · `renderer/dog.js` (interactions + orchestration) · `renderer/style.css`.
- **Sprite is NOT local anymore.** Grids, palette roles, tint math, and the draw functions live in the shared **`sprite-core`** package (`../../packages/sprite-core`). `dog.js` does `import { buildSprite, drawSprite, drawEyes, drawTongue, lerp } from 'sprite-core'` — there is no `const SPRITE`/`const C` or `window.SpriteTemplate` global. The 32×36 grid + load-bearing anchors (eyes rows 10–12 / cols 9–11 & 19–21, mouth (15,19)) live in `sprite-core/src/sprite-data.js`; a sprite change happens there, not here.
- **Renderer is bundled.** The renderer has no bundler + `contextIsolation`, so **esbuild** bundles `renderer/dog.js` + `sprite-core` → `renderer/dog.bundle.js` (gitignored). `index.html` loads only the bundle.
- **Run:** `npm start` (from the repo root, or `-w apps/dodo`) — runs `build:renderer` (esbuild) then `electron .`. **Quit:** right-click the dog → *Quit Dodo* (or Cmd+Q). Frameless + skips the taskbar, so no OS close button.
- **Onboarding:** on first launch (no saved `petConfig`) the renderer shows a single **import step** — a `<input type="file">` dropzone that reads the website's `.json` config, validates it, then `savePetConfig` → `renderSavedPet`. Right-click menu: **"Get a new pet…"** (opens the dodo-web site via `DODO_WEB_URL`) and **"Import new pet…"** (opens the import card). No in-app photo/species/shape wizard — that's on the website by design.
- **Packaging:** `npm run dist:mac` — bundles the renderer, then runs the **workspace-safe** packager `scripts/package.mjs` (staging copy in a space-free temp; plain `electron-builder` breaks in npm workspaces). Output → `apps/dodo/dist/`. See [`BUILD.md`](./BUILD.md).
- **Global input** (`uiohook-napi`) needs macOS Input Monitoring/Accessibility — not grantable from code; without it the app runs but typing/cursor reactions go silent.
- If `npm start` fails to launch Electron, suspect the extract-zip corruption (corrupt ~256K `node_modules/electron/dist`); fix per root `CLAUDE.md` → Known gotchas (extract the cached zip with system `unzip` + write `path.txt`).
