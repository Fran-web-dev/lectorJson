const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dteApp', {
  selectFolder: () => ipcRenderer.invoke('folder:select'),
  reloadFolder: (folderPath) => ipcRenderer.invoke('folder:reload', folderPath),
  selectFiles: () => ipcRenderer.invoke('files:select'),
  exportExcel: (rows) => ipcRenderer.invoke('excel:export', rows),
  exportRegisterTemplate: (request) => ipcRenderer.invoke('register:template-export', request),
  importRegisterExcel: (request) => ipcRenderer.invoke('register:excel-import', request),
  publicHaciendaQuery: (request) => ipcRenderer.invoke('hacienda:public-query', request),
  openExternal: (url) => ipcRenderer.invoke('external:open', url)
});
