export const DTE_TYPES = [
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

export const DEFAULT_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'] },
  { name: 'Numero del Documento', sections: ['identificacion'], fields: ['codigoGeneracion'] },
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
  { name: 'Condicion de la operacion', sections: ['resumen'], fields: ['condicionOperacion'], style: 'operationCondition' }
];

export const RETENTION_STRUCTURE = [
  { name: 'Tipo DTE', sections: ['identificacion'], fields: ['tipoDte'] },
  { name: 'Hora', sections: ['identificacion'], fields: ['horEmi'] },
  { name: 'Fecha', sections: ['identificacion'], fields: ['fecEmi'], style: 'date' },
  { name: 'Numero de Control', sections: ['identificacion'], fields: ['numeroControl'] },
  { name: 'Numero del Documento', sections: ['identificacion'], fields: ['codigoGeneracion'] },
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

export const STRUCTURES_BY_DTE = {
  '01': DEFAULT_STRUCTURE,
  '03': DEFAULT_STRUCTURE,
  '05': [
    ...DEFAULT_STRUCTURE,
    { name: 'Documento Relacionado', sections: ['documentoRelacionado'], fields: ['numeroDocumento', 'codigoGeneracion'] }
  ],
  '06': [
    ...DEFAULT_STRUCTURE,
    { name: 'Documento Relacionado', sections: ['documentoRelacionado'], fields: ['numeroDocumento', 'codigoGeneracion'] }
  ],
  '07': RETENTION_STRUCTURE,
  '11': [
    ...DEFAULT_STRUCTURE,
    { name: 'Pais destino', sections: ['receptor'], fields: ['nombrePais', 'pais'] },
    { name: 'Incoterms', sections: ['resumen'], fields: ['codIncoterms', 'descIncoterms'] }
  ],
  '14': [
    ...DEFAULT_STRUCTURE,
    { name: 'Sujeto Excluido', sections: ['sujetoExcluido'], fields: ['nombre'] },
    { name: 'Compra', sections: ['resumen'], fields: ['totalCompra'], style: 'money' }
  ],
  '15': [
    ...DEFAULT_STRUCTURE,
    { name: 'Donante', sections: ['donante', 'receptor'], fields: ['nombre'] },
    { name: 'Valor Donacion', sections: ['resumen'], fields: ['valorTotal', 'totalPagar'], style: 'money' }
  ]
};

export function getStructureForType(typeCode) {
  return STRUCTURES_BY_DTE[typeCode] || DEFAULT_STRUCTURE;
}
