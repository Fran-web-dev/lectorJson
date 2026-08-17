export function isMoneyColumn(column) {
  if (['Cant,NP,PU', 'Cant,NP,PU,VTAGR', 'DESCR,CANT,PU,VTAGR', 'DESCR,CANT,PU,VTA', 'Cant,Descrip,PU,compra'].includes(String(column || '').trim())) {
    return false;
  }

  return /total|monto|valor|iva|credito|debito|fovial|cotrans|percepciones|retencion|retenido|percibido|compra|gravado|exenta|sujetas|desc\.|sub-?total|pagar|comision|liq\./i.test(column)
    && !/letras/i.test(column);
}

function isDateColumn(column) {
  return /^fecha$/i.test(String(column).trim());
}

function parseFilterDate(value) {
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

export function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value || '').trim();
  if (!text) return 0;
  const normalized = text.replace(/[$,\s]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

export function compareCellValues(aValue, bValue, column) {
  if (isDateColumn(column)) {
    const aDate = parseFilterDate(aValue);
    const bDate = parseFilterDate(bValue);
    if (aDate || bDate) return aDate.localeCompare(bDate);
  }

  if (isMoneyColumn(column)) {
    return parseMoney(aValue) - parseMoney(bValue);
  }

  const aNumber = Number(String(aValue ?? '').replace(/[$,\s]/g, ''));
  const bNumber = Number(String(bValue ?? '').replace(/[$,\s]/g, ''));
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
    return aNumber - bNumber;
  }

  return String(aValue ?? '').localeCompare(String(bValue ?? ''), 'es', {
    numeric: true,
    sensitivity: 'base'
  });
}

export function sortTableRows(rows, sortConfig = { column: '', direction: 'asc' }) {
  if (!sortConfig.column) return rows;
  const direction = sortConfig.direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => compareCellValues(a?.[sortConfig.column], b?.[sortConfig.column], sortConfig.column) * direction);
}
