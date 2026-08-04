# Building Comnyang for distribution

This is how you turn the project into a real, double-clickable app that
your users can install without touching a terminal, npm, or Gatekeeper
fights. **This is the file to follow when you want to ship — not the dev
`npm start` flow.**

## Why this fixes the "too many difficulties" problem

Everything painful during development (`npm install`, Electron binaries
downloading, the macOS "malware" dialog, `path.txt`) is *build-time*
machinery. Your users never see it. They get one file:

- **macOS** → a `.dmg` they drag into Applications.
- **Windows** → an `.exe` installer they double-click.

`electron-builder` also downloads and bundles its **own** clean copy of
Electron for packaging, so it does not depend on the (possibly broken)
`node_modules/electron/dist` folder you fought with during dev.

## One-time setup

```bash
npm install
```

This now also installs `electron-builder` (added to devDependencies).

## Build the installer

**On a Mac, to make the macOS .dmg:**

```bash
npm run dist:mac
```

**On a Windows PC, to make the Windows .exe:**

```bash
npm run dist:win
```

> Note: you generally build the Mac version *on a Mac* and the Windows
> version *on a Windows machine* (or via CI). Cross-building Windows from
> Mac is possible but needs extra tooling (wine), so start with your
> current platform.

The finished installer lands in a new `dist/` folder in the project root
(e.g. `dist/Comnyang-0.1.0-arm64.dmg`).

## Code signing & notarization (needed before selling)

Right now the build is **unsigned**. An unsigned app will still run, but
users get a scary "unidentified developer" warning and have to
right-click → Open the first time. To remove that entirely and let it
open cleanly on any Mac:

1. Get an **Apple Developer account** ($99/year).
2. Create a "Developer ID Application" certificate in your account.
3. electron-builder will sign automatically once the certificate is in
   your Mac keychain, and can **notarize** (upload to Apple for a
   one-time malware scan) if you add your Apple ID credentials as
   environment variables:

   ```bash
   export APPLE_ID="you@example.com"
   export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
   export APPLE_TEAM_ID="YOURTEAMID"
   npm run dist:mac
   ```

   (App-specific password is generated at appleid.apple.com, not your
   normal login password.)

For Windows, signing uses a separate "code signing certificate" from a
certificate authority (e.g. DigiCert, Sectigo) — you can ship unsigned to
start and add this later.

## Suggested first step

Just run `npm run dist:mac` unsigned to confirm the whole pipeline works
and you get a `.dmg` that opens. Worry about the Apple Developer account
only when you're actually ready to distribute to other people.
