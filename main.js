const { app, BrowserWindow, screen, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let uIOhook;

const WIN_WIDTH = 128;
const WIN_HEIGHT = 200; // sprite is 144 tall; extra room for the tongue to stretch below
const MARGIN = 24;
// "Panel mode" is a temporarily larger window used to show readable onboarding
// and permission cards — the tiny widget window can't fit text.
const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 260;

// --- runtime state ---
let panelMode = false;        // window is currently showing a card
let widgetBounds = null;      // last known widget-mode position { x, y }
let saveTimer = null;         // debounce for persisting position
let receivedInput = false;    // have any global input events arrived?
let permissionNeeded = false; // macOS input permission looks missing

// --- persisted settings (userData/settings.json) ---
function settingsFile() {
  return path.join(app.getPath('userData'), 'settings.json');
}
function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) || {};
  } catch (e) {
    return {};
  }
}
function writeSettings(patch) {
  const next = { ...readSettings(), ...patch };
  try {
    fs.writeFileSync(settingsFile(), JSON.stringify(next, null, 2));
  } catch (e) {
    console.error('[Dodo] could not save settings:', e.message);
  }
  return next;
}

// --- window position helpers ---
function defaultWidgetPos() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { x: width - WIN_WIDTH - MARGIN, y: height - WIN_HEIGHT - MARGIN };
}
// Only restore a saved position if the widget would still be visible (guards
// against a monitor that was unplugged since last run).
function isWidgetVisibleAt(x, y) {
  return screen.getAllDisplays().some((d) => {
    const b = d.workArea;
    return (
      x + WIN_WIDTH > b.x + 8 &&
      x < b.x + b.width - 8 &&
      y + WIN_HEIGHT > b.y + 8 &&
      y < b.y + b.height - 8
    );
  });
}
function restoreWidgetPos() {
  const { pos } = readSettings();
  if (
    pos &&
    Number.isFinite(pos.x) &&
    Number.isFinite(pos.y) &&
    isWidgetVisibleAt(pos.x, pos.y)
  ) {
    return { x: pos.x, y: pos.y };
  }
  return defaultWidgetPos();
}

function createWindow() {
  const pos = restoreWidgetPos();
  widgetBounds = { x: pos.x, y: pos.y };

  mainWindow = new BrowserWindow({
    width: WIN_WIDTH,
    height: WIN_HEIGHT,
    x: pos.x,
    y: pos.y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  // Keep the dog visible across virtual desktops / full-screen apps
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Persist the widget's position as the user drags it (debounced, and never
  // while we're in the larger panel mode).
  mainWindow.on('move', () => {
    if (panelMode || !mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    widgetBounds = { x, y };
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => writeSettings({ pos: widgetBounds }), 400);
  });

  mainWindow.on('close', () => {
    if (panelMode || !mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    writeSettings({ pos: { x, y } });
  });

  // Once the page is ready, tell it whether this is a first run and hand over
  // any permission warning that fired before the renderer existed.
  mainWindow.webContents.once('did-finish-load', () => {
    const s = readSettings();
    mainWindow.webContents.send('app-init', {
      firstRun: !s.onboarded,
      platform: process.platform,
    });
    if (permissionNeeded) mainWindow.webContents.send('permission-needed');
  });
}

// setBounds is ignored on some platforms when resizable is false, so toggle it
// around the call.
function setWindowBounds(bounds) {
  if (!mainWindow) return;
  mainWindow.setResizable(true);
  mainWindow.setBounds(bounds, false);
  mainWindow.setResizable(false);
}

function enterPanelMode() {
  if (!mainWindow || panelMode) return;
  const [wx, wy] = mainWindow.getPosition();
  widgetBounds = { x: wx, y: wy };
  panelMode = true;
  // Center the card on whichever display the widget is currently on.
  const disp = screen.getDisplayNearestPoint({
    x: wx + WIN_WIDTH / 2,
    y: wy + WIN_HEIGHT / 2,
  });
  const wa = disp.workArea;
  setWindowBounds({
    x: Math.round(wa.x + (wa.width - PANEL_WIDTH) / 2),
    y: Math.round(wa.y + (wa.height - PANEL_HEIGHT) / 2),
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
  });
}

function exitPanelMode() {
  if (!mainWindow || !panelMode) return;
  panelMode = false;
  const pos = widgetBounds || restoreWidgetPos();
  setWindowBounds({
    x: pos.x,
    y: pos.y,
    width: WIN_WIDTH,
    height: WIN_HEIGHT,
  });
}

// --- IPC from the renderer ---

// Whole-body drag: move the frameless window in step with the pointer.
ipcMain.on('window-move-by', (_event, { dx, dy }) => {
  if (!mainWindow || panelMode) return;
  const [x, y] = mainWindow.getPosition();
  mainWindow.setPosition(Math.round(x + dx), Math.round(y + dy));
});

// Right-click menu — the primary way to close the frameless widget.
ipcMain.on('show-context-menu', () => {
  const menu = Menu.buildFromTemplate([
    { label: 'Quit Dodo', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
  ]);
  menu.popup({ window: mainWindow });
});

ipcMain.on('ui-enter-panel', enterPanelMode);
ipcMain.on('ui-exit-panel', exitPanelMode);
ipcMain.on('set-onboarded', () => writeSettings({ onboarded: true }));

ipcMain.on('open-input-monitoring-settings', () => {
  if (process.platform === 'darwin') {
    // Deep-link straight to the Input Monitoring pane.
    shell.openExternal(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent'
    );
  }
});

ipcMain.on('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

function notifyPermissionNeeded() {
  permissionNeeded = true;
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('permission-needed');
  }
}

function setupGlobalListeners() {
  try {
    ({ uIOhook } = require('uiohook-napi'));
  } catch (err) {
    console.error(
      '[Dodo] uiohook-napi failed to load — mouse/typing reactions disabled.',
      err.message
    );
    notifyPermissionNeeded();
    return;
  }

  // The first real input event means the hooks are working; clear any warning.
  const markActive = () => {
    if (receivedInput) return;
    receivedInput = true;
    permissionNeeded = false;
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('hooks-active');
    }
  };

  uIOhook.on('mousemove', (e) => {
    markActive();
    if (!mainWindow || panelMode) return;
    const bounds = mainWindow.getBounds();
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    mainWindow.webContents.send('cursor-update', {
      dx: e.x - centerX,
      dy: e.y - centerY,
    });
  });

  uIOhook.on('keydown', () => {
    markActive();
    if (!mainWindow || panelMode) return;
    mainWindow.webContents.send('typing-tick');
  });

  try {
    uIOhook.start();
  } catch (err) {
    console.error('[Dodo] uiohook failed to start.', err.message);
    notifyPermissionNeeded();
    return;
  }

  // macOS gates global input behind Input Monitoring / Accessibility. If no
  // events arrive shortly after start, the permission is almost certainly
  // missing — prompt the user. (markActive() self-clears this if events flow.)
  if (process.platform === 'darwin') {
    setTimeout(() => {
      if (!receivedInput) notifyPermissionNeeded();
    }, 4000);
  }
}

app.whenReady().then(() => {
  createWindow();
  setupGlobalListeners();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (uIOhook) uIOhook.stop();
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  if (uIOhook) uIOhook.stop();
});
