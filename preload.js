const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('comnyang', {
  onCursorUpdate: (callback) =>
    ipcRenderer.on('cursor-update', (_event, data) => callback(data)),
  onTypingTick: (callback) =>
    ipcRenderer.on('typing-tick', () => callback()),
  moveBy: (dx, dy) =>
    ipcRenderer.send('window-move-by', { dx, dy }),
  showContextMenu: () =>
    ipcRenderer.send('show-context-menu'),
});
