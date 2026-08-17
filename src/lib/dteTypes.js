import { loadCustomJsonStructures } from './dteStructureOptions.js';

export const DTE_TYPES = [
  { code: 'all', label: 'TODOS' },
  { code: '01', label: 'Factura de Consumidor Final' },
  { code: '03', label: 'Comprobante Credito Fiscal' },
  { code: '04', label: 'Nota de Remision' },
  { code: '05', label: 'Nota de Credito' },
  { code: '06', label: 'Nota de Debito' },
  { code: '07', label: 'Comprobante de Retencion' },
  { code: '08', label: 'Comprobante de Liquidacion' },
  { code: '09', label: 'Documento Contable de Liquidacion' },
  { code: '11', label: 'Facturas de Exportacion' },
  { code: '14', label: 'Factura Sujeto Excluido' },
  { code: '15', label: 'Comprobante de donacion' }
];

export function getDteTypeOptions() {
  const customTypes = loadCustomJsonStructures()
    .map((structure) => String(structure?.typeCode || '').padStart(2, '0'))
    .filter((code) => code && code !== '00')
    .map((code) => ({ code, label: 'Estructura personalizada' }));

  const optionsByCode = new Map();
  [...DTE_TYPES, ...customTypes].forEach((type) => {
    if (!optionsByCode.has(type.code)) {
      optionsByCode.set(type.code, type);
    }
  });

  return Array.from(optionsByCode.values()).sort((left, right) => {
    if (left.code === 'all') return -1;
    if (right.code === 'all') return 1;
    return left.code.localeCompare(right.code, 'es', { numeric: true });
  });
}
