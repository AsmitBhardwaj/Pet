# dodo-web

Marketing + customization front-end for **Dodo**, a pixel-art desktop-pet app.
Upload a photo of your pet → get a personalized pixel companion you can download
and import into the Dodo desktop app.

> This is a separate project from the Dodo Electron app. It does **not** touch or
> depend on that repo.

## What it does

- **Landing page** explaining the product.
- **Upload flow** (planned): pick a photo, species (Dog / Cat / Bear), and a
  shape variant.
- **Client-side color extraction** — dominant colors are read from the photo in
  the browser (`canvas` + `getImageData`). No uploads, no server, no ML API.
- **Live preview** — the selected sprite template is rendered with the extracted
  palette on a canvas.
- **Download flow** — link to the Dodo app installer + export a small
  `dodo-pet-config.json` (species, shape, palette) to skin the app.

## Stack

- Next.js (App Router) — static, no backend/database/auth.
- Tailwind CSS v4.
- Deployed on Vercel (free tier).

Dependencies are intentionally minimal: no CMS, no server-side image processing,
no database, no payments.

## Sprite module

Pixel-grid rendering and palette tinting live in a framework-agnostic module
(plain functions, no React state) so the code can be copied into the Electron
app's renderer without a rewrite. Currently a placeholder shape — real SPRITE
grids get ported from the Electron project later.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (static export-friendly)
```

## Roadmap

1. ✅ Scaffold + landing page + Vercel deploy.
2. Photo upload UI + client-side color extraction.
3. Species/shape picker + live canvas preview.
4. Download flow: config-JSON export + installer link.

**Cross-repo TODO:** the Dodo Electron app's onboarding needs to support
importing `dodo-pet-config.json` on first launch. Track/wire that up in the
Electron repo separately.
