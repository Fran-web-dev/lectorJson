import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const workbook = Workbook.create();
const sheet = workbook.worksheets.add('Resumen');
sheet.showGridLines = false;

const rows = [
  ['ANEXO VENTA CCF', 'Libro de Ventas CCF', 'DTE 03 y DTE 05', 'Filas utiles del Libro de Ventas CCF. Para DTE 05 los valores monetarios se trasladan en positivo.', 'NUMERO DE CONTROL; CODIGO DE GENERACION; NOMBRE DEL CLIENTE'],
  ['ANEXO VENTA FCF', 'Libro de Ventas FCF', 'Todos los DTE cargados en el libro', 'Todas las filas utiles cargadas en el Libro de Ventas FCF.', 'NUMERO DE CONTROL; CODIGO DE GENERACION; TOTAL'],
  ['ANEXO COMPRAS', 'Libro de Compras', 'DTE 03 y DTE 05', 'Filas con tipo de documento 03 o 05 segun NUMERO DE CONTROL.', 'NUMERO DE CONTROL; NOMBRE DEL PROVEEDOR; TOTAL COMPRAS'],
  ['ANEXO COMPRA SUJETO EXCLUIDO FSE (66)', 'Libro de Compras', 'Importe sujeto excluido mayor a cero', 'Filas con COMPRAS A SUJETOS EXCLUIDOS mayor a cero.', 'CODIGO DE GENERACION; NOMBRE DEL PROVEEDOR; COMPRAS A SUJETOS EXCLUIDOS'],
  ['ANEXO ANTICIPO A CUENTA IVA 2% (161)', 'Libro de Ventas CCF', 'DTE 09', 'Filas DTE 09 con PERCEPCION 2% mayor a cero.', 'NUMERO DE CONTROL; CODIGO DE GENERACION; PERCEPCION 2%'],
  ['ANEXO RETENCION IVA 1% (162)', 'Libro de Ventas CCF', 'DTE 07', 'Filas DTE 07 con RETENCION 1% mayor a cero.', 'NUMERO DE CONTROL; CODIGO DE GENERACION; RETENCION 1%'],
  ['ANEXO PERCEPCION IVA 1% (163)', 'Libro de Compras', 'Percepcion 1% mayor a cero', 'Filas con PERCEPCION 1% IVA mayor a cero.', 'NUMERO DE CONTROL; CODIGO DE GENERACION; PERCEPCION 1% IVA'],
  ['ANEXO DOCUMENTOS INVALIDADOS', 'Libro de Ventas CCF y Libro de Ventas FCF', 'Documentos invalidados o rechazados', 'Filas con estado/documento invalidado o rechazado segun regla del anexo.', 'NUMERO DE CONTROL; CODIGO DE GENERACION; NOMBRE DEL CLIENTE; Estado del DTE'],
  ['ANEXO F14', 'INICIO', 'DTE 14 FSE EMISOR', 'Filas DTE14 FSE EMISOR con retencion de renta/ingreso segun regla F14.', 'Doc ID Sujeto Excluido; Nombre sujetoExcluido; Subtotal Compra']
];

sheet.getRange('A1:E1').merge();
sheet.getRange('A1:E1').values = [['RESUMEN DE ALIMENTACION DE ANEXOS']];
sheet.getRange('A1:E1').format = {
  fill: '#F4F7F2',
  font: { bold: true, color: '#000000', size: 14 },
  borders: { preset: 'all', style: 'thin', color: '#000000' }
};

sheet.getRange('A2:E2').values = [['Anexo', 'De donde se alimenta', 'DTE / Filtro', 'Condicion de carga', 'Columnas clave']];
sheet.getRange('A2:E2').format = {
  fill: '#FFF2CC',
  font: { bold: true, color: '#000000' },
  borders: { preset: 'all', style: 'thin', color: '#000000' }
};

sheet.getRange(`A3:E${rows.length + 2}`).values = rows;
sheet.getRange(`A3:E${rows.length + 2}`).format = {
  font: { color: '#000000' },
  borders: { preset: 'all', style: 'thin', color: '#000000' },
  wrapText: true
};

sheet.getRange(`A1:E${rows.length + 2}`).format.font.name = 'Calibri';
sheet.getRange(`A1:E${rows.length + 2}`).format.font.size = 11;
sheet.getRange('A:A').format.columnWidthPx = 310;
sheet.getRange('B:B').format.columnWidthPx = 240;
sheet.getRange('C:C').format.columnWidthPx = 230;
sheet.getRange('D:D').format.columnWidthPx = 450;
sheet.getRange('E:E').format.columnWidthPx = 430;
sheet.getRange('1:1').format.rowHeightPx = 30;
sheet.getRange('2:2').format.rowHeightPx = 25;
sheet.getRange(`3:${rows.length + 2}`).format.rowHeightPx = 48;
sheet.freezePanes.freezeRows(2);

const usedRange = `A1:E${rows.length + 2}`;
const inspect = await workbook.inspect({
  kind: 'table',
  range: `Resumen!${usedRange}`,
  include: 'values',
  tableMaxRows: 20,
  tableMaxCols: 6
});
console.log(inspect.ndjson);

const errors = await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 50 },
  summary: 'formula error scan'
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: 'Resumen',
  range: usedRange,
  scale: 1,
  format: 'png'
});
await fs.writeFile(new URL('preview.png', import.meta.url), new Uint8Array(await preview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
try {
  await xlsx.save(fileURLToPath(new URL('resumen-alimentacion-anexos-actualizado.xlsx', import.meta.url)));
} catch (error) {
  if (error?.code !== 'EBUSY') throw error;
  await xlsx.save(fileURLToPath(new URL('resumen-alimentacion-anexos-actualizado-2.xlsx', import.meta.url)));
}
