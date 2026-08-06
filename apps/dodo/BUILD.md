# Building Dodo for distribution

This is how you turn the project into a real, double-clickable app that
your users can install without touching a terminal, npm, or Gatekeeper
fights. **This is the file to follow when you want to ship — not the dev
`npm start` flow.**

Dodo is a **monorepo** (npm workspaces): the Electron app lives in
`apps/dodo/`, shared sprite code in `packages/sprite-core/`. Run the
commands below from the **repo root** unless noted — the root passes them
through to `apps/dodo`.

## Why this fixes the "too many difficulties" problem

Everything painful during development (`npm install`, Electron binaries
downloading, the macOS "malware" dialog, `path.txt`) is *build-time*
machinery. Your users never see it. They get one file:

- **macOS** → a `.dmg` they drag into Applications.
- **Windows** → an `.exe` installer they double-click.

`electron-builder` downloads and bundles its **own** clean copy of
Electron for packaging, so it does not depend on the (possibly broken)
`node_modules/electron/dist` folder you fought with during dev. (If dev
`npm start` fails with a corrupt Electron dist, see root `CLAUDE.md` →
Known gotchas for the `unzip` workaround — it does not affect packaging.)

## One-time setup

From the repo root:

```bash
npm install
```

This installs all workspaces, including `electron` and `electron-builder`
(devDependencies of `apps/dodo`). The install-script allowlist for
`electron`/`uiohook-napi` lives in the **root** `package.json` — npm
ignores it in workspace packages.

## Build the installer

**On a Mac, to make the macOS .dmg (build unsigned first to confirm the
pipeline):**

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac
```

**On a Windows PC, to make the Windows .exe:**

```bash
npm run dist:win
```

> Note: you generally build the Mac version *on a Mac* and the Windows
> version *on a Windows machine* (or via CI). Cross-building Windows from
> Mac is possible but needs extra tooling (wine), so start with your
> current platform.

`dist:mac` first bundles the renderer (`build:renderer`, esbuild →
`renderer/dog.bundle.js`), then runs a **workspace-safe packaging script**
(`apps/dodo/scripts/package.mjs`). The finished installer lands in
**`apps/dodo/dist/`** (e.g. `apps/dodo/dist/Dodo-0.1.0-arm64.dmg`).

### Why the custom packaging script?

electron-builder is hostile to npm workspaces: run directly against
`apps/dodo` it can't resolve the hoisted Electron version, and its
"install production dependencies" step prunes the shared **root**
`node_modules`, deleting electron-builder's own dependencies mid-build.
So `package.mjs` builds from a self-contained **staging copy** (app files
+ a full `node_modules`) in a **space-free** temp dir, then copies the
artifacts back to `apps/dodo/dist/`. The space-free staging path also
sidesteps the `uiohook-napi` native-rebuild issue. See root `CLAUDE.md` →
Known gotchas for the full story.

## Code signing & notarization (needed before selling)

The build above is **unsigned** (`CSC_IDENTITY_AUTO_DISCOVERY=false`). An
unsigned app still runs, but users get a scary "unidentified developer"
warning and have to right-click → Open the first time. To remove that and
let it open cleanly on any Mac:

1. Get an **Apple Developer account** ($99/year).
2. Create a "Developer ID Application" certificate in your account.
3. With the certificate in your Mac keychain, drop the
   `CSC_IDENTITY_AUTO_DISCOVERY=false` flag; electron-builder signs
   automatically, and can **notarize** if you add your Apple ID
   credentials as environment variables:

   ```bash
   export APPLE_ID="you@example.com"
   export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
   export APPLE_TEAM_ID="YOURTEAMID"
   npm run dist:mac
   ```

   (App-specific password is generated at appleid.apple.com, not your
   normal login password.) Signing/notarization run inside the same
   staging build, so the env vars just need to be exported first.

For Windows, signing uses a separate "code signing certificate" from a
certificate authority (e.g. DigiCert, Sectigo) — you can ship unsigned to
start and add this later.

## Suggested first step

Just run `CSC_IDENTITY_AUTO_DISCOVERY=false npm run dist:mac` to confirm
the whole pipeline works and you get a `.dmg` that opens. Worry about the
Apple Developer account only when you're actually ready to distribute to
other people.
