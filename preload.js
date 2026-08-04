const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('comnyang', {
  // main -> renderer
  onCursorUpdate: (callback) =>
    ipcRenderer.on('cursor-update', (_event, data) => callback(data)),
  onTypingTick: (callback) =>
    ipcRenderer.on('typing-tick', () => callback()),
  onAppInit: (callback) =>
    ipcRenderer.on('app-init', (_event, data) => callback(data)),
  onPermissionNeeded: (callback) =>
    ipcRenderer.on('permission-needed', () => callback()),
  onHooksActive: (callback) =>
    ipcRenderer.on('hooks-active', () => callback()),

  // renderer -> main
  moveBy: (dx, dy) =>
    ipcRenderer.send('window-move-by', { dx, dy }),
  showContextMenu: () =>
    ipcRenderer.send('show-context-menu'),
  enterPanel: () =>
    ipcRenderer.send('ui-enter-panel'),
  exitPanel: () =>
    ipcRenderer.send('ui-exit-panel'),
  setOnboarded: () =>
    ipcRenderer.send('set-onboarded'),
  openInputMonitoringSettings: () =>
    ipcRenderer.send('open-input-monitoring-settings'),
  restartApp: () =>
    ipcRenderer.send('restart-app'),
});
