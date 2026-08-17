export const DEFAULT_STRUCTURE_NAME = 'Estructura Hacienda DTE';
export const CUSTOM_JSON_STRUCTURES_KEY = 'dte-custom-json-structures';
export const CUSTOM_JSON_STRUCTURES_UPDATED_EVENT = 'dte-custom-json-structures-updated';

export const STRUCTURE_OPTIONS_BY_DTE = {
  all: ['TODOS'],
  '01': ['FCF EMISOR'],
  '03': ['CCF RECEPTOR COMPRA', 'CCF EMISOR VENTA'],
  '05': ['NOTA DE CREDITO EMISOR VENTA', 'NOTA DE CREDITO RECEPTOR COMPRA'],
  '07': ['COMPROBANTE DE RETENCION RECEPTOR'],
  '09': ['DCL RECEPTOR'],
  '11': ['FEX EMISOR'],
  '14': ['FSE EMISOR'],
};

export function loadCustomJsonStructures() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(CUSTOM_JSON_STRUCTURES_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function getStructureOptions(typeCode) {
  const builtinOptions = STRUCTURE_OPTIONS_BY_DTE[typeCode] || [];
  const customOptions = loadCustomJsonStructures()
    .filter((structure) => (
      typeCode === 'all'
      || String(structure?.typeCode || '').padStart(2, '0') === String(typeCode || '').padStart(2, '0')
    ))
    .map((structure) => String(structure?.structureName || '').trim())
    .filter(Boolean);

  return Array.from(new Set([...builtinOptions, ...customOptions]));
}
