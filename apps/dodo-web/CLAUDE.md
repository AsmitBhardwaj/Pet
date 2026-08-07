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

- **Phase 1 only.** Bare Next.js scaffold + a single landing page (`app/page.js`,
  `app/layout.js`, `app/globals.css`), restyled to the retro black-and-white
  pixel/CRT theme. Nothing else is built: **no** upload flow, **no** species/
  shape picker, **no** download flow, **no** live preview.
- **Does NOT use `sprite-core` yet.** The landing page renders a hand-drawn
  placeholder, `app/components/PixelDodo.js`. When the real preview is built
  (root Open issues #1 / Phase 3), it MUST import `sprite-core`'s render
  functions so the web preview matches the Electron app pixel-for-pixel — do not
  reimplement sprite/palette logic here.
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
