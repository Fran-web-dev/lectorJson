import { performance } from 'node:perf_hooks';
import { extractRows } from '../src/lib/extractor.js';

function createDocument(index) {
  const amount = 12.5 + (index % 200);
  return {
    sourceFile: `DTE-${index}.json`,
    fileName: `DTE-${index}.json`,
    folderName: 'prueba-10k',
    payload: {
      identificacion: {
        tipoDte: index % 2 === 0 ? '01' : '03',
        horEmi: '10:15:00',
        fecEmi: '2026-07-26',
        numeroControl: `DTE-01-0001-${String(index).padStart(15, '0')}`,
        codigoGeneracion: `ABC-${String(index).padStart(8, '0')}-XYZ`
      },
      selloRecibido: `SELLO-${index}`,
      emisor: { nombre: 'Empresa Demo SA de CV' },
      receptor: { nombre: 'Cliente Demo', numDocumento: '06140000000000', nrc: '1234567' },
      cuerpoDocumento: [
        { cantidad: 1, descripcion: 'Servicio profesional', precioUni: amount, compra: amount }
      ],
      resumen: {
        totalCompra: amount,
        totalDescu: 0,
        subTotal: amount,
        totalIva: amount * 0.13,
        reteRenta: 0,
        totalPagar: amount * 1.13,
        totalLetras: 'CIEN 00/100 DOLARES',
        observaciones: 'Documento generado para prueba de rendimiento'
      }
    }
  };
}

const EXPECTED_ROWS = Number(process.env.PERF_ROWS || 20_000);
const EXPECTED_MS = Number(process.env.PERF_MS || 1_000);
const documents = Array.from({ length: EXPECTED_ROWS }, (_, index) => createDocument(index));
const start = performance.now();
const rows = extractRows(documents, { fromDate: '', toDate: '' });
const elapsedMs = performance.now() - start;

console.log(JSON.stringify({
  elapsedSeconds: Number((elapsedMs / 1000).toFixed(3)),
  passed: elapsedMs < EXPECTED_MS,
  rows: rows.length
}, null, 2));

if (elapsedMs >= EXPECTED_MS || rows.length !== EXPECTED_ROWS) {
  process.exitCode = 1;
}
