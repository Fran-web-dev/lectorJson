import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  loadPersistedFilters,
  loadPersistedSort,
  resolveFilterUpdate,
  savePersistedFilters,
  savePersistedSort
} from '../lib/filterPersistence.js';

const IVA_BOOK_FILTER_STORAGE_PREFIX = 'dte-iva-book-column-filters';
const IVA_BOOK_SORT_STORAGE_PREFIX = 'dte-iva-book-column-sort';

function getIvaBookFilterStorageKey(type) {
  return `${IVA_BOOK_FILTER_STORAGE_PREFIX}-${type || 'purchases'}`;
}

function getIvaBookSortStorageKey(type) {
  return `${IVA_BOOK_SORT_STORAGE_PREFIX}-${type || 'purchases'}`;
}

function hasActiveColumnFilter(selectedValues = [], values = []) {
  if (!selectedValues.length) return false;
  if (selectedValues.includes(NO_FILTER_VALUES_SELECTED)) return true;
  return selectedValues.length < values.length;
}

const IVA_BOOKS = {
  purchases: {
    title: 'LIBRO PARA REGISTRAR COMPRAS',
    columns: [
      { header: 'No. CORR.', width: '76px' },
      { header: 'FECHA DE EMISION', width: '120px' },
      { header: 'NUMERO DE CONTROL', width: '190px' },
      { header: 'CODIGO DE GENERACION', width: '190px' },
      { header: 'SELLO DE RECEPCION', width: '190px' },
      { header: 'N.R.C / NIT', width: '130px' },
      { header: 'NOMBRE DEL PROVEEDOR', width: '320px' },
      { header: 'COMPRAS EXENTAS INTERNAS', width: '125px', money: true },
      { header: 'COMPRAS EXENTAS IMPORTACIONES', width: '135px', money: true },
      { header: 'COMPRAS EXENTAS INTERNACIONES', width: '135px', money: true },
      { header: 'COMPRAS GRAVADAS INTERNAS', width: '135px', money: true },
      { header: 'COMPRAS GRAVADAS IMPORTACIONES', width: '145px', money: true },
      { header: 'COMPRAS GRAVADAS INTERNACIONES', width: '145px', money: true },
      { header: 'IVA', width: '110px', money: true },
      { header: 'TOTAL COMPRAS', width: '130px', money: true },
      { header: 'COMPRAS A SUJETOS EXCLUIDOS', width: '160px', money: true },
      { header: 'PERCEPCION 1% IVA', width: '150px', money: true },
      { header: 'RETENCION 1% IVA', width: '130px', money: true },
      { header: 'TIPO DE OPERACIÓN', width: '130px', redHeader: true },
      { header: 'CLASIFICACIÓN', width: '185px', redHeader: true },
      { header: 'SECTOR', width: '165px', redHeader: true },
      { header: 'TIPO DE COSTO / GASTO', width: '130px', redHeader: true }
    ]
  },
  ccfSales: {
    title: 'LIBRO DE VENTAS PARA REGISTRAR COMPROBANTES DE CREDITO FISCAL',
    columns: [
      { header: 'No. CORR.', width: '76px' },
      { header: 'FECHA DE EMISION', width: '120px' },
      { header: 'NUMERO DE CONTROL', width: '190px' },
      { header: 'CODIGO DE GENERACION', width: '190px' },
      { header: 'SELLO DE RECEPCION', width: '190px' },
      { header: 'N.R.C / NIT', width: '130px' },
      { header: 'NOMBRE DEL CLIENTE', width: '320px' },
      { header: 'NO SUJETAS', width: '115px', money: true },
      { header: 'EXENTAS', width: '115px', money: true },
      { header: 'VENTAS INTERNAS GRAVADAS VALOR NETO', width: '155px', money: true },
      { header: 'IVA DEBITO', width: '130px', money: true },
      { header: 'VENTA TOTAL', width: '130px', money: true },
      { header: 'RETENCION 1%', width: '120px', money: true },
      { header: 'PERCEPCION 2%', width: '120px', money: true },
      { header: 'TIPO DE OPERACION (RENTA)', width: '155px', redHeader: true },
      { header: 'TIPO DE INGRESO (Renta)', width: '165px', redHeader: true }
    ]
  },
  fcfSales: {
    title: 'LIBRO DE VENTAS PARA REGISTRAR CONSUMIDOR FINAL',
    columns: [
      { header: 'ITEM', width: '76px' },
      { header: 'FECHA EMISION', width: '120px' },
      { header: 'NUMERO DE CONTROL', width: '190px' },
      { header: 'CODIGO DE GENERACION', width: '190px' },
      { header: 'SELLO DE RECEPCION', width: '190px' },
      { header: 'Estado del DTE', width: '135px' },
      { header: 'Codigo pais', width: '110px' },
      { header: 'VENTAS NO SUJETAS', width: '175px', money: true },
      { header: 'VENTAS EXENTAS', width: '165px', money: true },
      { header: 'VENTAS GRAVADAS LOCALES', width: '185px', money: true },
      { header: 'VENTAS GRAVADAS EXPORTAC.', width: '190px', money: true },
      { header: 'TOTAL', width: '175px', money: true },
      { header: 'TIPO DE OPERACIÓN (Renta)', width: '140px', redHeader: true },
      { header: 'TIPO DE INGRESO (Renta)', width: '140px', redHeader: true }
    ]
  }
};

const EMPTY_ROWS = 24;
const ACTIONS_COLUMN_WIDTH = '92px';
const IVA_BOOK_ROW_HEIGHT = 24;
const IVA_BOOK_OVERSCAN = 10;
const FCF_IMPORT_PROGRESS_BATCH_SIZE = 250;
const IVA_BOOK_FILTER_VALUE_LIMIT = 1200;
const NO_FILTER_VALUES_SELECTED = '__DTE_FILTER_NONE_SELECTED__';
const CLIENT_REGISTER_STORAGE_KEY = 'dte-registers-clients';
const PROVIDER_REGISTER_STORAGE_KEY = 'dte-registers-providers';
const IVA_BOOK_HEADER_STORAGE_PREFIX = 'dte-iva-book-header';
const EMPTY_IVA_BOOK_HEADER = {
  companyName: '',
  businessLine: '',
  nrc: '',
  nit: '',
  dui: '',
  month: '',
  year: ''
};
const PROVIDER_RENT_COLUMNS = {
  operation: 'TIPO DE OPERACION (Renta)',
  classification: 'CLASIFICACION (Renta)',
  sector: 'SECTOR (Renta)',
  costExpense: 'TIPO DE COSTO/GASTO (Renta)'
};
const FCF_RENT_OPERATION_COLUMN_TOKENS = ['TIPO', 'OPERACION', 'RENTA'];
const FCF_RENT_INCOME_COLUMN_TOKENS = ['TIPO', 'INGRESO', 'RENTA'];
const FCF_RENT_OPERATION_OPTIONS = [
  '0 Para periodos anteriores a enero 2025',
  '01 Gravada',
  '02 No gravada o exenta',
  '03 Excluido o no constituye renta',
  '04 Mixta (Se refiere cuando en un mismo documento se encuentre una operaciÃ³n gravada y exenta.)',
  '12 Ingresos que ya fueron sujetos de retenciÃ³n en F910',
  '13 Sujetos pasivos excluidos (art. 6 LISR) e ingresos que no constituyen hecho generador del ISR'
];
const FCF_RENT_INCOME_OPTIONS = [
  '0 Para periodos anteriores a enero 2025',
  '01 Profesiones, Artes y Oficios',
  '02 Actividades de Servicios',
  '03 Actividades Comerciales',
  '04 Actividades Industriales',
  '05 Actividades Agropecuarias',
  '06 Utilidades y Dividendos',
  '07 Exportaciones de bienes',
  '08 Servicios Realizados en el Exterior y Utilizados en El Salvador',
  '09 Exportaciones de servicios',
  '10 Otras rentas gravables',
  '12 Ingresos que ya fueron sujetos de retenciÃ³n en F910',
  '13 Sujetos pasivos excluidos (art. 6 LISR) e ingresos que no constituyen hecho generador del ISR'
];
const PURCHASE_RENT_COLUMNS = {
  operation: 'TIPO DE OPERACIÃ“N',
  classification: 'CLASIFICACIÃ“N',
  sector: 'SECTOR',
  costExpense: 'TIPO DE COSTO / GASTO'
};
const PROVIDER_RENT_COLUMN_TOKENS = {
  operation: ['TIPO', 'OPERACION', 'RENTA'],
  classification: ['CLASIFICACION', 'RENTA'],
  sector: ['SECTOR', 'RENTA'],
  costExpense: ['TIPO', 'COSTO', 'GASTO', 'RENTA']
};
const PURCHASE_RENT_COLUMN_TOKENS = {
  operation: ['TIPO', 'OPERACION'],
  classification: ['CLASIFICACION'],
  sector: ['SECTOR'],
  costExpense: ['TIPO', 'COSTO', 'GASTO']
};
const CLIENT_REGISTER_COLUMN_TOKENS = {
  operation: ['TIPO', 'OPERACION'],
  income: ['TIPO', 'INGRESO']
};
const IVA_BOOK_MAPPINGS = {
  fcfSales: {
    'FECHA EMISION': 'Fecha',
    'NUMERO DE CONTROL': 'Numero de Control',
    'CODIGO DE GENERACION': ['Codigo de generacion local', 'Numero del Documento', 'Numero Documento'],
    'SELLO DE RECEPCION': ['Serie del Documento', 'Serie Documento'],
    'Estado del DTE': 'Estado del DTE',
    'Codigo pais': 'Codigo pais',
    'VENTAS NO SUJETAS': 'Total no Sujetas',
    'VENTAS EXENTAS': 'Total Exenta',
    'VENTAS GRAVADAS LOCALES': { exceptTypeCode: '11', source: 'Total Gravado' },
    'VENTAS GRAVADAS EXPORTAC.': { onlyTypeCode: '11', source: ['Monto Total Operación', 'Monto Total de la Operacion'] },
    TOTAL: 'Total a Pagar',
    'TIPO DE OPERACIÓN (Renta)': { fixed: '01 Gravada' },
    'TIPO DE INGRESO (Renta)': { fromItemType: true }
  },
  ccfSales: {
    'FECHA DE EMISION': 'Fecha',
    'NUMERO DE CONTROL': ['Numero de Control', 'Numero de control'],
    'CODIGO DE GENERACION': {
      byTypeCode: {
        '09': 'Numero de documento',
        default: ['Codigo de generacion local', 'Numero del Documento', 'Numero Documento']
      }
    },
    'SELLO DE RECEPCION': {
      byTypeCode: {
        '09': 'Serie de Documento',
        default: ['Serie del Documento', 'Serie Documento']
      }
    },
    'N.R.C / NIT': {
      byTypeCode: {
        '07': ['NRC emisor', 'NIT emisor'],
        '09': 'NRC Emisor',
        default: ['NRC receptor', 'NIT receptor']
      }
    },
    'NOMBRE DEL CLIENTE': {
      byTypeCode: {
        '07': 'Nombre emisor',
        '09': 'Nombre emisor',
        default: 'Nombre receptor'
      }
    },
    'NO SUJETAS': {
      byTypeCode: {
        '05': { calculate: [{ add: 'Total no Sujetas' }, { subtract: 'Desc. no Sujeta' }] },
        '07': { fixed: '$0.00' },
        '09': { fixed: '$0.00' },
        default: 'Total no Sujetas'
      }
    },
    EXENTAS: {
      byTypeCode: {
        '05': { calculate: [{ add: 'Total Exenta' }, { subtract: 'Desc. Exenta' }] },
        '07': { fixed: '$0.00' },
        '09': { fixed: '$0.00' },
        default: 'Total Exenta'
      }
    },
    'VENTAS INTERNAS GRAVADAS VALOR NETO': {
      byTypeCode: {
        '05': { calculate: [{ add: 'Total Gravado' }, { subtract: 'Desc. Gravado' }] },
        '07': { fixed: '$0.00' },
        '09': { fixed: '$0.00' },
        default: 'Total Gravado'
      }
    },
    'IVA DEBITO': {
      byTypeCode: {
        '07': { fixed: '$0.00' },
        '09': { fixed: '$0.00' },
        default: ['Debito Fiscal', 'Credito Fiscal']
      }
    },
    'VENTA TOTAL': {
      byTypeCode: {
        '07': { fixed: '$0.00' },
        '09': { fixed: '$0.00' },
        default: 'Monto Total de la Operacion'
      }
    },
    'RETENCION 1%': {
      byTypeCode: {
        '03': { fixed: '$0.00' },
        '05': { fixed: '$0.00' },
        '07': ['Retencion IVA', 'IVA retenido', 'IVA Retenido'],
        '09': { fixed: '$0.00' },
        default: 'IVA Retenido'
      }
    },
    'PERCEPCION 2%': {
      byTypeCode: {
        '07': { fixed: '$0.00' },
        '09': 'IVA percibido 2%',
        default: ['Percepciones', 'IVA Percibido']
      }
    },
    'TIPO DE OPERACION (RENTA)': {
      byTypeCode: {
        '07': { fixed: '' },
        '09': { fixed: '' },
        default: { fixed: '01 Gravada' }
      }
    },
    'TIPO DE INGRESO (Renta)': {
      byTypeCode: {
        '07': { fixed: '' },
        '09': { fixed: '' },
        default: { fromItemType: true }
      }
    }
  },
  purchases: {
    'FECHA DE EMISION': 'Fecha',
    'NUMERO DE CONTROL': 'Numero de Control',
    'CODIGO DE GENERACION': ['Codigo de generacion local', 'Numero del Documento', 'Numero Documento'],
    'SELLO DE RECEPCION': ['Serie del Documento', 'Serie de Documento', 'Serie Documento'],
    'N.R.C / NIT': ['Doc ID Sujeto Excluido', 'NRC emisor'],
    'NOMBRE DEL PROVEEDOR': ['Nombre sujetoExcluido', 'Nombre emisor'],
    'COMPRAS EXENTAS INTERNAS': {
      byTypeCode: {
        '05': { calculate: [{ add: 'Total Exenta' }, { subtract: 'Desc. Exenta' }, { add: 'Total no Sujetas' }, { subtract: 'Desc. no Sujeta' }, { add: 'FOVIAL' }, { add: 'COTRANS' }], negative: true },
        default: { sum: ['FOVIAL', 'COTRANS'] }
      }
    },
    'COMPRAS GRAVADAS INTERNAS': {
      byTypeCode: {
        '05': { source: ['Sub-total', 'Subtotal'], negative: true },
        '14': { fixed: '$0.00' },
        default: ['Sub-total', 'Subtotal']
      }
    },
    IVA: 'Credito Fiscal',
    'TOTAL COMPRAS': {
      byTypeCode: {
        '05': { source: 'Monto total de la operacion', negative: true },
        default: 'Total de Compra'
      }
    },
    'COMPRAS A SUJETOS EXCLUIDOS': {
      byTypeCode: {
        '14': 'Subtotal Compra',
        default: 'Total Compra'
      }
    },
    'PERCEPCION 1% IVA': { byTypeCode: { '05': { source: 'Percepciones', negative: true }, default: 'Percepciones' } },
    'RETENCION 1% IVA': { byTypeCode: { '05': { source: 'IVA Retenido', negative: true }, default: 'IVA Retenido' } }
  }
};
const IVA_BOOK_REQUIREMENTS = {
  fcfSales: {
    accepted: [
      { typeCode: '01', structureName: 'FCF EMISOR' },
      { typeCode: '11', structureName: 'FEX EMISOR' }
    ],
    message: 'Para cargar datos en Libro de Ventas FCF seleccione en INICIO: Tipo de Documento 01 con estructura FCF EMISOR, o Tipo de Documento 11 con estructura FEX EMISOR.'
  },
  ccfSales: {
    accepted: [
      { typeCode: '03', structureName: 'CCF EMISOR VENTA' },
      { typeCode: '05', structureName: 'NOTA DE CREDITO EMISOR VENTA' },
      { typeCode: '05', structureName: 'NOTA DE CREDITO EMISOR VENTAS' },
      { typeCode: '07', structureName: 'COMPROBANTE DE RETENCION RECEPTOR' },
      { typeCode: '07', structureName: 'COMPROBANTE DE RETENCION RECEPCION' },
      { typeCode: '09', structureName: 'DCL RECEPTOR' }
    ],
    message: 'Para importar datos en Libro de Ventas CCF seleccione en INICIO: Tipo de Documento 03 con estructura CCF EMISOR VENTA, Tipo de Documento 05 con estructura NOTA DE CREDITO EMISOR VENTA, Tipo de Documento 07 con estructura COMPROBANTE DE RETENCION RECEPTOR, o Tipo de Documento 09 con estructura DCL RECEPTOR.'
  },
  purchases: {
    accepted: [
      { typeCode: '03', structureName: 'CCF RECEPTOR COMPRA' },
      { typeCode: '05', structureName: 'NOTA DE CREDITO RECEPTOR COMPRA' },
      { typeCode: '14', structureName: 'FSE EMISOR' }
    ],
    message: 'Para importar datos en Libro de Compras seleccione en INICIO: Tipo de Documento 03 con estructura CCF RECEPTOR COMPRA, Tipo de Documento 05 con estructura NOTA DE CREDITO RECEPTOR COMPRA, o Tipo de Documento 14 con estructura FSE EMISOR.'
  }
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function createEmptyBookRows(columns, count = EMPTY_ROWS) {
  return Array.from({ length: count }, (_, rowIndex) => Object.fromEntries(
    columns.map((column, columnIndex) => [column.header, columnIndex === 0 ? String(rowIndex + 1) : ''])
  ));
}

function renumberBookRows(rows, columns) {
  const firstColumn = columns[0]?.header;
  if (!firstColumn) return rows;
  return rows.map((row, index) => ({
    ...row,
    [firstColumn]: String(index + 1)
  }));
}

function getVisibleBookRange(scrollTop, viewportHeight, rowCount) {
  if (rowCount <= 0) return { endIndex: 0, startIndex: 0 };
  const rawStartIndex = Math.max(0, Math.floor(scrollTop / IVA_BOOK_ROW_HEIGHT) - IVA_BOOK_OVERSCAN);
  const startIndex = Math.min(rawStartIndex, rowCount);
  const visibleCount = Math.ceil(viewportHeight / IVA_BOOK_ROW_HEIGHT) + IVA_BOOK_OVERSCAN * 2;
  const endIndex = Math.min(rowCount, startIndex + visibleCount);
  return { endIndex, startIndex };
}

function hasBookRowData(row, columns) {
  return columns.some((column, columnIndex) => columnIndex > 0 && String(row?.[column.header] || '').trim());
}

function hasUsefulBookFilterData(row) {
  return Object.entries(row || {}).some(([key, value]) => (
    !key.startsWith('__')
    && !['NO. CORR.', 'ITEM', 'CORR.'].includes(key)
    && String(value || '').trim()
  ));
}

function mergeTypedBookRows(currentRows, importedRows, importedTypeCode, columns, type) {
  const normalizedImportedType = String(importedTypeCode || '').padStart(2, '0');
  const existingRows = currentRows.filter((row) => (
    hasBookRowData(row, columns) && row.__sourceTypeCode !== normalizedImportedType
  ));
  const taggedImportedRows = importedRows.map((row) => ({
    ...row,
    __sourceTypeCode: normalizedImportedType
  }));

  return renumberBookRows(orderRowsForIvaBook([...existingRows, ...taggedImportedRows], type), columns);
}

function resolveDominantItemType(value) {
  const itemTypes = String(value || '').match(/[123]/g) || [];
  if (!itemTypes.length) return '';

  const counts = new Map();
  for (const itemType of itemTypes) {
    counts.set(itemType, (counts.get(itemType) || 0) + 1);
  }

  return itemTypes.reduce((dominant, itemType) => (
    (counts.get(itemType) || 0) > (counts.get(dominant) || 0) ? itemType : dominant
  ), itemTypes[0]);
}

function normalizeColumnText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function columnMatchesTokens(header, tokens) {
  const normalizedHeader = normalizeColumnText(header);
  return tokens.every((token) => normalizedHeader.includes(token));
}

function getSalesRentColumnOptions(type, header, value = '') {
  if (type !== 'fcfSales' && type !== 'ccfSales') return [];
  const options = columnMatchesTokens(header, FCF_RENT_OPERATION_COLUMN_TOKENS)
    ? FCF_RENT_OPERATION_OPTIONS
    : columnMatchesTokens(header, FCF_RENT_INCOME_COLUMN_TOKENS)
      ? FCF_RENT_INCOME_OPTIONS
      : [];
  if (!options.length) return [];
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue || options.includes(normalizedValue)) return options;
  return [normalizedValue, ...options];
}

function isSalesRentColumn(type, header) {
  if (type !== 'fcfSales' && type !== 'ccfSales') return false;
  return columnMatchesTokens(header, FCF_RENT_OPERATION_COLUMN_TOKENS)
    || columnMatchesTokens(header, FCF_RENT_INCOME_COLUMN_TOKENS);
}

function getSourceValue(row, sourceColumn) {
  if (sourceColumn && typeof sourceColumn === 'object' && !Array.isArray(sourceColumn)) {
    const sourceType = String(row?.['Tipo DTE'] || '').padStart(2, '0');

    if (sourceColumn.byTypeCode) {
      return getSourceValue(row, sourceColumn.byTypeCode[sourceType] ?? sourceColumn.byTypeCode.default);
    }

    if (Object.prototype.hasOwnProperty.call(sourceColumn, 'fixed')) {
      return sourceColumn.fixed;
    }

    if (sourceColumn.fromItemType) {
      const itemType = resolveDominantItemType(row?.['Tipo de Item']);
      if (itemType === '1' || itemType === '3') return '03 Actividades comerciales';
      if (itemType === '2') return '02 Actividades de servicios';
      return '';
    }

    if (sourceColumn.calculate) {
      const total = sourceColumn.calculate.reduce((sum, item) => {
        if (item.add) return sum + parseCurrency(getSourceValue(row, item.add));
        if (item.subtract) return sum - parseCurrency(getSourceValue(row, item.subtract));
        return sum;
      }, 0);
      if (!total) return '';
      const signedTotal = sourceColumn.negative ? -Math.abs(total) : total;
      return `$${currencyFormatter.format(signedTotal)}`;
    }

    if (sourceColumn.sum) {
      const total = sourceColumn.sum.reduce((sum, column) => sum + parseCurrency(row?.[column]), 0);
      if (!total) return '';
      const signedTotal = sourceColumn.negative ? -Math.abs(total) : total;
      return `$${currencyFormatter.format(signedTotal)}`;
    }

    if (sourceColumn.onlyTypeCode && sourceType !== sourceColumn.onlyTypeCode) return sourceColumn.fallback || '';
    if (sourceColumn.exceptTypeCode && sourceType === sourceColumn.exceptTypeCode) return sourceColumn.fallback || '';
    const value = getSourceValue(row, sourceColumn.source);
    if (sourceColumn.negative && parseCurrency(value) > 0) return `$${currencyFormatter.format(-Math.abs(parseCurrency(value)))}`;
    return value || sourceColumn.fallback || '';
  }

  if (Array.isArray(sourceColumn)) {
    for (const column of sourceColumn) {
      const value = row?.[column];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return '';
  }

  return sourceColumn ? row?.[sourceColumn] ?? '' : '';
}

function normalizeIvaBookValue(columnHeader, value) {
  if (columnHeader === 'NOMBRE DEL CLIENTE' || columnHeader === 'NOMBRE DEL PROVEEDOR') {
    return String(value || '').toLocaleUpperCase('es-SV');
  }
  return value;
}

function formatNegativeMoney(value) {
  const amount = parseCurrency(value);
  if (!amount) return '';
  return `$${currencyFormatter.format(-Math.abs(amount))}`;
}

function hasInvalidOrRejectedStatus(row) {
  const status = String(row?.['Estado del DTE'] || '').toLowerCase();
  return status.includes('invalidado') || status.includes('rechazado');
}

function normalizeRegisterLookupKey(value) {
  return String(value || '').replace(/[-\s]/g, '').trim().toUpperCase();
}

function normalizeColumnToken(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/gi, ' ')
    .trim()
    .toUpperCase();
}

function findColumnByTokens(row, tokens) {
  return Object.keys(row || {}).find((key) => {
    const normalizedKey = normalizeColumnToken(key);
    return tokens.every((token) => normalizedKey.includes(token));
  });
}

function getValueByTokens(row, tokens) {
  const column = findColumnByTokens(row, tokens);
  return column ? row[column] || '' : '';
}

function setValueByTokens(row, tokens, value) {
  const column = findColumnByTokens(row, tokens);
  if (!column) return row;
  return { ...row, [column]: value || '' };
}

function loadProviderRegisterLookup() {
  if (typeof window === 'undefined') return new Map();

  try {
    const rows = JSON.parse(window.localStorage.getItem(PROVIDER_REGISTER_STORAGE_KEY) || '[]');
    if (!Array.isArray(rows)) return new Map();

    const lookup = new Map();
    for (const row of rows) {
      const hasRentData = Object.values(PROVIDER_RENT_COLUMN_TOKENS).some((tokens) => String(getValueByTokens(row, tokens)).trim());
      if (!hasRentData) continue;

      for (const keyColumn of ['NRC', 'NIT', 'DUI']) {
        const key = normalizeRegisterLookupKey(row?.[keyColumn]);
        if (key && !lookup.has(key)) lookup.set(key, row);
      }
    }

    return lookup;
  } catch {
    return new Map();
  }
}

function loadClientRegisterLookup() {
  if (typeof window === 'undefined') return { nit: new Map(), nrc: new Map() };

  try {
    const rows = JSON.parse(window.localStorage.getItem(CLIENT_REGISTER_STORAGE_KEY) || '[]');
    if (!Array.isArray(rows)) return { nit: new Map(), nrc: new Map() };

    const lookup = { nit: new Map(), nrc: new Map() };
    for (const row of rows) {
      const hasClientData = Object.values(CLIENT_REGISTER_COLUMN_TOKENS).some((tokens) => String(getValueByTokens(row, tokens)).trim());
      if (!hasClientData) continue;

      const nrcKey = normalizeRegisterLookupKey(row?.NRC);
      const nitKey = normalizeRegisterLookupKey(row?.NIT);
      if (nrcKey && !lookup.nrc.has(nrcKey)) lookup.nrc.set(nrcKey, row);
      if (nitKey && !lookup.nit.has(nitKey)) lookup.nit.set(nitKey, row);
    }

    return lookup;
  } catch {
    return { nit: new Map(), nrc: new Map() };
  }
}

function applyProviderRentDataToPurchaseRow(bookRow, providerLookup) {
  const providerKey = normalizeRegisterLookupKey(bookRow?.['N.R.C / NIT']);
  const provider = providerLookup.get(providerKey);
  if (!provider) return bookRow;

  let nextRow = { ...bookRow };
  nextRow = setValueByTokens(nextRow, PURCHASE_RENT_COLUMN_TOKENS.operation, getValueByTokens(provider, PROVIDER_RENT_COLUMN_TOKENS.operation));
  nextRow = setValueByTokens(nextRow, PURCHASE_RENT_COLUMN_TOKENS.classification, getValueByTokens(provider, PROVIDER_RENT_COLUMN_TOKENS.classification));
  nextRow = setValueByTokens(nextRow, PURCHASE_RENT_COLUMN_TOKENS.sector, getValueByTokens(provider, PROVIDER_RENT_COLUMN_TOKENS.sector));
  nextRow = setValueByTokens(nextRow, PURCHASE_RENT_COLUMN_TOKENS.costExpense, getValueByTokens(provider, PROVIDER_RENT_COLUMN_TOKENS.costExpense));
  return nextRow;
}

function applyClientRentDataToCcfSaleRow(bookRow, clientLookup) {
  const clientKey = normalizeRegisterLookupKey(bookRow?.['N.R.C / NIT']);
  const client = clientLookup.nrc.get(clientKey) || clientLookup.nit.get(clientKey);
  if (!client) return bookRow;

  return {
    ...bookRow,
    'TIPO DE OPERACION': getValueByTokens(client, CLIENT_REGISTER_COLUMN_TOKENS.operation),
    'TIPO DE INGRESO': getValueByTokens(client, CLIENT_REGISTER_COLUMN_TOKENS.income)
  };
}

function getInvalidOrRejectedOverride(bookType, columnHeader) {
  if (columnHeader === 'N.R.C / NIT' && (bookType === 'purchases' || bookType === 'ccfSales')) return '0';
  if (bookType === 'purchases' && columnHeader === 'NOMBRE DEL PROVEEDOR') return 'DOCUMENTO INVALIDADO O RECHAZADO';
  if (bookType === 'ccfSales' && columnHeader === 'NOMBRE DEL CLIENTE') return 'DOCUMENTO INVALIDADO O RECHAZADO';
  return null;
}

function parseCurrency(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  let text = String(value || '').replace(/[$\s]/g, '').trim();
  if (!text) return 0;

  const commaIndex = text.lastIndexOf(',');
  const dotIndex = text.lastIndexOf('.');
  if (commaIndex > dotIndex) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else {
    text = text.replace(/,/g, '');
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
}

function isBookDateColumn(column) {
  const header = String(column?.header || '').toUpperCase();
  return header === 'FECHA DE EMISION' || header === 'FECHA EMISION';
}

function parseBookDate(value) {
  const text = String(value || '').trim();
  if (!text) return Number.NaN;

  const dayFirst = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dayFirst) {
    const [, day, month, year, hour = '0', minute = '0', second = '0'] = dayFirst;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    ).getTime();
  }

  const yearFirst = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (yearFirst) {
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = yearFirst;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    ).getTime();
  }

  return Number.NaN;
}

function getIvaBookHeaderStorageKey(type) {
  return `${IVA_BOOK_HEADER_STORAGE_PREFIX}-${type || 'purchases'}`;
}

function loadIvaBookHeaderDraft(type) {
  try {
    const raw = window.localStorage.getItem(getIvaBookHeaderStorageKey(type));
    if (!raw) return EMPTY_IVA_BOOK_HEADER;
    return { ...EMPTY_IVA_BOOK_HEADER, ...JSON.parse(raw) };
  } catch {
    return EMPTY_IVA_BOOK_HEADER;
  }
}

function saveIvaBookHeaderDraft(type, draft) {
  try {
    window.localStorage.setItem(getIvaBookHeaderStorageKey(type), JSON.stringify(draft));
  } catch {
    // Persistencia opcional: la app debe seguir funcionando aunque localStorage falle.
  }
}

function clearIvaBookHeaderDraft(type) {
  try {
    window.localStorage.removeItem(getIvaBookHeaderStorageKey(type));
  } catch {
    // Sin accion requerida.
  }
}

function compareBookValues(aValue, bValue, column) {
  if (isBookDateColumn(column)) {
    const aDate = parseBookDate(aValue);
    const bDate = parseBookDate(bValue);
    if (Number.isFinite(aDate) && Number.isFinite(bDate)) return aDate - bDate;
    if (Number.isFinite(aDate)) return -1;
    if (Number.isFinite(bDate)) return 1;
  }

  if (column.money) return parseCurrency(aValue) - parseCurrency(bValue);

  const aNumber = Number(String(aValue || '').replace(/[$,\s]/g, ''));
  const bNumber = Number(String(bValue || '').replace(/[$,\s]/g, ''));
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;

  return String(aValue || '').localeCompare(String(bValue || ''), 'es', {
    numeric: true,
    sensitivity: 'base'
  });
}

function applyBookFilters(rows, filters) {
  const activeFilters = Object.entries(filters).filter(([, values]) => values?.length);
  if (!activeFilters.length) return rows;
  if (activeFilters.some(([, values]) => values.includes(NO_FILTER_VALUES_SELECTED))) return [];
  const filterSets = activeFilters.map(([column, values]) => [column, new Set(values)]);

  return rows.filter((row) => (
    hasUsefulBookFilterData(row)
    && filterSets.every(([column, values]) => values.has(String(row[column] || '')))
  ));
}

function matchesBookRequirement(requirement, sourceTypeCode, sourceStructureName) {
  const accepted = requirement.accepted || [requirement];
  const normalizedSourceType = String(sourceTypeCode).padStart(2, '0');
  const normalizedSourceStructure = String(sourceStructureName).toUpperCase();

  return accepted.some((option) => (
    normalizedSourceType === option.typeCode
    && normalizedSourceStructure === option.structureName
  ));
}

function orderRowsForIvaBook(rows, type) {
  const typeOrderByBook = {
    fcfSales: new Map([
      ['01', 0],
      ['11', 1]
    ]),
    ccfSales: new Map([
      ['03', 0],
      ['05', 1],
      ['07', 2],
      ['09', 3]
    ]),
    purchases: new Map([
      ['03', 0],
      ['05', 1],
      ['14', 2]
    ])
  };
  const typeOrder = typeOrderByBook[type];
  if (!typeOrder) return rows;

  return rows
    .map((row, index) => ({ index, row }))
    .sort((a, b) => {
      const aType = String(a.row?.__sourceTypeCode || a.row?.['Tipo DTE'] || '').padStart(2, '0');
      const bType = String(b.row?.__sourceTypeCode || b.row?.['Tipo DTE'] || '').padStart(2, '0');
      const aOrder = typeOrder.get(aType) ?? 99;
      const bOrder = typeOrder.get(bType) ?? 99;
      return aOrder - bOrder || a.index - b.index;
    })
    .map((item) => item.row);
}

function summarizeLoadedDteTypes(rows) {
  const counts = new Map();
  for (const row of rows) {
    const typeCode = String(row?.__sourceTypeCode || row?.['Tipo DTE'] || '').padStart(2, '0');
    if (!typeCode || typeCode === '00') continue;
    counts.set(typeCode, (counts.get(typeCode) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b, 'es', { numeric: true }))
    .map(([typeCode, count]) => ({ typeCode, count }));
}

function summarizeBookAlerts(rows) {
  let invalidCount = 0;
  let rejectedCount = 0;
  const duplicateKeys = new Map();

  for (const row of rows) {
    if (!hasBookRowData(row, [
      { header: 'CODIGO DE GENERACION' },
      { header: 'NUMERO DE CONTROL' }
    ])) continue;

    const duplicateKey = String(row?.['CODIGO DE GENERACION'] || row?.['NUMERO DE CONTROL'] || '').trim().toUpperCase();
    if (duplicateKey) duplicateKeys.set(duplicateKey, (duplicateKeys.get(duplicateKey) || 0) + 1);

    const status = String(row?.__dteStatus || row?.['Estado del DTE'] || '').toLowerCase();
    if (status.includes('invalidado')) invalidCount += 1;
    if (status.includes('rechazado')) rejectedCount += 1;
  }

  let duplicateCount = 0;
  for (const row of rows) {
    const duplicateKey = String(row?.['CODIGO DE GENERACION'] || row?.['NUMERO DE CONTROL'] || '').trim().toUpperCase();
    if (row?.__isDuplicate || (duplicateKey && duplicateKeys.get(duplicateKey) > 1)) duplicateCount += 1;
  }

  return { duplicateCount, invalidCount, rejectedCount };
}

function getBookDuplicateKeys(rows) {
  const counts = new Map();
  for (const row of rows) {
    const duplicateKey = String(row?.['CODIGO DE GENERACION'] || row?.['NUMERO DE CONTROL'] || '').trim().toUpperCase();
    if (duplicateKey) counts.set(duplicateKey, (counts.get(duplicateKey) || 0) + 1);
  }
  return counts;
}

function isDuplicateBookRow(row, duplicateKeys) {
  const duplicateKey = String(row?.['CODIGO DE GENERACION'] || row?.['NUMERO DE CONTROL'] || '').trim().toUpperCase();
  return Boolean(row?.__isDuplicate || (duplicateKey && duplicateKeys.get(duplicateKey) > 1));
}

function getSourceDuplicateKey(row) {
  return String(
    row?.['Codigo de generacion local']
    || row?.['CODIGO DE GENERACION']
    || row?.['Codigo de Generacion']
    || row?.['Numero del Documento']
    || row?.['Numero Documento']
    || row?.['Numero de Control']
    || row?.['NUMERO DE CONTROL']
    || ''
  ).trim().toUpperCase();
}

function excludeDuplicateSourceRows(rows) {
  const seenKeys = new Set();
  const uniqueRows = [];

  for (const row of rows) {
    const key = getSourceDuplicateKey(row);
    if (!key) {
      uniqueRows.push({ ...row, __isDuplicate: false });
      continue;
    }
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    uniqueRows.push({ ...row, __isDuplicate: false });
  }

  return uniqueRows;
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function buildBookFilterValues(rows, openFilter) {
  if (!openFilter) return [];

  const values = new Set();
  for (const row of rows) {
    values.add(String(row[openFilter] || ''));
    if (values.size >= IVA_BOOK_FILTER_VALUE_LIMIT) break;
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b, 'es'));
}

export function IvaBooksView({
  onNavigateRegister,
  onRowsChange,
  savedRows,
  sourceRows = [],
  sourceStructureName = '',
  sourceTypeCode = '',
  type
}) {
  const config = IVA_BOOKS[type] || IVA_BOOKS.purchases;
  const registerShortcut = type === 'purchases'
    ? { label: 'REGISTROS PROVEEDORES', view: 'registers-providers' }
    : { label: 'REGISTROS CLIENTES', view: 'registers-clients' };
  const defaultColumnWidths = useMemo(() => Object.fromEntries(
    config.columns.map((column) => [column.header, Number.parseInt(column.width, 10) || 120])
  ), [config.columns]);
  const [manualColumnWidths, setManualColumnWidths] = useState({});
  const gridTemplateColumns = useMemo(() => [
    ACTIONS_COLUMN_WIDTH,
    ...config.columns.map((column) => `${manualColumnWidths[column.header] || defaultColumnWidths[column.header]}px`)
  ].join(' '), [config.columns, defaultColumnWidths, manualColumnWidths]);
  const [bookRows, setBookRows] = useState(() => (
    savedRows?.length ? savedRows : createEmptyBookRows(config.columns)
  ));
  const [editingRowIndex, setEditingRowIndex] = useState(-1);
  const [editingDraft, setEditingDraft] = useState(null);
  const [filters, setFilters] = useState(() => loadPersistedFilters(getIvaBookFilterStorageKey(type)));
  const [filterSearch, setFilterSearch] = useState('');
  const [message, setMessage] = useState('');
  const [importProgress, setImportProgress] = useState(null);
  const [headerDraft, setHeaderDraft] = useState(() => loadIvaBookHeaderDraft(type));
  const [openFilter, setOpenFilter] = useState('');
  const [sortConfig, setSortConfig] = useState(() => loadPersistedSort(getIvaBookSortStorageKey(type)));
  const [viewport, setViewport] = useState({ height: 520, scrollTop: 0 });
  const tableViewportRef = useRef(null);
  const scrollFrameRef = useRef(0);
  const pendingViewportRef = useRef(viewport);
  const rowsChangeTimerRef = useRef(0);

  useEffect(() => {
    if (!onRowsChange) return undefined;
    if (rowsChangeTimerRef.current) window.clearTimeout(rowsChangeTimerRef.current);

    rowsChangeTimerRef.current = window.setTimeout(() => {
      rowsChangeTimerRef.current = 0;
      onRowsChange(bookRows);
    }, 120);

    return () => {
      if (rowsChangeTimerRef.current) {
        window.clearTimeout(rowsChangeTimerRef.current);
        rowsChangeTimerRef.current = 0;
      }
    };
  }, [bookRows, onRowsChange]);

  useEffect(() => () => {
    if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current);
    if (rowsChangeTimerRef.current) window.clearTimeout(rowsChangeTimerRef.current);
  }, []);

  useEffect(() => {
    setManualColumnWidths({});
    setHeaderDraft(loadIvaBookHeaderDraft(type));
    setFilters(loadPersistedFilters(getIvaBookFilterStorageKey(type)));
    setSortConfig(loadPersistedSort(getIvaBookSortStorageKey(type)));
    setOpenFilter('');
    setFilterSearch('');
  }, [type]);
  const indexedBookRows = useMemo(
    () => bookRows.map((row, index) => ({ index, row })),
    [bookRows]
  );
  const rowIndexByRef = useMemo(() => new WeakMap(indexedBookRows.map((item) => [item.row, item.index])), [indexedBookRows]);
  const filteredBookRows = useMemo(() => applyBookFilters(bookRows, filters), [bookRows, filters]);
  const visibleBookRows = useMemo(() => {
    if (!sortConfig.column) return filteredBookRows;
    const column = config.columns.find((item) => item.header === sortConfig.column);
    const direction = sortConfig.direction === 'desc' ? -1 : 1;
    return [...filteredBookRows].sort((a, b) => compareBookValues(a[sortConfig.column], b[sortConfig.column], column || {}) * direction);
  }, [config.columns, filteredBookRows, sortConfig]);
  const visibleRange = useMemo(
    () => getVisibleBookRange(viewport.scrollTop, viewport.height, visibleBookRows.length),
    [viewport, visibleBookRows.length]
  );
  const renderedBookRows = useMemo(
    () => visibleBookRows.slice(visibleRange.startIndex, visibleRange.endIndex),
    [visibleBookRows, visibleRange]
  );
  const topSpacerHeight = visibleRange.startIndex * IVA_BOOK_ROW_HEIGHT;
  const bottomSpacerHeight = Math.max(0, (visibleBookRows.length - visibleRange.endIndex) * IVA_BOOK_ROW_HEIGHT);
  const totals = useMemo(() => {
    const nextTotals = {};
    const moneyColumns = config.columns.filter((column) => column.money);
    for (const column of moneyColumns) nextTotals[column.header] = 0;

    for (const row of filteredBookRows) {
      for (const column of moneyColumns) {
        nextTotals[column.header] += parseCurrency(row[column.header]);
      }
    }

    return nextTotals;
  }, [filteredBookRows, config.columns]);

  const handleFiltersChange = useCallback((update) => {
    setFilters((currentFilters) => {
      const nextFilters = resolveFilterUpdate(update, currentFilters);
      savePersistedFilters(getIvaBookFilterStorageKey(type), nextFilters);
      return nextFilters;
    });
    if (tableViewportRef.current) tableViewportRef.current.scrollTop = 0;
    pendingViewportRef.current = {
      height: tableViewportRef.current?.clientHeight || viewport.height,
      scrollTop: 0
    };
    setViewport((current) => ({ ...current, scrollTop: 0 }));
  }, [type, viewport.height]);
  const openFilterValues = useMemo(
    () => buildBookFilterValues(bookRows, openFilter),
    [bookRows, openFilter]
  );
  const filterValuesByColumn = useMemo(() => Object.fromEntries(
    config.columns.map((column) => [
      column.header,
      buildBookFilterValues(bookRows, column.header)
    ])
  ), [bookRows, config.columns]);
  const dteTypeSummary = useMemo(() => summarizeLoadedDteTypes(bookRows), [bookRows]);
  const bookAlertSummary = useMemo(() => summarizeBookAlerts(bookRows), [bookRows]);
  const duplicateKeys = useMemo(() => getBookDuplicateKeys(bookRows), [bookRows]);
  const useEditableBookHeader = type === 'purchases' || type === 'ccfSales' || type === 'fcfSales';

  const updateHeaderDraft = useCallback((field, value) => {
    const nextValue = ['nrc', 'nit', 'dui'].includes(field)
      ? String(value || '').replace(/\D/g, '')
      : value;
    setHeaderDraft((current) => {
      const nextDraft = { ...current, [field]: nextValue };
      saveIvaBookHeaderDraft(type, nextDraft);
      return nextDraft;
    });
  }, [type]);

  const clearHeaderDraft = useCallback(() => {
    clearIvaBookHeaderDraft(type);
    setHeaderDraft(EMPTY_IVA_BOOK_HEADER);
    setMessage('Datos del contribuyente eliminados correctamente.');
  }, [type]);

  function toggleSort(column) {
    setSortConfig((current) => {
      const nextSort = {
        column: column.header,
        direction: current.column === column.header && current.direction === 'asc' ? 'desc' : 'asc'
      };
      savePersistedSort(getIvaBookSortStorageKey(type), nextSort);
      return nextSort;
    });
    setViewport((current) => ({ ...current, scrollTop: 0 }));
  }

  function clearSortConfig() {
    const emptySort = { column: '', direction: 'asc' };
    setSortConfig(emptySort);
    savePersistedSort(getIvaBookSortStorageKey(type), emptySort);
  }

  const handleTableScroll = useCallback((event) => {
    const target = event.currentTarget;
    pendingViewportRef.current = {
      height: target.clientHeight,
      scrollTop: target.scrollTop
    };

    if (scrollFrameRef.current) return;
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = 0;
      setViewport(pendingViewportRef.current);
    });
  }, []);

  async function importData() {
    const requirement = IVA_BOOK_REQUIREMENTS[type] || IVA_BOOK_REQUIREMENTS.purchases;
    if (!matchesBookRequirement(requirement, sourceTypeCode, sourceStructureName)) {
      setMessage(requirement.message);
      return;
    }

    const mapping = IVA_BOOK_MAPPINGS[type] || IVA_BOOK_MAPPINGS.purchases;
    const providerLookup = type === 'purchases' ? loadProviderRegisterLookup() : new Map();
    const orderedSourceRows = orderRowsForIvaBook(excludeDuplicateSourceRows(sourceRows), type);
    const shouldShowFcfProgress = type === 'fcfSales';
    const totalRowsToImport = orderedSourceRows.length;
    if (shouldShowFcfProgress) {
      setImportProgress({ completed: 0, total: totalRowsToImport });
      await waitForNextFrame();
    }

    const nextRows = [];
    for (let rowIndex = 0; rowIndex < orderedSourceRows.length; rowIndex += 1) {
      const sourceRow = orderedSourceRows[rowIndex];
      const forceZeroMoney = hasInvalidOrRejectedStatus(sourceRow);
      const isRejectedDte = String(sourceRow?.['Estado del DTE'] || '').toLowerCase().includes('rechazado');

      const bookRow = {
        ...Object.fromEntries(
        config.columns.map((column, columnIndex) => {
          const invalidOverride = forceZeroMoney ? getInvalidOrRejectedOverride(type, column.header) : null;
          const clearRentColumn = forceZeroMoney && isSalesRentColumn(type, column.header);
          const clearRejectedCcfSeal = type === 'ccfSales'
            && column.header === 'SELLO DE RECEPCION'
            && isRejectedDte;
          const value = normalizeIvaBookValue(column.header, getSourceValue(sourceRow, mapping[column.header]));
          const sourceType = String(sourceRow?.['Tipo DTE'] || sourceTypeCode || '').padStart(2, '0');
          const normalizedValue = type === 'purchases' && sourceType === '05' && column.money
            ? formatNegativeMoney(value)
            : value;
          return [
            column.header,
            columnIndex === 0
              ? String(rowIndex + 1)
              : invalidOverride !== null
                ? invalidOverride
              : clearRejectedCcfSeal
                ? ''
              : clearRentColumn
                ? ''
              : forceZeroMoney && column.money
                ? '$0.00'
                : column.money && !normalizedValue
                  ? '$0.00'
                  : normalizedValue
          ];
        })
        ),
        __dteStatus: sourceRow?.['Estado del DTE'] || '',
        __isDuplicate: Boolean(sourceRow?.__isDuplicate),
        __sourceTypeCode: String(sourceRow?.['Tipo DTE'] || sourceTypeCode || '').padStart(2, '0')
      };

      if (type === 'purchases') {
        nextRows.push(applyProviderRentDataToPurchaseRow(bookRow, providerLookup));
      } else {
        nextRows.push(bookRow);
      }

      if (
        shouldShowFcfProgress
        && ((rowIndex + 1) % FCF_IMPORT_PROGRESS_BATCH_SIZE === 0 || rowIndex + 1 === totalRowsToImport)
      ) {
        setImportProgress({ completed: rowIndex + 1, total: totalRowsToImport });
        await waitForNextFrame();
      }
    }
    if (type === 'purchases' || type === 'ccfSales' || type === 'fcfSales') {
      setBookRows((currentRows) => {
        const mergedRows = mergeTypedBookRows(currentRows, nextRows, sourceTypeCode, config.columns, type);
        return mergedRows.length ? mergedRows : createEmptyBookRows(config.columns);
      });
    } else {
      setBookRows(nextRows.length ? nextRows : createEmptyBookRows(config.columns));
    }
    setOpenFilter('');
    setFilterSearch('');
    clearSortConfig();
    setMessage(`${nextRows.length} registro(s) importado(s).`);
    if (shouldShowFcfProgress) setImportProgress(null);
  }

  const getBookRowIndex = useCallback((row) => rowIndexByRef.get(row) ?? -1, [rowIndexByRef]);

  const deleteRow = useCallback((row) => {
    const targetIndex = getBookRowIndex(row);
    if (targetIndex < 0) return;
    setBookRows((currentRows) => {
      const nextRows = renumberBookRows(currentRows.filter((_, index) => index !== targetIndex), config.columns);
      return nextRows.length ? nextRows : createEmptyBookRows(config.columns);
    });
    if (editingRowIndex === targetIndex) {
      setEditingRowIndex(-1);
      setEditingDraft(null);
    }
    setMessage('Linea eliminada correctamente.');
  }, [config.columns, editingRowIndex, getBookRowIndex]);

  const startEditing = useCallback((row) => {
    const targetIndex = getBookRowIndex(row);
    if (targetIndex < 0) return;
    setEditingRowIndex(targetIndex);
    setEditingDraft({ ...row });
  }, [getBookRowIndex]);

  const cancelEditing = useCallback(() => {
    setEditingRowIndex(-1);
    setEditingDraft(null);
  }, []);

  const saveEditing = useCallback(() => {
    if (editingRowIndex < 0 || !editingDraft) return;
    setBookRows((currentRows) => currentRows.map((row, index) => (
      index === editingRowIndex ? { ...row, ...editingDraft } : row
    )));
    setEditingRowIndex(-1);
    setEditingDraft(null);
    setMessage('Linea editada correctamente.');
  }, [editingDraft, editingRowIndex]);

  const updateEditingValue = useCallback((column, value) => {
    setEditingDraft((draft) => ({ ...(draft || {}), [column]: value }));
  }, []);

  const addRowAfter = useCallback((row) => {
    const targetIndex = getBookRowIndex(row);
    if (targetIndex < 0) return;
    const firstColumn = config.columns[0]?.header;
    const newRow = Object.fromEntries(config.columns.map((column) => [column.header, '']));

    const nextRows = renumberBookRows([
      ...bookRows.slice(0, targetIndex + 1),
      newRow,
      ...bookRows.slice(targetIndex + 1)
    ], config.columns);
    if (firstColumn) newRow[firstColumn] = nextRows[targetIndex + 1]?.[firstColumn] || String(targetIndex + 2);

    setBookRows(nextRows);
    setOpenFilter('');
    setFilterSearch('');
    clearSortConfig();
    setEditingRowIndex(targetIndex + 1);
    setEditingDraft({ ...nextRows[targetIndex + 1] });
    setMessage('Linea agregada correctamente.');
  }, [bookRows, config.columns, getBookRowIndex]);

  const startColumnResize = useCallback((event, header) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const initialWidth = manualColumnWidths[header] || defaultColumnWidths[header] || 120;

    function handleMouseMove(moveEvent) {
      const nextWidth = Math.min(Math.max(initialWidth + moveEvent.clientX - startX, 70), 720);
      setManualColumnWidths((current) => ({ ...current, [header]: Math.round(nextWidth) }));
    }

    function handleMouseUp() {
      document.body.classList.remove('isColumnResizing');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    document.body.classList.add('isColumnResizing');
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [defaultColumnWidths, manualColumnWidths]);

  const resetColumnWidth = useCallback((event, header) => {
    event.preventDefault();
    event.stopPropagation();
    setManualColumnWidths((current) => {
      const next = { ...current };
      delete next[header];
      return next;
    });
  }, []);

  async function exportExcel() {
    const exportRows = visibleBookRows.filter((row) => (
      config.columns.some((column, columnIndex) => columnIndex > 0 && String(row[column.header] || '').trim())
    ));

    if (!exportRows.length) {
      setMessage('No hay registros para exportar.');
      return;
    }

    if (!window.dteApp?.exportIvaBookExcel) {
      setMessage('Reinicie la aplicacion para activar la exportacion de libros de IVA.');
      return;
    }

    try {
      const firstColumn = config.columns[0]?.header;
      const rowsForExport = firstColumn
        ? exportRows.map((row, index) => ({ ...row, [firstColumn]: String(index + 1) }))
        : exportRows;
      const filePath = await window.dteApp.exportIvaBookExcel({
        columns: config.columns,
        headerDraft,
        rows: rowsForExport,
        title: config.title,
        totals
      });
      if (filePath) setMessage(`Libro exportado: ${filePath}`);
    } catch (error) {
      setMessage(`No se pudo exportar el libro: ${error.message}`);
    }
  }

  function clearTable() {
    const hasRows = bookRows.some((row) => (
      config.columns.some((column, columnIndex) => columnIndex > 0 && String(row[column.header] || '').trim())
    ));

    setBookRows(createEmptyBookRows(config.columns));
    setFilters({});
    savePersistedFilters(getIvaBookFilterStorageKey(type), {});
    setOpenFilter('');
    setFilterSearch('');
    clearSortConfig();
    cancelEditing();
    setMessage(hasRows ? 'Tabla limpiada correctamente.' : 'La tabla ya esta vacia.');
  }

  return (
    <section className="ivaBookView" data-tour="iva-book-view">
      <div className="ivaBookToolbar" data-tour="iva-book-toolbar">
        {(message || dteTypeSummary.length || bookAlertSummary.duplicateCount || bookAlertSummary.invalidCount || bookAlertSummary.rejectedCount) ? (
          <span className="ivaBookMessage">
            {message ? <span>{message}</span> : null}
            {type === 'fcfSales' && importProgress ? (
              <span className="ivaBookImportProgress">
                Cargando {importProgress.completed}/{importProgress.total} archivo(s)...
              </span>
            ) : null}
            {dteTypeSummary.length ? (
              <span className="ivaBookTypeSummary" aria-label="Contador de documentos por tipo">
                {dteTypeSummary.map((item) => (
                  <strong className="ivaBookTypeChip" key={item.typeCode}>
                    DTE-{item.typeCode}: {item.count}
                  </strong>
                ))}
              </span>
            ) : null}
            <span className="ivaBookAlertSummary" aria-label="Alertas de documentos">
              <strong className="ivaBookAlertChip duplicate">
                DTE duplicados: {bookAlertSummary.duplicateCount}
              </strong>
              <strong className="ivaBookAlertChip invalid">
                DTE invalidados: {bookAlertSummary.invalidCount}
              </strong>
              <strong className="ivaBookAlertChip rejected">
                DTE rechazados: {bookAlertSummary.rejectedCount}
              </strong>
            </span>
          </span>
        ) : null}
        <button
          className="actionButton"
          data-tour="iva-register-shortcut-button"
          onClick={() => onNavigateRegister?.(registerShortcut.view)}
          type="button"
        >
          {registerShortcut.label}
        </button>
        <button className="actionButton" data-tour="iva-load-button" onClick={importData} type="button">CARGAR DATOS</button>
        <button className="actionButton" data-tour="iva-export-button" onClick={exportExcel} type="button">EXPORTAR A EXCEL</button>
        {useEditableBookHeader ? (
          <button className="actionButton dangerActionButton" onClick={clearHeaderDraft} type="button">
            LIMPIAR DATOS CONTRIBUYENTES
          </button>
        ) : null}
        <button className="actionButton dangerActionButton" data-tour="iva-clear-button" onClick={clearTable} type="button">LIMPIAR TABLA</button>
      </div>

      <div className="ivaBookSheet">
        {useEditableBookHeader ? (
          <div className="ivaBookSalesHeader">
            <div className="ivaBookSalesHeaderTitle">{config.title}</div>
            <label className="ivaBookSalesHeaderField company">
              <span>NOMBRE DE LA EMPRESA:</span>
              <input
                onChange={(event) => updateHeaderDraft('companyName', event.target.value)}
                value={headerDraft.companyName}
              />
            </label>
            <label className="ivaBookSalesHeaderField giro">
              <span>GIRO:</span>
              <input
                onChange={(event) => updateHeaderDraft('businessLine', event.target.value)}
                value={headerDraft.businessLine}
              />
            </label>
            <div className="ivaBookSalesHeaderRow">
              <label className="ivaBookSalesHeaderField">
                <span>NRC:</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => updateHeaderDraft('nrc', event.target.value)}
                  pattern="[0-9]*"
                  value={headerDraft.nrc}
                />
              </label>
              <label className="ivaBookSalesHeaderField compact">
                <span>NIT:</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => updateHeaderDraft('nit', event.target.value)}
                  pattern="[0-9]*"
                  value={headerDraft.nit}
                />
              </label>
              <label className="ivaBookSalesHeaderField compact">
                <span>DUI:</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => updateHeaderDraft('dui', event.target.value)}
                  pattern="[0-9]*"
                  value={headerDraft.dui}
                />
              </label>
            </div>
            <label className="ivaBookSalesHeaderField">
              <span>MES:</span>
              <input
                onChange={(event) => updateHeaderDraft('month', event.target.value)}
                value={headerDraft.month}
              />
            </label>
            <label className="ivaBookSalesHeaderField">
              <span>AÑO:</span>
              <input
                onChange={(event) => updateHeaderDraft('year', event.target.value)}
                value={headerDraft.year}
              />
            </label>
          </div>
        ) : (
          <div className="ivaBookHeader">
            <div className="ivaBookHeaderLabel">NOMBRE EMPRESA:</div>
            <div className="ivaBookHeaderValue spanWide" />
            <div className="ivaBookHeaderTitle">{config.title}</div>
            <div className="ivaBookHeaderLabel">NRC:</div>
            <div className="ivaBookHeaderValue" />
            <div className="ivaBookHeaderLabel">NIT:</div>
            <div className="ivaBookHeaderValue spanMedium" />
            <div className="ivaBookHeaderLabel">GIRO:</div>
            <div className="ivaBookHeaderValue spanWide" />
            <div className="ivaBookHeaderLabel">MES:</div>
            <div className="ivaBookHeaderValue" />
            <div className="ivaBookHeaderLabel">AÑO:</div>
            <div className="ivaBookHeaderValue" />
          </div>
        )}

        <div className="ivaBookTableViewport" onScroll={handleTableScroll} ref={tableViewportRef}>
          <div className="ivaBookTable" style={{ gridTemplateColumns }}>
          <div className="ivaBookTotalCell" />
          {config.columns.map((column, columnIndex) => {
            const totalValue = column.money ? `$${currencyFormatter.format(totals[column.header] || 0)}` : '';
            const isLastColumn = columnIndex === config.columns.length - 1;
            return (
              <div className={`ivaBookTotalCell ${isLastColumn ? 'ivaBookLastColumn' : ''}`} key={`total-${column.header}`} title={totalValue}>
                {totalValue}
              </div>
            );
          })}

          <div className="ivaBookHeadCell ivaBookActionsHead">ACCIONES</div>
          {config.columns.map((column, columnIndex) => (
            <div className={`ivaBookHeadCell ${column.redHeader ? 'ivaBookRedHeadCell' : ''} ${columnIndex === config.columns.length - 1 ? 'ivaBookLastColumn' : ''}`} key={column.header} onClick={() => toggleSort(column)} role="columnheader" title={`Ordenar ${column.header}`}>
              <span>{column.header}</span>
              {sortConfig.column === column.header ? (
                <span className="sortIndicator">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
              ) : null}
              <button
                className={`excelFilterButton ${hasActiveColumnFilter(filters[column.header], filterValuesByColumn[column.header]) ? 'active' : ''}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenFilter(openFilter === column.header ? '' : column.header);
                  setFilterSearch('');
                }}
                title={`Filtrar ${column.header}`}
                type="button"
              >
                v
              </button>
              {openFilter === column.header ? (
                <IvaBookFilterMenu
                  alignStart={columnIndex < 2}
                  column={column.header}
                  filterSearch={filterSearch}
                  onClose={() => setOpenFilter('')}
                  onFilterSearchChange={setFilterSearch}
                  onFiltersChange={handleFiltersChange}
                  selectedValues={filters[column.header] || []}
                  values={openFilterValues}
                />
              ) : null}
              <span
                className="ivaBookColumnResizeHandle"
                onDoubleClick={(event) => resetColumnWidth(event, column.header)}
                onMouseDown={(event) => startColumnResize(event, column.header)}
                title="Arrastrar para ajustar ancho. Doble click para restaurar."
              />
            </div>
          ))}

          {topSpacerHeight > 0 ? (
            <div className="ivaBookVirtualSpacer" style={{ height: topSpacerHeight }} />
          ) : null}

          {renderedBookRows.flatMap((row, renderIndex) => {
            const rowIndex = visibleRange.startIndex + renderIndex;
            const sourceIndex = getBookRowIndex(row);
            const isEditing = sourceIndex === editingRowIndex;
            const isDuplicateRow = isDuplicateBookRow(row, duplicateKeys);
            const actionCell = (
              <div className={`ivaBookCell ivaBookActionsCell ${rowIndex % 2 === 0 ? 'odd' : 'even'} ${isDuplicateRow ? 'duplicate' : ''}`} key={`${rowIndex}-actions`}>
                {isEditing ? (
                  <>
                    <button className="ivaBookRowButton save" onClick={saveEditing} title="Guardar" type="button">
                      <Check size={13} />
                    </button>
                    <button className="ivaBookRowButton cancel" onClick={cancelEditing} title="Cancelar" type="button">
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="ivaBookRowButton edit" onClick={() => startEditing(row)} title="Editar linea" type="button">
                      <Pencil size={13} />
                    </button>
                    <button className="ivaBookRowButton add" onClick={() => addRowAfter(row)} title="Agregar linea abajo" type="button">
                      <Plus size={13} />
                    </button>
                    <button className="ivaBookRowButton delete" onClick={() => deleteRow(row)} title="Eliminar linea" type="button">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            );
            const rowCells = config.columns.map((column, columnIndex) => (
              <div
                className={`ivaBookCell ${rowIndex % 2 === 0 ? 'odd' : 'even'} ${column.money ? 'money' : ''} ${isDuplicateRow ? 'duplicate' : ''} ${columnIndex === config.columns.length - 1 ? 'ivaBookLastColumn' : ''}`}
                key={`${rowIndex}-${column.header}`}
                title={String(row[column.header] || '')}
              >
                {isEditing && columnIndex > 0 ? (
                  <IvaBookFieldControl
                    className={`ivaBookEditInput ${column.money ? 'money' : ''}`}
                    onChange={(value) => updateEditingValue(column.header, value)}
                    options={getSalesRentColumnOptions(type, column.header, editingDraft?.[column.header])}
                    value={editingDraft?.[column.header] || ''}
                  />
                  ) : columnIndex === 0 ? (
                    rowIndex + 1
                  ) : (
                    row[column.header] || ''
                  )}
              </div>
            ));
            return [actionCell, ...rowCells];
          })}
          {bottomSpacerHeight > 0 ? (
            <div className="ivaBookVirtualSpacer" style={{ height: bottomSpacerHeight }} />
          ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function IvaBookFieldControl({
  className = '',
  onChange,
  options = [],
  value
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const closeTimerRef = useRef(null);
  const comboRef = useRef(null);

  function openOptions() {
    if (!options.length) return;
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    const rect = comboRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuStyle({
        left: `${rect.left}px`,
        top: `${rect.bottom + 2}px`,
        width: `${Math.max(rect.width, 360)}px`
      });
    }
    setIsOpen(true);
  }

  function scheduleClose() {
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 140);
  }

  if (options.length) {
    return (
      <div className={`ivaBookCombobox ${isOpen ? 'open' : ''}`} ref={comboRef}>
        <input
          className={className}
          onBlur={scheduleClose}
          onChange={(event) => onChange(event.target.value)}
          onClick={openOptions}
          onFocus={openOptions}
          placeholder="SELECCIONE O PEGUE UN VALOR..."
          value={value}
        />
        <button
          className="ivaBookComboboxButton"
          onMouseDown={(event) => {
            event.preventDefault();
            if (isOpen) setIsOpen(false);
            else openOptions();
          }}
          tabIndex={-1}
          type="button"
        >
          v
        </button>
        {isOpen ? createPortal(
          <div className="ivaBookComboboxMenu" style={menuStyle}>
            {options.map((option) => (
              <button
                className="ivaBookComboboxOption"
                key={option}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(option);
                  setIsOpen(false);
                }}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>,
          document.body
        ) : null}
      </div>
    );
  }

  return (
    <input
      className={className}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}

function IvaBookFilterMenu({
  alignStart,
  column,
  filterSearch,
  onClose,
  onFilterSearchChange,
  onFiltersChange,
  selectedValues,
  values
}) {
  const normalizedSearch = filterSearch.trim().toLowerCase();
  const matchingValues = normalizedSearch
    ? values.filter((value) => value.toLowerCase().includes(normalizedSearch))
    : values;
  const searchedValues = matchingValues.slice(0, 200);
  const isNoneSelected = selectedValues.includes(NO_FILTER_VALUES_SELECTED);
  const effectiveSelected = isNoneSelected ? [] : selectedValues.length ? selectedValues : values;
  const allValuesSelected = values.length > 0
    && effectiveSelected.length === values.length
    && values.every((value) => effectiveSelected.includes(value));

  function setColumnValues(nextValues) {
    onFiltersChange((filters) => ({
      ...filters,
      [column]: nextValues
    }));
  }

  return (
    <div className={`excelFilterMenu ivaBookFilterMenu ${alignStart ? 'alignStart' : ''}`} onClick={(event) => event.stopPropagation()}>
      <div className="excelFilterTitle">{column}</div>
      <input
        className="excelFilterSearch"
        onChange={(event) => {
          const nextSearch = event.target.value;
          const nextSearchNormalized = nextSearch.trim().toLowerCase();
          const nextMatchingValues = nextSearchNormalized
            ? values.filter((value) => value.toLowerCase().includes(nextSearchNormalized))
            : [];
          onFilterSearchChange(nextSearch);
          setColumnValues(nextMatchingValues);
        }}
        placeholder="Buscar"
        value={filterSearch}
      />
      <div className="excelFilterActions">
        <button onClick={() => setColumnValues(allValuesSelected ? [NO_FILTER_VALUES_SELECTED] : values)} type="button">Todos</button>
        <button onClick={onClose} type="button">Cerrar</button>
      </div>
      <div className="excelFilterValues">
        {searchedValues.map((value) => (
          <label className="excelFilterOption" key={value || '(vacio)'}>
            <input
              checked={effectiveSelected.includes(value)}
              onChange={(event) => {
                const nextValues = event.target.checked
                  ? Array.from(new Set([...effectiveSelected, value]))
                  : effectiveSelected.filter((item) => item !== value);
                setColumnValues(nextValues);
              }}
              type="checkbox"
            />
            <span>{value || '(Vacios)'}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
