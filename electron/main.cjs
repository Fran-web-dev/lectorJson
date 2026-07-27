const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const Papa = require('papaparse');
const ExcelJS = require('exceljs');
const axios = require('axios');

const isDev = !app.isPackaged;
const EXCEL_FONT = 'Tw Cen MT Condensed';
const EXCEL_FONT_SIZE = 12;
const TABLE_HEADER_FILL = 'FF2EA8C9';
const TABLE_ALT_FILL = 'FFF1FDFF';
const TABLE_WHITE_FILL = 'FFFFFFFF';
const TABLE_DUPLICATE_FILL = 'FFFFF2CC';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 1000,
    minHeight: 620,
    title: 'Lector DTE Hacienda',
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    win.loadURL('http://127.0.0.1:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

async function collectFiles(folderPath) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath));
    } else if (!/^\./.test(entry.name) && !/\.(xlsx|xls|pdf|png|jpg|jpeg|gif|exe|dll|zip|rar|7z)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function readDataFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const trimmed = raw.trim();

  if (/\.json$/i.test(filePath) || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = parseJsonWithRepair(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  const result = Papa.parse(raw, { header: true, skipEmptyLines: true, dynamicTyping: false });
  if (result.errors.length || !result.meta.fields?.length) {
    throw new Error(result.errors.map((error) => error.message).join(', '));
  }
  return result.data;
}

function parseJsonWithRepair(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const repaired = raw.replace(/:\s*"([^"\r\n]*)\r?\n(\s*")/g, ': "$1",\n$2');
    if (repaired !== raw) {
      return JSON.parse(repaired);
    }
    throw error;
  }
}

async function loadFiles(filePaths, sourcePath) {
  const documents = [];
  const errors = [];

  for (const filePath of filePaths) {
    try {
      const items = await readDataFile(filePath);
      for (const item of items) {
        documents.push({
          sourceFile: filePath,
          fileName: path.basename(filePath),
          folderName: path.basename(path.dirname(filePath)),
          payload: item
        });
      }
    } catch (error) {
      errors.push({ filePath, message: error.message });
    }
  }

  return { documents, errors, sourcePath };
}

ipcMain.handle('folder:select', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Seleccione la carpeta contenedora de los archivos JSON o CSV',
    properties: ['openDirectory']
  });

  if (result.canceled || !result.filePaths[0]) return null;
  const folderPath = result.filePaths[0];
  const files = await collectFiles(folderPath);
  return loadFiles(files, folderPath);
});

ipcMain.handle('files:select', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Seleccione archivos JSON o CSV',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Archivos JSON, CSV o sin extension', extensions: ['json', 'csv', '*'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'CSV', extensions: ['csv'] }
    ]
  });

  if (result.canceled || !result.filePaths.length) return null;
  return loadFiles(result.filePaths, `${result.filePaths.length} archivo(s) seleccionado(s)`);
});

ipcMain.handle('excel:export', async (_event, rows) => {
  const result = await dialog.showSaveDialog({
    title: 'Exportar Excel',
    defaultPath: `DTE-Hacienda-${new Date().toISOString().slice(0, 10)}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });

  if (result.canceled || !result.filePath) return null;
  await writeStyledExcel(result.filePath, rows);
  return result.filePath;
});

function isMoneyColumn(header) {
  return /total|monto|credito|fovial|cotrans|percepciones|retencion|compra|gravado|exenta|sujetas|desc\.|sub-total/i.test(header);
}

function parseMoney(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || !/^\$/.test(value.trim())) return value;
  const number = Number(value.replace(/[$,\s]/g, ''));
  return Number.isFinite(number) ? number : value;
}

function getExcelColumnWidth(header, values) {
  const maxLength = Math.max(
    String(header).length,
    ...values.slice(0, 200).map((value) => String(value ?? '').length)
  );
  return Math.min(Math.max(maxLength + 2, 11), header === 'Cant,NP,PU,VTAGR' ? 34 : 24);
}

async function writeStyledExcel(filePath, rows) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('DTE', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row).filter((key) => !key.startsWith('__')))));
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: getExcelColumnWidth(header, rows.map((row) => row[header]))
  }));

  for (const row of rows) {
    const excelRow = {};
    for (const header of headers) {
      excelRow[header] = isMoneyColumn(header) ? parseMoney(row[header]) : row[header];
    }
    worksheet.addRow(excelRow);
  }

  worksheet.getRow(1).height = 45;
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: EXCEL_FONT, size: EXCEL_FONT_SIZE };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TABLE_HEADER_FILL } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
    };
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.height = 58;
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1];
      cell.font = { bold: false, color: { argb: 'FF000000' }, name: EXCEL_FONT, size: EXCEL_FONT_SIZE };
      cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowNumber % 2 === 0 ? TABLE_WHITE_FILL : TABLE_ALT_FILL }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };

      if (isMoneyColumn(header) && typeof cell.value === 'number') {
        cell.numFmt = '$#,##0.00';
      }

      if (rows[rowNumber - 2]?.__isDuplicate) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TABLE_DUPLICATE_FILL } };
      }
    });
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };

  await workbook.xlsx.writeFile(filePath);
}

ipcMain.handle('hacienda:request', async (_event, request) => {
  const { baseUrl, token, endpoint, payload } = request;
  const url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const response = await axios.post(url, payload, {
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {})
    }
  });
  return response.data;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
