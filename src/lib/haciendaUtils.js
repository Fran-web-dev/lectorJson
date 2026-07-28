import { LOCAL_GENERATION_CODE_COLUMN } from './columnConstants.js';

const GENERATION_CODE_REGEX = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/;
const COMPACT_GENERATION_CODE_REGEX = /^[0-9A-F]{32}$/;

export function toHaciendaDate(value) {
  const text = String(value || '').trim();
  const dayFirst = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const yearFirst = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (yearFirst) {
    const [, year, month, day] = yearFirst;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return '';
}

export function formatGenerationCode(value) {
  const text = String(value || '').trim().toUpperCase();
  if (GENERATION_CODE_REGEX.test(text)) return text;

  const compact = text.replace(/-/g, '');
  if (!COMPACT_GENERATION_CODE_REGEX.test(compact)) return '';
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

export function buildHaciendaQueryUrl(row) {
  if (!row) return '';
  const ambiente = getSelectedEnvironment(row);
  const codGen = getSelectedGenerationCode(row);
  const fechaEmi = getSelectedIssueDate(row);
  if (!codGen || !fechaEmi) return '';
  return `https://admin.factura.gob.sv/consultaPublica?ambiente=${encodeURIComponent(ambiente)}&codGen=${encodeURIComponent(codGen)}&fechaEmi=${encodeURIComponent(fechaEmi)}`;
}

export function getSelectedEnvironment(row) {
  return String(row?.Ambiente || row?.ambiente || '01').padStart(2, '0');
}

export function getSelectedGenerationCode(row) {
  return formatGenerationCode(
    row?.['Codigo de Generacion']
    || row?.[LOCAL_GENERATION_CODE_COLUMN]
    || row?.['Numero del Documento']
    || row?.['Numero Documento']
    || row?.['Codigo de generacion local']
  );
}

export function getSelectedIssueDate(row) {
  return toHaciendaDate(row?.Fecha);
}

export function getUniqueQueryableRows(rows) {
  const rowsByCode = new Map();
  for (const row of rows) {
    const code = getSelectedGenerationCode(row);
    const date = getSelectedIssueDate(row);
    if (code && date && !rowsByCode.has(code)) rowsByCode.set(code, row);
  }
  return Array.from(rowsByCode.values());
}

export function getDocumentGenerationCode(document) {
  return formatGenerationCode(
    document?.payload?.identificacion?.codigoGeneracion
    || document?.payload?.codigoGeneracion
    || document?.payload?.codGen
  );
}
