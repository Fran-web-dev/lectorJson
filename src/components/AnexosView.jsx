import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const ANEXOS = {
  salesCcf: {
    title: 'ANEXO VENTA CCF',
    columns: [
      ['FECHA DE EMISION DEL DOCUMENTO', '10'],
      ['CLASE DE DOCUMENTO', '1'],
      ['TIPO DE DOCUMENTO', '2'],
      ['NUMERO DE RESOLUCION', '100'],
      ['NUMERO DE SERIE DE DOCUMENTO', '100'],
      ['NUMERO DE DOCUMENTO', '100'],
      ['NUMERO DE CONTROL INTERNO', '100'],
      ['NIT O NRC DEL CLIENTE', '14'],
      ['NOMBRE, RAZON SOCIAL O DENOMINACION', 'SIN LIMITE'],
      ['VENTAS EXENTAS', '10'],
      ['VENTAS NO SUJETAS', '10'],
      ['VENTAS GRAVADAS LOCALES', '10'],
      ['DEBITO FISCAL', '10'],
      ['VENTAS A CUENTA DE TERCEROS NO DOMICILIADOS', '10'],
      ['DEBITO FISCAL POR VENTA A CUENTA DE TERCEROS', '10'],
      ['TOTAL VENTAS', '10'],
      ['DUI DEL CLIENTE', '9'],
      ['TIPO DE OPERACION (Renta)', '10'],
      ['TIPO DE INGRESO (Renta)', '10'],
      ['NUMERO DE ANEXO', '1']
    ]
  },
  salesFcf: {
    title: 'ANEXO VENTA FCF',
    columns: [
      ['FECHA DE EMISION', '10'],
      ['CLASE DE DOCUMENTO', '1'],
      ['TIPO DE DOCUMENTO', '2'],
      ['NUMERO DE RESOLUCION', '100'],
      ['SERIE DE DOCUMENTO', '100'],
      ['NUMERO DE CONTROL INTERNO (DEL)', '100'],
      ['NUMERO DE CONTROL INTERNO (AL)', '100'],
      ['NUMERO DE DOCUMENTO (DEL)', '100'],
      ['NUMERO DE DOCUMENTO (AL)', '100'],
      ['N° DE MAQUINA REGISTRADORA', '14'],
      ['VENTAS EXENTAS', '10'],
      ['VENTAS INTERNAS EXENTAS NO SUJETAS A PROPORCIONALIDAD', '10'],
      ['VENTAS NO SUJETAS', '10'],
      ['VENTAS GRAVADAS LOCALES', '10'],
      ['EXPORTACIONES DENTRO DEL AREA CENTROAMERICANA', '10'],
      ['EXPORTACIONES FUERA DEL AREA CENTROAMERICANA', '10'],
      ['EXPORTACIONES DE SERVICIOS', '10'],
      ['VENTAS A ZONAS FRANCAS Y DPA (TASA CERO)', '10'],
      ['VENTAS A CUENTA DE TERCEROS NO DOMICILIADOS', '10'],
      ['TOTAL VENTAS', '10'],
      ['TIPO DE OPERACION (Renta)', '10'],
      ['TIPO DE INGRESO (Renta)', '10'],
      ['NUMERO DE ANEXO', '1']
    ]
  },
  purchases: {
    title: 'ANEXO COMPRAS',
    columns: [
      ['FECHA DE EMISION', '10'],
      ['CLASE DE DOCUMENTO', '1'],
      ['TIPO DE DOCUMENTO', '2'],
      ['NUMERO DE DOCUMENTO', '100'],
      ['NIT O NRC DEL PROVEEDOR', '14'],
      ['NOMBRE DEL PROVEEDOR', 'SIN LIMITE'],
      ['COMPRAS INTERNAS EXENTAS Y/O NO SUJETAS', '10'],
      ['INTERNACIONES EXENTAS Y/O NO SUJETAS', '10'],
      ['IMPORTACIONES EXENTAS Y/O NO SUJETAS', '10'],
      ['COMPRAS INTERNAS GRAVADAS', '10'],
      ['INTERNACIONES GRAVADAS DE BIENES', '10'],
      ['IMPORTACIONES GRAVADAS DE BIENES', '10'],
      ['IMPORTACIONES GRAVADAS DE SERVICIOS', '10'],
      ['CREDITO FISCAL', '10'],
      ['TOTAL DE COMPRAS', '10'],
      ['DUI DEL PROVEEDOR', '9'],
      ['TIPO DE OPERACION', '1'],
      ['CLASIFICACION', '1'],
      ['SECTOR', '1'],
      ['TIPO DE COSTO / GASTO', '1'],
      ['NUMERO DE ANEXO', '1']
    ]
  },
  excludedSubject: {
    title: 'ANEXO COMPRA SUJETO EXCLUIDO FSE (66)',
    columns: [
      ['TIPO DE DOCUMENTO', '1'],
      ['NUMERO DE NIT, DUI, U OTRO DOCUMENTO', '14'],
      ['NOMBRE, RAZON SOCIAL O DENOMINACION', 'SIN LIMITE'],
      ['FECHA DE EMISION DEL DOCUMENTO', '10'],
      ['NUMERO DE SERIE DEL DOCUMENTO', '100'],
      ['NUMERO DE DOCUMENTO', '100'],
      ['MONTO DE LA OPERACION', '10'],
      ['MONTO DE LA RETENCION IVA 13%', '10'],
      ['TIPO DE OPERACION', '1'],
      ['CLASIFICACION', '1'],
      ['SECTOR', '1'],
      ['TIPO DE COSTO / GASTO', '1'],
      ['NUMERO DE ANEXO', '1']
    ]
  },
  advanceVat: {
    title: 'ANEXO ANTICIPO A CUENTA IVA 2% (161)',
    columns: [
      ['NIT AGENTE', '14'],
      ['FECHA DE EMISION DEL DOCUMENTO', '10'],
      ['SERIE DE DOCUMENTO', '100'],
      ['NUMERO DE DOCUMENTO', '100'],
      ['MONTO SUJETO', '10'],
      ['MONTO DEL ANTICIPO A CUENTA 2% DE IVA', '10'],
      ['DUI AGENTE', '9'],
      ['NUMERO DE ANEXO', '1']
    ]
  },
  retentionVat: {
    title: 'ANEXO RETENCION IVA 1% (162)',
    columns: [
      ['NIT DEL AGENTE', '14'],
      ['FECHA DE EMISION', '10'],
      ['TIPO DE DOCUMENTO', '2'],
      ['SERIE', '100'],
      ['NUMERO DE DOCUMENTO', '100'],
      ['MONTO SUJETO', '10'],
      ['MONTO RETENCION 1%', '10'],
      ['DUI DEL AGENTE', '9'],
      ['NUMERO DE ANEXO', '1']
    ]
  },
  perceptionVat: {
    title: 'ANEXO PERCEPCION IVA 1% (163)',
    columns: [
      ['NIT AGENTE', '14'],
      ['FECHA DE EMISION', '10'],
      ['TIPO DE DOCUMENTO', '2'],
      ['SERIE DE DOCUMENTO', '100'],
      ['NUMERO DE DOCUMENTO', '100'],
      ['MONTO SUJETO', '10'],
      ['MONTO DE LA PERCEPCION', '10'],
      ['DUI AGENTE', '9'],
      ['NUMERO DE ANEXO', '1']
    ]
  }
};

export const ANEXOS_LABELS = {
  salesCcf: 'Anexo venta CCF',
  salesFcf: 'Anexo venta FCF',
  purchases: 'Anexo compras',
  excludedSubject: 'Anexo compra sujeto excluido FSE',
  advanceVat: 'Anexo anticipo IVA 2%',
  retentionVat: 'Anexo retencion IVA 1%',
  perceptionVat: 'Anexo percepcion IVA 1%'
};

function createEmptyAnexoRow(columns) {
  return Object.fromEntries(columns.map(([header]) => [header, '']));
}

function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const number = Number(String(value || '').replace(/[$,\s]/g, ''));
  return Number.isFinite(number) ? number : 0;
}

function formatAnexoMoney(value) {
  return parseMoney(value).toFixed(2);
}

function formatAnexoTotal(value) {
  return parseMoney(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function isAnexoAmountColumn(header) {
  return /VENTAS|DEBITO|MONTO|TOTAL|COMPRAS|CREDITO/i.test(header)
    && !/NUMERO|DOCUMENTO|CONTROL|ANEXO|NIT|NRC|DUI|TIPO|CLASE|FECHA/i.test(header);
}

function extractDteTypeFromControl(value) {
  const text = String(value || '').toUpperCase();
  const match = text.match(/DTE-?(\d{2})/);
  return match?.[1] || '';
}

function normalizeColumnName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function getRowValueByTokens(row, tokens) {
  const entry = Object.entries(row || {}).find(([key]) => {
    const normalizedKey = normalizeColumnName(key);
    return tokens.every((token) => normalizedKey.includes(token));
  });
  return entry?.[1] || '';
}

function mapCcfSaleToAnexoRow(row) {
  const gravadas = parseMoney(row['VENTAS INTERNAS GRAVADAS VALOR NETO']);
  const ivaDebito = parseMoney(row['IVA DEBITO']);

  return {
    'FECHA DE EMISION DEL DOCUMENTO': row['FECHA DE EMISION'] || '',
    'CLASE DE DOCUMENTO': '4',
    'TIPO DE DOCUMENTO': extractDteTypeFromControl(row['NUMERO DE CONTROL']),
    'NUMERO DE RESOLUCION': row['NUMERO DE CONTROL'] || '',
    'NUMERO DE SERIE DE DOCUMENTO': row['SELLO DE RECEPCION'] || '',
    'NUMERO DE DOCUMENTO': row['CODIGO DE GENERACION'] || '',
    'NUMERO DE CONTROL INTERNO': '',
    'NIT O NRC DEL CLIENTE': row['N.R.C / NIT'] || '',
    'NOMBRE, RAZON SOCIAL O DENOMINACION': row['NOMBRE DEL CLIENTE'] || '',
    'VENTAS EXENTAS': formatAnexoMoney(row.EXENTAS),
    'VENTAS NO SUJETAS': formatAnexoMoney(row['NO SUJETAS']),
    'VENTAS GRAVADAS LOCALES': formatAnexoMoney(gravadas),
    'DEBITO FISCAL': formatAnexoMoney(ivaDebito),
    'VENTAS A CUENTA DE TERCEROS NO DOMICILIADOS': '0.00',
    'DEBITO FISCAL POR VENTA A CUENTA DE TERCEROS': '0.00',
    'TOTAL VENTAS': formatAnexoMoney(gravadas + ivaDebito),
    'DUI DEL CLIENTE': '',
    'TIPO DE OPERACION (Renta)': getRowValueByTokens(row, ['TIPO', 'OPERACION', 'RENTA']),
    'TIPO DE INGRESO (Renta)': getRowValueByTokens(row, ['TIPO', 'INGRESO', 'RENTA']),
    'NUMERO DE ANEXO': '1'
  };
}

function mapFcfSaleToAnexoRow(row) {
  const exportAmount = parseMoney(row['VENTAS GRAVADAS EXPORTAC.']);
  const incomeType = normalizeColumnName(getRowValueByTokens(row, ['TIPO', 'INGRESO', 'RENTA']));
  const countryCode = String(row['Codigo pais'] || '').trim().toUpperCase();
  const isCentralAmerica = ['GT', 'HN', 'NI', 'CR', 'PA'].includes(countryCode);
  const isCommercialIncome = incomeType.includes('03') && incomeType.includes('ACTIVIDADES COMERCIALES');
  const isServiceIncome = incomeType.includes('02') && incomeType.includes('ACTIVIDADES DE SERVICIOS');

  return {
    'FECHA DE EMISION': row['FECHA EMISION'] || '',
    'CLASE DE DOCUMENTO': '4',
    'TIPO DE DOCUMENTO': extractDteTypeFromControl(row['NUMERO DE CONTROL']),
    'NUMERO DE RESOLUCION': row['NUMERO DE CONTROL'] || '',
    'SERIE DE DOCUMENTO': row['SELLO DE RECEPCION'] || '',
    'NUMERO DE CONTROL INTERNO (DEL)': '0',
    'NUMERO DE CONTROL INTERNO (AL)': '0',
    'NUMERO DE DOCUMENTO (DEL)': row['CODIGO DE GENERACION'] || '',
    'NUMERO DE DOCUMENTO (AL)': row['CODIGO DE GENERACION'] || '',
    'NÂ° DE MAQUINA REGISTRADORA': '',
    'VENTAS EXENTAS': formatAnexoMoney(row['VENTAS EXENTAS']),
    'VENTAS INTERNAS EXENTAS NO SUJETAS A PROPORCIONALIDAD': '0.00',
    'VENTAS NO SUJETAS': formatAnexoMoney(row['VENTAS NO SUJETAS']),
    'VENTAS GRAVADAS LOCALES': formatAnexoMoney(row['VENTAS GRAVADAS LOCALES']),
    'EXPORTACIONES DENTRO DEL AREA CENTROAMERICANA': formatAnexoMoney(isCommercialIncome && isCentralAmerica ? exportAmount : 0),
    'EXPORTACIONES FUERA DEL AREA CENTROAMERICANA': formatAnexoMoney(isCommercialIncome && !isCentralAmerica ? exportAmount : 0),
    'EXPORTACIONES DE SERVICIOS': formatAnexoMoney(isServiceIncome ? exportAmount : 0),
    'VENTAS A ZONAS FRANCAS Y DPA (TASA CERO)': '0.00',
    'VENTAS A CUENTA DE TERCEROS NO DOMICILIADOS': '0.00',
    'TOTAL VENTAS': formatAnexoMoney(row.TOTAL),
    'TIPO DE OPERACION (Renta)': getRowValueByTokens(row, ['TIPO', 'OPERACION', 'RENTA']),
    'TIPO DE INGRESO (Renta)': getRowValueByTokens(row, ['TIPO', 'INGRESO', 'RENTA']),
    'NUMERO DE ANEXO': '2'
  };
}

function hasUsefulAnexoData(row, columns) {
  return columns.some(([header]) => String(row[header] || '').trim());
}

function isInvalidOrRejectedDte(row) {
  const status = String(row?.__dteStatus || row?.['Estado del DTE'] || '').toLowerCase();
  return status.includes('invalidado') || status.includes('rechazado');
}

function getAnexoColumnWidth(header) {
  if (/NOMBRE|RAZON|DENOMINACION|TERCEROS|PROPORCIONALIDAD|EXPORTACIONES/i.test(header)) return 260;
  if (/NUMERO|CONTROL|RESOLUCION|SERIE|DOCUMENTO/i.test(header)) return 220;
  if (/FECHA/i.test(header)) return 150;
  if (/VENTAS|DEBITO|MONTO|TOTAL|COMPRAS|CREDITO/i.test(header)) return 160;
  return Math.min(Math.max(header.length * 8 + 42, 130), 220);
}

function applyAnexoFilters(rows, filters) {
  const activeFilters = Object.entries(filters).filter(([, values]) => values?.length);
  if (!activeFilters.length) return rows;
  const filterSets = activeFilters.map(([column, values]) => [column, new Set(values)]);

  return rows.filter(({ row }) => filterSets.every(([column, values]) => values.has(String(row[column] || ''))));
}

export function AnexosView({ ccfSalesRows = [], fcfSalesRows = [], onRowsChange, savedRows, type = 'salesCcf' }) {
  const config = useMemo(() => ANEXOS[type] || ANEXOS.salesCcf, [type]);
  const defaultColumnWidths = useMemo(
    () => Object.fromEntries(config.columns.map(([header]) => [header, getAnexoColumnWidth(header)])),
    [config.columns]
  );
  const [manualColumnWidths, setManualColumnWidths] = useState({});
  const gridTemplateColumns = useMemo(() => [
    '92px',
    '82px',
    ...config.columns.map(([header]) => `${manualColumnWidths[header] || defaultColumnWidths[header]}px`)
  ].join(' '), [config.columns, defaultColumnWidths, manualColumnWidths]);
  const emptyRows = useMemo(() => Array.from({ length: 22 }, (_, index) => index + 1), []);
  const initialRows = useMemo(() => emptyRows.map(() => Object.fromEntries(
    config.columns.map(([header]) => [header, ''])
  )), [config.columns, emptyRows]);
  const [rows, setRows] = useState(() => (savedRows?.length ? savedRows : initialRows));
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState('');
  const [openFilter, setOpenFilter] = useState('');

  const indexedRows = useMemo(() => rows.map((row, index) => ({ index, row })), [rows]);
  const visibleRows = useMemo(
    () => applyAnexoFilters(indexedRows, filters),
    [filters, indexedRows]
  );
  const anexoTotals = useMemo(() => {
    const amountColumns = config.columns
      .map(([header]) => header)
      .filter(isAnexoAmountColumn);
    const totals = Object.fromEntries(amountColumns.map((header) => [header, 0]));

    for (const { row } of visibleRows) {
      for (const header of amountColumns) {
        totals[header] += parseMoney(row[header]);
      }
    }

    return totals;
  }, [config.columns, visibleRows]);
  const openFilterValues = useMemo(() => {
    if (!openFilter) return [];
    return Array.from(new Set(rows.map((row) => String(row[openFilter] || '')))).sort((a, b) => a.localeCompare(b, 'es'));
  }, [openFilter, rows]);

  useEffect(() => {
    const nextRows = savedRows?.length ? savedRows : initialRows;
    setRows((currentRows) => (currentRows === nextRows ? currentRows : nextRows));
    setMessage('');
    setFilters({});
    setOpenFilter('');
    setFilterSearch('');
    setManualColumnWidths({});
    cancelEditing();
  }, [initialRows, savedRows]);

  useEffect(() => {
    onRowsChange?.(rows);
  }, [onRowsChange, rows]);

  function startEditing(rowIndex) {
    setEditingRowIndex(rowIndex);
    setEditingDraft({ ...rows[rowIndex] });
  }

  function cancelEditing() {
    setEditingRowIndex(null);
    setEditingDraft(null);
  }

  function saveEditing() {
    if (editingRowIndex === null) return;
    setRows((currentRows) => currentRows.map((row, index) => (
      index === editingRowIndex ? editingDraft : row
    )));
    cancelEditing();
  }

  function updateEditingValue(header, value) {
    setEditingDraft((draft) => ({ ...draft, [header]: value }));
  }

  function clearRow(rowIndex) {
    setRows((currentRows) => currentRows.map((row, index) => (
      index === rowIndex
        ? createEmptyAnexoRow(config.columns)
        : row
    )));
    if (editingRowIndex === rowIndex) cancelEditing();
  }

  function loadData() {
    if (type !== 'salesCcf' && type !== 'salesFcf') {
      setMessage('Carga de datos disponible por ahora para anexos de venta CCF y FCF.');
      return;
    }

    const sourceRows = type === 'salesFcf' ? fcfSalesRows : ccfSalesRows;
    const usefulColumns = type === 'salesFcf'
      ? [
          ['NUMERO DE CONTROL'],
          ['CODIGO DE GENERACION'],
          ['TOTAL']
        ]
      : [
          ['NUMERO DE CONTROL'],
          ['CODIGO DE GENERACION'],
          ['NOMBRE DEL CLIENTE']
        ];
    const filledRows = sourceRows.filter((row) => (
      !isInvalidOrRejectedDte(row)
      && hasUsefulAnexoData(row, usefulColumns)
    ));

    if (!filledRows.length) {
      setRows(initialRows);
      setMessage(`No hay datos validos cargados en ${type === 'salesFcf' ? 'Libro de Ventas FCF' : 'Libro de Ventas CCF'}.`);
      return;
    }

    setRows(filledRows.map((row) => ({
      ...createEmptyAnexoRow(config.columns),
      ...(type === 'salesFcf' ? mapFcfSaleToAnexoRow(row) : mapCcfSaleToAnexoRow(row)),
      __dteStatus: row.__dteStatus || row['Estado del DTE'] || ''
    })));
    cancelEditing();
    setMessage(`${filledRows.length} registro(s) cargado(s) desde ${type === 'salesFcf' ? 'Libro de Ventas FCF' : 'Libro de Ventas CCF'}.`);
  }

  function clearData() {
    setRows(initialRows);
    setFilters({});
    setOpenFilter('');
    setFilterSearch('');
    cancelEditing();
    setMessage('Datos del anexo borrados correctamente.');
  }

  async function exportCsv() {
    try {
      const columns = config.columns.map(([header]) => header);
      const exportRows = visibleRows
        .map(({ row }) => row)
        .filter((row) => hasUsefulAnexoData(row, config.columns) && !isInvalidOrRejectedDte(row));

      if (!exportRows.length) {
        setMessage('No hay registros para generar CSV.');
        return;
      }

      if (!window.dteApp?.exportAnexoCsv) {
        setMessage('Reinicie la aplicacion para activar la exportacion CSV de anexos.');
        return;
      }

      const filePath = await window.dteApp.exportAnexoCsv({
        columns,
        rows: exportRows,
        title: config.title
      });

      if (filePath) setMessage(`CSV generado: ${filePath}`);
    } catch (error) {
      setMessage(`No se pudo generar CSV: ${error.message}`);
    }
  }

  const startColumnResize = useCallback((event, header) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const initialWidth = manualColumnWidths[header] || defaultColumnWidths[header] || 150;

    function handleMouseMove(moveEvent) {
      const nextWidth = Math.min(Math.max(initialWidth + moveEvent.clientX - startX, 90), 640);
      setManualColumnWidths((current) => ({ ...current, [header]: Math.round(nextWidth) }));
    }

    function handleMouseUp() {
      document.body.classList.remove('isColumnResizing');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    document.body.classList.add('isColumnResizing');
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [defaultColumnWidths, manualColumnWidths]);

  const resetColumnWidth = useCallback((event, header) => {
    event.preventDefault();
    event.stopPropagation();
    setManualColumnWidths((current) => {
      const next = { ...current };
      delete next[header];
      return next;
    });
  }, []);

  return (
    <section className="anexosView">
      <div className="anexosSheet">
        <div className="anexosToolbar">
          {message ? <span className="anexosMessage">{message}</span> : null}
          <button className="actionButton" onClick={loadData} type="button">CARGAR DATOS</button>
          <button className="actionButton" onClick={exportCsv} type="button">GENERAR CSV</button>
          <button className="actionButton dangerActionButton" onClick={clearData} type="button">BORRAR DATOS</button>
        </div>
        <div className="anexosHeader">
          <h1 className="anexosTitle">{config.title}</h1>
        </div>
        <div className="anexosTableViewport">
          <div className="anexosTable" style={{ gridTemplateColumns }}>
            <div className="anexosTotalCell anexosActionsTotalCell" />
            <div className="anexosTotalCell anexosCorrTotalCell" />
            {config.columns.map(([header]) => {
              const totalValue = isAnexoAmountColumn(header) ? `$${formatAnexoTotal(anexoTotals[header] || 0)}` : '';

              return (
                <div className="anexosTotalCell" key={`total-${header}`} title={totalValue}>
                  {totalValue}
                </div>
              );
            })}

            <div className="anexosHeadCell anexosActionsHead">ACCIONES</div>
            <div className="anexosMetaCell anexosCorrHead">CORR.</div>
            {config.columns.map(([header]) => (
              <div className="anexosHeadCell" key={header}>
                <span>{header}</span>
                <button
                  className={`excelFilterButton ${filters[header]?.length ? 'active' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenFilter(openFilter === header ? '' : header);
                    setFilterSearch('');
                  }}
                  title={`Filtrar ${header}`}
                  type="button"
                >
                  v
                </button>
                {openFilter === header ? (
                  <AnexoFilterMenu
                    column={header}
                    filterSearch={filterSearch}
                    onClose={() => setOpenFilter('')}
                    onFilterSearchChange={setFilterSearch}
                    onFiltersChange={setFilters}
                    selectedValues={filters[header] || []}
                    values={openFilterValues}
                  />
                ) : null}
                <span
                  className="anexosColumnResizeHandle"
                  onDoubleClick={(event) => resetColumnWidth(event, header)}
                  onMouseDown={(event) => startColumnResize(event, header)}
                  title="Arrastrar para ajustar ancho. Doble click para autoajustar."
                />
              </div>
            ))}

            {visibleRows.flatMap(({ row, index }) => {
              const rowNumber = index + 1;
              const isEditing = index === editingRowIndex;

              return [
              <div className={`anexosCell anexosActionsCell ${rowNumber % 2 ? 'odd' : 'even'}`} key={`${rowNumber}-actions`}>
                {isEditing ? (
                  <>
                    <button className="ivaBookRowButton save" onClick={saveEditing} title="Guardar" type="button">
                      <Check size={13} />
                    </button>
                    <button className="ivaBookRowButton cancel" onClick={cancelEditing} title="Cancelar" type="button">
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="ivaBookRowButton edit" onClick={() => startEditing(index)} title="Editar linea" type="button">
                      <Pencil size={13} />
                    </button>
                    <button className="ivaBookRowButton delete" onClick={() => clearRow(index)} title="Borrar linea" type="button">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>,
              <div className={`anexosCell rowNumber ${rowNumber % 2 ? 'odd' : 'even'}`} key={`${rowNumber}-number`}>
                {rowNumber}
              </div>,
              ...config.columns.map(([header]) => (
                <div className={`anexosCell ${rowNumber % 2 ? 'odd' : 'even'}`} key={`${rowNumber}-${header}`} title={String(row[header] || '')}>
                  {isEditing ? (
                    <input
                      className="anexosEditInput"
                      onChange={(event) => updateEditingValue(header, event.target.value)}
                      value={editingDraft?.[header] || ''}
                    />
                  ) : (
                    row[header]
                  )}
                </div>
              ))
            ];
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function AnexoFilterMenu({
  column,
  filterSearch,
  onClose,
  onFilterSearchChange,
  onFiltersChange,
  selectedValues,
  values
}) {
  const normalizedSearch = filterSearch.trim().toLowerCase();
  const matchingValues = normalizedSearch
    ? values.filter((value) => value.toLowerCase().includes(normalizedSearch))
    : values;
  const searchedValues = matchingValues.slice(0, 200);
  const effectiveSelected = selectedValues.length ? selectedValues : values;

  function setColumnValues(nextValues) {
    onFiltersChange((currentFilters) => ({
      ...currentFilters,
      [column]: nextValues.length === values.length ? [] : nextValues
    }));
  }

  return (
    <div className="excelFilterMenu anexosFilterMenu" onClick={(event) => event.stopPropagation()}>
      <div className="excelFilterTitle">{column}</div>
      <input
        className="excelFilterSearch"
        onChange={(event) => onFilterSearchChange(event.target.value)}
        placeholder="Buscar..."
        value={filterSearch}
      />
      <div className="excelFilterActions">
        <button onClick={() => setColumnValues(values)} type="button">Todos</button>
        <button onClick={() => setColumnValues([])} type="button">Limpiar</button>
        <button onClick={onClose} type="button">Cerrar</button>
      </div>
      <div className="excelFilterValues">
        {searchedValues.map((value) => (
          <label className="excelFilterOption" key={value || '(vacio)'}>
            <input
              checked={effectiveSelected.includes(value)}
              onChange={(event) => {
                const nextValues = event.target.checked
                  ? [...new Set([...effectiveSelected, value])]
                  : effectiveSelected.filter((item) => item !== value);
                setColumnValues(nextValues);
              }}
              type="checkbox"
            />
            <span>{value || '(vacio)'}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
