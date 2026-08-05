import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "D:/Escritorio/Proyects/lector-dte-hacienda/outputs/headers-iva-anexos";

const dteStructures = {
  "FCF EMISOR": [
    "Tipo DTE", "Hora", "Fecha", "Numero de Control", "Numero del Documento", "Serie del Documento",
    "NRC receptor", "NIT receptor", "Nombre receptor", "NRC emisor", "NIT emisor", "Nombre emisor",
    "DESCR,CANT,PU,VTA", "Total Gravado", "Total Exenta", "Total no Sujetas", "Desc. Gravado",
    "Desc. no Sujeta", "Desc. Exenta", "Total Desc.", "Sub-total", "Monto sin IVA (Calcular)",
    "Debito Fiscal", "Monto Total de la Operacion", "IVA Retenido", "Total a Pagar",
    "Valor en Letras", "Condicion de la operacion"
  ],
  "VENTAS CCF": [
    "Tipo DTE", "Hora", "Fecha", "Numero de Control", "Codigo de generacion local", "Serie del Documento",
    "NRC receptor", "NIT receptor", "Nombre receptor", "NRC emisor", "NIT emisor", "Nombre emisor",
    "DESCR,CANT,PU,VTAGR", "Total Gravado", "Total Exenta", "Total no Sujetas", "Desc. Gravado",
    "Desc. no Sujeta", "Desc. Exenta", "Total Desc.", "Sub-total", "Credito Fiscal",
    "Monto Total de la Operacion", "IVA Percibido", "IVA Retenido", "Total a Pagar",
    "Valor en Letras", "Condicion de la operacion", "Observacion"
  ],
  "COMPRAS CCF": [
    "Tipo DTE", "Hora", "Fecha", "Numero de Control", "Codigo de generacion local", "Serie del Documento",
    "NRC emisor", "NIT emisor", "Nombre emisor", "NRC receptor", "NIT receptor", "Nombre receptor",
    "Cant,NP,PU", "Total Gravado", "Total Exenta", "Total no Sujetas", "Desc. Gravado",
    "Desc. no Sujeta", "Desc. Exenta", "Total Desc.", "Sub-total", "Credito Fiscal",
    "Monto total de la operacion", "FOVIAL", "COTRANS", "Percepciones", "Retenciones",
    "Total de Compra", "Valor en Letras", "Condicion de la operacion"
  ],
  "NC COMPRAS": [
    "Tipo DTE", "Hora", "Fecha", "Numero de Control", "Numero del Documento", "Serie del Documento",
    "NRC emisor", "NIT emisor", "Nombre emisor", "NRC receptor", "NIT receptor", "Nombre receptor",
    "Cant,NP,PU", "Total Gravado", "Total Exenta", "Total no Sujetas", "Desc. Gravado",
    "Desc. no Sujeta", "Desc. Exenta", "Total Desc.", "Sub-total", "Credito Fiscal",
    "Monto total de la operacion", "FOVIAL", "COTRANS", "Percepciones", "IVA Retenido",
    "Total de Compra", "Valor en Letras", "Condicion de la operacion", "Documento Relacionado", "fechaEmision"
  ],
  "NC VENTAS": [
    "Tipo DTE", "Hora", "Fecha", "Numero de Control", "Numero del Documento", "Serie del Documento",
    "NRC receptor", "NIT receptor", "Nombre receptor", "NRC emisor", "NIT emisor", "Nombre emisor",
    "Nombre del Producto", "Total Gravado", "Total Exenta", "Total no Sujetas", "Desc. Gravado",
    "Desc. no Sujeta", "Desc. Exenta", "Total Desc.", "Sub-total", "Debito Fiscal",
    "Monto Total de la Operacion", "Percepciones", "IVA Retenido", "Total a Pagar",
    "Valor en Letras", "Condicion de la operacion", "Documento Relacionado", "fechaEmision"
  ],
  "COMPROBANTE DE RETENCION": [
    "Tipo DTE", "Hora", "Fecha", "Numero de Control", "Numero del Documento", "Serie del Documento",
    "NRC emisor", "NIT emisor", "Nombre emisor", "NRC receptor", "NIT receptor", "Nombre receptor",
    "Descripcion", "No. Doc Relacionado", "Fecha Doc Relacionado", "Monto Sujeto",
    "Retencion IVA", "Valor en letras", "Observaciones"
  ],
  "FEX EMISOR": [
    "Tipo DTE", "Hora", "Fecha", "Numero de Control", "Numero Documento", "Serie Documento",
    "Documento Receptor", "Nombre Receptor", "Nombre comercial Receptor", "Codigo pais", "Nombre pais",
    "Complemento Direccion", "Actividad economica Receptor", "NRC emisor", "NIT emisor", "Nombre Emisor",
    "No.,Descripcion", "Total Operac. Gravadas", "Descuento", "Total Desc.", "Monto Total Operacion",
    "Total a Pagar", "Total en Letras", "Condicion Operacion", "Observaciones"
  ],
  "FSE-EMISOR": [
    "Tipo DTE", "Hora", "Fecha", "Numero de Control", "Numero Documento", "Serie de Documento",
    "Doc ID Sujeto Excluido", "Nombre sujetoExcluido", "NRC emisor", "NIT emisor", "Nombre emisor",
    "Cant,Descrip,PU,compra", "Total Compra", "Total Desc.", "Subtotal Compra", "IVA Retenido",
    "Retencion Renta", "Total a Pagar", "Total en Letras", "Observaciones"
  ],
  "ESTRUCTURA TODOS": [
    "Tipo DTE", "Hora", "Fecha", "Numero de Control", "Numero del Documento", "Serie del Documento",
    "NRC receptor", "NIT receptor", "Nombre receptor", "NRC emisor", "NIT emisor", "Nombre emisor",
    "Descripcion", "Estado del DTE", "Descripcion del DTE", "Tipo de DTE", "Fecha y hora de generacion",
    "Codigo de Generacion", "Sello de Recepcion", "Numero de Control Consulta", "Documento ajustado",
    "Documento con Evento aplicado", "Documentos Relacionados"
  ]
};

const ivaBooks = {
  "LIBRO DE COMPRAS": [
    "No. CORR.", "FECHA DE EMISION", "NUMERO DE CONTROL", "CODIGO DE GENERACION", "SELLO DE RECEPCION",
    "N.R.C / NIT", "NOMBRE DEL PROVEEDOR", "COMPRAS EXENTAS INTERNAS", "COMPRAS EXENTAS IMPORTACIONES",
    "COMPRAS EXENTAS INTERNACIONES", "COMPRAS GRAVADAS INTERNAS", "COMPRAS GRAVADAS IMPORTACIONES",
    "COMPRAS GRAVADAS INTERNACIONES", "IVA", "TOTAL COMPRAS", "COMPRAS A SUJETOS EXCLUIDOS",
    "PERCEPCION 2% / 1% IVA", "RETENCION 1% IVA", "TIPO DE OPERACION", "CLASIFICACION", "SECTOR",
    "TIPO DE COSTO / GASTO"
  ],
  "LIBRO VENTAS CCF": [
    "No. CORR.", "FECHA DE EMISION", "NUMERO DE CONTROL", "CODIGO DE GENERACION", "SELLO DE RECEPCION",
    "N.R.C / NIT", "NOMBRE DEL CLIENTE", "NO SUJETAS", "EXENTAS", "VENTAS INTERNAS GRAVADAS VALOR NETO",
    "IVA DEBITO", "VENTA TOTAL", "RETENCION 1%", "TIPO DE OPERACION", "TIPO DE INGRESO"
  ],
  "LIBRO VENTAS FCF": [
    "ITEM", "FECHA EMISION", "NUMERO DE CONTROL", "CODIGO DE GENERACION", "SELLO DE RECEPCION",
    "VENTAS NO SUJETAS", "VENTAS EXENTAS", "VENTAS GRAVADAS LOCALES", "VENTAS GRAVADAS EXPORTAC.",
    "TOTAL", "TIPO DE OPERACION (Renta)", "TIPO DE INGRESO (Renta)"
  ]
};

const anexos = {
  "ANEXO VENTA CCF": [
    "FECHA DE EMISION DEL DOCUMENTO", "CLASE DE DOCUMENTO", "TIPO DE DOCUMENTO", "NUMERO DE RESOLUCION",
    "NUMERO DE SERIE DE DOCUMENTO", "NUMERO DE DOCUMENTO", "NUMERO DE CONTROL INTERNO",
    "NIT O NRC DEL CLIENTE", "NOMBRE, RAZON SOCIAL O DENOMINACION", "VENTAS EXENTAS",
    "VENTAS NO SUJETAS", "VENTAS GRAVADAS LOCALES", "DEBITO FISCAL",
    "VENTAS A CUENTA DE TERCEROS NO DOMICILIADOS", "DEBITO FISCAL POR VENTA A CUENTA DE TERCEROS",
    "TOTAL VENTAS", "DUI DEL CLIENTE", "TIPO DE OPERACION (Renta)", "TIPO DE INGRESO (Renta)",
    "NUMERO DE ANEXO"
  ],
  "ANEXO VENTA FCF": [
    "FECHA DE EMISION", "CLASE DE DOCUMENTO", "TIPO DE DOCUMENTO", "NUMERO DE RESOLUCION",
    "SERIE DE DOCUMENTO", "NUMERO DE CONTROL INTERNO (DEL)", "NUMERO DE CONTROL INTERNO (AL)",
    "NUMERO DE DOCUMENTO (DEL)", "NUMERO DE DOCUMENTO (AL)", "N DE MAQUINA REGISTRADORA",
    "VENTAS EXENTAS", "VENTAS INTERNAS EXENTAS NO SUJETAS A PROPORCIONALIDAD", "VENTAS NO SUJETAS",
    "VENTAS GRAVADAS LOCALES", "EXPORTACIONES DENTRO DEL AREA CENTROAMERICANA",
    "EXPORTACIONES FUERA DEL AREA CENTROAMERICANA", "EXPORTACIONES DE SERVICIOS",
    "VENTAS A ZONAS FRANCAS Y DPA (TASA CERO)", "VENTAS A CUENTA DE TERCEROS NO DOMICILIADOS",
    "TOTAL VENTAS", "TIPO DE OPERACION (Renta)", "TIPO DE INGRESO (Renta)", "NUMERO DE ANEXO"
  ],
  "ANEXO COMPRAS": [
    "FECHA DE EMISION", "CLASE DE DOCUMENTO", "TIPO DE DOCUMENTO", "NUMERO DE DOCUMENTO",
    "NIT O NRC DEL PROVEEDOR", "NOMBRE DEL PROVEEDOR", "COMPRAS INTERNAS EXENTAS Y/O NO SUJETAS",
    "INTERNACIONES EXENTAS Y/O NO SUJETAS", "IMPORTACIONES EXENTAS Y/O NO SUJETAS",
    "COMPRAS INTERNAS GRAVADAS", "INTERNACIONES GRAVADAS DE BIENES", "IMPORTACIONES GRAVADAS DE BIENES",
    "IMPORTACIONES GRAVADAS DE SERVICIOS", "CREDITO FISCAL", "TOTAL DE COMPRAS", "DUI DEL PROVEEDOR",
    "TIPO DE OPERACION", "CLASIFICACION", "SECTOR", "TIPO DE COSTO / GASTO", "NUMERO DE ANEXO"
  ],
  "ANEXO COMPRA SUJETO EXCLUIDO FSE": [
    "TIPO DE DOCUMENTO", "NUMERO DE NIT, DUI, U OTRO DOCUMENTO", "NOMBRE, RAZON SOCIAL O DENOMINACION",
    "FECHA DE EMISION DEL DOCUMENTO", "NUMERO DE SERIE DEL DOCUMENTO", "NUMERO DE DOCUMENTO",
    "MONTO DE LA OPERACION", "MONTO DE LA RETENCION IVA 13%", "TIPO DE OPERACION", "CLASIFICACION",
    "SECTOR", "TIPO DE COSTO / GASTO", "NUMERO DE ANEXO"
  ],
  "ANEXO ANTICIPO A CUENTA IVA 2%": [
    "NIT AGENTE", "FECHA DE EMISION DEL DOCUMENTO", "SERIE DE DOCUMENTO", "NUMERO DE DOCUMENTO",
    "MONTO SUJETO", "MONTO DEL ANTICIPO A CUENTA 2% DE IVA", "DUI AGENTE", "NUMERO DE ANEXO"
  ],
  "ANEXO RETENCION IVA 1%": [
    "NIT DEL AGENTE", "FECHA DE EMISION", "TIPO DE DOCUMENTO", "SERIE", "NUMERO DE DOCUMENTO",
    "MONTO SUJETO", "MONTO RETENCION 1%", "DUI DEL AGENTE", "NUMERO DE ANEXO"
  ],
  "ANEXO PERCEPCION IVA 1%": [
    "NIT AGENTE", "FECHA DE EMISION", "TIPO DE DOCUMENTO", "SERIE DE DOCUMENTO", "NUMERO DE DOCUMENTO",
    "MONTO SUJETO", "MONTO DE LA PERCEPCION", "DUI AGENTE", "NUMERO DE ANEXO"
  ]
};

function columnName(index) {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function buildMatrix(groups) {
  const entries = Object.entries(groups);
  const maxRows = Math.max(...entries.map(([, values]) => values.length));
  return Array.from({ length: maxRows + 1 }, (_, rowIndex) => (
    entries.map(([title, values]) => (rowIndex === 0 ? title : values[rowIndex - 1] || ""))
  ));
}

function writeVerticalSheet(workbook, sheetName, groups, titleFill) {
  const sheet = workbook.worksheets.add(sheetName);
  sheet.showGridLines = false;
  const matrix = buildMatrix(groups);
  const endColumn = columnName(matrix[0].length - 1);
  const usedRange = `A1:${endColumn}${matrix.length}`;
  sheet.getRange(usedRange).values = matrix;
  sheet.freezePanes.freezeRows(1);

  const all = sheet.getRange(usedRange);
  all.format = {
    font: { name: "Arial", size: 10, color: "#000000" },
    borders: { preset: "all", style: "thin", color: "#000000" },
    wrapText: false
  };

  const header = sheet.getRange(`A1:${endColumn}1`);
  header.format = {
    fill: titleFill,
    font: { bold: true, color: "#000000", size: 10 },
    borders: { preset: "all", style: "thin", color: "#000000" }
  };

  for (let index = 0; index < matrix[0].length; index += 1) {
    const col = columnName(index);
    sheet.getRange(`${col}:${col}`).format.columnWidthPx = 210;
  }

  sheet.getRange(`A1:${endColumn}1`).format.rowHeightPx = 28;
  return sheet;
}

await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
writeVerticalSheet(workbook, "Estructuras DTE", dteStructures, "#DDEBF7");
writeVerticalSheet(workbook, "Libros IVA", ivaBooks, "#E2F0D9");
writeVerticalSheet(workbook, "Anexos", anexos, "#FCE4D6");

const check = await workbook.inspect({
  kind: "table",
  sheetId: "Estructuras DTE",
  range: "A1:I8",
  include: "values",
  tableMaxRows: 8,
  tableMaxCols: 9
});
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "formula error scan"
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: "Estructuras DTE",
  range: "A1:I32",
  scale: 1,
  format: "png"
});
await fs.writeFile(`${outputDir}/preview-estructuras-dte.png`, new Uint8Array(await preview.arrayBuffer()));

const ivaPreview = await workbook.render({
  sheetName: "Libros IVA",
  range: "A1:C24",
  scale: 1,
  format: "png"
});
await fs.writeFile(`${outputDir}/preview-libros-iva.png`, new Uint8Array(await ivaPreview.arrayBuffer()));

const anexosPreview = await workbook.render({
  sheetName: "Anexos",
  range: "A1:G26",
  scale: 1,
  format: "png"
});
await fs.writeFile(`${outputDir}/preview-anexos.png`, new Uint8Array(await anexosPreview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/encabezados-libros-iva-anexos.xlsx`);
