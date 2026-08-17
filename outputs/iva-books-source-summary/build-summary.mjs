import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const outputDir = fileURLToPath(new URL('.', import.meta.url));
const workbook = Workbook.create();
const sheet = workbook.worksheets.add('Resumen');

sheet.showGridLines = false;

const sections = [
  {
    title: 'LIBRO COMPRAS',
    rows: [
      ['03 Comprobante Credito Fiscal', 'CCF RECEPTOR COMPRA'],
      ['05 Nota de Credito', 'NOTA DE CREDITO RECEPTOR COMPRA'],
      ['14 Factura Sujeto Excluido', 'FSE EMISOR']
    ]
  },
  {
    title: 'LIBRO VENTAS CCF',
    rows: [
      ['03 Comprobante Credito Fiscal', 'CCF EMISOR VENTA'],
      ['05 Nota de Credito', 'NOTA DE CREDITO EMISOR VENTA'],
      ['07 Comprobante de Retencion', 'COMPROBANTE DE RETENCION RECEPTOR'],
      ['09 Documento Contable de Liquidacion', 'DCL RECEPTOR']
    ]
  },
  {
    title: 'LIBRO VENTAS FCF',
    rows: [
      ['01 Factura Consumidor Final', 'FCF EMISOR'],
      ['11 Factura de Exportacion', 'FEX EMISOR']
    ]
  }
];

let row = 1;
for (const section of sections) {
  sheet.getRange(`A${row}:B${row}`).merge();
  sheet.getRange(`A${row}:B${row}`).values = [[section.title]];
  sheet.getRange(`A${row}:B${row}`).format = {
    fill: '#F4F7F2',
    font: { bold: true, color: '#000000' },
    borders: { preset: 'all', style: 'thin', color: '#000000' }
  };

  sheet.getRange(`A${row + 1}:B${row + 1}`).values = [['Tipo de Documento', 'Nombre de estructura']];
  sheet.getRange(`A${row + 1}:B${row + 1}`).format = {
    fill: '#FFF2CC',
    font: { bold: true, color: '#000000' },
    borders: { preset: 'all', style: 'thin', color: '#000000' }
  };

  const dataStart = row + 2;
  const dataEnd = dataStart + Math.max(section.rows.length, 4) - 1;
  const data = [
    ...section.rows,
    ...Array.from({ length: Math.max(0, 4 - section.rows.length) }, () => ['', ''])
  ];
  sheet.getRange(`A${dataStart}:B${dataEnd}`).values = data;
  sheet.getRange(`A${dataStart}:B${dataEnd}`).format = {
    font: { color: '#000000' },
    borders: { preset: 'all', style: 'thin', color: '#000000' }
  };

  row = dataEnd + 2;
}

sheet.getRange('A:B').format.font.name = 'Calibri';
sheet.getRange('A:B').format.font.size = 11;
sheet.getRange('A:A').format.columnWidthPx = 330;
sheet.getRange('B:B').format.columnWidthPx = 470;
sheet.getRange(`A1:B${row}`).format.wrapText = false;
sheet.freezePanes.freezeRows(2);

const inspect = await workbook.inspect({
  kind: 'table',
  range: `Resumen!A1:B${row - 1}`,
  include: 'values',
  tableMaxRows: 30,
  tableMaxCols: 3
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
  range: `A1:B${row - 1}`,
  scale: 2,
  format: 'png'
});
await fs.writeFile(new URL('preview.png', import.meta.url), new Uint8Array(await preview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(fileURLToPath(new URL('resumen-alimentacion-libros-iva.xlsx', import.meta.url)));
