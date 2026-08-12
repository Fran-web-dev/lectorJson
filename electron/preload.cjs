const { contextBridge, ipcRenderer } = require('electron');

const haciendaProgressListeners = new Set();
const fileLoadProgressListeners = new Set();
const closeRequestListeners = new Set();

ipcRenderer.on('hacienda:public-batch-progress', (_event, progress) => {
  for (const listener of haciendaProgressListeners) listener(progress);
});

ipcRenderer.on('files:load-progress', (_event, progress) => {
  for (const listener of fileLoadProgressListeners) listener(progress);
});

ipcRenderer.on('app:confirm-close', () => {
  for (const listener of closeRequestListeners) listener();
});

contextBridge.exposeInMainWorld('dteApp', {
  selectFolder: () => ipcRenderer.invoke('folder:select'),
  reloadFolder: (folderPath) => ipcRenderer.invoke('folder:reload', folderPath),
  selectFiles: () => ipcRenderer.invoke('files:select'),
  cancelFileLoad: () => ipcRenderer.invoke('files:cancel-load'),
  exportExcel: (rows) => ipcRenderer.invoke('excel:export', rows),
  exportIvaBookExcel: (request) => ipcRenderer.invoke('iva-book:excel-export', request),
  exportRegisterTemplate: (request) => ipcRenderer.invoke('register:template-export', request),
  exportRegisterTable: (request) => ipcRenderer.invoke('register:table-export', request),
  exportLoadErrorExcel: (errors) => ipcRenderer.invoke('load-errors:excel-export', errors),
  exportAnexoCsv: (request) => ipcRenderer.invoke('anexo:csv-export', request),
  importRegisterExcel: (request) => ipcRenderer.invoke('register:excel-import', request),
  publicHaciendaQuery: (request) => ipcRenderer.invoke('hacienda:public-query', request),
  publicHaciendaBatchQuery: (request) => ipcRenderer.invoke('hacienda:public-batch-query', request),
  onPublicHaciendaBatchProgress: (listener) => {
    if (typeof listener !== 'function') return () => {};
    haciendaProgressListeners.add(listener);
    return () => haciendaProgressListeners.delete(listener);
  },
  onFileLoadProgress: (listener) => {
    if (typeof listener !== 'function') return () => {};
    fileLoadProgressListeners.add(listener);
    return () => fileLoadProgressListeners.delete(listener);
  },
  onCloseRequest: (listener) => {
    if (typeof listener !== 'function') return () => {};
    closeRequestListeners.add(listener);
    return () => closeRequestListeners.delete(listener);
  },
  confirmCloseApp: () => ipcRenderer.invoke('app:confirm-close'),
  openExternal: (url) => ipcRenderer.invoke('external:open', url)
});
