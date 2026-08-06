export const DEFAULT_STRUCTURE_NAME = 'Estructura Hacienda DTE';

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

export function getStructureOptions(typeCode) {
  return STRUCTURE_OPTIONS_BY_DTE[typeCode] || [];
}
