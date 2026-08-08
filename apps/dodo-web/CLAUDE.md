# dodo-web (apps/dodo-web) — agent context

The **Dodo marketing/customizer website**: a Next.js (JavaScript) + Tailwind app
where users will upload a pet photo, pick a species/shape, preview the sprite,
and download a personalized JSON config + the installer. This is the web app
package inside the **monorepo** (npm workspaces).

## Read first (required context)

- **Root [`CLAUDE.md`](../../CLAUDE.md)** — the cross-app source of truth: product
  direction, repo layout, `sprite-core` rule, Status, Open issues, and the full
  **Design system** for this site. Read it before touching anything here.

Keep the root CLAUDE.md (Status / Open issues / Design system) updated when
something here meaningfully changes. Don't duplicate that content in this file.

## Current state (honest, not aspirational)

- **Phases 1 + 2 done.** Landing page (`app/page.js`, `app/layout.js`,
  `app/globals.css`) in the retro B&W pixel/CRT theme, plus a working
  photo-to-config **customizer** in the `#create` section.
- **Phase 2 customizer** (`app/components/Customizer.js` + `PhotoCropper.js` +
  `SpritePreview.js`, glue in `app/lib/extract.js`): drag-drop/click **upload**
  → draggable/resizable **square crop** (no ML subject detection, by design) →
  client-side **color extraction** → **live preview** → **JSON export**
  (`dodo-pet-config.json`). All client-side; nothing is uploaded.
- **Uses `sprite-core` now.** Extraction goes through `extractDominantColor` +
  `deriveCoat`; the preview renders with sprite-core's `drawSprite`/`drawEyes`/
  `drawTongue` (same funcs as the Electron renderer, so it's pixel-accurate).
  `sprite-core` is a declared dep and compiled via `transpilePackages` in
  `next.config.mjs`. Any color/sprite math still belongs in sprite-core, never
  here — the only web-side code is DOM/canvas glue.
- **Still placeholder:** the hero visual uses the hand-drawn
  `app/components/PixelDodo.js` (root Open issue #1). Species/shape are
  **hardcoded** to `dog`/`retriever` — the real picker gallery is Phase 3
  (needs the 2nd dog + cat shapes, which don't exist in sprite-core yet).
- **Not built:** Phase 3 (species/shape picker), Phase 4 (installer download
  link — the JSON-export half already works).
- Folded into this monorepo from a standalone repo (history preserved). No
  per-app `package-lock.json` — the root lockfile is authoritative.

## Run

- `npm run dev:web` from the repo root (or `npm run dev -w apps/dodo-web`) → Next
  dev server on `http://localhost:3000`.
- `npm run build:web` for a production build.

## Notes

- `AGENTS.md` here is **auto-generated and re-added by `next dev`** (a Next.js
  agent-rules block), not hand-maintained project context — leave it to Next.
- All visual/theme decisions follow the **Design system** section in the root
  CLAUDE.md. The one place color is allowed is inside sprite preview frames;
  everything else is strictly black/white/one-gray.
