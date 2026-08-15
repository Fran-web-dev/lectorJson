import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ANEXOS = {
  salesCcf: {
    title: 'ANEXO VENTA CCF',
    columns: [
      ['FECHA DE EMISION DEL DOCUMENTO', '10'],
      ['CLASE DE DOCUMENTO', '1'],
      ['TIPO DE DOCUMENTO', '2'],
      ['NÚMERO DE RESOLUCIÓN', '100'],
      ['NÚMERO DE SERIE DE DOCUMENTO', '100'],
      ['NÚMERO DE DOCUMENTO', '100'],
      ['NÚMERO DE CONTROL INTERNO', '100'],
      ['NIT O NRC DEL CLIENTE', '14'],
      ['NOMBRE, RAZON SOCIAL O DENOMINACION', 'SIN LIMITE'],
      ['VENTAS EXENTAS', '10'],
      ['VENTAS NO SUJETAS', '10'],
      ['VENTAS GRAVADAS LOCALES', '10'],
      ['DÉBITO FISCAL', '10'],
      ['VENTAS A CUENTA DE TERCEROS NO DOMICILIADOS', '10'],
      ['DÉBITO FISCAL POR VENTA A CUENTA DE TERCEROS', '10'],
      ['TOTAL VENTAS', '10'],
      ['DUI DEL CLIENTE', '9'],
      ['TIPO DE OPERACION (Renta)', '10'],
      ['TIPO DE INGRESO (Renta)', '10'],
      ['NÚMERO DE ANEXO', '1']
    ]
  },
  salesFcf: {
    title: 'ANEXO VENTA FCF',
    columns: [
      ['FECHA DE EMISIÓN', '10'],
      ['CLASE DE DOCUMENTO', '1'],
      ['TIPO DE DOCUMENTO', '2'],
      ['NÚMERO DE RESOLUCIÓN', '100'],
      ['SERIE DE DOCUMENTO', '100'],
      ['NÚMERO DE CONTROL INTERNO (DEL)', '100'],
      ['NÚMERO DE CONTROL INTERNO (AL)', '100'],
      ['NÚMERO DE DOCUMENTO (DEL)', '100'],
      ['NÚMERO DE DOCUMENTO (AL)', '100'],
      ['N° DE MAQUINA REGISTRADORA', '14'],
      ['VENTAS EXENTAS', '10'],
      ['VENTAS INTERNAS EXENTAS NO SUJETAS A PROPORCIONALIDAD', '10'],
      ['VENTAS NO SUJETAS', '10'],
      ['VENTAS GRAVADAS LOCALES', '10'],
      ['EXPORTACIONES DENTRO DEL ÁREA CENTROAMERICANA', '10'],
      ['EXPORTACIONES FUERA DEL ÁREA CENTROAMERICANA', '10'],
      ['EXPORTACIONES DE SERVICIOS', '10'],
      ['VENTAS A ZONAS FRANCAS Y DPA (TASA CERO)', '10'],
      ['VENTAS A CUENTA DE TERCEROS NO DOMICILIADOS', '10'],
      ['TOTAL VENTAS', '10'],
      ['TIPO DE OPERACION (Renta)', '10'],
      ['TIPO DE INGRESO (Renta)', '10'],
      ['NÚMERO DE ANEXO', '1']
    ]
  },
  purchases: {
    title: 'ANEXO COMPRAS',
    columns: [
      ['FECHA DE EMISIÓN', '10'],
      ['CLASE DE DOCUMENTO', '1'],
      ['TIPO DE DOCUMENTO', '2'],
      ['NÚMERO DE DOCUMENTO', '100'],
      ['NIT O NRC DEL PROVEEDOR', '14'],
      ['NOMBRE DEL PROVEEDOR', 'SIN LIMITE'],
      ['COMPRAS INTERNAS EXENTAS Y/O NO SUJETAS', '10'],
      ['INTERNACIONES EXENTAS Y/O NO SUJETAS', '10'],
      ['IMPORTACIONES EXENTAS Y/O NO SUJETAS', '10'],
      ['COMPRAS INTERNAS GRAVADAS', '10'],
      ['INTERNACIONES GRAVADAS DE BIENES', '10'],
      ['IMPORTACIONES GRAVADAS DE BIENES', '10'],
      ['IMPORTACIONES GRAVADAS DE SERVICIOS', '10'],
      ['CRÉDITO FISCAL', '10'],
      ['TOTAL DE COMPRAS', '10'],
      ['DUI DEL PROVEEDOR', '9'],
      ['TIPO DE OPERACIÓN', '1'],
      ['CLASIFICACIÓN', '1'],
      ['SECTOR', '1'],
      ['TIPO DE COSTO / GASTO', '1'],
      ['NÚMERO DE ANEXO', '1']
    ]
  },
  excludedSubject: {
    title: 'ANEXO COMPRA SUJETO EXCLUIDO FSE (66)',
    columns: [
      ['TIPO DE DOCUMENTO', '1'],
      ['NÚMERO DE NIT, DUI, U OTRO DOCUMENTO', '14'],
      ['NOMBRE, RAZÓN SOCIAL O DENOMINACIÓN', 'SIN LIMITE'],
      ['FECHA DE EMISIÓN DEL DOCUMENTO', '10'],
      ['NÚMERO DE SERIE DEL DOCUMENTO', '100'],
      ['NÚMERO DE DOCUMENTO', '100'],
      ['MONTO DE LA OPERACIÓN', '10'],
      ['MONTO DE LA RETENCIÓN IVA 13%', '10'],
      ['TIPO DE OPERACIÓN', '1'],
      ['CLASIFICACIÓN', '1'],
      ['SECTOR', '1'],
      ['TIPO DE COSTO / GASTO', '1'],
      ['NÚMERO DE ANEXO', '1']
    ]
  },
  advanceVat: {
    title: 'ANEXO ANTICIPO A CUENTA IVA 2% (161)',
    columns: [
      ['NIT AGENTE', '14'],
      ['FECHA DE EMISIÓN DEL DOCUMENTO', '10'],
      ['SERIE DE DOCUMENTO', '100'],
      ['NÚMERO DE DOCUMENTO', '100'],
      ['MONTO SUJETO', '10'],
      ['MONTO DEL ANTICIPO A CUENTA 2% DE IVA', '10'],
      ['DUI AGENTE', '9'],
      ['NÚMERO DE ANEXO', '1']
    ]
  },
  retentionVat: {
    title: 'ANEXO RETENCION IVA 1% (162)',
    columns: [
      ['NIT DEL AGENTE', '14'],
      ['FECHA DE EMISIÓN', '10'],
      ['TIPO DE DOCUMENTO', '2'],
      ['SERIE', '100'],
      ['NUMERO DE DOCUMENTO', '100'],
      ['MONTO SUJETO', '10'],
      ['MONTO RETENCION 1%', '10'],
      ['DUI DEL AGENTE', '9'],
      ['NÚMERO DE ANEXO', '1']
    ]
  },
  perceptionVat: {
    title: 'ANEXO PERCEPCION IVA 1% (163)',
    columns: [
      ['NIT DEL AGENTE', '14'],
      ['FECHA DE EMISIÓN', '10'],
      ['TIPO DE DOCUMENTO', '2'],
      ['SERIE DE DOCUMENTO', '100'],
      ['NUMERO DE DOCUMENTO', '100'],
      ['MONTO SUJETO', '10'],
      ['MONTO DE LA PERCEPCION', '10'],
      ['DUI AGENTE', '9'],
      ['NÚMERO DE ANEXO', '1']
    ]
  },
  invalidDocuments: {
    title: 'ANEXO DOCUMENTOS INVALIDADOS',
    columns: [
      ['NÚMERO DE RESOLUCIÓN', '100'],
      ['CLASE DE DOCUMENTO', '1'],
      ['DESDE (PREIMPRESO)', '100'],
      ['HASTA (PREIMPRESO)', '100'],
      ['TIPO DE DOCUMENTO', '2'],
      ['TIPO DE DETALLE', '3'],
      ['SERIE', '100'],
      ['DESDE', '100'],
      ['HASTA', '100'],
      ['CÓDIGO DE GENERACIÓN', '100']
    ]
  },
  f14: {
    title: 'ANEXO F14',
    columns: [
      ['DOMICILIADO', ''],
      ['CODIGO DE PAIS', ''],
      ['APELLIDOS, NOMBRES; RAZON O DENOMINACION SOCIAL.', 'SIN LIMITE'],
      ['NIT/NIE', ''],
      ['DUI', ''],
      ['CODIGO DE INGRESO', ''],
      ['MONTO DEVENGADO', ''],
      ['MONTO DEVENGADO POR BONIFICACIONES Y GRATIFICACIONES', ''],
      ['IMPUESTO RETENIDO', ''],
      ['AGUINALDO EXENTO', ''],
      ['AGUINALDO GRAVADO', ''],
      ['AFP', ''],
      ['ISSS', ''],
      ['INPEP', ''],
      ['IPSFA', ''],
      ['CEFAFA', ''],
      ['BIENESTAR MAGISTERIAL', ''],
      ['ISSS IVM', ''],
      ['TIPO DE OPERACION', ''],
      ['CLASIFICACION', ''],
      ['SECTOR', ''],
      ['TIPO DE COSTO/GASTO', ''],
      ['PERIODO', '']
    ]
  }
};

export const ANEXOS_LABELS = {
  salesCcf: 'Anexo venta CCF',
  salesFcf: 'Anexo venta FCF',
  purchases: 'Anexo compras',
  excludedSubject: 'Anexo compra sujeto excluido FSE',
  advanceVat: 'Anexo anticipo IVA 2%',
  retentionVat: 'Anexo retencion IVA 1%',
  perceptionVat: 'Anexo percepcion IVA 1%',
  invalidDocuments: 'Anexo documentos invalidados',
  f14: 'Anexo F14'
};

const CLIENT_REGISTER_STORAGE_KEY = 'dte-registers-clients';
const PROVIDER_REGISTER_STORAGE_KEY = 'dte-registers-providers';
const PROVIDER_F14_REGISTER_STORAGE_KEY = 'dte-registers-providersF14';
const ANEXO_LOAD_BATCH_SIZE = 4000;
const ANEXO_ROW_HEIGHT = 28;
const ANEXO_OVERSCAN_ROWS = 12;
const ANEXO_STICKY_ROWS_HEIGHT = 76;
const ANEXO_FILTER_VALUE_LIMIT = 1200;
const NO_FILTER_VALUES_SELECTED = '__DTE_FILTER_NONE_SELECTED__';
const F14_TOTAL_COLUMNS = new Set([
  'IMPUESTO RETENIDO',
  'AGUINALDO EXENTO',
  'AGUINALDO GRAVADO',
  'AFP',
  'ISSS',
  'INPEP',
  'IPSFA',
  'CEFAFA',
  'BIENESTAR MAGISTERIAL',
  'ISSS IVM'
]);
const ANEXO_TOTAL_COLUMNS = new Set([
  'EXPORTACIONES DENTRO DEL AREA CENTROAMERICANA',
  'EXPORTACIONES FUERA DEL AREA CENTROAMERICANA',
  'EXPORTACIONES DE SERVICIOS',
  'INTERNACIONES EXENTAS Y/O NO SUJETAS',
  'IMPORTACIONES EXENTAS Y/O NO SUJETAS',
  'INTERNACIONES GRAVADAS DE BIENES',
  'IMPORTACIONES GRAVADAS DE BIENES',
  'IMPORTACIONES GRAVADAS DE SERVICIOS'
]);

function hasActiveColumnFilter(selectedValues = [], values = []) {
  if (!selectedValues.length) return false;
  if (selectedValues.includes(NO_FILTER_VALUES_SELECTED)) return true;
  return selectedValues.length < values.length;
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function normalizeRegisterLookupKey(value) {
  return String(value || '').replace(/[-\s]/g, '').trim().toUpperCase();
}

function loadClientRegisterLookup() {
  return loadRegisterLookup(CLIENT_REGISTER_STORAGE_KEY);
}

function loadProviderRegisterLookup() {
  return loadRegisterLookup(PROVIDER_REGISTER_STORAGE_KEY);
}

function loadProviderF14RegisterLookup() {
  return loadRegisterLookup(PROVIDER_F14_REGISTER_STORAGE_KEY);
}

function loadRegisterLookup(storageKey) {
  if (typeof window === 'undefined') return new Map();

  try {
    const rows = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(rows)) return new Map();

    const lookup = new Map();
    for (const row of rows) {
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

function getRetentionAmount(row) {
  return parseMoney(
    row['RETENCION 1%']
    || getRowValueByTokens(row, ['RETENCION', '1'])
  );
}

function getAdvanceVatAmount(row) {
  return parseMoney(
    row['PERCEPCION 2%']
    || getRowValueByTokens(row, ['PERCEPCION', '2'])
  );
}

function getPurchasePerceptionVatAmount(row) {
  return parseMoney(
    row['PERCEPCION 1% IVA']
    || row['PERCEPCION 2% / 1% IVA']
    || getRowValueByTokens(row, ['PERCEPCION', '1'])
  );
}

function getF14IncomeRetentionAmount(row) {
  return parseMoney(
    row?.['Retencion Renta']
    || row?.['RETENCION RENTA']
    || getRowValueByTokens(row, ['RETENCION', 'RENTA'])
  );
}

function isFseInicioRow(row) {
  const typeCode = String(
    row?.['Tipo DTE']
    || row?.['Tipo DTE']
    || row?.['Tipo de Documento']
    || extractDteTypeFromControl(row?.['Numero de Control'] || row?.['NUMERO DE CONTROL'])
    || ''
  ).replace(/\D/g, '').padStart(2, '0');
  return typeCode === '14';
}

function isF14IncomeRetentionRow(row) {
  return isFseInicioRow(row) && getF14IncomeRetentionAmount(row) > 0;
}

function isInvalidDocumentCustomer(row) {
  return normalizeColumnName(row?.['NOMBRE DEL CLIENTE'])
    === 'DOCUMENTO INVALIDADO O RECHAZADO';
}

function isInvalidDocumentStatus(row) {
  return normalizeColumnName(row?.['Estado del DTE']) === 'INVALIDADO';
}

function hasInvalidDocumentRequiredValues(row) {
  return ['NUMERO DE CONTROL', 'CODIGO DE GENERACION', 'SELLO DE RECEPCION']
    .every((column) => String(row?.[column] || '').trim());
}

function shouldIncludeInvalidDocumentRow(row) {
  if (!hasInvalidDocumentRequiredValues(row)) return false;

  if (Object.prototype.hasOwnProperty.call(row || {}, 'Estado del DTE')) {
    return isInvalidDocumentStatus(row);
  }

  return isInvalidDocumentCustomer(row);
}

function createEmptyAnexoRow(columns) {
  return Object.fromEntries(columns.map(([header]) => [header, '']));
}

function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const number = Number(String(value || '').replace(/[$,\s]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function formatAnexoMoney(value) {
  return parseMoney(value).toFixed(2);
}

function formatPositiveAnexoMoney(value) {
  return Math.abs(parseMoney(value)).toFixed(2);
}

function formatAnexoTotal(value) {
  return parseMoney(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function isAnexoAmountColumn(header) {
  const normalizedHeader = normalizeColumnName(header);
  if (F14_TOTAL_COLUMNS.has(normalizedHeader)) return true;
  if (ANEXO_TOTAL_COLUMNS.has(normalizedHeader)) return true;
  return /VENTAS|DEBITO|MONTO|TOTAL|COMPRAS|CREDITO/i.test(normalizedHeader)
    && !/NUMERO|DOCUMENTO|CONTROL|ANEXO|NIT|NRC|DUI|TIPO|CLASE|FECHA/i.test(normalizedHeader);
}

function extractDteTypeFromControl(value) {
  const text = String(value || '').toUpperCase();
  const match = text.match(/DTE-?(\d{2})/);
  return match?.[1] || '';
}

function normalizeColumnName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function getRowValueByTokens(row, tokens) {
  const entry = Object.entries(row || {}).find(([key]) => {
    const normalizedKey = normalizeColumnName(key);
    return tokens.every((token) => normalizedKey.includes(token));
  });
  return entry?.[1] || '';
}

function getLeadingTwoDigits(value) {
  return String(value || '').trim().match(/\d{1,2}/)?.[0]?.padStart(2, '0') || '';
}

function getLeadingDigit(value) {
  return String(value || '').trim().match(/\d/)?.[0] || '';
}

function getDigitsBeforeDash(value, maxLength) {
  const beforeDash = String(value || '').trim().split('-')[0] || '';
  return beforeDash.replace(/\D/g, '').slice(0, maxLength);
}

function cleanDelimitedIdentifier(value, maxLength) {
  return String(value || '').replace(/[-/|\s]/g, '').slice(0, maxLength);
}

function limitCsvText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function formatF14CsvMoney(value) {
  return formatAnexoMoney(value).replace(/,/g, '');
}

function getF14PeriodValue(period = {}) {
  const monthText = normalizeColumnName(period.month);
  const monthMap = {
    ENERO: '01',
    FEBRERO: '02',
    MARZO: '03',
    ABRIL: '04',
    MAYO: '05',
    JUNIO: '06',
    JULIO: '07',
    AGOSTO: '08',
    SEPTIEMBRE: '09',
    SETIEMBRE: '09',
    OCTUBRE: '10',
    NOVIEMBRE: '11',
    DICIEMBRE: '12'
  };
  const numericMonth = String(period.month || '').replace(/\D/g, '');
  const month = monthMap[monthText] || (numericMonth ? numericMonth.padStart(2, '0').slice(-2) : '');
  const year = String(period.year || '').replace(/\D/g, '').slice(0, 4);
  return month && year.length === 4 ? `${month}${year}` : '';
}

function prepareAnexoRowForCsv(row, type) {
  if (type === 'f14') {
    return {
      ...row,
      DOMICILIADO: getLeadingDigit(row.DOMICILIADO),
      'CODIGO DE PAIS': getDigitsBeforeDash(row['CODIGO DE PAIS'], 4),
      'APELLIDOS, NOMBRES; RAZON O DENOMINACION SOCIAL.': limitCsvText(row['APELLIDOS, NOMBRES; RAZON O DENOMINACION SOCIAL.'], 100),
      'NIT/NIE': cleanDelimitedIdentifier(row['NIT/NIE'], 14),
      DUI: cleanDelimitedIdentifier(row.DUI, 9),
      'CODIGO DE INGRESO': getDigitsBeforeDash(row['CODIGO DE INGRESO'], 2),
      'MONTO DEVENGADO': formatF14CsvMoney(row['MONTO DEVENGADO']),
      'MONTO DEVENGADO POR BONIFICACIONES Y GRATIFICACIONES': formatF14CsvMoney(row['MONTO DEVENGADO POR BONIFICACIONES Y GRATIFICACIONES']),
      'IMPUESTO RETENIDO': formatF14CsvMoney(row['IMPUESTO RETENIDO']),
      'AGUINALDO EXENTO': formatF14CsvMoney(row['AGUINALDO EXENTO']),
      'AGUINALDO GRAVADO': formatF14CsvMoney(row['AGUINALDO GRAVADO']),
      AFP: formatF14CsvMoney(row.AFP),
      ISSS: formatF14CsvMoney(row.ISSS),
      INPEP: formatF14CsvMoney(row.INPEP),
      IPSFA: formatF14CsvMoney(row.IPSFA),
      CEFAFA: formatF14CsvMoney(row.CEFAFA),
      'BIENESTAR MAGISTERIAL': formatF14CsvMoney(row['BIENESTAR MAGISTERIAL']),
      'ISSS IVM': formatF14CsvMoney(row['ISSS IVM']),
      'TIPO DE OPERACION': getLeadingDigit(row['TIPO DE OPERACION']),
      CLASIFICACION: getLeadingDigit(row.CLASIFICACION),
      SECTOR: getLeadingDigit(row.SECTOR),
      'TIPO DE COSTO/GASTO': getLeadingDigit(row['TIPO DE COSTO/GASTO']),
      PERIODO: cleanDelimitedIdentifier(row.PERIODO, 6)
    };
  }

  if (type === 'purchases') {
    return {
      ...row,
      'TIPO DE OPERACIÓN': getLeadingDigit(row['TIPO DE OPERACIÓN']),
      'CLASIFICACIÓN': getLeadingDigit(row['CLASIFICACIÓN']),
      SECTOR: getLeadingDigit(row.SECTOR),
      'TIPO DE COSTO / GASTO': getLeadingDigit(row['TIPO DE COSTO / GASTO'])
    };
  }

  if (type === 'excludedSubject') {
    return {
      ...row,
      'TIPO DE OPERACIÓN': getLeadingDigit(row['TIPO DE OPERACIÓN']),
      CLASIFICACIÓN: getLeadingDigit(row.CLASIFICACIÓN),
      SECTOR: getLeadingDigit(row.SECTOR),
      'TIPO DE COSTO / GASTO': getLeadingDigit(row['TIPO DE COSTO / GASTO'])
    };
  }

  if (type !== 'salesCcf' && type !== 'salesFcf') return row;

  return {
    ...row,
    'TIPO DE OPERACION (Renta)': getLeadingTwoDigits(row['TIPO DE OPERACION (Renta)']),
    'TIPO DE INGRESO (Renta)': getLeadingTwoDigits(row['TIPO DE INGRESO (Renta)'])
  };
}

function mapCcfSaleToAnexoRow(row) {
  const gravadas = parseMoney(row['VENTAS INTERNAS GRAVADAS VALOR NETO']);
  const ivaDebito = parseMoney(row['IVA DEBITO']);
  const fechaEmision = row['FECHA DE EMISION']
    || row['FECHA DE EMISIÓN']
    || getRowValueByTokens(row, ['FECHA', 'EMISION'])
    || '';

  return {
    'FECHA DE EMISION DEL DOCUMENTO': fechaEmision,
    'CLASE DE DOCUMENTO': '4',
    'TIPO DE DOCUMENTO': extractDteTypeFromControl(row['NUMERO DE CONTROL']),
    'NÚMERO DE RESOLUCIÓN': row['NUMERO DE CONTROL'] || '',
    'NÚMERO DE SERIE DE DOCUMENTO': row['SELLO DE RECEPCION'] || '',
    'NÚMERO DE DOCUMENTO': row['CODIGO DE GENERACION'] || '',
    'NÚMERO DE CONTROL INTERNO': row['NUMERO DE CONTROL'] || '',
    'NIT O NRC DEL CLIENTE': row['N.R.C / NIT'] || '',
    'NOMBRE, RAZON SOCIAL O DENOMINACION': row['NOMBRE DEL CLIENTE'] || '',
    'VENTAS EXENTAS': formatAnexoMoney(row.EXENTAS),
    'VENTAS NO SUJETAS': formatAnexoMoney(row['NO SUJETAS']),
    'VENTAS GRAVADAS LOCALES': formatAnexoMoney(gravadas),
    'DÉBITO FISCAL': formatAnexoMoney(ivaDebito),
    'VENTAS A CUENTA DE TERCEROS NO DOMICILIADOS': '0.00',
    'DÉBITO FISCAL POR VENTA A CUENTA DE TERCEROS': '0.00',
    'TOTAL VENTAS': formatAnexoMoney(gravadas + ivaDebito),
    'DUI DEL CLIENTE': '',
    'TIPO DE OPERACION (Renta)': getRowValueByTokens(row, ['TIPO', 'OPERACION', 'RENTA']),
    'TIPO DE INGRESO (Renta)': getRowValueByTokens(row, ['TIPO', 'INGRESO', 'RENTA']),
    'NÚMERO DE ANEXO': '1'
  };
}

function countIdentifierDigits(value) {
  return String(value || '').replace(/\D/g, '').length;
}

function getExcludedSubjectDocumentType(nrcNit) {
  const digitCount = countIdentifierDigits(nrcNit);
  if (digitCount === 14) return '1';
  if (digitCount === 9) return '2';
  return '';
}

function mapExcludedSubjectPurchaseToAnexoRow(row) {
  const nrcNit = row['N.R.C / NIT']
    || getRowValueByTokens(row, ['NRC', 'NIT'])
    || '';

  return {
    'TIPO DE DOCUMENTO': getExcludedSubjectDocumentType(nrcNit),
    'NÚMERO DE NIT, DUI, U OTRO DOCUMENTO': nrcNit,
    'NOMBRE, RAZÓN SOCIAL O DENOMINACIÓN': row['NOMBRE DEL PROVEEDOR']
      || getRowValueByTokens(row, ['NOMBRE', 'PROVEEDOR'])
      || '',
    'FECHA DE EMISIÓN DEL DOCUMENTO': row['FECHA DE EMISIÓN']
      || getRowValueByTokens(row, ['FECHA', 'EMISION'])
      || '',
    'NÚMERO DE SERIE DEL DOCUMENTO': row['SELLO DE RECEPCION']
      || getRowValueByTokens(row, ['SELLO', 'RECEPCION'])
      || '',
    'NÚMERO DE DOCUMENTO': row['CODIGO DE GENERACION']
      || getRowValueByTokens(row, ['CODIGO', 'GENERACION'])
      || '',
    'MONTO DE LA OPERACIÓN': formatAnexoMoney(
      row['COMPRAS A SUJETOS EXCLUIDOS']
      || getRowValueByTokens(row, ['COMPRAS', 'SUJETOS', 'EXCLUIDOS'])
    ),
    'MONTO DE LA RETENCIÓN IVA 13%': '0.00',
    'TIPO DE OPERACIÓN': getRowValueByTokens(row, ['TIPO', 'OPERACION']),
    'CLASIFICACIÓN': getRowValueByTokens(row, ['CLASIFICACION']),
    'SECTOR': getRowValueByTokens(row, ['SECTOR']),
    'TIPO DE COSTO / GASTO': getRowValueByTokens(row, ['TIPO', 'COSTO', 'GASTO']),
    'NÚMERO DE ANEXO': '5'
  };
}

function getProviderDui(row) {
  const nrcNit = row['N.R.C / NIT']
    || getRowValueByTokens(row, ['NRC', 'NIT'])
    || '';
  return countIdentifierDigits(nrcNit) === 9 ? nrcNit : '';
}

function mapPurchaseToAnexoRow(row) {
  const internalExempt = row['COMPRAS EXENTAS INTERNAS'];
  const importExempt = row['COMPRAS EXENTAS IMPORTACIONES'];
  const internationalExempt = row['COMPRAS EXENTAS INTERNACIONES'];
  const internalTaxed = row['COMPRAS GRAVADAS INTERNAS'];
  const importTaxed = row['COMPRAS GRAVADAS IMPORTACIONES'];
  const internationalTaxed = row['COMPRAS GRAVADAS INTERNACIONES'];

  return {
    'FECHA DE EMISIÓN': row['FECHA DE EMISIÓN']
      || row['FECHA DE EMISION']
      || getRowValueByTokens(row, ['FECHA', 'EMISION'])
      || '',
    'CLASE DE DOCUMENTO': '4',
    'TIPO DE DOCUMENTO': extractDteTypeFromControl(row['NUMERO DE CONTROL']),
    'NÚMERO DE DOCUMENTO': row['NUMERO DE CONTROL'] || '',
    'NIT O NRC DEL PROVEEDOR': row['N.R.C / NIT']
      || getRowValueByTokens(row, ['NRC', 'NIT'])
      || '',
    'NOMBRE DEL PROVEEDOR': row['NOMBRE DEL PROVEEDOR']
      || getRowValueByTokens(row, ['NOMBRE', 'PROVEEDOR'])
      || '',
    'COMPRAS INTERNAS EXENTAS Y/O NO SUJETAS': formatPositiveAnexoMoney(internalExempt),
    'INTERNACIONES EXENTAS Y/O NO SUJETAS': formatPositiveAnexoMoney(internationalExempt),
    'IMPORTACIONES EXENTAS Y/O NO SUJETAS': formatPositiveAnexoMoney(importExempt),
    'COMPRAS INTERNAS GRAVADAS': formatPositiveAnexoMoney(internalTaxed),
    'INTERNACIONES GRAVADAS DE BIENES': formatPositiveAnexoMoney(internationalTaxed),
    'IMPORTACIONES GRAVADAS DE BIENES': formatPositiveAnexoMoney(importTaxed),
    'IMPORTACIONES GRAVADAS DE SERVICIOS': '0.00',
    'CRÉDITO FISCAL': formatPositiveAnexoMoney(row.IVA || row['CREDITO FISCAL']),
    'TOTAL DE COMPRAS': formatPositiveAnexoMoney(row['TOTAL COMPRAS'] || row['Total de Compra']),
    'DUI DEL PROVEEDOR': getProviderDui(row),
    'TIPO DE OPERACIÓN': getRowValueByTokens(row, ['TIPO', 'OPERACION']),
    'CLASIFICACIÓN': getRowValueByTokens(row, ['CLASIFICACION']),
    'SECTOR': getRowValueByTokens(row, ['SECTOR']),
    'TIPO DE COSTO / GASTO': getRowValueByTokens(row, ['TIPO', 'COSTO', 'GASTO']),
    'NÚMERO DE ANEXO': '3'
  };
}

function mapRetentionVatToAnexoRow(row, clientLookup = new Map()) {
  const nrcNit = row['N.R.C / NIT']
    || getRowValueByTokens(row, ['NRC', 'NIT'])
    || '';
  const client = clientLookup.get(normalizeRegisterLookupKey(nrcNit));
  const retentionAmount = getRetentionAmount(row);
  const subjectAmount = retentionAmount ? retentionAmount / 0.01 : 0;

  return {
    'NIT DEL AGENTE': client?.NIT || '',
    'FECHA DE EMISIÓN': row['FECHA DE EMISIÓN']
      || getRowValueByTokens(row, ['FECHA', 'EMISION'])
      || '',
    'TIPO DE DOCUMENTO': extractDteTypeFromControl(row['NUMERO DE CONTROL']),
    SERIE: row['SELLO DE RECEPCION']
      || getRowValueByTokens(row, ['SELLO', 'RECEPCION'])
      || '',
    'NUMERO DE DOCUMENTO': row['CODIGO DE GENERACION']
      || getRowValueByTokens(row, ['CODIGO', 'GENERACION'])
      || '',
    'MONTO SUJETO': formatAnexoMoney(subjectAmount),
    'MONTO RETENCION 1%': formatAnexoMoney(retentionAmount),
    'DUI DEL AGENTE': '',
    'NÚMERO DE ANEXO': '7'
  };
}

function mapAdvanceVatToAnexoRow(row, clientLookup = new Map()) {
  const nrcNit = row['N.R.C / NIT']
    || getRowValueByTokens(row, ['NRC', 'NIT'])
    || '';
  const client = clientLookup.get(normalizeRegisterLookupKey(nrcNit));
  const advanceAmount = getAdvanceVatAmount(row);
  const subjectAmount = advanceAmount ? advanceAmount / 0.02 : 0;

  return {
    'NIT AGENTE': client?.NIT || '',
    'FECHA DE EMISIÓN DEL DOCUMENTO': row['FECHA DE EMISIÓN']
      || getRowValueByTokens(row, ['FECHA', 'EMISION'])
      || '',
    'SERIE DE DOCUMENTO': row['CODIGO DE GENERACION']
      || getRowValueByTokens(row, ['CODIGO', 'GENERACION'])
      || '',
    'NÚMERO DE DOCUMENTO': row['SELLO DE RECEPCION']
      || getRowValueByTokens(row, ['SELLO', 'RECEPCION'])
      || '',
    'MONTO SUJETO': formatAnexoMoney(subjectAmount),
    'MONTO DEL ANTICIPO A CUENTA 2% DE IVA': formatAnexoMoney(advanceAmount),
    'DUI AGENTE': '',
    'NÚMERO DE ANEXO': '6'
  };
}

function mapPerceptionVatToAnexoRow(row, providerLookup = new Map()) {
  const nrcNit = row['N.R.C / NIT']
    || getRowValueByTokens(row, ['NRC', 'NIT'])
    || '';
  const provider = providerLookup.get(normalizeRegisterLookupKey(nrcNit));
  const perceptionAmount = getPurchasePerceptionVatAmount(row);
  const subjectAmount = perceptionAmount ? perceptionAmount / 0.01 : 0;

  return {
    'NIT DEL AGENTE': provider?.NIT || '',
    'FECHA DE EMISIÓN': row['FECHA DE EMISION']
      || row['FECHA DE EMISIÓN']
      || getRowValueByTokens(row, ['FECHA', 'EMISION'])
      || '',
    'TIPO DE DOCUMENTO': extractDteTypeFromControl(row['NUMERO DE CONTROL']),
    'SERIE DE DOCUMENTO': row['SELLO DE RECEPCION']
      || getRowValueByTokens(row, ['SELLO', 'RECEPCION'])
      || '',
    'NUMERO DE DOCUMENTO': row['CODIGO DE GENERACION']
      || getRowValueByTokens(row, ['CODIGO', 'GENERACION'])
      || '',
    'MONTO SUJETO': formatAnexoMoney(subjectAmount),
    'MONTO DE LA PERCEPCION': formatAnexoMoney(perceptionAmount),
    'DUI AGENTE': '',
    'NÚMERO DE ANEXO': '8'
  };
}

function mapF14ToAnexoRow(row, providerF14Lookup = new Map(), periodValue = '') {
  const documentId = row['Doc ID Sujeto Excluido']
    || getRowValueByTokens(row, ['DOC', 'ID', 'SUJETO', 'EXCLUIDO'])
    || '';
  const documentDigits = String(documentId || '').replace(/\D/g, '');
  const nitNie = documentDigits.length === 14 ? documentDigits : '';
  const dui = documentDigits.length === 9 ? documentDigits : '';
  const provider = providerF14Lookup.get(normalizeRegisterLookupKey(nitNie))
    || providerF14Lookup.get(normalizeRegisterLookupKey(dui))
    || new Map();

  return {
    DOMICILIADO: provider?.DOMICILIADO || '',
    'CODIGO DE PAIS': provider?.['CODIGO DE PAIS'] || '',
    'APELLIDOS, NOMBRES; RAZON O DENOMINACION SOCIAL.': row['Nombre sujetoExcluido']
      || getRowValueByTokens(row, ['NOMBRE', 'SUJETOEXCLUIDO'])
      || '',
    'NIT/NIE': nitNie,
    DUI: dui,
    'CODIGO DE INGRESO': provider?.['CODIGO DE INGRESO'] || '',
    'MONTO DEVENGADO': formatAnexoMoney(row['Subtotal Compra'] || getRowValueByTokens(row, ['SUBTOTAL', 'COMPRA'])),
    'MONTO DEVENGADO POR BONIFICACIONES Y GRATIFICACIONES': '0.00',
    'IMPUESTO RETENIDO': formatAnexoMoney(getF14IncomeRetentionAmount(row)),
    'AGUINALDO EXENTO': '0.00',
    'AGUINALDO GRAVADO': '0.00',
    AFP: '0.00',
    ISSS: '0.00',
    INPEP: '0.00',
    IPSFA: '0.00',
    CEFAFA: '0.00',
    'BIENESTAR MAGISTERIAL': '0.00',
    'ISSS IVM': '0.00',
    'TIPO DE OPERACION': provider?.['TIPO DE OPERACION (Renta)'] || '',
    CLASIFICACION: provider?.['CLASIFICACION (Renta)'] || '',
    SECTOR: provider?.['SECTOR (Renta)'] || '',
    'TIPO DE COSTO/GASTO': provider?.['TIPO DE COSTO/GASTO (Renta)'] || '',
    PERIODO: periodValue
  };
}

function mapInvalidDocumentToAnexoRow(row) {
  return {
    'NÚMERO DE RESOLUCIÓN': row['NUMERO DE CONTROL'] || '',
    'CLASE DE DOCUMENTO': '4',
    'DESDE (PREIMPRESO)': '0',
    'HASTA (PREIMPRESO)': '0',
    'TIPO DE DOCUMENTO': extractDteTypeFromControl(row['NUMERO DE CONTROL']),
    'TIPO DE DETALLE': 'D',
    SERIE: row['SELLO DE RECEPCION'] || '',
    DESDE: '0',
    HASTA: '0',
    'CÓDIGO DE GENERACIÓN': row['CODIGO DE GENERACION'] || ''
  };
}

function mapFcfSaleToAnexoRow(row) {
  const exportAmount = parseMoney(row['VENTAS GRAVADAS EXPORTAC.']);
  const incomeType = normalizeColumnName(getRowValueByTokens(row, ['TIPO', 'INGRESO', 'RENTA']));
  const countryCode = String(row['Codigo pais'] || '').trim().toUpperCase();
  const isCentralAmerica = ['GT', 'HN', 'NI', 'CR', 'PA'].includes(countryCode);
  const isCommercialIncome = incomeType.includes('03') && incomeType.includes('ACTIVIDADES COMERCIALES');
  const isServiceIncome = incomeType.includes('02') && incomeType.includes('ACTIVIDADES DE SERVICIOS');

  return {
    'FECHA DE EMISIÓN': row['FECHA EMISION'] || '',
    'CLASE DE DOCUMENTO': '4',
    'TIPO DE DOCUMENTO': extractDteTypeFromControl(row['NUMERO DE CONTROL']),
    'NÚMERO DE RESOLUCIÓN': row['NUMERO DE CONTROL'] || '',
    'SERIE DE DOCUMENTO': row['SELLO DE RECEPCION'] || '',
    'NÚMERO DE CONTROL INTERNO (DEL)': '0',
    'NÚMERO DE CONTROL INTERNO (AL)': '0',
    'NÚMERO DE DOCUMENTO (DEL)': row['CODIGO DE GENERACION'] || '',
    'NÚMERO DE DOCUMENTO (AL)': row['CODIGO DE GENERACION'] || '',
    'N° DE MAQUINA REGISTRADORA': '',
    'VENTAS EXENTAS': formatAnexoMoney(row['VENTAS EXENTAS']),
    'VENTAS INTERNAS EXENTAS NO SUJETAS A PROPORCIONALIDAD': '0.00',
    'VENTAS NO SUJETAS': formatAnexoMoney(row['VENTAS NO SUJETAS']),
    'VENTAS GRAVADAS LOCALES': formatAnexoMoney(row['VENTAS GRAVADAS LOCALES']),
    'EXPORTACIONES DENTRO DEL ÁREA CENTROAMERICANA': formatAnexoMoney(isCommercialIncome && isCentralAmerica ? exportAmount : 0),
    'EXPORTACIONES FUERA DEL ÁREA CENTROAMERICANA': formatAnexoMoney(isCommercialIncome && !isCentralAmerica ? exportAmount : 0),
    'EXPORTACIONES DE SERVICIOS': formatAnexoMoney(isServiceIncome ? exportAmount : 0),
    'VENTAS A ZONAS FRANCAS Y DPA (TASA CERO)': '0.00',
    'VENTAS A CUENTA DE TERCEROS NO DOMICILIADOS': '0.00',
    'TOTAL VENTAS': formatAnexoMoney(row.TOTAL),
    'TIPO DE OPERACION (Renta)': getRowValueByTokens(row, ['TIPO', 'OPERACION', 'RENTA']),
    'TIPO DE INGRESO (Renta)': getRowValueByTokens(row, ['TIPO', 'INGRESO', 'RENTA']),
    'NÚMERO DE ANEXO': '2'
  };
}

function hasUsefulAnexoData(row, columns) {
  return columns.some((columnParts) => {
    const [header] = columnParts;
    const isColumnDefinition = columnParts.length === 2
      && (/^\d+$/.test(String(columnParts[1])) || String(columnParts[1]).toUpperCase() === 'SIN LIMITE');
    const value = columnParts.length > 1 && !isColumnDefinition
      ? getRowValueByTokens(row, columnParts)
      : row[header];

    return String(value || '').trim();
  });
}

function isInvalidOrRejectedDte(row) {
  const status = String(row?.__dteStatus || row?.['Estado del DTE'] || '').toLowerCase();
  return status.includes('invalidado') || status.includes('rechazado');
}

function getAnexoColumnWidth(header) {
  if (/NOMBRE|RAZON|DENOMINACION|TERCEROS|PROPORCIONALIDAD|EXPORTACIONES/i.test(header)) return 260;
  if (/NUMERO|CONTROL|RESOLUCION|SERIE|DOCUMENTO/i.test(header)) return 220;
  if (/FECHA/i.test(header)) return 150;
  if (/VENTAS|DEBITO|MONTO|TOTAL|COMPRAS|CREDITO/i.test(header)) return 160;
  return Math.min(Math.max(header.length * 8 + 42, 130), 220);
}

function applyAnexoFilters(rows, filters) {
  const activeFilters = Object.entries(filters).filter(([, values]) => values?.length);
  if (!activeFilters.length) return rows;
  if (activeFilters.some(([, values]) => values.includes(NO_FILTER_VALUES_SELECTED))) return [];
  const filterSets = activeFilters.map(([column, values]) => [column, new Set(values)]);

  return rows.filter(({ row }) => (
    Object.values(row || {}).some((value) => String(value || '').trim())
    && filterSets.every(([column, values]) => values.has(String(row[column] || '')))
  ));
}

function compareAnexoValues(firstValue, secondValue) {
  const firstText = String(firstValue || '').trim();
  const secondText = String(secondValue || '').trim();
  const firstNumber = Number(firstText.replace(/[$,\s]/g, ''));
  const secondNumber = Number(secondText.replace(/[$,\s]/g, ''));

  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
    return firstNumber - secondNumber;
  }

  return firstText.localeCompare(secondText, 'es', {
    numeric: true,
    sensitivity: 'base'
  });
}

function getAnexoLoadConfig(type, { ccfSalesRows, clientLookup, f14PeriodValue, fcfSalesRows, homeRows, providerF14Lookup, providerLookup, purchaseRows }) {
  const loadConfigByType = {
    salesCcf: {
      sourceRows: ccfSalesRows,
      sourceLabel: 'Libro de Ventas CCF',
      usefulColumns: [
        ['NUMERO DE CONTROL'],
        ['CODIGO DE GENERACION'],
        ['NOMBRE DEL CLIENTE']
      ],
      mapRow: mapCcfSaleToAnexoRow,
      includeRow: (row) => extractDteTypeFromControl(row['NUMERO DE CONTROL']) === '03'
    },
    salesFcf: {
      sourceRows: fcfSalesRows,
      sourceLabel: 'Libro de Ventas FCF',
      usefulColumns: [
        ['NUMERO DE CONTROL'],
        ['CODIGO DE GENERACION'],
        ['TOTAL']
      ],
      mapRow: mapFcfSaleToAnexoRow,
      includeRow: () => true
    },
    purchases: {
      sourceRows: purchaseRows,
      sourceLabel: 'Libro de Compras',
      usefulColumns: [
        ['NUMERO DE CONTROL'],
        ['NOMBRE', 'PROVEEDOR'],
        ['TOTAL', 'COMPRAS']
      ],
      mapRow: mapPurchaseToAnexoRow,
      includeRow: (row) => ['03', '05'].includes(extractDteTypeFromControl(row['NUMERO DE CONTROL']))
    },
    excludedSubject: {
      sourceRows: purchaseRows,
      sourceLabel: 'Libro de Compras',
      usefulColumns: [
        ['CODIGO DE GENERACION'],
        ['NOMBRE DEL PROVEEDOR'],
        ['COMPRAS A SUJETOS EXCLUIDOS']
      ],
      mapRow: mapExcludedSubjectPurchaseToAnexoRow,
      includeRow: (row) => parseMoney(
        row['COMPRAS A SUJETOS EXCLUIDOS']
        || getRowValueByTokens(row, ['COMPRAS', 'SUJETOS', 'EXCLUIDOS'])
      ) > 0
    },
    retentionVat: {
      sourceRows: ccfSalesRows,
      sourceLabel: 'Libro de Ventas CCF',
      usefulColumns: [
        ['NUMERO DE CONTROL'],
        ['CODIGO DE GENERACION'],
        ['RETENCION 1%']
      ],
      mapRow: (row) => mapRetentionVatToAnexoRow(row, clientLookup),
      includeRow: (row) => extractDteTypeFromControl(row['NUMERO DE CONTROL']) === '07'
        && getRetentionAmount(row) > 0
    },
    advanceVat: {
      sourceRows: ccfSalesRows,
      sourceLabel: 'Libro de Ventas CCF',
      usefulColumns: [
        ['NUMERO DE CONTROL'],
        ['CODIGO DE GENERACION'],
        ['PERCEPCION', '2']
      ],
      mapRow: (row) => mapAdvanceVatToAnexoRow(row, clientLookup),
      includeRow: (row) => extractDteTypeFromControl(row['NUMERO DE CONTROL']) === '09'
        && getAdvanceVatAmount(row) > 0
    },
    perceptionVat: {
      sourceRows: purchaseRows,
      sourceLabel: 'Libro de Compras',
      usefulColumns: [
        ['NUMERO DE CONTROL'],
        ['CODIGO DE GENERACION'],
        ['PERCEPCION', '1']
      ],
      mapRow: (row) => mapPerceptionVatToAnexoRow(row, providerLookup),
      includeRow: (row) => getPurchasePerceptionVatAmount(row) > 0
    },
    invalidDocuments: {
      sourceRows: [...ccfSalesRows, ...fcfSalesRows],
      sourceLabel: 'Libro de Ventas CCF y Libro de Ventas FCF',
      usefulColumns: [
        ['NUMERO DE CONTROL'],
        ['CODIGO DE GENERACION'],
        ['NOMBRE DEL CLIENTE'],
        ['Estado', 'DTE']
      ],
      mapRow: mapInvalidDocumentToAnexoRow,
      includeRow: shouldIncludeInvalidDocumentRow,
      includeInvalidOrRejected: true
    },
    f14: {
      sourceRows: homeRows,
      sourceLabel: 'INICIO DTE14 FSE EMISOR',
      usefulColumns: [
        ['Doc ID Sujeto Excluido'],
        ['Nombre sujetoExcluido'],
        ['Subtotal Compra']
      ],
      mapRow: (row) => mapF14ToAnexoRow(row, providerF14Lookup, f14PeriodValue),
      includeRow: isF14IncomeRetentionRow
    }
  };

  return loadConfigByType[type];
}

async function buildAnexoRows({ columns, loadConfig, onProgress }) {
  const sourceRowsToLoad = loadConfig.sourceRows;
  const totalRowsToCheck = sourceRowsToLoad.length;
  const emptyRowTemplate = createEmptyAnexoRow(columns);
  const nextRows = [];

  onProgress({ completed: 0, matched: 0, total: totalRowsToCheck });
  await waitForNextFrame();

  for (let index = 0; index < totalRowsToCheck; index += 1) {
    const row = sourceRowsToLoad[index];

    if (
      (loadConfig.includeInvalidOrRejected || !isInvalidOrRejectedDte(row))
      && loadConfig.includeRow(row)
      && hasUsefulAnexoData(row, loadConfig.usefulColumns)
    ) {
      nextRows.push({
        ...emptyRowTemplate,
        ...loadConfig.mapRow(row),
        __dteStatus: row.__dteStatus || row['Estado del DTE'] || ''
      });
    }

    const completed = index + 1;
    if (completed % ANEXO_LOAD_BATCH_SIZE === 0 || completed === totalRowsToCheck) {
      onProgress({ completed, matched: nextRows.length, total: totalRowsToCheck });
      await waitForNextFrame();
    }
  }

  return nextRows;
}

function buildAnexoFilterValues(rows, openFilter) {
  if (!openFilter) return [];

  const values = new Set();
  for (const row of rows) {
    values.add(String(row[openFilter] || ''));
    if (values.size >= ANEXO_FILTER_VALUE_LIMIT) break;
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b, 'es'));
}

function getNoAnexoRowsMessage(type, { ccfSalesRows, fcfSalesRows, loadConfig, purchaseRows }) {
  if (type === 'excludedSubject') {
    const hasPurchaseBookRows = purchaseRows.some((row) => hasUsefulAnexoData(row, [
      ['CODIGO DE GENERACION'],
      ['NOMBRE DEL PROVEEDOR'],
      ['NUMERO DE CONTROL']
    ]));
    return hasPurchaseBookRows
      ? 'El Libro de Compras no tiene filas con monto en COMPRAS A SUJETOS EXCLUIDOS. En INICIO seleccione Tipo de Documento 14 con estructura FSE EMISOR, importe esos registros al Libro de Compras y vuelva a cargar este anexo.'
      : 'No hay datos en Libro de Compras. Vaya a LIBROS DE IVA > Libro de compras y pulse CARGAR DATOS.';
  }

  if (type === 'retentionVat') {
    const hasCcfSalesRows = ccfSalesRows.some((row) => hasUsefulAnexoData(row, [
      ['CODIGO DE GENERACION'],
      ['NUMERO DE CONTROL'],
      ['NOMBRE DEL CLIENTE']
    ]));
    return hasCcfSalesRows
      ? 'El Libro de Ventas CCF no tiene filas con monto en RETENCION 1%. Importe documentos con retencion al libro de ventas CCF y vuelva a cargar este anexo.'
      : 'No hay datos en Libro de Ventas CCF. Vaya a LIBROS DE IVA > Libro de ventas CCF y pulse CARGAR DATOS.';
  }

  if (type === 'advanceVat') {
    const hasCcfSalesRows = ccfSalesRows.some((row) => hasUsefulAnexoData(row, [
      ['CODIGO DE GENERACION'],
      ['NUMERO DE CONTROL'],
      ['NOMBRE DEL CLIENTE']
    ]));
    return hasCcfSalesRows
      ? 'El Libro de Ventas CCF no tiene filas DTE09 con monto en PERCEPCION 2%. Importe documentos DTE09 DCL RECEPTOR al Libro de Ventas CCF y vuelva a cargar este anexo.'
      : 'No hay datos en Libro de Ventas CCF. Vaya a LIBROS DE IVA > Libro de ventas CCF y pulse CARGAR DATOS.';
  }

  if (type === 'perceptionVat') {
    const hasPurchaseRows = purchaseRows.some((row) => hasUsefulAnexoData(row, [
      ['CODIGO DE GENERACION'],
      ['NUMERO DE CONTROL'],
      ['NOMBRE DEL PROVEEDOR']
    ]));
    return hasPurchaseRows
      ? 'El Libro de Compras no tiene filas con monto mayor a cero en PERCEPCION 1% IVA. Importe documentos con percepcion al Libro de Compras y vuelva a cargar este anexo.'
      : 'No hay datos en Libro de Compras. Vaya a LIBROS DE IVA > Libro de compras y pulse CARGAR DATOS.';
  }

  if (type === 'invalidDocuments') {
    const hasCcfSalesRows = ccfSalesRows.some((row) => hasUsefulAnexoData(row, [
      ['CODIGO DE GENERACION'],
      ['NUMERO DE CONTROL'],
      ['NOMBRE DEL CLIENTE']
    ]));
    const hasFcfSalesRows = fcfSalesRows.some((row) => hasUsefulAnexoData(row, [
      ['CODIGO DE GENERACION'],
      ['NUMERO DE CONTROL'],
      ['Estado', 'DTE']
    ]));
    return hasCcfSalesRows || hasFcfSalesRows
      ? 'No se encontraron documentos invalidados: en CCF se requiere NOMBRE DEL CLIENTE igual a DOCUMENTO INVALIDADO O RECHAZADO, y en FCF Estado del DTE igual a Invalidado.'
      : 'No hay datos en Libro de Ventas CCF ni Libro de Ventas FCF. Cargue datos en esos libros y vuelva a intentar.';
  }

  if (type === 'f14') {
    return 'No se encontraron DTE14 FSE EMISOR en INICIO. Cargue los JSON tipo 14 y vuelva a intentar.';
  }

  return `No hay datos validos cargados en ${loadConfig.sourceLabel}.`;
}

export function AnexosView({
  ccfSalesRows = [],
  fcfSalesRows = [],
  homeRows = [],
  purchaseRows = [],
  onRowsChange,
  savedRows,
  type = 'salesCcf'
}) {
  const config = useMemo(() => ANEXOS[type] || ANEXOS.salesCcf, [type]);
  const defaultColumnWidths = useMemo(
    () => Object.fromEntries(config.columns.map(([header]) => [header, getAnexoColumnWidth(header)])),
    [config.columns]
  );
  const [manualColumnWidths, setManualColumnWidths] = useState({});
  const gridTemplateColumns = useMemo(() => [
    '92px',
    '82px',
    ...config.columns.map(([header]) => `${manualColumnWidths[header] || defaultColumnWidths[header]}px`)
  ].join(' '), [config.columns, defaultColumnWidths, manualColumnWidths]);
  const emptyRows = useMemo(() => Array.from({ length: 22 }, (_, index) => index + 1), []);
  const initialRows = useMemo(() => emptyRows.map(() => Object.fromEntries(
    config.columns.map(([header]) => [header, ''])
  )), [config.columns, emptyRows]);
  const [rows, setRows] = useState(() => (savedRows?.length ? savedRows : initialRows));
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [message, setMessage] = useState('');
  const [loadProgress, setLoadProgress] = useState(null);
  const [f14Period, setF14Period] = useState({ month: '', year: '' });
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ column: '', direction: 'asc' });
  const [filterSearch, setFilterSearch] = useState('');
  const [openFilter, setOpenFilter] = useState('');
  const [viewport, setViewport] = useState({ height: 600, scrollTop: 0 });
  const scrollFrameRef = useRef(0);
  const pendingViewportRef = useRef(viewport);
  const rowsChangeTimerRef = useRef(0);

  const indexedRows = useMemo(() => rows.map((row, index) => ({ index, row })), [rows]);
  const visibleRows = useMemo(
    () => {
      const filteredRows = applyAnexoFilters(indexedRows, filters);
      if (!sortConfig.column) return filteredRows;
      const direction = sortConfig.direction === 'desc' ? -1 : 1;

      return [...filteredRows].sort((firstRow, secondRow) => (
        compareAnexoValues(firstRow.row?.[sortConfig.column], secondRow.row?.[sortConfig.column]) * direction
      ));
    },
    [filters, indexedRows, sortConfig]
  );
  const loadedItemCount = useMemo(
    () => rows.filter((row) => hasUsefulAnexoData(row, config.columns)).length,
    [config.columns, rows]
  );
  const virtualRows = useMemo(() => {
    const bodyScrollTop = Math.max(0, viewport.scrollTop - ANEXO_STICKY_ROWS_HEIGHT);
    const start = Math.max(0, Math.floor(bodyScrollTop / ANEXO_ROW_HEIGHT) - ANEXO_OVERSCAN_ROWS);
    const visibleCount = Math.ceil(viewport.height / ANEXO_ROW_HEIGHT) + ANEXO_OVERSCAN_ROWS * 2;
    const end = Math.min(visibleRows.length, start + visibleCount);

    return {
      rows: visibleRows.slice(start, end),
      startIndex: start,
      totalHeight: visibleRows.length * ANEXO_ROW_HEIGHT
    };
  }, [viewport.height, viewport.scrollTop, visibleRows]);
  const anexoTotals = useMemo(() => {
    const amountColumns = config.columns
      .map(([header]) => header)
      .filter(isAnexoAmountColumn);
    const totals = Object.fromEntries(amountColumns.map((header) => [header, 0]));

    for (const { row } of visibleRows) {
      for (const header of amountColumns) {
        totals[header] += parseMoney(row[header]);
      }
    }

    return totals;
  }, [config.columns, visibleRows]);
  const openFilterValues = useMemo(
    () => buildAnexoFilterValues(rows, openFilter),
    [openFilter, rows]
  );
  const filterValuesByColumn = useMemo(() => Object.fromEntries(
    config.columns.map(([header]) => [
      header,
      buildAnexoFilterValues(rows, header)
    ])
  ), [config.columns, rows]);

  useEffect(() => {
    const nextRows = savedRows?.length ? savedRows : initialRows;
    setRows((currentRows) => (currentRows === nextRows ? currentRows : nextRows));
    setMessage('');
    setFilters({});
    setSortConfig({ column: '', direction: 'asc' });
    setOpenFilter('');
    setFilterSearch('');
    setManualColumnWidths({});
    setViewport({ height: 600, scrollTop: 0 });
    setLoadProgress(null);
    cancelEditing();
  }, [initialRows, savedRows]);

  useEffect(() => {
    if (!onRowsChange) return undefined;
    if (rowsChangeTimerRef.current) window.clearTimeout(rowsChangeTimerRef.current);

    rowsChangeTimerRef.current = window.setTimeout(() => {
      rowsChangeTimerRef.current = 0;
      onRowsChange(rows);
    }, 120);

    return () => {
      if (rowsChangeTimerRef.current) {
        window.clearTimeout(rowsChangeTimerRef.current);
        rowsChangeTimerRef.current = 0;
      }
    };
  }, [onRowsChange, rows]);

  useEffect(() => () => {
    if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    if (rowsChangeTimerRef.current) window.clearTimeout(rowsChangeTimerRef.current);
  }, []);

  function startEditing(rowIndex) {
    setEditingRowIndex(rowIndex);
    setEditingDraft({ ...rows[rowIndex] });
  }

  function cancelEditing() {
    setEditingRowIndex(null);
    setEditingDraft(null);
  }

  function saveEditing() {
    if (editingRowIndex === null) return;
    setRows((currentRows) => currentRows.map((row, index) => (
      index === editingRowIndex ? editingDraft : row
    )));
    cancelEditing();
  }

  function updateEditingValue(header, value) {
    setEditingDraft((draft) => ({ ...draft, [header]: value }));
  }

  function clearRow(rowIndex) {
    setRows((currentRows) => currentRows.map((row, index) => (
      index === rowIndex
        ? createEmptyAnexoRow(config.columns)
        : row
    )));
    if (editingRowIndex === rowIndex) cancelEditing();
  }

  async function loadData() {
    const clientLookup = loadClientRegisterLookup();
    const providerLookup = loadProviderRegisterLookup();
    const providerF14Lookup = loadProviderF14RegisterLookup();
    const f14PeriodValue = getF14PeriodValue(f14Period);
    const loadConfig = getAnexoLoadConfig(type, {
      ccfSalesRows,
      clientLookup,
      f14PeriodValue,
      fcfSalesRows,
      homeRows,
      providerF14Lookup,
      providerLookup,
      purchaseRows
    });

    if (!loadConfig) {
      setMessage('Carga de datos disponible por ahora para anexos de venta CCF, venta FCF, compras, compra sujeto excluido FSE, anticipo IVA 2%, retencion IVA 1%, percepcion IVA 1% y documentos invalidados. Anexo F14 queda disponible como estructura editable manual.');
      return;
    }

    const nextRows = await buildAnexoRows({
      columns: config.columns,
      loadConfig,
      onProgress: ({ completed, matched, total }) => {
        setLoadProgress({ completed, total, matched });
        setMessage(`Cargando datos: ${completed}/${total} archivo(s) revisado(s). ${matched} registro(s) encontrado(s).`);
      }
    });

    if (!nextRows.length) {
      setRows(initialRows);
      setLoadProgress(null);
      setMessage(getNoAnexoRowsMessage(type, {
        ccfSalesRows,
        fcfSalesRows,
        loadConfig,
        purchaseRows
      }));
      return;
    }

    setRows(nextRows);
    setLoadProgress(null);
    cancelEditing();
    setMessage(`${nextRows.length} registro(s) cargado(s) desde ${loadConfig.sourceLabel}.`);
  }

  function clearData() {
    setRows(initialRows);
    setFilters({});
    setSortConfig({ column: '', direction: 'asc' });
    setOpenFilter('');
    setFilterSearch('');
    cancelEditing();
    setMessage('Datos del anexo borrados correctamente.');
  }

  async function exportF14ExcelTemplate() {
    try {
      if (!window.dteApp?.exportRegisterTemplate) {
        setMessage('Reinicie la aplicacion para generar plantillas Excel.');
        return;
      }

      const filePath = await window.dteApp.exportRegisterTemplate({
        columns: config.columns.map(([header]) => header),
        title: config.title
      });
      if (filePath) setMessage(`Plantilla creada: ${filePath}`);
    } catch (error) {
      setMessage(`No se pudo crear la plantilla: ${error.message}`);
    }
  }

  async function importF14ExcelTemplate() {
    try {
      if (!window.dteApp?.importRegisterExcel) {
        setMessage('Reinicie la aplicacion para importar Excel.');
        return;
      }

      const importedRows = await window.dteApp.importRegisterExcel({
        columns: config.columns.map(([header]) => header),
        title: config.title
      });
      if (!importedRows) return;

      const emptyRowTemplate = createEmptyAnexoRow(config.columns);
      const nextRows = importedRows
        .map((row) => ({ ...emptyRowTemplate, ...row }))
        .filter((row) => hasUsefulAnexoData(row, config.columns));

      if (!nextRows.length) {
        setMessage('No se encontraron datos en la plantilla seleccionada.');
        return;
      }

      const emptyRowsNeeded = Math.max(22 - nextRows.length, 1);
      setRows([
        ...nextRows,
        ...Array.from({ length: emptyRowsNeeded }, () => createEmptyAnexoRow(config.columns))
      ]);
      setFilters({});
      setSortConfig({ column: '', direction: 'asc' });
      setOpenFilter('');
      setFilterSearch('');
      cancelEditing();
      setMessage(`${nextRows.length} registro(s) importado(s) desde Excel.`);
    } catch (error) {
      setMessage(`No se pudo importar Excel: ${error.message}`);
    }
  }

  async function exportCsv() {
    try {
      const columns = config.columns.map(([header]) => header);
      const exportRows = visibleRows
        .map(({ row }) => row)
        .filter((row) => (
          hasUsefulAnexoData(row, config.columns)
          && (type === 'invalidDocuments' || !isInvalidOrRejectedDte(row))
        ))
        .map((row) => prepareAnexoRowForCsv(row, type));

      if (!exportRows.length) {
        setMessage('No hay registros para generar CSV.');
        return;
      }

      if (!window.dteApp?.exportAnexoCsv) {
        setMessage('Reinicie la aplicacion para activar la exportacion CSV de anexos.');
        return;
      }

      const filePath = await window.dteApp.exportAnexoCsv({
        columns,
        rows: exportRows,
        title: config.title
      });

      if (filePath) setMessage(`CSV generado: ${filePath}`);
    } catch (error) {
      setMessage(`No se pudo generar CSV: ${error.message}`);
    }
  }

  const startColumnResize = useCallback((event, header) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const initialWidth = manualColumnWidths[header] || defaultColumnWidths[header] || 150;

    function handleMouseMove(moveEvent) {
      const nextWidth = Math.min(Math.max(initialWidth + moveEvent.clientX - startX, 90), 640);
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

  function toggleSort(header) {
    setSortConfig((currentSort) => ({
      column: header,
      direction: currentSort.column === header && currentSort.direction === 'asc' ? 'desc' : 'asc'
    }));
    setViewport((current) => ({ ...current, scrollTop: 0 }));
  }

  const handleTableScroll = useCallback((event) => {
    const target = event.currentTarget;
    pendingViewportRef.current = {
      height: target.clientHeight,
      scrollTop: target.scrollTop
    };

    if (scrollFrameRef.current) return;
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = 0;
      setViewport(pendingViewportRef.current);
    });
  }, []);

  const isLoadingData = Boolean(loadProgress);
  const progressMessage = loadProgress
    ? `Cargando ${loadProgress.completed}/${loadProgress.total} archivo(s). ${loadProgress.matched} registro(s) encontrado(s).`
    : '';
  const statusMessage = progressMessage || message;

  return (
    <section className="anexosView" data-tour="anexos-view">
      <div className="anexosSheet">
        <div className="anexosToolbar" data-tour="anexos-toolbar">
          {statusMessage ? <span className="anexosMessage">{statusMessage}</span> : null}
          <span className="anexosCounter">{loadedItemCount} item(s) cargado(s)</span>
          {type === 'f14' ? (
            <>
              <button className="actionButton" disabled={isLoadingData} onClick={exportF14ExcelTemplate} type="button">PLANTILLA EXCEL</button>
              <button className="actionButton" disabled={isLoadingData} onClick={importF14ExcelTemplate} type="button">IMPORTAR EXCEL</button>
            </>
          ) : null}
          <button className="actionButton" data-tour="anexo-load-button" disabled={isLoadingData} onClick={loadData} type="button">CARGAR DATOS</button>
          <button className="actionButton" data-tour="anexo-csv-button" disabled={isLoadingData} onClick={exportCsv} type="button">GENERAR CSV</button>
          <button className="actionButton dangerActionButton" data-tour="anexo-clear-button" disabled={isLoadingData} onClick={clearData} type="button">BORRAR DATOS</button>
        </div>
        <div className={`anexosHeader ${type === 'f14' ? 'anexosHeaderF14' : ''}`}>
          <h1 className="anexosTitle">{config.title}</h1>
          {type === 'f14' ? (
            <div className="anexosF14PeriodFields" aria-label="Periodo Anexo F14">
              <label className="anexosF14PeriodField">
                <span>MES</span>
                <input
                  onChange={(event) => setF14Period((current) => ({ ...current, month: event.target.value }))}
                  type="text"
                  value={f14Period.month}
                />
              </label>
              <label className="anexosF14PeriodField">
                <span>AÑO</span>
                <input
                  onChange={(event) => setF14Period((current) => ({ ...current, year: event.target.value }))}
                  type="text"
                  value={f14Period.year}
                />
              </label>
            </div>
          ) : null}
        </div>
        <div className="anexosTableViewport" onScroll={handleTableScroll}>
          <div className="anexosTable" style={{ gridTemplateColumns }}>
            <div className="anexosTotalCell anexosActionsTotalCell" />
            <div className="anexosTotalCell anexosCorrTotalCell" />
            {config.columns.map(([header]) => {
              const totalValue = isAnexoAmountColumn(header) ? `$${formatAnexoTotal(anexoTotals[header] || 0)}` : '';

              return (
                <div className="anexosTotalCell" key={`total-${header}`} title={totalValue}>
                  {totalValue}
                </div>
              );
            })}

            <div className="anexosHeadCell anexosActionsHead">ACCIONES</div>
            <div className="anexosMetaCell anexosCorrHead">CORR.</div>
            {config.columns.map(([header]) => (
              <div className="anexosHeadCell" key={header} onClick={() => toggleSort(header)} role="columnheader" title={`Ordenar ${header}`}>
                <span>{header}</span>
                {sortConfig.column === header ? (
                  <span className="sortIndicator">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                ) : null}
                <button
                  className={`excelFilterButton ${hasActiveColumnFilter(filters[header], filterValuesByColumn[header]) ? 'active' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenFilter(openFilter === header ? '' : header);
                    setFilterSearch('');
                  }}
                  title={`Filtrar ${header}`}
                  type="button"
                >
                  v
                </button>
                {openFilter === header ? (
                  <AnexoFilterMenu
                    column={header}
                    filterSearch={filterSearch}
                    onClose={() => setOpenFilter('')}
                    onFilterSearchChange={setFilterSearch}
                    onFiltersChange={setFilters}
                    onSortChange={setSortConfig}
                    sortConfig={sortConfig}
                    selectedValues={filters[header] || []}
                    values={openFilterValues}
                  />
                ) : null}
                <span
                  className="anexosColumnResizeHandle"
                  onClick={(event) => event.stopPropagation()}
                  onDoubleClick={(event) => resetColumnWidth(event, header)}
                  onMouseDown={(event) => startColumnResize(event, header)}
                  onPointerDown={(event) => event.stopPropagation()}
                  title="Arrastrar para ajustar ancho. Doble click para autoajustar."
                />
              </div>
            ))}

            <div className="anexosVirtualBody" style={{ height: virtualRows.totalHeight }}>
              {virtualRows.rows.map(({ row, index }, renderIndex) => {
                const visualIndex = virtualRows.startIndex + renderIndex;
                return (
                <AnexoVirtualRow
                  columns={config.columns}
                  editingDraft={editingDraft}
                  gridTemplateColumns={gridTemplateColumns}
                  isEditing={index === editingRowIndex}
                  key={`anexo-row-${index}`}
                  onCancelEditing={cancelEditing}
                  onClearRow={clearRow}
                  onSaveEditing={saveEditing}
                  onStartEditing={startEditing}
                  onUpdateEditingValue={updateEditingValue}
                  row={row}
                  rowIndex={index}
                  visualIndex={visualIndex}
                />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnexoVirtualRow({
  columns,
  editingDraft,
  gridTemplateColumns,
  isEditing,
  onCancelEditing,
  onClearRow,
  onSaveEditing,
  onStartEditing,
  onUpdateEditingValue,
  row,
  rowIndex,
  visualIndex
}) {
  const rowNumber = visualIndex + 1;
  const rowTone = rowNumber % 2 ? 'odd' : 'even';

  return (
    <div
      className="anexosVirtualRow"
      style={{ gridTemplateColumns, transform: `translateY(${visualIndex * ANEXO_ROW_HEIGHT}px)` }}
    >
      <div className={`anexosCell anexosActionsCell ${rowTone}`}>
        {isEditing ? (
          <>
            <button className="ivaBookRowButton save" onClick={onSaveEditing} title="Guardar" type="button">
              <Check size={13} />
            </button>
            <button className="ivaBookRowButton cancel" onClick={onCancelEditing} title="Cancelar" type="button">
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <button className="ivaBookRowButton edit" onClick={() => onStartEditing(rowIndex)} title="Editar linea" type="button">
              <Pencil size={13} />
            </button>
            <button className="ivaBookRowButton delete" onClick={() => onClearRow(rowIndex)} title="Borrar linea" type="button">
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
      <div className={`anexosCell rowNumber ${rowTone}`}>{rowNumber}</div>
      {columns.map(([header]) => (
        <div className={`anexosCell ${rowTone}`} key={header} title={String(row[header] || '')}>
          {isEditing ? (
            <input
              className="anexosEditInput"
              onChange={(event) => onUpdateEditingValue(header, event.target.value)}
              value={editingDraft?.[header] || ''}
            />
          ) : (
            row[header]
          )}
        </div>
      ))}
    </div>
  );
}

function AnexoFilterMenu({
  column,
  filterSearch,
  onClose,
  onFilterSearchChange,
  onFiltersChange,
  onSortChange,
  sortConfig,
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
    onFiltersChange((currentFilters) => ({
      ...currentFilters,
      [column]: nextValues
    }));
  }

  return (
    <div className="excelFilterMenu anexosFilterMenu" onClick={(event) => event.stopPropagation()}>
      <div className="excelFilterTitle">{column}</div>
      <input
        className="excelFilterSearch"
        onChange={(event) => onFilterSearchChange(event.target.value)}
        placeholder="Buscar..."
        value={filterSearch}
      />
      <div className="excelFilterActions">
        <button
          className={sortConfig?.column === column && sortConfig?.direction === 'asc' ? 'active' : ''}
          onClick={() => onSortChange({ column, direction: 'asc' })}
          type="button"
        >
          Menor a mayor
        </button>
        <button
          className={sortConfig?.column === column && sortConfig?.direction === 'desc' ? 'active' : ''}
          onClick={() => onSortChange({ column, direction: 'desc' })}
          type="button"
        >
          Mayor a menor
        </button>
        <button onClick={() => setColumnValues(allValuesSelected ? [NO_FILTER_VALUES_SELECTED] : values)} type="button">Todos</button>
        <button onClick={(event) => {
          event.stopPropagation();
          onClose();
        }} type="button">Cerrar</button>
      </div>
      <div className="excelFilterValues">
        {searchedValues.map((value) => (
          <label className="excelFilterOption" key={value || '(vacio)'}>
            <input
              checked={effectiveSelected.includes(value)}
              onChange={(event) => {
                const nextValues = event.target.checked
                  ? [...new Set([...effectiveSelected, value])]
                  : effectiveSelected.filter((item) => item !== value);
                setColumnValues(nextValues);
              }}
              type="checkbox"
            />
            <span>{value || '(vacio)'}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
