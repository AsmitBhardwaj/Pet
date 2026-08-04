const { app, BrowserWindow, screen, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow;
let uIOhook;
const WIN_WIDTH = 128;
const WIN_HEIGHT = 200; // sprite is 144 tall; extra room for the tongue to stretch below
const MARGIN = 24;

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  mainWindow = new BrowserWindow({
    width: WIN_WIDTH,
    height: WIN_HEIGHT,
    x: width - WIN_WIDTH - MARGIN,
    y: height - WIN_HEIGHT - MARGIN,
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

  // Keep the cat visible across virtual desktops / full-screen apps
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

// Drag the frameless window by moving it in step with the pointer. The
// renderer sends movement deltas (in CSS px, 1:1 with screen DIPs at zoom 1)
// while the user drags the dog's body.
ipcMain.on('window-move-by', (_event, { dx, dy }) => {
  if (!mainWindow) return;
  const [x, y] = mainWindow.getPosition();
  mainWindow.setPosition(Math.round(x + dx), Math.round(y + dy));
});

// Right-clicking the dog opens a small native menu. This is the primary way
// to close the widget, since the window is frameless and skips the taskbar.
ipcMain.on('show-context-menu', () => {
  const menu = Menu.buildFromTemplate([
    { label: 'Quit Dodo', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
  ]);
  menu.popup({ window: mainWindow });
});

function setupGlobalListeners() {
  try {
    ({ uIOhook } = require('uiohook-napi'));
  } catch (err) {
    console.error(
      '[comnyang] uiohook-napi is not installed. Run `npm install` first — mouse/typing reactions will be disabled until then.'
    );
    return;
  }

  uIOhook.on('mousemove', (e) => {
    if (!mainWindow) return;
    const bounds = mainWindow.getBounds();
    const catCenterX = bounds.x + bounds.width / 2;
    const catCenterY = bounds.y + bounds.height / 2;
    mainWindow.webContents.send('cursor-update', {
      dx: e.x - catCenterX,
      dy: e.y - catCenterY,
    });
  });

  uIOhook.on('keydown', () => {
    if (!mainWindow) return;
    mainWindow.webContents.send('typing-tick');
  });

  uIOhook.start();
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
