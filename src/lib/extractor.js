import { DTE_TYPES, getStructureForType } from './dteStructures.js';

const moneyFormatter = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
const OPERATION_CONDITIONS = {
  1: 'Contado',
  2: 'Credito',
  3: 'Otro'
};

function normalizeKey(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function flattenVisible(value) {
  if (Array.isArray(value)) {
    return value.map(flattenVisible).filter(Boolean).join(' | ');
  }
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([, item]) => item !== null && item !== undefined && item !== '')
      .map(([key, item]) => `${key}: ${flattenVisible(item)}`)
      .join(', ');
  }
  return value ?? '';
}

function formatValue(value, style) {
  if (value === null || value === undefined || value === '') return '';
  if (style === 'stripHyphen') return String(value).replace(/-/g, '');
  if (style === 'date') return formatDate(value);
  if (style === 'operationCondition') return OPERATION_CONDITIONS[value] || value;
  if (style === 'money') {
    const number = Number(String(value).replace(/[$,\s]/g, ''));
    if (Number.isFinite(number)) {
      return moneyFormatter.format(number);
    }
  }
  return flattenVisible(value);
}

function formatDate(value) {
  const text = String(value).trim();
  const yearFirst = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (yearFirst) {
    const [, year, month, day] = yearFirst;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  const dayFirst = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  return text;
}

function parseDisplayDate(value) {
  const text = String(value || '').trim();
  const dayFirst = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`).getTime();
  }

  const yearFirst = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yearFirst) {
    const [, year, month, day] = yearFirst;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`).getTime();
  }

  return Number.NaN;
}

function extractFromPlainObject(source, fields, style) {
  if (!source) return '';
  const values = [];

  if (fields.includes('cantidad') && fields.includes('descripcion') && fields.includes('precioUni') && fields.includes('ventaGravada')) {
    return [
      `Cant: ${flattenVisible(source.cantidad)}`,
      flattenVisible(source.descripcion),
      `PU: ${flattenVisible(source.precioUni)}`,
      `VTAGR: ${flattenVisible(source.ventaGravada)}`
    ].filter(Boolean).join(' | ');
  }

  for (const field of fields) {
    const value = source[field];
    if (value !== undefined && value !== null && value !== '') {
      values.push(style ? formatValue(value, style) : flattenVisible(value));
    }
  }

  return values.join('; ');
}

function addItemColumns(row, payload, structure) {
  const items = Array.isArray(payload?.cuerpoDocumento) ? payload.cuerpoDocumento : [];

  for (const rule of structure) {
    if (rule.perItem) {
      row[rule.name] = items
        .map((item) => extractFromPlainObject(item, rule.fields, rule.style))
        .filter(Boolean)
        .join('\n');
    }
  }

  return row;
}

function addIndexedValue(index, key, value) {
  if (value === null || value === undefined || value === '') return;
  const normalizedKey = normalizeKey(key);
  if (!index.fields.has(normalizedKey)) index.fields.set(normalizedKey, value);
}

function createDocumentIndex(payload) {
  const index = { fields: new Map(), sections: new Map() };
  const stack = [{ key: '', value: payload }];

  while (stack.length) {
    const { key, value } = stack.pop();
    if (key) {
      const normalizedKey = normalizeKey(key);
      if (!index.sections.has(normalizedKey)) index.sections.set(normalizedKey, value);
    }

    if (!value || typeof value !== 'object') continue;

    if (Array.isArray(value)) {
      for (let indexItem = value.length - 1; indexItem >= 0; indexItem -= 1) {
        stack.push({ key, value: value[indexItem] });
      }
      continue;
    }

    for (const [childKey, childValue] of Object.entries(value)) {
      if (childValue && typeof childValue === 'object') {
        stack.push({ key: childKey, value: childValue });
      } else {
        addIndexedValue(index, childKey, childValue);
      }
    }
  }

  return index;
}

function findIndexedField(index, fieldName) {
  return index.fields.get(normalizeKey(fieldName)) ?? '';
}

function findIndexedSection(index, sectionName) {
  return index.sections.get(normalizeKey(sectionName));
}

function extractField(payloadIndex, rule) {
  for (const sectionName of rule.sections) {
    const section = findIndexedSection(payloadIndex, sectionName);
    if (section === undefined && rule.fields.includes('*')) {
      const directValue = findIndexedField(payloadIndex, sectionName);
      if (directValue !== '') return directValue;
    }
    if (section === undefined) continue;
    if (section === null || typeof section !== 'object') return section;
    if (rule.fields.includes('*')) return section;
    if (rule.filter && Array.isArray(section)) {
      const match = section.find((item) => String(item?.[rule.filter.key]) === String(rule.filter.value));
      return match?.[rule.filter.field] ?? '';
    }

    if (Array.isArray(section)) {
      const parts = section.map((item) => {
        const itemIndex = createDocumentIndex(item);
        const row = {};
        for (const field of rule.fields) row[field] = findIndexedField(itemIndex, field);
        return flattenVisible(row);
      });
      return parts.filter(Boolean).join(' | ');
    }

    const sectionIndex = createDocumentIndex(section);
    for (const field of rule.fields) {
      const value = findIndexedField(sectionIndex, field);
      if (value !== '') return value;
    }
  }

  for (const field of rule.fields) {
    if (field === '*') continue;
    const value = findIndexedField(payloadIndex, field);
    if (value !== '') return value;
  }

  return '';
}

export function detectDteType(payload, selectedType = '') {
  const index = createDocumentIndex(payload);
  const code = selectedType || findIndexedField(index, 'tipoDte');
  const dte = DTE_TYPES.find((item) => item.code === String(code).padStart(2, '0'));
  return dte || { code: String(code || 'ND'), label: 'No detectado' };
}

export function extractRows(documents, options = {}) {
  const { typeCode = '', fromDate = '', toDate = '' } = options;
  const selectedType = typeCode === 'all' ? '' : typeCode;
  const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
  const toTime = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

  return documents.map((document) => {
    const payloadIndex = createDocumentIndex(document.payload);
    const actualCode = String(findIndexedField(payloadIndex, 'tipoDte') || '').padStart(2, '0');
    if (selectedType && actualCode !== String(selectedType).padStart(2, '0')) return null;

    const dte = DTE_TYPES.find((item) => item.code === actualCode) || { code: actualCode || 'ND', label: 'No detectado' };
    const structure = getStructureForType(dte.code);
    const baseRow = {
      __sourceFile: document.sourceFile || ''
    };

    for (const rule of structure) {
      if (!rule.perItem) {
        baseRow[rule.name] = formatValue(extractField(payloadIndex, rule), rule.style);
      }
    }

    return addItemColumns(baseRow, document.payload, structure);
  }).filter((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
    if (!fromTime && !toTime) return true;
    const raw = row.Fecha || '';
    if (!raw) return true;
    const dateTime = parseDisplayDate(raw);
    if (Number.isNaN(dateTime)) return true;
    if (fromTime && dateTime < fromTime) return false;
    if (toTime && dateTime > toTime) return false;
    return true;
  });
}
