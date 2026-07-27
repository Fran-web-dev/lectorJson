const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dteApp', {
  selectFolder: () => ipcRenderer.invoke('folder:select'),
  reloadFolder: (folderPath) => ipcRenderer.invoke('folder:reload', folderPath),
  selectFiles: () => ipcRenderer.invoke('files:select'),
  exportExcel: (rows) => ipcRenderer.invoke('excel:export', rows),
  publicHaciendaQuery: (request) => ipcRenderer.invoke('hacienda:public-query', request),
  openExternal: (url) => ipcRenderer.invoke('external:open', url)
});
