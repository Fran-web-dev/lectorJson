import { HACIENDA_PUBLIC_COLUMN_SET, LOCAL_GENERATION_CODE_COLUMN } from './columnConstants.js';

export function orderColumns(columns) {
  const normalColumns = columns.filter((column) => !HACIENDA_PUBLIC_COLUMN_SET.has(column) && column !== 'Tipo de Item');
  const itemTypeColumns = columns.filter((column) => column === 'Tipo de Item');
  const haciendaColumns = columns.filter((column) => HACIENDA_PUBLIC_COLUMN_SET.has(column));
  return [...normalColumns, ...itemTypeColumns, ...haciendaColumns];
}

export function applyColumnFilters(rows, filters) {
  const activeFilters = Object.entries(filters)
    .map(([column, value]) => [column, Array.isArray(value) ? value : []])
    .filter(([, value]) => value.length);

  if (!activeFilters.length) return rows;

  const filterSets = activeFilters.map(([column, value]) => [column, new Set(value)]);

  return rows.filter((row) => filterSets.every(([column, value]) => (
    value.has(String(row[column] ?? ''))
  )));
}

export function extractRowsForSummary(documents) {
  return documents;
}

export function summarizeDteTypes(rows) {
  const counts = new Map();
  for (const row of rows) {
    const code = String(row?.payload?.identificacion?.tipoDte || row?.['Tipo DTE'] || '').trim().padStart(2, '0');
    if (!code || code === '00') continue;
    counts.set(code, (counts.get(code) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([firstCode], [secondCode]) => firstCode.localeCompare(secondCode, 'es'))
    .map(([code, count]) => ({ code, count }));
}

export function markDuplicateRows(rows) {
  const filesByDocument = new Map();

  for (const row of rows) {
    const key = getDuplicateKey(row);
    if (!key) continue;
    if (!filesByDocument.has(key)) filesByDocument.set(key, new Set());
    filesByDocument.get(key).add(row.__sourceFile || `row:${filesByDocument.get(key).size}`);
  }

  for (const row of rows) {
    const key = getDuplicateKey(row);
    row.__isDuplicate = Boolean(key && filesByDocument.get(key)?.size > 1);
  }

  return rows;
}

function normalizeDuplicateKey(value) {
  return String(value || '').trim().toUpperCase();
}

function getDuplicateKey(row) {
  return normalizeDuplicateKey(row[LOCAL_GENERATION_CODE_COLUMN]) || normalizeDuplicateKey(row['Numero de Control']);
}
