const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');

const isDev = !app.isPackaged;
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');

const EXCEL_FONT = 'Tw Cen MT Condensed';
const EXCEL_FONT_SIZE = 12;
const TABLE_HEADER_FILL = 'FF2EA8C9';
const TABLE_PUBLIC_HEADER_FILL = 'FF86EFAC';
const TABLE_ALT_FILL = 'FFF1FDFF';
const TABLE_WHITE_FILL = 'FFFFFFFF';
const TABLE_DUPLICATE_FILL = 'FFFFF2CC';
const TABLE_ALERT_FILL = 'FFFEE2E2';
const REGISTER_CLIENT_HEADER_FILL = 'FFDCFCE7';
const REGISTER_CLIENT_ALT_FILL = 'FFF0FDF4';
const REGISTER_PROVIDER_HEADER_FILL = 'FFFEF3C7';
const REGISTER_PROVIDER_ALT_FILL = 'FFFFFBEB';
const ACCOUNTING_NUMBER_FORMAT = '_("$"* #,##0.00_);_("$"* (#,##0.00);_("$"* "-"??_);_(@_)';
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
const PUBLIC_BATCH_QUERY_CONCURRENCY = 18;
const FILE_READ_CONCURRENCY = 32;
const ENRICH_PUBLIC_QUERY_ON_LOAD = false;
const publicQueryCache = new Map();
let papaParser;
let excelJs;
let axiosClient;
let publicQueryHttp;

function writeStartupLog(message) {
  try {
    const logPath = path.join(app.getPath('userData'), 'startup.log');
    fsSync.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`, 'utf8');
  } catch {
    // Logging must never block app startup.
  }
}

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
      httpsAgent: new https.Agent({
        keepAlive: true,
        maxSockets: PUBLIC_BATCH_QUERY_CONCURRENCY,
        rejectUnauthorized: false
      }),
      timeout: 7000
    });
  }
  return publicQueryHttp;
}

function createWindow() {
  writeStartupLog(`Starting app. packaged=${app.isPackaged} dirname=${__dirname}`);
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
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (isDev) {
    win.loadURL('http://127.0.0.1:5173');
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    writeStartupLog(`Loading ${indexPath}`);
    win.loadFile(indexPath);
  }

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    const message = `No se pudo cargar la interfaz (${errorCode}): ${errorDescription}. ${validatedURL}`;
    writeStartupLog(message);
    dialog.showErrorBox('Error al cargar Lector DTE Hacienda', message);
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    const message = `El proceso grafico se cerro: ${details.reason}. Codigo: ${details.exitCode}`;
    writeStartupLog(message);
    dialog.showErrorBox('Error grafico', message);
  });

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) writeStartupLog(`Renderer: ${message} (${sourceId}:${line})`);
  });
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
  return { documents: enrichedDocuments, errors, sourcePath, totalFiles: filePaths.length };
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

async function queryPublicHacienda(request) {
  const ambiente = String(request?.ambiente || '01').padStart(2, '0');
  const codigoGeneracion = String(request?.codigoGeneracion || '').trim();
  const fechaEmi = normalizePublicDate(request?.fechaEmi);
  if (!codigoGeneracion || !fechaEmi) throw new Error('Codigo de generacion o fecha invalidos.');

  const basePath = ambiente === '01' ? 'prod' : 'test';
  const url = `https://admin.factura.gob.sv/${basePath}/consultas/publica/simple/1`;
  const cacheKey = `${ambiente}|${codigoGeneracion}|${fechaEmi}`;

  if (!publicQueryCache.has(cacheKey)) {
    publicQueryCache.set(cacheKey, getPublicQueryHttp().get(url, {
      params: { ambiente, codigoGeneracion, fechaEmi }
    }).then((response) => response.data).catch(() => null));
  }

  return publicQueryCache.get(cacheKey);
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
    title: 'Seleccione la carpeta contenedora de los archivos JSON',
    properties: ['openDirectory']
  });

  if (result.canceled || !result.filePaths[0]) return null;
  const folderPath = result.filePaths[0];
  const files = await collectFiles(folderPath);
  return loadFiles(files, folderPath);
});

ipcMain.handle('folder:reload', async (_event, folderPath) => {
  const resolvedFolderPath = path.resolve(String(folderPath || ''));
  const stat = await fs.stat(resolvedFolderPath);
  if (!stat.isDirectory()) throw new Error('La carpeta seleccionada ya no existe o no es valida.');

  const files = await collectFiles(resolvedFolderPath);
  return loadFiles(files, resolvedFolderPath);
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

ipcMain.handle('register:template-export', async (_event, request) => {
  const columns = Array.isArray(request?.columns) ? request.columns.filter(Boolean) : [];
  if (!columns.length) throw new Error('No hay columnas para generar la plantilla.');

  const result = await dialog.showSaveDialog({
    title: 'Guardar plantilla de registros',
    defaultPath: `Plantilla-${sanitizeFileName(request?.title || 'Registros')}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });

  if (result.canceled || !result.filePath) return null;
  await writeRegisterTemplate(result.filePath, columns, request?.title || 'REGISTROS');
  return result.filePath;
});

ipcMain.handle('register:table-export', async (_event, request) => {
  const columns = Array.isArray(request?.columns) ? request.columns.filter(Boolean) : [];
  const rows = Array.isArray(request?.rows) ? request.rows : [];
  if (!columns.length) throw new Error('No hay columnas para exportar.');
  if (!rows.length) throw new Error('No hay registros con datos para exportar.');

  const result = await dialog.showSaveDialog({
    title: 'Exportar tabla de registros',
    defaultPath: `${sanitizeFileName(request?.title || 'Registros')}-${formatExportTimestamp(new Date())}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });

  if (result.canceled || !result.filePath) return null;
  await writeRegisterTableExcel(result.filePath, rows, columns, request?.title || 'REGISTROS', request?.tone || 'client');
  return result.filePath;
});

ipcMain.handle('register:excel-import', async (_event, request) => {
  const columns = Array.isArray(request?.columns) ? request.columns.filter(Boolean) : [];
  if (!columns.length) throw new Error('No hay columnas configuradas para importar.');

  const result = await dialog.showOpenDialog({
    title: 'Importar registros desde Excel',
    properties: ['openFile'],
    filters: [
      { name: 'Excel', extensions: ['xlsx'] }
    ]
  });

  if (result.canceled || !result.filePaths[0]) return null;
  return readRegisterExcel(result.filePaths[0], columns);
});

function formatExportTimestamp(date) {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${hour}-${minute}-${second}`;
}

function sanitizeFileName(value) {
  return String(value || 'Registros')
    .replace(/[<>:"/\\|?*]+/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

async function writeRegisterTemplate(filePath, columns, title) {
  const ExcelJS = getExcelJs();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Plantilla');
  const editableColumns = columns.filter((column) => column !== 'CORR.');

  worksheet.mergeCells(1, 1, 1, editableColumns.length);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = String(title || 'REGISTROS').toUpperCase();
  titleCell.font = { bold: true, color: { argb: 'FF0F172A' }, name: EXCEL_FONT, size: EXCEL_FONT_SIZE + 2 };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };

  worksheet.columns = editableColumns.map((header) => ({
    key: header,
    width: Math.min(Math.max(String(header).length + 6, 16), /NOMBRE/i.test(header) ? 42 : 28)
  }));

  worksheet.addRow(editableColumns);
  for (let index = 0; index < 20; index += 1) {
    worksheet.addRow(Object.fromEntries(editableColumns.map((header) => [header, ''])));
  }

  worksheet.getRow(2).height = 22;
  for (let colNumber = 1; colNumber <= editableColumns.length; colNumber += 1) {
    const cell = worksheet.getRow(2).getCell(colNumber);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: EXCEL_FONT, size: EXCEL_FONT_SIZE };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TABLE_HEADER_FILL } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  }

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return;
    row.height = 18;
    for (let colNumber = 1; colNumber <= editableColumns.length; colNumber += 1) {
      const cell = row.getCell(colNumber);
      cell.font = { name: EXCEL_FONT, size: EXCEL_FONT_SIZE };
      cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
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
    }
  });

  worksheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: editableColumns.length }
  };

  await workbook.xlsx.writeFile(filePath);
}

async function writeRegisterTableExcel(filePath, rows, columns, title, tone) {
  const ExcelJS = getExcelJs();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Registros');
  const isProvider = tone === 'provider';
  const headerFill = isProvider ? REGISTER_PROVIDER_HEADER_FILL : REGISTER_CLIENT_HEADER_FILL;
  const bodyAltFill = isProvider ? REGISTER_PROVIDER_ALT_FILL : REGISTER_CLIENT_ALT_FILL;
  const headerBorderColor = isProvider ? 'FFFACC15' : 'FF86EFAC';

  worksheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = String(title || 'REGISTROS').toUpperCase();
  titleCell.font = { bold: true, color: { argb: 'FF0F172A' }, name: EXCEL_FONT, size: EXCEL_FONT_SIZE + 2 };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
  worksheet.getRow(1).height = 24;

  worksheet.columns = columns.map((header) => ({
    key: header,
    width: Math.min(Math.max(
      Math.max(String(header).length, ...rows.map((row) => String(row?.[header] || '').length)) + 4,
      header === 'CORR.' ? 8 : 14
    ), /NOMBRE/i.test(header) ? 48 : 32)
  }));

  worksheet.addRow(columns);
  rows.forEach((row) => {
    worksheet.addRow(Object.fromEntries(columns.map((header) => [header, row?.[header] || ''])));
  });

  worksheet.getRow(2).height = 22;
  for (let colNumber = 1; colNumber <= columns.length; colNumber += 1) {
    const cell = worksheet.getRow(2).getCell(colNumber);
    cell.font = { bold: true, color: { argb: 'FF111827' }, name: EXCEL_FONT, size: EXCEL_FONT_SIZE };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerFill } };
    cell.border = {
      top: { style: 'thin', color: { argb: headerBorderColor } },
      left: { style: 'thin', color: { argb: headerBorderColor } },
      bottom: { style: 'thin', color: { argb: headerBorderColor } },
      right: { style: 'thin', color: { argb: headerBorderColor } }
    };
  }

  for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    row.height = 18;
    for (let colNumber = 1; colNumber <= columns.length; colNumber += 1) {
      const cell = row.getCell(colNumber);
      cell.font = { name: EXCEL_FONT, size: EXCEL_FONT_SIZE };
      cell.alignment = { horizontal: colNumber === 1 ? 'center' : 'left', vertical: 'middle', wrapText: false };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowNumber % 2 === 0 ? bodyAltFill : TABLE_WHITE_FILL }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
    }
  }

  worksheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: columns.length }
  };
  worksheet.views = [{ state: 'frozen', ySplit: 2 }];

  await workbook.xlsx.writeFile(filePath);
}

async function readRegisterExcel(filePath, columns) {
  const ExcelJS = getExcelJs();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const editableColumns = columns.filter((column) => column !== 'CORR.');
  const headerRowNumber = findRegisterHeaderRow(worksheet, editableColumns);
  if (!headerRowNumber) throw new Error('No se encontraron encabezados validos en la plantilla.');

  const headerRow = worksheet.getRow(headerRowNumber);
  const headerMap = new Map();
  headerRow.eachCell((cell, colNumber) => {
    const header = String(cell.value || '').trim();
    if (editableColumns.includes(header)) headerMap.set(header, colNumber);
  });

  const importedRows = [];
  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const worksheetRow = worksheet.getRow(rowNumber);
    const row = {};
    let hasData = false;
    for (const header of editableColumns) {
      const value = getExcelCellText(worksheetRow.getCell(headerMap.get(header)));
      row[header] = value;
      if (value.trim()) hasData = true;
    }
    if (hasData) importedRows.push(row);
  }

  return importedRows;
}

function findRegisterHeaderRow(worksheet, columns) {
  for (let rowNumber = 1; rowNumber <= Math.min(10, worksheet.rowCount); rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values = [];
    row.eachCell((cell) => values.push(String(cell.value || '').trim()));
    const matches = columns.filter((column) => values.includes(column)).length;
    if (matches >= Math.min(2, columns.length)) return rowNumber;
  }
  return 0;
}

function getExcelCellText(cell) {
  const value = cell?.value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (value.text) return String(value.text);
    if (value.result !== undefined) return String(value.result);
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || '').join('');
  }
  return String(value);
}

function isMoneyColumn(header) {
  return /total|monto|credito|debito|iva|fovial|cotrans|percepciones|retencion|retenido|percibido|compra|gravado|exenta|sujetas|desc\.|descuento|sub-total|pagar/i.test(header)
    && !/letras/i.test(header);
}

function parseMoney(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || !/^\$/.test(value.trim())) return value;
  const number = Number(value.replace(/[$,\s]/g, ''));
  return Number.isFinite(number) ? number : value;
}

function parseAccountingMoney(value) {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseMoney(value);
  if (typeof parsed === 'number' && Number.isFinite(parsed)) return parsed;
  const number = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function getExcelColumnWidth(header, values) {
  const maxLength = Math.max(
    String(header).length,
    ...values.slice(0, 200).map((value) => String(value ?? '').length)
  );
  if (header === 'Cant,NP,PU' || header === 'Cant,NP,PU,VTAGR' || header === 'DESCR,CANT,PU,VTAGR' || header === 'DESCR,CANT,PU,VTA' || header === 'Cant,Descrip,PU,compra') {
    return Math.min(Math.max(maxLength + 2, 18), 42);
  }
  if (header === 'Codigo de generacion local') return Math.min(Math.max(maxLength + 2, 22), 36);
  if (HACIENDA_PUBLIC_COLUMNS.has(header)) return Math.min(Math.max(maxLength + 2, 16), 38);
  return Math.min(Math.max(maxLength + 2, 11), 24);
}

async function writeStyledExcel(filePath, rows) {
  const ExcelJS = getExcelJs();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('DTE', {
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  const headers = orderExcelHeaders(Array.from(new Set(rows.flatMap((row) => Object.keys(row).filter((key) => !key.startsWith('__'))))));
  worksheet.columns = headers.map((header) => ({
    key: header,
    width: getExcelColumnWidth(header, rows.map((row) => row[header]))
  }));

  const totalsRow = {};
  const headerRow = {};
  for (const header of headers) {
    totalsRow[header] = isMoneyColumn(header)
      ? rows.reduce((total, row) => total + parseAccountingMoney(row[header]), 0)
      : '';
    headerRow[header] = header;
  }

  worksheet.addRow(totalsRow);
  worksheet.addRow(headerRow);

  for (const row of rows) {
    const excelRow = {};
    for (const header of headers) {
      excelRow[header] = isMoneyColumn(header) ? parseAccountingMoney(row[header]) : row[header];
    }
    worksheet.addRow(excelRow);
  }

  worksheet.getRow(1).height = 18;
  for (let colNumber = 1; colNumber <= headers.length; colNumber += 1) {
    const cell = worksheet.getRow(1).getCell(colNumber);
    const header = headers[colNumber - 1];
    const isMoney = isMoneyColumn(header);
    cell.font = { bold: true, color: { argb: isMoney ? 'FF1D4ED8' : 'FF94A3B8' }, name: EXCEL_FONT, size: EXCEL_FONT_SIZE };
    cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: false };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isMoney ? 'FFDBEAFE' : 'FFF8FAFC' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      bottom: { style: 'thin', color: { argb: 'FF93C5FD' } },
      right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
    };
    if (isMoney) cell.numFmt = ACCOUNTING_NUMBER_FORMAT;
  }

  worksheet.getRow(2).height = 20;
  for (let colNumber = 1; colNumber <= headers.length; colNumber += 1) {
    const cell = worksheet.getRow(2).getCell(colNumber);
    const header = headers[colNumber - 1];
    const isPublicHeader = HACIENDA_PUBLIC_COLUMNS.has(header);
    cell.font = { bold: true, color: { argb: isPublicHeader ? 'FF000000' : 'FFFFFFFF' }, name: EXCEL_FONT, size: EXCEL_FONT_SIZE };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isPublicHeader ? TABLE_PUBLIC_HEADER_FILL : TABLE_HEADER_FILL } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
    };
  }

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return;
    row.height = 18;
    for (let colNumber = 1; colNumber <= headers.length; colNumber += 1) {
      const cell = row.getCell(colNumber);
      const header = headers[colNumber - 1];
      cell.font = { bold: false, color: { argb: 'FF000000' }, name: EXCEL_FONT, size: EXCEL_FONT_SIZE };
      cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
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

      if (isMoneyColumn(header)) {
        cell.numFmt = ACCOUNTING_NUMBER_FORMAT;
      }

      if (rows[rowNumber - 3]?.__isDuplicate) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TABLE_DUPLICATE_FILL } };
      }

      if (isAlertRow(rows[rowNumber - 3])) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TABLE_ALERT_FILL } };
      }
    }
  });

  worksheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: headers.length }
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
  return queryPublicHacienda(request);
});

ipcMain.handle('hacienda:public-batch-query', async (event, request) => {
  const queries = Array.isArray(request?.queries) ? request.queries : [];
  const results = [];
  const total = queries.length;
  let completed = 0;
  let nextIndex = 0;

  function reportProgress() {
    event.sender.send('hacienda:public-batch-progress', { completed, total });
  }

  async function worker() {
    while (nextIndex < queries.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      const query = queries[currentIndex];
      try {
        const data = await queryPublicHacienda(query);
        results[currentIndex] = {
          codigoGeneracion: query?.codigoGeneracion || '',
          data
        };
      } catch {
        results[currentIndex] = {
          codigoGeneracion: query?.codigoGeneracion || '',
          data: null
        };
      } finally {
        completed += 1;
        if (completed % 25 === 0 || completed === total) reportProgress();
      }
    }
  }

  await Promise.all(Array.from(
    { length: Math.min(PUBLIC_BATCH_QUERY_CONCURRENCY, queries.length || 1) },
    () => worker()
  ));

  return results;
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

