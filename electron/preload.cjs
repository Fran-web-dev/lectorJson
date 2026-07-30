const { contextBridge, ipcRenderer } = require('electron');

const haciendaProgressListeners = new Set();

ipcRenderer.on('hacienda:public-batch-progress', (_event, progress) => {
  for (const listener of haciendaProgressListeners) listener(progress);
});

contextBridge.exposeInMainWorld('dteApp', {
  selectFolder: () => ipcRenderer.invoke('folder:select'),
  reloadFolder: (folderPath) => ipcRenderer.invoke('folder:reload', folderPath),
  selectFiles: () => ipcRenderer.invoke('files:select'),
  exportExcel: (rows) => ipcRenderer.invoke('excel:export', rows),
  exportIvaBookExcel: (request) => ipcRenderer.invoke('iva-book:excel-export', request),
  exportRegisterTemplate: (request) => ipcRenderer.invoke('register:template-export', request),
  exportRegisterTable: (request) => ipcRenderer.invoke('register:table-export', request),
  importRegisterExcel: (request) => ipcRenderer.invoke('register:excel-import', request),
  publicHaciendaQuery: (request) => ipcRenderer.invoke('hacienda:public-query', request),
  publicHaciendaBatchQuery: (request) => ipcRenderer.invoke('hacienda:public-batch-query', request),
  onPublicHaciendaBatchProgress: (listener) => {
    if (typeof listener !== 'function') return () => {};
    haciendaProgressListeners.add(listener);
    return () => haciendaProgressListeners.delete(listener);
  },
  openExternal: (url) => ipcRenderer.invoke('external:open', url)
});
