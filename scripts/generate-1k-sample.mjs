import fs from 'node:fs';
import path from 'node:path';

const recordCount = Number(process.argv[2] || 1000);
const outputPath = path.resolve('samples', 'json-inicial', `ejemplojson-${recordCount}`, `credito-fiscal-${recordCount}-ventas.json`);
const products = [
  ['SERV-ERP', 'Implementacion modulo facturacion electronica', 950],
  ['SERV-SOP', 'Horas soporte tecnico especializado', 45],
  ['LIC-CRM', 'Licencia mensual CRM empresarial', 38.5],
  ['CONS-DTE', 'Consultoria fiscal DTE El Salvador', 125],
  ['MANT-SRV', 'Mantenimiento preventivo de servidores', 210],
  ['CAP-CONT', 'Capacitacion equipo contable', 75],
  ['AUD-SIS', 'Auditoria de sistemas y respaldo', 185],
  ['INT-API', 'Integracion API Hacienda y ERP', 320],
  ['SOP-REM', 'Soporte remoto especializado', 55],
  ['DOC-TEC', 'Documentacion tecnica de procesos', 42]
];

const cuerpoDocumento = Array.from({ length: recordCount }, (_, index) => {
  const [baseCode, descripcion, basePrice] = products[index % products.length];
  const cantidad = (index % 9) + 1;
  const precioUni = Number((basePrice + (index % 17) * 2.15).toFixed(2));
  const bruto = cantidad * precioUni;
  const montoDescu = Number((index % 8 === 0 ? bruto * 0.04 : 0).toFixed(2));
  const ventaGravada = Number((bruto - montoDescu).toFixed(2));

  return {
    numItem: index + 1,
    tipoItem: index % 4 === 0 ? 1 : 2,
    cantidad,
    codigo: `${baseCode}-${String(index + 1).padStart(4, '0')}`,
    descripcion: `${descripcion} #${index + 1}`,
    precioUni,
    montoDescu,
    ventaGravada
  };
});

const totalGravada = Number(cuerpoDocumento.reduce((sum, item) => sum + item.ventaGravada, 0).toFixed(2));
const totalDescu = Number(cuerpoDocumento.reduce((sum, item) => sum + item.montoDescu, 0).toFixed(2));
const totalIva = Number((totalGravada * 0.13).toFixed(2));
const ivaRete1 = Number((totalGravada * 0.01).toFixed(2));
const montoTotalOperacion = Number((totalGravada + totalIva - ivaRete1).toFixed(2));

const dte = {
  identificacion: {
    version: 3,
    ambiente: '00',
    tipoDte: '03',
    numeroControl: `DTE-03-${String(recordCount).padStart(8, '0')}-000000000000${String(recordCount).padStart(3, '0')}`,
    codigoGeneracion: `${String(recordCount).padStart(4, '0')}1122-3344-5566-7788-99AABBCCDDEE`,
    tipoModelo: 1,
    tipoOperacion: 1,
    fecEmi: '2026-07-26',
    horEmi: '14:12:09',
    tipoMoneda: 'USD'
  },
  selloRecepcion: `MH-SELLO-RECEPCION-PRUEBA-${recordCount}`,
  emisor: {
    nit: '06142811231015',
    nrc: '1234567',
    nombre: 'Servicios Tecnicos del Pacifico SA de CV',
    codActividad: '62020',
    descActividad: 'Consultoria informatica',
    nombreComercial: 'STP Consultores',
    telefono: '2525-9090',
    correo: 'dte@stp.example',
    direccion: {
      departamento: '06',
      municipio: '23',
      complemento: 'San Salvador, Torre Empresarial, Nivel 4'
    }
  },
  receptor: {
    nit: '06140101991012',
    nrc: '7654321',
    nombre: 'Inversiones El Volcan SA de CV',
    codActividad: '46900',
    descActividad: 'Venta al por mayor de diversos productos',
    nombreComercial: 'El Volcan',
    correo: 'contabilidad@elvolcan.example',
    direccion: {
      departamento: '05',
      municipio: '22',
      complemento: 'Santa Tecla, Parque Industrial, Bodega 8'
    }
  },
  cuerpoDocumento,
  resumen: {
    totalNoSuj: 0,
    totalExenta: 0,
    totalGravada,
    subTotalVentas: totalGravada,
    totalDescu,
    subTotal: totalGravada,
    ivaRete1,
    ivaPerci1: 0,
    reteRenta: 0,
    montoTotalOperacion,
    totalPagar: montoTotalOperacion,
    totalLetras: `${montoTotalOperacion.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DOLARES`,
    totalIva,
    saldoFavor: 0,
    condicionOperacion: 2,
    observaciones: `Credito fiscal con ${recordCount.toLocaleString('es-SV')} registros de venta para prueba visual.`
  },
  extension: {
    nombEntrega: 'Ana Martinez',
    docuEntrega: '06140000111122',
    nombRecibe: 'Luis Hernandez',
    docuRecibe: '06140000333344',
    observaciones: 'Entregado a departamento de contabilidad.'
  }
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(dte, null, 2)}\n`, 'utf8');
console.log(outputPath);
console.log(JSON.stringify({ items: cuerpoDocumento.length, totalPagar: montoTotalOperacion }, null, 2));
