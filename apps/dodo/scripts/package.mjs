#!/usr/bin/env node
// Workspace-safe Electron packaging.
//
// WHY THIS EXISTS: electron-builder is hostile to npm workspaces. When run
// against apps/dodo directly it (1) can't resolve the hoisted electron version
// and (2) its "installing production dependencies" step runs `npm install
// --production` in the app dir, which — because deps are HOISTED to the repo
// root — prunes the shared root node_modules and deletes electron-builder's own
// dependencies mid-build. See root CLAUDE.md → Known gotchas.
//
// FIX: build from a self-contained STAGING copy (app files + a full
// node_modules) in a SPACE-FREE temp dir. electron-builder then sees a normal
// standalone project: it finds prod deps locally (skipping the destructive
// prune) and the space-free path also dodges the uiohook-napi native-build
// issue. Artifacts are copied back to apps/dodo/dist/.
//
// Usage: node scripts/package.mjs [electron-builder args]   e.g. --mac
// Assumes renderer/dog.bundle.js is already built (npm run build:renderer).

import { execFileSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync, existsSync, lstatSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(fileURLToPath(import.meta.url), '..', '..'); // apps/dodo
const repoRoot = path.resolve(appDir, '..', '..');
const builderArgs = process.argv.slice(2);
const staging = path.join(tmpdir(), 'dodo-pkg-staging'); // tmpdir() is space-free

console.log(`[package] app:     ${appDir}`);
console.log(`[package] staging: ${staging}`);
console.log(`[package] builder: electron-builder ${builderArgs.join(' ')}`);

// 1. Fresh staging dir.
rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

// 2. Copy the app source electron-builder packages (its `files` globs).
for (const f of ['main.js', 'preload.js', 'package.json']) {
  cpSync(path.join(appDir, f), path.join(staging, f));
}
cpSync(path.join(appDir, 'renderer'), path.join(staging, 'renderer'), { recursive: true });
if (!existsSync(path.join(staging, 'renderer', 'dog.bundle.js'))) {
  console.error('[package] ERROR: renderer/dog.bundle.js missing — run `npm run build:renderer` first.');
  process.exit(1);
}

// 3. Copy the full hoisted node_modules so staging is self-contained. `cp -R`
//    preserves symlinks (workspace self-links are pruned in step 4).
execFileSync('cp', ['-R', path.join(repoRoot, 'node_modules'), path.join(staging, 'node_modules')], {
  stdio: 'inherit',
});

// 4. Remove dangling top-level symlinks (workspace self-links like
//    node_modules/Dodo and node_modules/sprite-core now point outside staging;
//    @electron/rebuild would ENOENT on them).
const nm = path.join(staging, 'node_modules');
for (const name of readdirSync(nm)) {
  const p = path.join(nm, name);
  try {
    if (lstatSync(p).isSymbolicLink() && !existsSync(p)) {
      rmSync(p, { force: true });
      console.log(`[package] pruned dangling link: node_modules/${name}`);
    }
  } catch { /* ignore */ }
}

// 5. Run electron-builder from staging (env passes through, e.g.
//    CSC_IDENTITY_AUTO_DISCOVERY=false for unsigned builds).
execFileSync(path.join(nm, '.bin', 'electron-builder'), builderArgs, {
  cwd: staging,
  stdio: 'inherit',
  env: process.env,
});

// 6. Copy artifacts back to apps/dodo/dist/.
const outDir = path.join(appDir, 'dist');
rmSync(outDir, { recursive: true, force: true });
cpSync(path.join(staging, 'dist'), outDir, { recursive: true });
console.log(`[package] artifacts copied to ${outDir}`);
