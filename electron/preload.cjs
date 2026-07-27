const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dteApp', {
  selectFolder: () => ipcRenderer.invoke('folder:select'),
  selectFiles: () => ipcRenderer.invoke('files:select'),
  exportExcel: (rows) => ipcRenderer.invoke('excel:export', rows),
  haciendaRequest: (request) => ipcRenderer.invoke('hacienda:request', request)
});
