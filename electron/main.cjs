const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const isDev = !app.isPackaged;
const EXCEL_FONT = 'Tw Cen MT Condensed';
const EXCEL_FONT_SIZE = 12;
const TABLE_HEADER_FILL = 'FF2EA8C9';
const TABLE_PUBLIC_HEADER_FILL = 'FF86EFAC';
const TABLE_ALT_FILL = 'FFF1FDFF';
const TABLE_WHITE_FILL = 'FFFFFFFF';
const TABLE_DUPLICATE_FILL = 'FFFFF2CC';
const TABLE_ALERT_FILL = 'FFFEE2E2';
const HACIENDA_PUBLIC_COLUMNS = new Set([
  'Estado del DTE',
  'Descripcion del DTE',
  'Tipo de DTE',
  'Fecha y hora de generacion',
  'Codigo de Generacion',
  'Sello de Recepcion',
  'Numero de Control Consulta',
  'Documento ajustado',
  'Documento con Evento aplicado',
  'Documentos Relacionados'
]);
const PUBLIC_QUERY_LIMIT = 300;
const PUBLIC_QUERY_CONCURRENCY = 8;
const FILE_READ_CONCURRENCY = 32;
const ENRICH_PUBLIC_QUERY_ON_LOAD = false;
const publicQueryCache = new Map();
let papaParser;
let excelJs;
let axiosClient;
let publicQueryHttp;

function getPapaParser() {
  papaParser ||= require('papaparse');
  return papaParser;
}

function getExcelJs() {
  excelJs ||= require('exceljs');
  return excelJs;
}

function getAxios() {
  axiosClient ||= require('axios');
  return axiosClient;
}

function getPublicQueryHttp() {
  if (!publicQueryHttp) {
    const https = require('https');
    publicQueryHttp = getAxios().create({
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 4000
    });
  }
  return publicQueryHttp;
}

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

  const result = getPapaParser().parse(raw, { header: true, skipEmptyLines: true, dynamicTyping: false });
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
  const documentsByFile = new Array(filePaths.length);
  const errors = [];
  let nextFileIndex = 0;

  async function worker() {
    while (nextFileIndex < filePaths.length) {
      const fileIndex = nextFileIndex;
      nextFileIndex += 1;

      const filePath = filePaths[fileIndex];
      try {
        const items = await readDataFile(filePath);
        documentsByFile[fileIndex] = items.map((item) => ({
          sourceFile: filePath,
          fileName: path.basename(filePath),
          folderName: path.basename(path.dirname(filePath)),
          payload: item
        }));
      } catch (error) {
        documentsByFile[fileIndex] = [];
        errors.push({ filePath, message: error.message });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(FILE_READ_CONCURRENCY, filePaths.length || 1) }, () => worker()));

  const documents = documentsByFile.flat();
  const enrichedDocuments = ENRICH_PUBLIC_QUERY_ON_LOAD ? await enrichDocumentsWithPublicQuery(documents) : documents;
  return { documents: enrichedDocuments, errors, sourcePath };
}

function findValue(source, fieldName) {
  if (!source || typeof source !== 'object') return '';
  if (Object.prototype.hasOwnProperty.call(source, fieldName)) return source[fieldName];

  const stack = [source];
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    if (Object.prototype.hasOwnProperty.call(current, fieldName)) return current[fieldName];
    for (const value of Object.values(current)) {
      if (value && typeof value === 'object') stack.push(value);
    }
  }

  return '';
}

function normalizePublicDate(value) {
  const text = String(value || '').trim();
  const dayFirst = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return text.slice(0, 10);
}

async function enrichWithPublicQuery(payload) {
  if (!payload || typeof payload !== 'object' || findValue(payload, 'estadoDoc')) return payload;

  const ambiente = String(findValue(payload, 'ambiente') || '01').padStart(2, '0');
  const codigoGeneracion = String(findValue(payload, 'codigoGeneracion') || findValue(payload, 'codGen') || '').trim();
  const fechaEmi = normalizePublicDate(findValue(payload, 'fecEmi') || findValue(payload, 'fechaEmi'));

  if (!codigoGeneracion || !fechaEmi) return payload;

  const basePath = ambiente === '01' ? 'prod' : 'test';
  const url = `https://admin.factura.gob.sv/${basePath}/consultas/publica/simple/1`;
  const cacheKey = `${ambiente}|${codigoGeneracion}|${fechaEmi}`;

  try {
    if (!publicQueryCache.has(cacheKey)) {
      publicQueryCache.set(cacheKey, getPublicQueryHttp().get(url, {
        params: { ambiente, codigoGeneracion, fechaEmi }
      }).then((response) => response.data).catch(() => null));
    }

    const data = await publicQueryCache.get(cacheKey);
    if (!data || typeof data !== 'object' || data.estadoDoc === 'Error') return payload;
    return { ...payload, __consultaPublica: data };
  } catch {
    return payload;
  }
}

function getPublicQueryKey(payload) {
  if (!payload || typeof payload !== 'object' || findValue(payload, 'estadoDoc')) return '';

  const ambiente = String(findValue(payload, 'ambiente') || '01').padStart(2, '0');
  const codigoGeneracion = String(findValue(payload, 'codigoGeneracion') || findValue(payload, 'codGen') || '').trim();
  const fechaEmi = normalizePublicDate(findValue(payload, 'fecEmi') || findValue(payload, 'fechaEmi'));

  return codigoGeneracion && fechaEmi ? `${ambiente}|${codigoGeneracion}|${fechaEmi}` : '';
}

async function enrichDocumentsWithPublicQuery(documents) {
  const uniqueQueryKeys = new Set(documents.map((document) => getPublicQueryKey(document.payload)).filter(Boolean));
  if (!uniqueQueryKeys.size || uniqueQueryKeys.size > PUBLIC_QUERY_LIMIT) return documents;

  const enrichedDocuments = [...documents];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < enrichedDocuments.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      const document = enrichedDocuments[currentIndex];
      const enrichedPayload = await enrichWithPublicQuery(document.payload);
      if (enrichedPayload !== document.payload) {
        enrichedDocuments[currentIndex] = { ...document, payload: enrichedPayload };
      }
    }
  }

  await Promise.all(Array.from({ length: PUBLIC_QUERY_CONCURRENCY }, () => worker()));
  return enrichedDocuments;
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
    defaultPath: `DTE-Hacienda-${formatExportTimestamp(new Date())}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });

  if (result.canceled || !result.filePath) return null;
  await writeStyledExcel(result.filePath, rows);
  return result.filePath;
});

function formatExportTimestamp(date) {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${hour}-${minute}-${second}`;
}

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
  if (header === 'Cant,NP,PU,VTAGR') return Math.min(Math.max(maxLength + 2, 18), 42);
  if (header === 'Codigo de generacion local') return Math.min(Math.max(maxLength + 2, 22), 36);
  if (HACIENDA_PUBLIC_COLUMNS.has(header)) return Math.min(Math.max(maxLength + 2, 16), 38);
  return Math.min(Math.max(maxLength + 2, 11), 24);
}

async function writeStyledExcel(filePath, rows) {
  const ExcelJS = getExcelJs();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('DTE', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  const headers = orderExcelHeaders(Array.from(new Set(rows.flatMap((row) => Object.keys(row).filter((key) => !key.startsWith('__'))))));
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
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    const header = headers[colNumber - 1];
    const isPublicHeader = HACIENDA_PUBLIC_COLUMNS.has(header);
    cell.font = { bold: true, color: { argb: isPublicHeader ? 'FF000000' : 'FFFFFFFF' }, name: EXCEL_FONT, size: EXCEL_FONT_SIZE };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isPublicHeader ? TABLE_PUBLIC_HEADER_FILL : TABLE_HEADER_FILL } };
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

      if (isAlertRow(rows[rowNumber - 2])) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TABLE_ALERT_FILL } };
      }
    });
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };

  await workbook.xlsx.writeFile(filePath);
}

function isAlertRow(row) {
  return /invalidado|rechazado/i.test(String(row?.['Estado del DTE'] || ''));
}

function orderExcelHeaders(headers) {
  const normalHeaders = headers.filter((header) => !HACIENDA_PUBLIC_COLUMNS.has(header));
  const publicHeaders = headers.filter((header) => HACIENDA_PUBLIC_COLUMNS.has(header));
  return [...normalHeaders, ...publicHeaders];
}

ipcMain.handle('hacienda:public-query', async (_event, request) => {
  const ambiente = String(request?.ambiente || '01').padStart(2, '0');
  const codigoGeneracion = String(request?.codigoGeneracion || '').trim();
  const fechaEmi = normalizePublicDate(request?.fechaEmi);
  if (!codigoGeneracion || !fechaEmi) throw new Error('Codigo de generacion o fecha invalidos.');

  const basePath = ambiente === '01' ? 'prod' : 'test';
  const url = `https://admin.factura.gob.sv/${basePath}/consultas/publica/simple/1`;
  const response = await getPublicQueryHttp().get(url, {
    params: { ambiente, codigoGeneracion, fechaEmi }
  });
  return response.data;
});

ipcMain.handle('external:open', async (_event, url) => {
  if (!/^https:\/\/admin\.factura\.gob\.sv\/consultaPublica\?/i.test(String(url))) {
    throw new Error('URL no permitida.');
  }
  await shell.openExternal(url);
  return true;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
