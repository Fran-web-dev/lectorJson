import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
      { header: 'PERCEPCION 2% / 1% IVA', width: '150px', money: true },
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
      { header: 'TIPO DE OPERACION', width: '155px', redHeader: true },
      { header: 'TIPO DE INGRESO', width: '165px', redHeader: true }
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
const PROVIDER_REGISTER_STORAGE_KEY = 'dte-registers-providers';
const PROVIDER_RENT_COLUMNS = {
  operation: 'TIPO DE OPERACION (Renta)',
  classification: 'CLASIFICACION (Renta)',
  sector: 'SECTOR (Renta)',
  costExpense: 'TIPO DE COSTO/GASTO (Renta)'
};
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
const IVA_BOOK_MAPPINGS = {
  fcfSales: {
    'FECHA EMISION': 'Fecha',
    'NUMERO DE CONTROL': 'Numero de Control',
    'CODIGO DE GENERACION': ['Codigo de generacion local', 'Numero del Documento', 'Numero Documento'],
    'SELLO DE RECEPCION': ['Serie del Documento', 'Serie Documento'],
    'VENTAS NO SUJETAS': 'Total no Sujetas',
    'VENTAS EXENTAS': 'Total Exenta',
    'VENTAS GRAVADAS LOCALES': { exceptTypeCode: '11', source: 'Total Gravado' },
    'VENTAS GRAVADAS EXPORTAC.': { onlyTypeCode: '11', source: ['Monto Total Operación', 'Monto Total de la Operacion'] },
    TOTAL: 'Total a Pagar'
  },
  ccfSales: {
    'FECHA DE EMISION': 'Fecha',
    'NUMERO DE CONTROL': 'Numero de Control',
    'CODIGO DE GENERACION': ['Codigo de generacion local', 'Numero del Documento', 'Numero Documento'],
    'SELLO DE RECEPCION': ['Serie del Documento', 'Serie Documento'],
    'N.R.C / NIT': 'NRC receptor',
    'NOMBRE DEL CLIENTE': 'Nombre receptor',
    'NO SUJETAS': 'Total no Sujetas',
    EXENTAS: 'Total Exenta',
    'VENTAS INTERNAS GRAVADAS VALOR NETO': 'Total Gravado',
    'IVA DEBITO': ['Debito Fiscal', 'Credito Fiscal'],
    'VENTA TOTAL': 'Monto Total de la Operacion',
    'RETENCION 1%': 'IVA Retenido',
    'TIPO DE OPERACION': 'Condicion de la operacion',
    'TIPO DE INGRESO': { fallback: 'Gravado', source: ['Tipo de ingreso', 'Tipo de Ingreso', 'TIPO DE INGRESO'] }
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
        '05': { calculate: [{ add: 'Total Gravado' }, { subtract: 'Desc. Gravado' }], negative: true },
        default: 'Total Gravado'
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
    'PERCEPCION 2% / 1% IVA': { byTypeCode: { '05': { source: 'Percepciones', negative: true }, default: 'Percepciones' } },
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
    typeCode: '03',
    structureName: 'CCF EMISOR VENTA',
    message: 'Para importar datos en Libro de Ventas CCF seleccione en INICIO: Tipo de Documento 03 y Nombre de estructura CCF EMISOR VENTA.'
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

function hasBookRowData(row, columns) {
  return columns.some((column, columnIndex) => columnIndex > 0 && String(row?.[column.header] || '').trim());
}

function mergePurchaseRows(currentRows, importedRows, importedTypeCode, columns) {
  const normalizedImportedType = String(importedTypeCode || '').padStart(2, '0');
  const existingRows = currentRows.filter((row) => (
    hasBookRowData(row, columns) && row.__sourceTypeCode !== normalizedImportedType
  ));
  const taggedImportedRows = importedRows.map((row) => ({
    ...row,
    __sourceTypeCode: normalizedImportedType
  }));

  return renumberBookRows(orderRowsForIvaBook([...existingRows, ...taggedImportedRows], 'purchases'), columns);
}

function getSourceValue(row, sourceColumn) {
  if (sourceColumn && typeof sourceColumn === 'object' && !Array.isArray(sourceColumn)) {
    const sourceType = String(row?.['Tipo DTE'] || '').padStart(2, '0');

    if (sourceColumn.byTypeCode) {
      return getSourceValue(row, sourceColumn.byTypeCode[sourceType] ?? sourceColumn.byTypeCode.default);
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

function compareBookValues(aValue, bValue, column) {
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
  const filterSets = activeFilters.map(([column, values]) => [column, new Set(values)]);

  return rows.filter((row) => filterSets.every(([column, values]) => values.has(String(row[column] || ''))));
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
  let duplicateCount = 0;
  let invalidOrRejectedCount = 0;

  for (const row of rows) {
    if (row?.__isDuplicate) duplicateCount += 1;
    const status = String(row?.__dteStatus || row?.['Estado del DTE'] || '').toLowerCase();
    if (status.includes('invalidado') || status.includes('rechazado')) invalidOrRejectedCount += 1;
  }

  return { duplicateCount, invalidOrRejectedCount };
}

export function IvaBooksView({
  onRowsChange,
  savedRows,
  sourceRows = [],
  sourceStructureName = '',
  sourceTypeCode = '',
  type
}) {
  const config = IVA_BOOKS[type] || IVA_BOOKS.purchases;
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
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState('');
  const [message, setMessage] = useState('');
  const [openFilter, setOpenFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ column: '', direction: 'asc' });

  useEffect(() => {
    onRowsChange?.(bookRows);
  }, [bookRows, onRowsChange]);

  useEffect(() => {
    setManualColumnWidths({});
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
  const totals = useMemo(() => {
    const nextTotals = {};
    const moneyColumns = config.columns.filter((column) => column.money);
    for (const column of moneyColumns) nextTotals[column.header] = 0;

    for (const row of bookRows) {
      for (const column of moneyColumns) {
        nextTotals[column.header] += parseCurrency(row[column.header]);
      }
    }

    return nextTotals;
  }, [bookRows, config.columns]);
  const openFilterValues = useMemo(() => {
    if (!openFilter) return [];
    return Array.from(new Set(bookRows.map((row) => String(row[openFilter] || '')))).sort((a, b) => a.localeCompare(b, 'es'));
  }, [bookRows, openFilter]);
  const dteTypeSummary = useMemo(() => summarizeLoadedDteTypes(bookRows), [bookRows]);
  const bookAlertSummary = useMemo(() => summarizeBookAlerts(bookRows), [bookRows]);

  function toggleSort(column) {
    setSortConfig((current) => ({
      column: column.header,
      direction: current.column === column.header && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  function importData() {
    const requirement = IVA_BOOK_REQUIREMENTS[type] || IVA_BOOK_REQUIREMENTS.purchases;
    if (!matchesBookRequirement(requirement, sourceTypeCode, sourceStructureName)) {
      setMessage(requirement.message);
      return;
    }

    const mapping = IVA_BOOK_MAPPINGS[type] || IVA_BOOK_MAPPINGS.purchases;
    const providerLookup = type === 'purchases' ? loadProviderRegisterLookup() : new Map();
    const orderedSourceRows = orderRowsForIvaBook(sourceRows, type);
    const nextRows = orderedSourceRows.map((sourceRow, rowIndex) => {
      const forceZeroMoney = hasInvalidOrRejectedStatus(sourceRow);

      const bookRow = {
        ...Object.fromEntries(
        config.columns.map((column, columnIndex) => {
          const invalidOverride = forceZeroMoney ? getInvalidOrRejectedOverride(type, column.header) : null;
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

      return type === 'purchases'
        ? applyProviderRentDataToPurchaseRow(bookRow, providerLookup)
        : bookRow;
    });
    if (type === 'purchases') {
      setBookRows((currentRows) => {
        const mergedRows = mergePurchaseRows(currentRows, nextRows, sourceTypeCode, config.columns);
        return mergedRows.length ? mergedRows : createEmptyBookRows(config.columns);
      });
    } else {
      setBookRows(nextRows.length ? nextRows : createEmptyBookRows(config.columns));
    }
    setFilters({});
    setOpenFilter('');
    setFilterSearch('');
    setSortConfig({ column: '', direction: 'asc' });
    setMessage(`${nextRows.length} registro(s) importado(s).`);
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
    setFilters({});
    setOpenFilter('');
    setFilterSearch('');
    setSortConfig({ column: '', direction: 'asc' });
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
    setOpenFilter('');
    setFilterSearch('');
    setSortConfig({ column: '', direction: 'asc' });
    cancelEditing();
    setMessage(hasRows ? 'Tabla limpiada correctamente.' : 'La tabla ya esta vacia.');
  }

  return (
    <section className="ivaBookView">
      <div className="ivaBookToolbar">
        {(message || dteTypeSummary.length || bookAlertSummary.duplicateCount || bookAlertSummary.invalidOrRejectedCount) ? (
          <span className="ivaBookMessage">
            {message ? <span>{message}</span> : null}
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
                DTE invalidados o rechazados: {bookAlertSummary.invalidOrRejectedCount}
              </strong>
            </span>
          </span>
        ) : null}
        <button className="actionButton" onClick={importData} type="button">CARGAR DATOS</button>
        <button className="actionButton" onClick={exportExcel} type="button">EXPORTAR A EXCEL</button>
        <button className="actionButton dangerActionButton" onClick={clearTable} type="button">LIMPIAR TABLA</button>
      </div>

      <div className="ivaBookSheet">
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

        <div className="ivaBookTableViewport">
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
                className={`excelFilterButton ${filters[column.header]?.length ? 'active' : ''}`}
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
                  onFiltersChange={setFilters}
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

          {visibleBookRows.flatMap((row, rowIndex) => {
            const sourceIndex = getBookRowIndex(row);
            const isEditing = sourceIndex === editingRowIndex;
            const actionCell = (
              <div className={`ivaBookCell ivaBookActionsCell ${rowIndex % 2 === 0 ? 'odd' : 'even'}`} key={`${rowIndex}-actions`}>
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
                className={`ivaBookCell ${rowIndex % 2 === 0 ? 'odd' : 'even'} ${column.money ? 'money' : ''} ${columnIndex === config.columns.length - 1 ? 'ivaBookLastColumn' : ''}`}
                key={`${rowIndex}-${column.header}`}
                title={String(row[column.header] || '')}
              >
                {isEditing && columnIndex > 0 ? (
                  <input
                    className={`ivaBookEditInput ${column.money ? 'money' : ''}`}
                    onChange={(event) => updateEditingValue(column.header, event.target.value)}
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
          </div>
        </div>
      </div>
    </section>
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
  const effectiveSelected = selectedValues.length ? selectedValues : values;

  function setColumnValues(nextValues) {
    onFiltersChange((filters) => ({
      ...filters,
      [column]: nextValues.length === values.length ? [] : nextValues
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
        <button onClick={() => setColumnValues(values)} type="button">Todos</button>
        <button onClick={() => setColumnValues([])} type="button">Limpiar</button>
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
