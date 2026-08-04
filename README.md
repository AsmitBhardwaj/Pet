# Dodo 🐾

Dodo is a tiny pixel pet that lives on your desktop — but instead of a
generic mascot, **it's modeled on your own pet.** Send a photo of your
dog (or cat), and Dodo turns it into a small pixel-art sprite that sits
in the corner of your screen, reacts to what you're doing, and feels
like *yours* instead of a stock character.

## The idea

1. **You send a picture of your pet.**
2. **We turn it into a pixel sprite** — matching its coloring, ear
   shape, and general vibe, in the same small pixel-art style as the
   reference widget this project is inspired by.
3. **You get a lightweight desktop widget** with that sprite: it sits
   quietly in a corner, reacts to your mouse and keyboard, and has a
   couple of fun physical touches (see below) — a little companion
   that's actually *your* pet, not a random cartoon animal.

This repo is the engine that makes step 3 work. Step 2 (photo → sprite)
is the part we're actively building — see **Roadmap** below for where
that stands.

## What's working right now (v1)

- **Transparent, always-on-top desktop window** — sits in a corner,
  doesn't steal focus, drag it anywhere.
- **Eyes track your cursor** anywhere on screen, not just when it's
  hovering over the widget (uses global mouse tracking).
- **"Heat" reacts to typing** — the pet's coat gradually shifts color
  the more actively you're typing, and cools back down when you stop.
- **Stretchy tongue** — click and hold near the mouth, drag, and the
  tongue follows your cursor up to a max length, then springs back with
  a little bounce when you let go.
- **Idle animation** — blinking and tail movement so it feels alive
  even when you're not interacting with it.
- **Packaged as a real app** — ships as a double-clickable `.dmg`
  (macOS) / installer (Windows) via `electron-builder`, not just a dev
  script.

Right now it ships with one hand-drawn placeholder sprite (a pixel
golden retriever) while the photo-to-sprite pipeline is being built —
see Roadmap.

## Setup (development)

```bash
cd dodo
npm install
npm start
```

A small transparent window should appear in the corner of your screen
with the pet in it.

## macOS: enable Accessibility / Input Monitoring

Global mouse and keyboard tracking (via `uiohook-napi`) requires OS
permission on macOS:

1. Run the app once — macOS may prompt automatically, or silently
   block the feature without prompting.
2. Go to **System Settings → Privacy & Security → Accessibility** (and
   also **Input Monitoring**) and enable it for whatever is running the
   app — your terminal app in dev (`npm start`), or the packaged
   **Dodo.app** itself once installed from a built `.dmg`.
3. Fully quit and reopen the app afterward.

A packaged build is the more reliable path here: it has a stable app
identity, so the permission sticks properly, instead of being tied to
whichever terminal app happened to launch it during development.

On Windows/Linux this generally works without extra permissions.

## Building a distributable app

```bash
npm run dist:mac   # produces a .dmg
npm run dist:win   # produces a Windows installer
```

See `BUILD.md` for the full packaging + code-signing/notarization
walkthrough (important before distributing to other people — an
unsigned build shows a scary "unidentified developer" warning on first
launch).

## How it works (technical)

- `main.js` — creates the transparent, frameless, always-on-top
  Electron window, and uses `uiohook-napi` to listen for **global**
  mouse movement and keystrokes (i.e. even when the widget isn't
  focused).
- `preload.js` — safely bridges those events into the renderer via
  `contextBridge`.
- `renderer/dog.js` — draws the pet on a small canvas each frame from a
  hand-authored pixel grid (`SPRITE`), with:
  - Eyes/pupils that shift toward wherever your cursor is on screen.
  - A "heat" value that ramps up while typing and decays when idle,
    tinting the coat color.
  - A damped-spring tongue simulation driven by local pointer
    events (drag near the mouth to stretch it, release to snap back).
  - Idle blink + tail motion.
- The canvas is intentionally `no-drag` so the tongue can capture mouse
  drags; window repositioning is handled separately (see the dragging
  section in code/BUILD notes — this is an active area of iteration).

## Roadmap

**Near-term (the core "your pet" pipeline):**
- Photo upload flow (drag in a picture of your pet).
- Image → pixel-sprite generation: extract dominant coat color, ear
  shape (floppy/pointy), and rough proportions, and map them onto a
  small library of sprite templates (or generate a bespoke grid).
- Let people preview and tweak the generated sprite before it becomes
  their permanent widget.
- One-click "get my widget" — bundle the personalized sprite into a
  ready-to-run app for the user, without them touching any code.

**Also planned:**
- More moods (curling up after long idle periods, excitement bursts).
- Reacting to specific apps in focus (calmer during meetings, more
  hyper during long coding/agent sessions).
- Code signing + notarization so the shipped app opens with zero
  security warnings on a fresh Mac.
- Windows parity testing (most development so far has been macOS-first).

## Known rough edges

- Native module builds (`uiohook-napi`) can fail if the project lives
  in a path with spaces — keep the project folder path space-free.
- Unsigned builds trigger a one-time "unidentified developer" warning
  on macOS; this goes away once signed/notarized (see `BUILD.md`).
