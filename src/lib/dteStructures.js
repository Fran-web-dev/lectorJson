import { DTE_TYPES } from './dteTypes.js';
export { DTE_TYPES } from './dteTypes.js';
import { LOCAL_GENERATION_CODE_COLUMN } from './columnConstants.js';
import { DEFAULT_STRUCTURE_NAME } from './dteStructureOptions.js';

export { LOCAL_GENERATION_CODE_COLUMN } from './columnConstants.js';

const ITEM_TYPE_COLUMN = {
  name: 'Tipo de Item',
  sections: ['cuerpoDocumento'],
  fields: ['tipoItem'],
  perItem: true,
  byDteType: {
    '11': { sections: ['emisor'], fields: ['tipoItemExpor'], perItem: false }
  }
};

export const DEFAULT_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'] },
  { name: LOCAL_GENERATION_CODE_COLUMN, sections: ['identificacion'], fields: ['codigoGeneracion'] },
  { name: 'Serie del Documento', sections: ['selloRecibido', 'sello', 'selloRecepcion', 'SelloRecibido'], fields: ['*'] },
  { name: 'NRC emisor', sections: ['emisor'], fields: ['nrc'] },
  { name: 'NIT emisor', sections: ['emisor'], fields: ['nit'] },
  { name: 'Nombre emisor', sections: ['emisor'], fields: ['nombre'] },
  { name: 'NRC receptor', sections: ['receptor'], fields: ['nrc'] },
  { name: 'Nombre receptor', sections: ['receptor'], fields: ['nombre'] },
  { name: 'Cant,NP,PU,VTAGR', sections: ['cuerpoDocumento'], fields: ['cantidad', 'descripcion', 'precioUni', 'ventaGravada'], perItem: true },
  { name: 'Total Gravado', sections: ['resumen'], fields: ['totalGravada'], style: 'money' },
  { name: 'Total Exenta', sections: ['resumen'], fields: ['totalExenta'], style: 'money' },
  { name: 'Total no Sujetas', sections: ['resumen'], fields: ['totalNoSuj'], style: 'money' },
  { name: 'Desc. Gravado', sections: ['resumen'], fields: ['descuGravada'], style: 'money' },
  { name: 'Desc. no Sujeta', sections: ['resumen'], fields: ['descuNoSuj'], style: 'money' },
  { name: 'Desc. Exenta', sections: ['resumen'], fields: ['descuExenta'], style: 'money' },
  { name: 'Total Desc.', sections: ['resumen'], fields: ['totalDescu'], style: 'money' },
  { name: 'Sub-total', sections: ['resumen'], fields: ['subTotal'], style: 'money' },
  { name: 'Credito Fiscal', sections: ['resumen'], fields: ['tributos'], filter: { key: 'codigo', value: '20', field: 'valor' }, style: 'money' },
  { name: 'Monto total de la operacion', sections: ['resumen'], fields: ['montoTotalOperacion'], style: 'money' },
  { name: 'FOVIAL', sections: ['resumen'], fields: ['tributos'], filter: { key: 'codigo', value: 'D1', field: 'valor' }, style: 'money' },
  { name: 'COTRANS', sections: ['resumen'], fields: ['tributos'], filter: { key: 'codigo', value: 'C8', field: 'valor' }, style: 'money' },
  { name: 'Percepciones', sections: ['resumen'], fields: ['ivaPerci', 'ivaPerci1'], style: 'money' },
  { name: 'Retencion Renta', sections: ['resumen'], fields: ['reteRenta'], style: 'money' },
  { name: 'Total de Compra', sections: ['resumen'], fields: ['totalPagar'], style: 'money' },
  { name: 'Valor en Letras', sections: ['resumen'], fields: ['totalLetras'] },
  { name: 'Condicion de la operacion', sections: ['resumen'], fields: ['condicionOperacion'], style: 'operationCondition' },
  ITEM_TYPE_COLUMN
];

export const CCF_RECEPTOR_COMPRA_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'], style: 'stripHyphen' },
  { name: LOCAL_GENERATION_CODE_COLUMN, sections: ['identificacion'], fields: ['codigoGeneracion'], style: 'stripHyphen' },
  { name: 'Serie del Documento', sections: ['selloRecibido', 'sello', 'selloRecepcion', 'SelloRecibido'], fields: ['*'] },
  { name: 'NRC emisor', sections: ['emisor'], fields: ['nrc'] },
  { name: 'NIT emisor', sections: ['emisor'], fields: ['nit'] },
  { name: 'Nombre emisor', sections: ['emisor'], fields: ['nombre'] },
  { name: 'NRC receptor', sections: ['receptor'], fields: ['nrc'] },
  { name: 'NIT receptor', sections: ['receptor'], fields: ['nit'] },
  { name: 'Nombre receptor', sections: ['receptor'], fields: ['nombre'] },
  { name: 'Cant,NP,PU', sections: ['cuerpoDocumento'], fields: ['cantidad', 'descripcion', 'precioUni'], perItem: true },
  { name: 'Total Gravado', sections: ['resumen'], fields: ['totalGravada'], style: 'money' },
  { name: 'Total Exenta', sections: ['resumen'], fields: ['totalExenta'], style: 'money' },
  { name: 'Total no Sujetas', sections: ['resumen'], fields: ['totalNoSuj'], style: 'money' },
  { name: 'Desc. Gravado', sections: ['resumen'], fields: ['descuGravada'], style: 'money' },
  { name: 'Desc. no Sujeta', sections: ['resumen'], fields: ['descuNoSuj'], style: 'money' },
  { name: 'Desc. Exenta', sections: ['resumen'], fields: ['descuExenta'], style: 'money' },
  { name: 'Total Desc.', sections: ['resumen'], fields: ['totalDescu'], style: 'money' },
  { name: 'Sub-total', sections: ['resumen'], fields: ['subTotal'], style: 'money' },
  { name: 'Credito Fiscal', sections: ['resumen'], fields: ['tributos'], filter: { key: 'codigo', value: '20', field: 'valor' }, style: 'money' },
  { name: 'Monto total de la operacion', sections: ['resumen'], fields: ['montoTotalOperacion'], style: 'money' },
  { name: 'FOVIAL', sections: ['resumen'], fields: ['tributos'], filter: { key: 'codigo', value: 'D1', field: 'valor' }, style: 'money' },
  { name: 'COTRANS', sections: ['resumen'], fields: ['tributos'], filter: { key: 'codigo', value: 'C8', field: 'valor' }, style: 'money' },
  { name: 'Percepciones', sections: ['resumen'], fields: ['ivaPerci1', 'ivaPerci'], style: 'money' },
  { name: 'Retenciones', sections: ['resumen'], fields: ['ivaRete1', 'ivaRete'], style: 'money' },
  { name: 'Total de Compra', sections: ['resumen'], fields: ['totalPagar'], style: 'money' },
  { name: 'Valor en Letras', sections: ['resumen'], fields: ['totalLetras'] },
  { name: 'Condicion de la operacion', sections: ['resumen'], fields: ['condicionOperacion'], style: 'operationCondition' },
  ITEM_TYPE_COLUMN
];

export const CCF_EMISOR_VENTA_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'], style: 'stripHyphen' },
  { name: LOCAL_GENERATION_CODE_COLUMN, sections: ['identificacion'], fields: ['codigoGeneracion'], style: 'stripHyphen' },
  { name: 'Serie del Documento', sections: ['selloRecibido', 'sello', 'selloRecepcion', 'SelloRecibido'], fields: ['*'], style: 'stripHyphen' },
  { name: 'NRC receptor', sections: ['receptor'], fields: ['nrc'] },
  { name: 'NIT receptor', sections: ['receptor'], fields: ['nit'] },
  { name: 'Nombre receptor', sections: ['receptor'], fields: ['nombre'] },
  { name: 'NRC emisor', sections: ['emisor'], fields: ['nrc'] },
  { name: 'NIT emisor', sections: ['emisor'], fields: ['nit'] },
  { name: 'Nombre emisor', sections: ['emisor'], fields: ['nombre'] },
  { name: 'DESCR,CANT,PU,VTAGR', sections: ['cuerpoDocumento'], fields: ['descripcion', 'cantidad', 'precioUni', 'ventaGravada'], perItem: true },
  { name: 'Total Gravado', sections: ['resumen'], fields: ['totalGravada'], style: 'money' },
  { name: 'Total Exenta', sections: ['resumen'], fields: ['totalExenta'], style: 'money' },
  { name: 'Total no Sujetas', sections: ['resumen'], fields: ['totalNoSuj'], style: 'money' },
  { name: 'Desc. Gravado', sections: ['resumen'], fields: ['descuGravada'], style: 'money' },
  { name: 'Desc. no Sujeta', sections: ['resumen'], fields: ['descuNoSuj'], style: 'money' },
  { name: 'Desc. Exenta', sections: ['resumen'], fields: ['descuExenta'], style: 'money' },
  { name: 'Total Desc.', sections: ['resumen'], fields: ['totalDescu'], style: 'money' },
  { name: 'Sub-total', sections: ['resumen'], fields: ['subTotalVentas'], style: 'money' },
  { name: 'Credito Fiscal', sections: ['resumen'], fields: ['tributos'], filter: { key: 'codigo', value: '20', field: 'valor' }, style: 'money' },
  { name: 'Monto Total de la Operacion', sections: ['resumen'], fields: ['montoTotalOperacion'], style: 'money' },
  { name: 'IVA Percibido', sections: ['resumen'], fields: ['ivaPerci1'], style: 'money' },
  { name: 'IVA Retenido', sections: ['resumen'], fields: ['ivaRete1'], style: 'money' },
  { name: 'Total a Pagar', sections: ['resumen'], fields: ['totalPagar'], style: 'money' },
  { name: 'Valor en Letras', sections: ['resumen'], fields: ['totalLetras'] },
  { name: 'Condicion de la operacion', sections: ['resumen'], fields: ['condicionOperacion'], style: 'operationCondition' },
  ITEM_TYPE_COLUMN,
  { name: 'Observacion', sections: ['observaciones'], fields: ['*'] }
];

export const CONSUMIDOR_FINAL_EMISOR_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'], style: 'stripHyphen' },
  { name: 'Numero del Documento', sections: ['identificacion'], fields: ['codigoGeneracion'], style: 'stripHyphen' },
  { name: 'Serie del Documento', sections: ['selloRecibido', 'sello', 'selloRecepcion', 'SelloRecibido'], fields: ['*'] },
  { name: 'NRC receptor', sections: ['receptor'], fields: ['nrc'] },
  { name: 'NIT receptor', sections: ['receptor'], fields: ['numDocumento'] },
  { name: 'Nombre receptor', sections: ['receptor'], fields: ['nombre'] },
  { name: 'NRC emisor', sections: ['emisor'], fields: ['nrc'] },
  { name: 'NIT emisor', sections: ['emisor'], fields: ['nit'] },
  { name: 'Nombre emisor', sections: ['emisor'], fields: ['nombre'] },
  { name: 'DESCR,CANT,PU,VTA', sections: ['cuerpoDocumento'], fields: ['descripcion', 'cantidad', 'precioUni', 'ventaGravada'], perItem: true },
  { name: 'Total Gravado', sections: ['resumen'], fields: ['totalGravada'], style: 'money' },
  { name: 'Total Exenta', sections: ['resumen'], fields: ['totalExenta'], style: 'money' },
  { name: 'Total no Sujetas', sections: ['resumen'], fields: ['totalNoSuj'], style: 'money' },
  { name: 'Desc. Gravado', sections: ['resumen'], fields: ['descuGravada'], style: 'money' },
  { name: 'Desc. no Sujeta', sections: ['resumen'], fields: ['descuNoSuj'], style: 'money' },
  { name: 'Desc. Exenta', sections: ['resumen'], fields: ['descuExenta'], style: 'money' },
  { name: 'Total Desc.', sections: ['resumen'], fields: ['totalDescu'], style: 'money' },
  { name: 'Sub-total', sections: ['resumen'], fields: ['subTotalVentas'], style: 'money' },
  { name: 'Monto sin IVA (Calcular)', sections: ['resumen'], fields: ['montoTotalOperacion'], calculate: 'divide', by: 1.13, style: 'money' },
  { name: 'Debito Fiscal', sections: ['resumen'], fields: ['totalIva'], style: 'money' },
  { name: 'Monto Total de la Operacion', sections: ['resumen'], fields: ['montoTotalOperacion'], style: 'money' },
  { name: 'IVA Retenido', sections: ['resumen'], fields: ['ivaRete'], style: 'money' },
  { name: 'Total a Pagar', sections: ['resumen'], fields: ['totalPagar'], style: 'money' },
  { name: 'Valor en Letras', sections: ['resumen'], fields: ['totalLetras'] },
  { name: 'Condicion de la operacion', sections: ['resumen'], fields: ['condicionOperacion'], style: 'operationCondition' },
  ITEM_TYPE_COLUMN
];

export const NOTA_CREDITO_EMISOR_VENTA_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'], style: 'stripHyphen' },
  { name: 'Numero del Documento', sections: ['identificacion'], fields: ['codigoGeneracion'], style: 'stripHyphen' },
  { name: 'Serie del Documento', sections: ['selloRecibido', 'sello', 'selloRecepcion', 'SelloRecibido'], fields: ['*'] },
  { name: 'NRC receptor', sections: ['receptor'], fields: ['nrc'] },
  { name: 'NIT receptor', sections: ['receptor'], fields: ['nit'] },
  { name: 'Nombre receptor', sections: ['receptor'], fields: ['nombre'] },
  { name: 'NRC emisor', sections: ['emisor'], fields: ['nrc'] },
  { name: 'NIT emisor', sections: ['emisor'], fields: ['nit'] },
  { name: 'Nombre emisor', sections: ['emisor'], fields: ['nombre'] },
  { name: 'Nombre del Producto', sections: ['cuerpoDocumento'], fields: ['descripcion'], perItem: true },
  { name: 'Total Gravado', sections: ['resumen'], fields: ['totalGravada'], style: 'money' },
  { name: 'Total Exenta', sections: ['resumen'], fields: ['totalExenta'], style: 'money' },
  { name: 'Total no Sujetas', sections: ['resumen'], fields: ['totalNoSuj'], style: 'money' },
  { name: 'Desc. Gravado', sections: ['resumen'], fields: ['descuGravada'], style: 'money' },
  { name: 'Desc. no Sujeta', sections: ['resumen'], fields: ['descuNoSuj'], style: 'money' },
  { name: 'Desc. Exenta', sections: ['resumen'], fields: ['descuExenta'], style: 'money' },
  { name: 'Total Desc.', sections: ['resumen'], fields: ['totalDescu'], style: 'money' },
  { name: 'Sub-total', sections: ['resumen'], fields: ['subTotalVentas'], style: 'money' },
  { name: 'Debito Fiscal', sections: ['resumen'], fields: ['tributos'], filter: { key: 'codigo', value: '20', field: 'valor' }, style: 'money' },
  { name: 'Monto Total de la Operacion', sections: ['resumen'], fields: ['montoTotalOperacion'], style: 'money' },
  { name: 'Percepciones', sections: ['resumen'], fields: ['ivaPerci1'], style: 'money' },
  { name: 'IVA Retenido', sections: ['resumen'], fields: ['ivaRete1'], style: 'money' },
  { name: 'Total a Pagar', sections: ['resumen'], fields: ['totalPagar'], style: 'money' },
  { name: 'Valor en Letras', sections: ['resumen'], fields: ['totalLetras'] },
  { name: 'Condicion de la operacion', sections: ['resumen'], fields: ['condicionOperacion'], style: 'operationCondition' },
  ITEM_TYPE_COLUMN,
  { name: 'Documento Relacionado', sections: ['numeroDocumento'], fields: ['*'] },
  { name: 'fechaEmision', sections: ['fechaEmision'], fields: ['*'], style: 'date' }
];

export const NOTA_CREDITO_RECEPTOR_COMPRA_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'], style: 'stripHyphen' },
  { name: 'Numero del Documento', sections: ['identificacion'], fields: ['codigoGeneracion'], style: 'stripHyphen' },
  { name: 'Serie del Documento', sections: ['selloRecibido', 'sello', 'selloRecepcion', 'SelloRecibido'], fields: ['*'] },
  { name: 'NRC emisor', sections: ['emisor'], fields: ['nrc'] },
  { name: 'NIT emisor', sections: ['emisor'], fields: ['nit'] },
  { name: 'Nombre emisor', sections: ['emisor'], fields: ['nombre'] },
  { name: 'NRC receptor', sections: ['receptor'], fields: ['nrc'] },
  { name: 'NIT receptor', sections: ['receptor'], fields: ['nit'] },
  { name: 'Nombre receptor', sections: ['receptor'], fields: ['nombre'] },
  { name: 'Cant,NP,PU', sections: ['cuerpoDocumento'], fields: ['cantidad', 'descripcion', 'ventaGravada'], perItem: true },
  { name: 'Total Gravado', sections: ['resumen'], fields: ['totalGravada'], style: 'money' },
  { name: 'Total Exenta', sections: ['resumen'], fields: ['totalExenta'], style: 'money' },
  { name: 'Total no Sujetas', sections: ['resumen'], fields: ['totalNoSuj'], style: 'money' },
  { name: 'Desc. Gravado', sections: ['resumen'], fields: ['descuGravada'], style: 'money' },
  { name: 'Desc. no Sujeta', sections: ['resumen'], fields: ['descuNoSuj'], style: 'money' },
  { name: 'Desc. Exenta', sections: ['resumen'], fields: ['descuExenta'], style: 'money' },
  { name: 'Total Desc.', sections: ['resumen'], fields: ['totalDescu'], style: 'money' },
  { name: 'Sub-total', sections: ['resumen'], fields: ['subTotal'], style: 'money' },
  { name: 'Credito Fiscal', sections: ['resumen'], fields: ['tributos'], filter: { key: 'codigo', value: '20', field: 'valor' }, style: 'money' },
  { name: 'Monto total de la operacion', sections: ['resumen'], fields: ['montoTotalOperacion'], style: 'money' },
  { name: 'FOVIAL', sections: ['resumen'], fields: ['tributos'], filter: { key: 'codigo', value: 'D1', field: 'valor' }, style: 'money' },
  { name: 'COTRANS', sections: ['resumen'], fields: ['tributos'], filter: { key: 'codigo', value: 'C8', field: 'valor' }, style: 'money' },
  { name: 'Percepciones', sections: ['resumen'], fields: ['ivaPerci1'], style: 'money' },
  { name: 'IVA Retenido', sections: ['resumen'], fields: ['ivaRete1'], style: 'money' },
  { name: 'Total de Compra', sections: ['resumen'], fields: ['totalPagar'], style: 'money' },
  { name: 'Valor en Letras', sections: ['resumen'], fields: ['totalLetras'] },
  { name: 'Condicion de la operacion', sections: ['resumen'], fields: ['condicionOperacion'], style: 'operationCondition' },
  ITEM_TYPE_COLUMN,
  { name: 'Documento Relacionado', sections: ['numeroDocumento'], fields: ['*'] },
  { name: 'fechaEmision', sections: ['fechaEmision'], fields: ['*'], style: 'date' }
];

export const RETENTION_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'] },
  { name: LOCAL_GENERATION_CODE_COLUMN, sections: ['identificacion'], fields: ['codigoGeneracion'] },
  { name: 'Serie del Documento', sections: ['selloRecibido', 'sello', 'selloRecepcion', 'SelloRecibido'], fields: ['*'] },
  { name: 'NRC emisor', sections: ['emisor'], fields: ['nrc'] },
  { name: 'NIT emisor', sections: ['emisor'], fields: ['nit'] },
  { name: 'Nombre emisor', sections: ['emisor'], fields: ['nombre'] },
  { name: 'NRC receptor', sections: ['receptor'], fields: ['nrc'] },
  { name: 'NIT receptor', sections: ['receptor'], fields: ['nit', 'numDocumento'] },
  { name: 'Nombre receptor', sections: ['receptor'], fields: ['nombre'] },
  { name: 'Tipo DTE relacionado', sections: ['cuerpoDocumento'], fields: ['tipoDte'], perItem: true },
  { name: 'Numero documento relacionado', sections: ['cuerpoDocumento'], fields: ['numDocumento'], perItem: true },
  { name: 'Fecha documento relacionado', sections: ['cuerpoDocumento'], fields: ['fechaEmision'], perItem: true, style: 'date' },
  { name: 'Descripcion', sections: ['cuerpoDocumento'], fields: ['descripcion'], perItem: true },
  { name: 'Monto sujeto retencion', sections: ['cuerpoDocumento'], fields: ['montoSujetoGrav'], perItem: true, style: 'money' },
  { name: 'Codigo retencion', sections: ['cuerpoDocumento'], fields: ['codigoRetencionMH'], perItem: true },
  { name: 'IVA retenido', sections: ['cuerpoDocumento'], fields: ['ivaRetenido'], perItem: true, style: 'money' },
  { name: 'Total sujeto retencion', sections: ['resumen'], fields: ['totalSujetoRetencion'], style: 'money' },
  { name: 'Total IVA retenido', sections: ['resumen'], fields: ['totalIVAretenido'], style: 'money' },
  { name: 'Valor en Letras', sections: ['resumen'], fields: ['totalIVAretenidoLetras'] }
];

export const RETENTION_RECEPTOR_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'], style: 'stripHyphen' },
  { name: 'Numero del Documento', sections: ['identificacion'], fields: ['codigoGeneracion'], style: 'stripHyphen' },
  { name: 'Serie del Documento', sections: ['selloRecibido', 'sello', 'selloRecepcion', 'SelloRecibido'], fields: ['*'] },
  { name: 'NRC emisor', sections: ['emisor'], fields: ['nrc'] },
  { name: 'NIT emisor', sections: ['emisor'], fields: ['nit'] },
  { name: 'Nombre emisor', sections: ['emisor'], fields: ['nombre'] },
  { name: 'NRC receptor', sections: ['receptor'], fields: ['nrc'] },
  { name: 'NIT receptor', sections: ['receptor'], fields: ['nit'] },
  { name: 'Nombre receptor', sections: ['receptor'], fields: ['nombre'] },
  { name: 'Descripcion', sections: ['cuerpoDocumento'], fields: ['descripcion'], perItem: true },
  { name: 'No. Doc Relacionado', sections: ['cuerpoDocumento'], fields: ['numDocumento'], perItem: true },
  { name: 'Fecha Doc Relacionado', sections: ['cuerpoDocumento'], fields: ['fechaEmision'], perItem: true, style: 'date' },
  { name: 'Monto Sujeto', sections: ['resumen'], fields: ['totalSujetoRetencion'], style: 'money' },
  { name: 'Retencion IVA', sections: ['resumen'], fields: ['totalIVAretenido'], style: 'money' },
  { name: 'Valor en letras', sections: ['resumen'], fields: ['totalIVAretenidoLetras'] },
  { name: 'Observaciones', sections: ['observaciones'], fields: ['*'] }
];

export const DCL_RECEPTOR_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de control', sections: ['identificacion'], fields: ['numeroControl'], style: 'stripHyphen' },
  { name: 'Numero de documento', sections: ['identificacion'], fields: ['codigoGeneracion'], style: 'stripHyphen' },
  { name: 'Serie de Documento', sections: ['selloRecibido', 'selloRecepcion', 'sello'], fields: ['*'] },
  { name: 'NRC Emisor', sections: ['emisor'], fields: ['nrc'] },
  { name: 'NIT Emisor', sections: ['emisor'], fields: ['nit'] },
  { name: 'Nombre emisor', sections: ['emisor'], fields: ['nombre'] },
  { name: 'NRC Receptor', sections: ['receptor'], fields: ['nrc'] },
  { name: 'NIT Receptor', sections: ['receptor'], fields: ['nit'] },
  { name: 'Nombre receptor', sections: ['receptor'], fields: ['nombre'] },
  { name: 'Periodo Liq Inicio', sections: ['cuerpoDocumento'], fields: ['periodoLiquidacionFechaInicio'], perItem: true, style: 'date' },
  { name: 'Periodo Liq Fin', sections: ['cuerpoDocumento'], fields: ['periodoLiquidacionFechaFin'], perItem: true, style: 'date' },
  { name: 'Valor operaciones', sections: ['cuerpoDocumento'], fields: ['valorOperaciones'], perItem: true, style: 'money' },
  { name: 'Sub total', sections: ['cuerpoDocumento'], fields: ['subTotal'], perItem: true, style: 'money' },
  { name: 'IVA', sections: ['cuerpoDocumento'], fields: ['iva'], perItem: true, style: 'money' },
  { name: 'Monto Sujeto Percepcion', sections: ['cuerpoDocumento'], fields: ['montoSujetoPercepcion'], perItem: true, style: 'money' },
  { name: 'IVA percibido 2%', sections: ['cuerpoDocumento'], fields: ['ivaPercibido'], perItem: true, style: 'money' },
  { name: 'Comision', sections: ['cuerpoDocumento'], fields: ['comision'], perItem: true, style: 'money' },
  { name: '% comision', sections: ['cuerpoDocumento'], fields: ['porcentComision'], perItem: true },
  { name: 'IVA Comision', sections: ['cuerpoDocumento'], fields: ['ivaComision'], perItem: true, style: 'money' },
  { name: 'Liq. A Pagar', sections: ['cuerpoDocumento'], fields: ['liquidoApagar'], perItem: true, style: 'money' },
  { name: 'Cantidad en letras', sections: ['cuerpoDocumento'], fields: ['totalLetras'], perItem: true },
  { name: 'Codigo liquidacion', sections: ['cuerpoDocumento'], fields: ['codLiquidacion'], perItem: true },
  { name: 'Cantidad Documentos', sections: ['cuerpoDocumento'], fields: ['cantidadDoc'], perItem: true },
  { name: 'Observaciones', sections: ['cuerpoDocumento'], fields: ['observaciones'], perItem: true }
];

export const FEX_EMISOR_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'], style: 'stripHyphen' },
  { name: 'Numero Documento', sections: ['identificacion'], fields: ['codigoGeneracion'], style: 'stripHyphen' },
  { name: 'Serie Documento', sections: ['sello', 'selloRecepcion', 'selloRecibido', 'SelloRecibido'], fields: ['*'] },
  { name: 'Documento Receptor', sections: ['receptor'], fields: ['numDocumento'] },
  { name: 'Nombre Receptor', sections: ['receptor'], fields: ['nombre'] },
  { name: 'Nombre comercial Receptor', sections: ['receptor'], fields: ['nombreComercial'] },
  { name: 'Codigo pais', sections: ['receptor'], fields: ['codPais'] },
  { name: 'Nombre pais', sections: ['receptor'], fields: ['nombrePais'] },
  { name: 'Complemento Direccion', sections: ['receptor'], fields: ['complemento'] },
  { name: 'Actividad economica Receptor', sections: ['receptor'], fields: ['descActividad'] },
  { name: 'NRC emisor', sections: ['emisor'], fields: ['nrc'] },
  { name: 'NIT emisor', sections: ['emisor'], fields: ['nit'] },
  { name: 'Nombre Emisor', sections: ['emisor'], fields: ['nombre'] },
  { name: 'No.,Descripcion', sections: ['cuerpoDocumento'], fields: ['numItem', 'descripcion'], perItem: true },
  { name: 'Total Operac. Gravadas', sections: ['resumen'], fields: ['totalGravada'], style: 'money' },
  { name: 'Descuento', sections: ['resumen'], fields: ['descuento'], style: 'money' },
  { name: 'Total Desc.', sections: ['resumen'], fields: ['totalDescu'], style: 'money' },
  { name: 'Monto Total Operación', sections: ['resumen'], fields: ['montoTotalOperacion'], style: 'money' },
  { name: 'Total a Pagar', sections: ['resumen'], fields: ['totalPagar'], style: 'money' },
  { name: 'Total en Letras', sections: ['resumen'], fields: ['totalLetras'] },
  { name: 'Condición Operación', sections: ['resumen'], fields: ['condicionOperacion'], style: 'operationCondition' },
  ITEM_TYPE_COLUMN,
  { name: 'Observaciones', sections: ['resumen'], fields: ['observaciones'] }
];

export const FSE_EMISOR_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'], style: 'stripHyphen' },
  { name: 'Numero Documento', sections: ['identificacion'], fields: ['codigoGeneracion'], style: 'stripHyphen' },
  { name: 'Serie de Documento', sections: ['selloRecibido', 'selloRecepcion'], fields: ['*'] },
  { name: 'Doc ID Sujeto Excluido', sections: ['receptor'], fields: ['numDocumento'] },
  { name: 'Nombre sujetoExcluido', sections: ['receptor'], fields: ['nombre'] },
  { name: 'NRC emisor', sections: ['emisor'], fields: ['nrc'] },
  { name: 'NIT emisor', sections: ['emisor'], fields: ['nit'] },
  { name: 'Nombre emisor', sections: ['emisor'], fields: ['nombre'] },
  { name: 'Cant,Descrip,PU,compra', sections: ['cuerpoDocumento'], fields: ['cantidad', 'descripcion', 'precioUni', 'compra'], perItem: true },
  { name: 'Total Compra', sections: ['resumen'], fields: ['totalCompra'], style: 'money' },
  { name: 'Total Desc.', sections: ['resumen'], fields: ['totalDescu'], style: 'money' },
  { name: 'Subtotal Compra', sections: ['resumen'], fields: ['subTotal'], style: 'money' },
  { name: 'IVA Retenido', sections: ['resumen'], fields: ['ivaRete1'], style: 'money' },
  { name: 'Retencion Renta', sections: ['resumen'], fields: ['reteRenta'], style: 'money' },
  { name: 'Total a Pagar', sections: ['resumen'], fields: ['totalPagar'], style: 'money' },
  { name: 'Total en Letras', sections: ['resumen'], fields: ['totalLetras'] },
  { name: 'Observaciones', sections: ['resumen'], fields: ['observaciones'] }
];

export const PUBLIC_QUERY_COLUMNS = [
  { name: 'Estado del DTE', source: 'publicQuery', sections: ['estadoDoc'], fields: ['*'] },
  { name: 'Descripcion del DTE', source: 'publicQuery', sections: ['descripcionEstado'], fields: ['*'] },
  { name: 'Tipo de DTE', source: 'publicQuery', sections: ['tipoDte'], fields: ['*'] },
  { name: 'Fecha y hora de generacion', source: 'publicQuery', sections: ['fechaProcesado'], fields: ['*'] },
  { name: 'Codigo de Generacion', source: 'publicQuery', sections: ['codGen'], fields: ['*'] },
  { name: 'Sello de Recepcion', source: 'publicQuery', sections: ['selloVal'], fields: ['*'] },
  { name: 'Numero de Control Consulta', source: 'publicQuery', sections: ['identificacion'], fields: ['numeroControl'] },
  {
    name: 'Documento ajustado',
    source: 'publicQuery',
    sections: ['ajustes', 'documentoAjustado', 'docAjustado'],
    fields: ['*'],
    style: 'adjustedDocument',
    searchKeys: ['documentoAjustado', 'docAjustado', 'ajustado', 'ajustes']
  },
  {
    name: 'Documento con Evento aplicado',
    source: 'publicQuery',
    sections: ['otroEvento', 'evento', 'eventos', 'eventoAplicado', 'documentoEvento'],
    fields: ['*'],
    style: 'eventApplied',
    searchKeys: ['eventoAplicado', 'documentoEvento', 'eventos', 'evento']
  },
  {
    name: 'Documentos Relacionados',
    source: 'publicQuery',
    sections: ['documentoRelacionado'],
    fields: ['*'],
    searchKeys: ['documentoRelacionado', 'documentosRelacionados', 'relacionados']
  }
];

export const STRUCTURES_BY_DTE = {
  '01': CONSUMIDOR_FINAL_EMISOR_STRUCTURE,
  '03': CCF_RECEPTOR_COMPRA_STRUCTURE,
  '05': NOTA_CREDITO_RECEPTOR_COMPRA_STRUCTURE,
  '06': [
    ...DEFAULT_STRUCTURE,
    { name: 'Documento Relacionado', sections: ['documentoRelacionado'], fields: ['numeroDocumento', 'codigoGeneracion'] }
  ],
  '07': RETENTION_RECEPTOR_STRUCTURE,
  '09': DCL_RECEPTOR_STRUCTURE,
  '11': FEX_EMISOR_STRUCTURE,
  '14': FSE_EMISOR_STRUCTURE,
  '15': [
    ...DEFAULT_STRUCTURE,
    { name: 'Donante', sections: ['donante', 'receptor'], fields: ['nombre'] },
    { name: 'Valor Donacion', sections: ['resumen'], fields: ['valorTotal', 'totalPagar'], style: 'money' }
  ]
};

export const NAMED_STRUCTURES_BY_DTE = {
  '01': {
    'FCF EMISOR': CONSUMIDOR_FINAL_EMISOR_STRUCTURE
  },
  '03': {
    'CCF RECEPTOR COMPRA': CCF_RECEPTOR_COMPRA_STRUCTURE,
    'CCF EMISOR VENTA': CCF_EMISOR_VENTA_STRUCTURE
  },
  '05': {
    'NOTA DE CREDITO EMISOR VENTA': NOTA_CREDITO_EMISOR_VENTA_STRUCTURE,
    'NOTA DE CREDITO RECEPTOR COMPRA': NOTA_CREDITO_RECEPTOR_COMPRA_STRUCTURE
  },
  '07': {
    'COMPROBANTE DE RETENCION RECEPTOR': RETENTION_RECEPTOR_STRUCTURE
  },
  '09': {
    'DCL RECEPTOR': DCL_RECEPTOR_STRUCTURE
  },
  '11': {
    'FEX EMISOR': FEX_EMISOR_STRUCTURE
  },
  '14': {
    'FSE EMISOR': FSE_EMISOR_STRUCTURE
  }
};

export const ALL_DTE_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'] },
  { name: 'Numero del Documento', sections: ['identificacion'], fields: ['codigoGeneracion'] },
  { name: 'Serie del Documento', sections: ['selloRecibido', 'sello', 'selloRecepcion', 'SelloRecibido'], fields: ['*'] },
  { name: 'NRC receptor', sections: ['receptor'], fields: ['nrc'] },
  { name: 'NIT receptor', sections: ['receptor'], fields: ['nit', 'numDocumento'] },
  { name: 'Nombre receptor', sections: ['receptor'], fields: ['nombre'] },
  { name: 'NRC emisor', sections: ['emisor'], fields: ['nrc'] },
  { name: 'NIT emisor', sections: ['emisor'], fields: ['nit'] },
  { name: 'Nombre emisor', sections: ['emisor'], fields: ['nombre'] },
  { name: 'Descripcion', sections: ['cuerpoDocumento'], fields: ['descripcion'], perItem: true },
  ITEM_TYPE_COLUMN
];

export const MONEY_COLUMN_NAMES = new Set(Object.values(NAMED_STRUCTURES_BY_DTE)
  .flatMap((structuresByName) => Object.values(structuresByName))
  .flatMap((structure) => structure.filter((rule) => rule?.style === 'money').map((rule) => rule.name)));

export function getStructureForType(typeCode, structureName = DEFAULT_STRUCTURE_NAME) {
  if (structureName === 'TODOS') return [...ALL_DTE_STRUCTURE, ...PUBLIC_QUERY_COLUMNS];

  const namedStructure = NAMED_STRUCTURES_BY_DTE[typeCode]?.[structureName];
  const defaultStructure = STRUCTURES_BY_DTE[typeCode] || [];
  const selectedStructure = namedStructure || defaultStructure;
  return selectedStructure.length ? [...selectedStructure, ...PUBLIC_QUERY_COLUMNS] : [];
}
