# Comnyang 🐕

A tiny pixel dog that lives on your desktop. It sits in the bottom-right
corner, its eyes track your mouse anywhere on screen, it heats up from
brown → dark red → bright red the more you type, and it has a tongue you
can grab and stretch.

## Setup

```bash
cd comnyang
npm install
npm start
```

That's it — a small transparent window should appear in the bottom-right
corner of your screen with the cat in it.

## macOS: enable Accessibility / Input Monitoring

Global mouse and keyboard tracking (via `uiohook-napi`) requires OS
permission on macOS:

1. Run `npm start` once — macOS will prompt you, or silently block it.
2. Go to **System Settings → Privacy & Security → Accessibility** (and also
   **Input Monitoring**) and enable it for your terminal app (Terminal,
   iTerm, VS Code, whichever you ran `npm start` from).
3. Restart the app.

On Windows/Linux this generally works without extra permissions.

## How it works

- `main.js` — creates a transparent, frameless, always-on-top Electron
  window, and uses `uiohook-napi` to listen for **global** mouse movement
  and keystrokes (i.e. even when the dog window isn't focused).
- `preload.js` — safely bridges those events into the renderer via
  `contextBridge`.
- `renderer/dog.js` — draws the dog on a small canvas each frame:
  - Eyes/pupils angle toward wherever your cursor is on screen (global).
  - A "heat" value ramps up while you're actively typing and decays when
    you stop, driving the body color from warm brown to bright red.
  - The tail wags and the dog blinks every few seconds.
  - **Tongue:** click and hold near the mouth, then drag — the tongue
    stretches toward your cursor (up to a max length) in whatever
    direction you pull. Let go and it springs back with a little bounce,
    using a simple damped-spring simulation. This uses normal in-window
    pointer events (not the global hook), so it only responds while your
    cursor is actually over the dog.
  - Because the tongue needs local mouse control, the canvas itself is
    `no-drag`; window dragging now happens via the small translucent tab
    at the very top of the window instead of the whole body.

## Where to take it next

- Add more moods (idle purring, curling up after a long idle period).
- React to specific apps in focus (e.g. calmer during meetings, more
  hyper during long coding sessions).
- Package it with `electron-builder` so it's a double-clickable app
  instead of something run via `npm start`.
- Swap the hand-drawn pixel grid in `cat.js` for a proper sprite sheet
  if you want more expressive animation frames.

## Note on the "AI agent" reaction (v2 idea)

Not wired up yet, per your call to keep v1 to mouse + typing only. When
you're ready: the cleanest hook would be watching for a running
`claude` / terminal process (via `ps` on an interval, or a small file the
agent touches) and sending that as another IPC event, same pattern as
`typing-tick`.
