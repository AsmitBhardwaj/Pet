# Dodo — agent context

Dodo is an **Electron desktop-pet widget**: a tiny pixel golden-retriever that lives on the
desktop and reacts to the mouse and typing.

## Read these first (required context)
- **[`plan.json`](./plan.json)** — source of truth: architecture, IPC channels, sprite format,
  interactions, decisions, known issues, and roadmap.
- **[`TODO.md`](./TODO.md)** — current status and what's next (Done / In-progress / Next / Backlog).

Keep both files updated when architecture, decisions, or the roadmap change.

## Fast facts
- **Files:** `main.js` (window + global input + IPC) · `preload.js` (bridge, namespace `window.comnyang`) · `renderer/dog.js` (sprite + interactions) · `renderer/style.css`.
- **Sprite:** ASCII grid `const SPRITE` at 32×36, SCALE 4, palette `const C`. **Anchors are load-bearing** — eyes rows 10–12 / cols 9–11 & 19–21, mouth (15,19). A sprite swap must preserve these or update `EYES`/`MOUTH`/`drawEyes`/`drawTongue` to match.
- **Run:** `npm start`. **Quit the widget:** right-click the dog → *Quit Dodo* (or Cmd+Q). It's frameless + skips the taskbar, so there is no OS close button.
- **Global input** (`uiohook-napi`) needs macOS Input Monitoring/Accessibility — not grantable from code; without it the app runs but typing/cursor reactions go silent.
- If `npm start` fails to launch Electron, suspect the extract-zip corruption documented in `plan.json` → `knownIssues.electron-extract-corruption`.
