import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const IVA_BOOKS = {
  purchases: {
    title: 'LIBRO PARA REGISTRAR COMPRAS',
    columns: [
      { header: 'No. CORR.', width: '76px' },
      { header: 'FECHA DE EMISION', width: '120px' },
      { header: 'NUMERO DE CONTROL', width: '190px' },
      { header: 'CODIGO DE GENERACION', width: '190px' },
      { header: 'SELLO DE RECEPCION', width: '190px' },
      { header: 'N.R.C / NIT', width: '130px' },
      { header: 'NOMBRE DEL PROVEEDOR', width: '320px' },
      { header: 'COMPRAS EXENTAS INTERNAS', width: '125px', money: true },
      { header: 'COMPRAS EXENTAS IMPORTACIONES', width: '135px', money: true },
      { header: 'COMPRAS EXENTAS INTERNACIONES', width: '135px', money: true },
      { header: 'COMPRAS GRAVADAS INTERNAS', width: '135px', money: true },
      { header: 'COMPRAS GRAVADAS IMPORTACIONES', width: '145px', money: true },
      { header: 'COMPRAS GRAVADAS INTERNACIONES', width: '145px', money: true },
      { header: 'IVA', width: '110px', money: true },
      { header: 'TOTAL COMPRAS', width: '130px', money: true },
      { header: 'COMPRAS A SUJETOS EXCLUIDOS', width: '160px', money: true },
      { header: 'PERCEPCION 2% / 1% IVA', width: '150px', money: true },
      { header: 'RETENCION 1% IVA', width: '130px', money: true }
    ]
  },
  ccfSales: {
    title: 'LIBRO DE VENTAS PARA REGISTRAR COMPROBANTES DE CREDITO FISCAL',
    columns: [
      { header: 'No. CORR.', width: '76px' },
      { header: 'FECHA DE EMISION', width: '120px' },
      { header: 'NUMERO DE CONTROL', width: '190px' },
      { header: 'CODIGO DE GENERACION', width: '190px' },
      { header: 'SELLO DE RECEPCION', width: '190px' },
      { header: 'N.R.C / NIT', width: '130px' },
      { header: 'NOMBRE DEL CLIENTE', width: '320px' },
      { header: 'NO SUJETAS', width: '115px', money: true },
      { header: 'EXENTAS', width: '115px', money: true },
      { header: 'VENTAS INTERNAS GRAVADAS VALOR NETO', width: '155px', money: true },
      { header: 'VENTAS INTERNAS GRAVADAS IVA', width: '130px', money: true },
      { header: 'VENTA TOTAL', width: '130px', money: true },
      { header: 'RETENCION 1%', width: '120px', money: true },
      { header: 'TIPO DE OPERACION', width: '155px' },
      { header: 'TIPO DE INGRESO', width: '165px' }
    ]
  },
  fcfSales: {
    title: 'LIBRO DE VENTAS PARA REGISTRAR CONSUMIDOR FINAL',
    columns: [
      { header: 'ITEM', width: '76px' },
      { header: 'FECHA EMISION', width: '120px' },
      { header: 'NUMERO DE CONTROL', width: '190px' },
      { header: 'CODIGO DE GENERACION', width: '190px' },
      { header: 'SELLO DE RECEPCION', width: '190px' },
      { header: 'VENTAS NO SUJETAS', width: '175px', money: true },
      { header: 'VENTAS EXENTAS', width: '165px', money: true },
      { header: 'VENTAS GRAVADAS LOCALES', width: '185px', money: true },
      { header: 'VENTAS GRAVADAS EXPORTAC.', width: '190px', money: true },
      { header: 'TOTAL', width: '175px', money: true }
    ]
  }
};

const EMPTY_ROWS = 24;
const ACTIONS_COLUMN_WIDTH = '92px';
const IVA_BOOK_MAPPINGS = {
  fcfSales: {
    'FECHA EMISION': 'Fecha',
    'NUMERO DE CONTROL': 'Numero de Control',
    'CODIGO DE GENERACION': ['Codigo de generacion local', 'Numero del Documento', 'Numero Documento'],
    'SELLO DE RECEPCION': ['Serie del Documento', 'Serie Documento'],
    'VENTAS NO SUJETAS': 'Total no Sujetas',
    'VENTAS EXENTAS': 'Total Exenta',
    'VENTAS GRAVADAS LOCALES': { exceptTypeCode: '11', source: 'Total Gravado' },
    'VENTAS GRAVADAS EXPORTAC.': { onlyTypeCode: '11', source: ['Monto Total Operación', 'Monto Total de la Operacion'] },
    TOTAL: 'Total a Pagar'
  },
  ccfSales: {
    'FECHA DE EMISION': 'Fecha',
    'NUMERO DE CONTROL': 'Numero de Control',
    'CODIGO DE GENERACION': ['Codigo de generacion local', 'Numero del Documento', 'Numero Documento'],
    'SELLO DE RECEPCION': ['Serie del Documento', 'Serie Documento'],
    'N.R.C / NIT': 'NRC receptor',
    'NOMBRE DEL CLIENTE': 'Nombre receptor',
    'NO SUJETAS': 'Total no Sujetas',
    EXENTAS: 'Total Exenta',
    'VENTAS INTERNAS GRAVADAS VALOR NETO': 'Total Gravado',
    'VENTAS INTERNAS GRAVADAS IVA': ['Debito Fiscal', 'Credito Fiscal'],
    'VENTA TOTAL': 'Monto Total de la Operacion',
    'RETENCION 1%': 'IVA Retenido',
    'TIPO DE OPERACION': 'Condicion de la operacion',
    'TIPO DE INGRESO': { fallback: 'Gravado', source: ['Tipo de ingreso', 'Tipo de Ingreso', 'TIPO DE INGRESO'] }
  },
  purchases: {
    'FECHA DE EMISION': 'Fecha',
    'NUMERO DE CONTROL': 'Numero de Control',
    'CODIGO DE GENERACION': ['Codigo de generacion local', 'Numero del Documento', 'Numero Documento'],
    'SELLO DE RECEPCION': ['Serie del Documento', 'Serie Documento'],
    'N.R.C / NIT': 'NRC emisor',
    'NOMBRE DEL PROVEEDOR': 'Nombre emisor',
    'COMPRAS EXENTAS INTERNAS': 'Total Exenta',
    'COMPRAS GRAVADAS INTERNAS': 'Total Gravado',
    IVA: 'Credito Fiscal',
    'TOTAL COMPRAS': 'Total de Compra',
    'COMPRAS A SUJETOS EXCLUIDOS': 'Total Compra',
    'PERCEPCION 2% / 1% IVA': 'Percepciones',
    'RETENCION 1% IVA': 'IVA Retenido'
  }
};
const IVA_BOOK_REQUIREMENTS = {
  fcfSales: {
    accepted: [
      { typeCode: '01', structureName: 'FCF EMISOR' },
      { typeCode: '11', structureName: 'FEX EMISOR' }
    ],
    message: 'Para cargar datos en Libro de Ventas FCF seleccione en INICIO: Tipo de Documento 01 con estructura FCF EMISOR, o Tipo de Documento 11 con estructura FEX EMISOR.'
  },
  ccfSales: {
    typeCode: '03',
    structureName: 'CCF EMISOR VENTA',
    message: 'Para importar datos en Libro de Ventas CCF seleccione en INICIO: Tipo de Documento 03 y Nombre de estructura CCF EMISOR VENTA.'
  },
  purchases: {
    typeCode: '03',
    structureName: 'CCF RECEPTOR COMPRA',
    message: 'Para importar datos en Libro de Compras seleccione en INICIO: Tipo de Documento 03 y Nombre de estructura CCF RECEPTOR COMPRA.'
  }
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function createEmptyBookRows(columns, count = EMPTY_ROWS) {
  return Array.from({ length: count }, (_, rowIndex) => Object.fromEntries(
    columns.map((column, columnIndex) => [column.header, columnIndex === 0 ? String(rowIndex + 1) : ''])
  ));
}

function renumberBookRows(rows, columns) {
  const firstColumn = columns[0]?.header;
  if (!firstColumn) return rows;
  return rows.map((row, index) => ({
    ...row,
    [firstColumn]: String(index + 1)
  }));
}

function getSourceValue(row, sourceColumn) {
  if (sourceColumn && typeof sourceColumn === 'object' && !Array.isArray(sourceColumn)) {
    const sourceType = String(row?.['Tipo DTE'] || '').padStart(2, '0');
    if (sourceColumn.onlyTypeCode && sourceType !== sourceColumn.onlyTypeCode) return sourceColumn.fallback || '';
    if (sourceColumn.exceptTypeCode && sourceType === sourceColumn.exceptTypeCode) return sourceColumn.fallback || '';
    const value = getSourceValue(row, sourceColumn.source);
    return value || sourceColumn.fallback || '';
  }

  if (Array.isArray(sourceColumn)) {
    for (const column of sourceColumn) {
      const value = row?.[column];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return '';
  }

  return sourceColumn ? row?.[sourceColumn] ?? '' : '';
}

function hasInvalidOrRejectedStatus(row) {
  const status = String(row?.['Estado del DTE'] || '').toLowerCase();
  return status.includes('invalidado') || status.includes('rechazado');
}

function parseCurrency(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  let text = String(value || '').replace(/[$\s]/g, '').trim();
  if (!text) return 0;

  const commaIndex = text.lastIndexOf(',');
  const dotIndex = text.lastIndexOf('.');
  if (commaIndex > dotIndex) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else {
    text = text.replace(/,/g, '');
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
}

function compareBookValues(aValue, bValue, column) {
  if (column.money) return parseCurrency(aValue) - parseCurrency(bValue);

  const aNumber = Number(String(aValue || '').replace(/[$,\s]/g, ''));
  const bNumber = Number(String(bValue || '').replace(/[$,\s]/g, ''));
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;

  return String(aValue || '').localeCompare(String(bValue || ''), 'es', {
    numeric: true,
    sensitivity: 'base'
  });
}

function applyBookFilters(rows, filters) {
  const activeFilters = Object.entries(filters).filter(([, values]) => values?.length);
  if (!activeFilters.length) return rows;

  return rows.filter((row) => activeFilters.every(([column, values]) => values.includes(String(row[column] || ''))));
}

function matchesBookRequirement(requirement, sourceTypeCode, sourceStructureName) {
  const accepted = requirement.accepted || [requirement];
  const normalizedSourceType = String(sourceTypeCode).padStart(2, '0');
  const normalizedSourceStructure = String(sourceStructureName).toUpperCase();

  return accepted.some((option) => (
    normalizedSourceType === option.typeCode
    && normalizedSourceStructure === option.structureName
  ));
}

function orderRowsForIvaBook(rows, type) {
  if (type !== 'fcfSales') return rows;
  const typeOrder = new Map([
    ['01', 0],
    ['11', 1]
  ]);

  return rows
    .map((row, index) => ({ index, row }))
    .sort((a, b) => {
      const aType = String(a.row?.['Tipo DTE'] || '').padStart(2, '0');
      const bType = String(b.row?.['Tipo DTE'] || '').padStart(2, '0');
      const aOrder = typeOrder.get(aType) ?? 99;
      const bOrder = typeOrder.get(bType) ?? 99;
      return aOrder - bOrder || a.index - b.index;
    })
    .map((item) => item.row);
}

function summarizeLoadedDteTypes(rows) {
  const counts = new Map();
  for (const row of rows) {
    const typeCode = String(row?.['Tipo DTE'] || '').padStart(2, '0');
    if (!typeCode || typeCode === '00') continue;
    counts.set(typeCode, (counts.get(typeCode) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b, 'es', { numeric: true }))
    .map(([typeCode, count]) => `DTE ${typeCode}: ${count} item${count === 1 ? '' : 's'}`)
    .join(' | ');
}

export function IvaBooksView({ sourceRows = [], sourceStructureName = '', sourceTypeCode = '', type }) {
  const config = IVA_BOOKS[type] || IVA_BOOKS.purchases;
  const gridTemplateColumns = [ACTIONS_COLUMN_WIDTH, ...config.columns.map((column) => column.width)].join(' ');
  const [bookRows, setBookRows] = useState(() => createEmptyBookRows(config.columns));
  const [editingRowIndex, setEditingRowIndex] = useState(-1);
  const [editingDraft, setEditingDraft] = useState(null);
  const [filters, setFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loadedTypeSummary, setLoadedTypeSummary] = useState('');
  const [openFilter, setOpenFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ column: '', direction: 'asc' });
  const filteredBookRows = useMemo(() => applyBookFilters(bookRows, filters), [bookRows, filters]);
  const visibleBookRows = useMemo(() => {
    if (!sortConfig.column) return filteredBookRows;
    const column = config.columns.find((item) => item.header === sortConfig.column);
    const direction = sortConfig.direction === 'desc' ? -1 : 1;
    return [...filteredBookRows].sort((a, b) => compareBookValues(a[sortConfig.column], b[sortConfig.column], column || {}) * direction);
  }, [config.columns, filteredBookRows, sortConfig]);
  const totals = useMemo(() => {
    const nextTotals = {};
    for (const column of config.columns) {
      if (!column.money) continue;
      nextTotals[column.header] = bookRows.reduce((total, row) => total + parseCurrency(row[column.header]), 0);
    }
    return nextTotals;
  }, [bookRows, config.columns]);
  const openFilterValues = useMemo(() => {
    if (!openFilter) return [];
    return Array.from(new Set(bookRows.map((row) => String(row[openFilter] || '')))).sort((a, b) => a.localeCompare(b, 'es'));
  }, [bookRows, openFilter]);

  function toggleSort(column) {
    setSortConfig((current) => ({
      column: column.header,
      direction: current.column === column.header && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  function importData() {
    const requirement = IVA_BOOK_REQUIREMENTS[type] || IVA_BOOK_REQUIREMENTS.purchases;
    if (!matchesBookRequirement(requirement, sourceTypeCode, sourceStructureName)) {
      setMessage(requirement.message);
      setLoadedTypeSummary('');
      return;
    }

    const mapping = IVA_BOOK_MAPPINGS[type] || IVA_BOOK_MAPPINGS.purchases;
    const orderedSourceRows = orderRowsForIvaBook(sourceRows, type);
    const nextRows = orderedSourceRows.map((sourceRow, rowIndex) => {
      const forceZeroMoney = hasInvalidOrRejectedStatus(sourceRow);

      return Object.fromEntries(
        config.columns.map((column, columnIndex) => {
          const value = getSourceValue(sourceRow, mapping[column.header]);
          return [
            column.header,
            columnIndex === 0
              ? String(rowIndex + 1)
              : forceZeroMoney && column.money
                ? '$0.00'
                : column.money && !value
                  ? '$0.00'
                  : value
          ];
        })
      );
    });
    setBookRows(nextRows.length ? nextRows : createEmptyBookRows(config.columns));
    setFilters({});
    setOpenFilter('');
    setFilterSearch('');
    setSortConfig({ column: '', direction: 'asc' });
    setMessage(`${nextRows.length} registro(s) importado(s).`);
    setLoadedTypeSummary(summarizeLoadedDteTypes(orderedSourceRows));
  }

  function getBookRowIndex(row) {
    return bookRows.indexOf(row);
  }

  function deleteRow(row) {
    const targetIndex = getBookRowIndex(row);
    if (targetIndex < 0) return;
    setBookRows((currentRows) => {
      const nextRows = renumberBookRows(currentRows.filter((_, index) => index !== targetIndex), config.columns);
      return nextRows.length ? nextRows : createEmptyBookRows(config.columns);
    });
    if (editingRowIndex === targetIndex) {
      setEditingRowIndex(-1);
      setEditingDraft(null);
    }
    setMessage('Linea eliminada correctamente.');
  }

  function startEditing(row) {
    const targetIndex = getBookRowIndex(row);
    if (targetIndex < 0) return;
    setEditingRowIndex(targetIndex);
    setEditingDraft({ ...row });
  }

  function cancelEditing() {
    setEditingRowIndex(-1);
    setEditingDraft(null);
  }

  function saveEditing() {
    if (editingRowIndex < 0 || !editingDraft) return;
    setBookRows((currentRows) => currentRows.map((row, index) => (
      index === editingRowIndex ? { ...row, ...editingDraft } : row
    )));
    setEditingRowIndex(-1);
    setEditingDraft(null);
    setMessage('Linea editada correctamente.');
  }

  function updateEditingValue(column, value) {
    setEditingDraft((draft) => ({ ...(draft || {}), [column]: value }));
  }

  async function exportExcel() {
    const exportRows = visibleBookRows.filter((row) => (
      config.columns.some((column, columnIndex) => columnIndex > 0 && String(row[column.header] || '').trim())
    ));

    if (!exportRows.length) {
      setMessage('No hay registros para exportar.');
      return;
    }

    if (!window.dteApp?.exportIvaBookExcel) {
      setMessage('Reinicie la aplicacion para activar la exportacion de libros de IVA.');
      return;
    }

    try {
      const filePath = await window.dteApp.exportIvaBookExcel({
        columns: config.columns,
        rows: exportRows,
        title: config.title,
        totals
      });
      if (filePath) setMessage(`Libro exportado: ${filePath}`);
    } catch (error) {
      setMessage(`No se pudo exportar el libro: ${error.message}`);
    }
  }

  function clearTable() {
    const hasRows = bookRows.some((row) => (
      config.columns.some((column, columnIndex) => columnIndex > 0 && String(row[column.header] || '').trim())
    ));

    setBookRows(createEmptyBookRows(config.columns));
    setFilters({});
    setOpenFilter('');
    setFilterSearch('');
    setSortConfig({ column: '', direction: 'asc' });
    setLoadedTypeSummary('');
    cancelEditing();
    setMessage(hasRows ? 'Tabla limpiada correctamente.' : 'La tabla ya esta vacia.');
  }

  return (
    <section className="ivaBookView">
      <div className="ivaBookSheet">
        <div className="ivaBookToolbar">
          {(message || loadedTypeSummary) ? (
            <span className="ivaBookMessage">
              {message ? <span>{message}</span> : null}
              {loadedTypeSummary ? <strong className="ivaBookTypeSummary">{loadedTypeSummary}</strong> : null}
            </span>
          ) : null}
          <button className="actionButton" onClick={importData} type="button">CARGAR DATOS</button>
          <button className="actionButton" onClick={exportExcel} type="button">EXPORTAR A EXCEL</button>
          <button className="actionButton dangerActionButton" onClick={clearTable} type="button">LIMPIAR TABLA</button>
          <button className="actionButton" type="button">ANEXOS CSV</button>
        </div>

        <div className="ivaBookHeader">
          <div className="ivaBookHeaderLabel">NOMBRE EMPRESA:</div>
          <div className="ivaBookHeaderValue spanWide" />
          <div className="ivaBookHeaderTitle">{config.title}</div>
          <div className="ivaBookHeaderLabel">NRC:</div>
          <div className="ivaBookHeaderValue" />
          <div className="ivaBookHeaderLabel">NIT:</div>
          <div className="ivaBookHeaderValue spanMedium" />
          <div className="ivaBookHeaderLabel">GIRO:</div>
          <div className="ivaBookHeaderValue spanWide" />
          <div className="ivaBookHeaderLabel">MES:</div>
          <div className="ivaBookHeaderValue" />
          <div className="ivaBookHeaderLabel">AÑO:</div>
          <div className="ivaBookHeaderValue" />
        </div>

        <div className="ivaBookTable" style={{ gridTemplateColumns }}>
          <div className="ivaBookTotalCell" />
          {config.columns.map((column, columnIndex) => {
            const totalValue = column.money ? `$${currencyFormatter.format(totals[column.header] || 0)}` : '';
            const isLastColumn = columnIndex === config.columns.length - 1;
            return (
              <div className={`ivaBookTotalCell ${isLastColumn ? 'ivaBookLastColumn' : ''}`} key={`total-${column.header}`} title={totalValue}>
                {totalValue}
              </div>
            );
          })}

          <div className="ivaBookHeadCell ivaBookActionsHead">ACCIONES</div>
          {config.columns.map((column, columnIndex) => (
            <div className={`ivaBookHeadCell ${columnIndex === config.columns.length - 1 ? 'ivaBookLastColumn' : ''}`} key={column.header} onClick={() => toggleSort(column)} role="columnheader" title={`Ordenar ${column.header}`}>
              <span>{column.header}</span>
              {sortConfig.column === column.header ? (
                <span className="sortIndicator">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
              ) : null}
              <button
                className={`excelFilterButton ${filters[column.header]?.length ? 'active' : ''}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenFilter(openFilter === column.header ? '' : column.header);
                  setFilterSearch('');
                }}
                title={`Filtrar ${column.header}`}
                type="button"
              >
                v
              </button>
              {openFilter === column.header ? (
                <IvaBookFilterMenu
                  alignStart={columnIndex < 2}
                  column={column.header}
                  filterSearch={filterSearch}
                  onClose={() => setOpenFilter('')}
                  onFilterSearchChange={setFilterSearch}
                  onFiltersChange={setFilters}
                  selectedValues={filters[column.header] || []}
                  values={openFilterValues}
                />
              ) : null}
            </div>
          ))}

          {visibleBookRows.flatMap((row, rowIndex) => {
            const sourceIndex = getBookRowIndex(row);
            const isEditing = sourceIndex === editingRowIndex;
            const actionCell = (
              <div className={`ivaBookCell ivaBookActionsCell ${rowIndex % 2 === 0 ? 'odd' : 'even'}`} key={`${rowIndex}-actions`}>
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
                    <button className="ivaBookRowButton edit" onClick={() => startEditing(row)} title="Editar linea" type="button">
                      <Pencil size={13} />
                    </button>
                    <button className="ivaBookRowButton delete" onClick={() => deleteRow(row)} title="Eliminar linea" type="button">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            );
            const rowCells = config.columns.map((column, columnIndex) => (
              <div
                className={`ivaBookCell ${rowIndex % 2 === 0 ? 'odd' : 'even'} ${column.money ? 'money' : ''} ${columnIndex === config.columns.length - 1 ? 'ivaBookLastColumn' : ''}`}
                key={`${rowIndex}-${column.header}`}
                title={String(row[column.header] || '')}
              >
                {isEditing && columnIndex > 0 ? (
                  <input
                    className={`ivaBookEditInput ${column.money ? 'money' : ''}`}
                    onChange={(event) => updateEditingValue(column.header, event.target.value)}
                    value={editingDraft?.[column.header] || ''}
                  />
                ) : (
                  row[column.header] || (columnIndex === 0 ? rowIndex + 1 : '')
                )}
              </div>
            ));
            return [actionCell, ...rowCells];
          })}
        </div>
      </div>
    </section>
  );
}

function IvaBookFilterMenu({
  alignStart,
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
    onFiltersChange((filters) => ({
      ...filters,
      [column]: nextValues.length === values.length ? [] : nextValues
    }));
  }

  return (
    <div className={`excelFilterMenu ivaBookFilterMenu ${alignStart ? 'alignStart' : ''}`} onClick={(event) => event.stopPropagation()}>
      <div className="excelFilterTitle">{column}</div>
      <input
        className="excelFilterSearch"
        onChange={(event) => {
          const nextSearch = event.target.value;
          const nextSearchNormalized = nextSearch.trim().toLowerCase();
          const nextMatchingValues = nextSearchNormalized
            ? values.filter((value) => value.toLowerCase().includes(nextSearchNormalized))
            : [];
          onFilterSearchChange(nextSearch);
          setColumnValues(nextMatchingValues);
        }}
        placeholder="Buscar"
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
                  ? Array.from(new Set([...effectiveSelected, value]))
                  : effectiveSelected.filter((item) => item !== value);
                setColumnValues(nextValues);
              }}
              type="checkbox"
            />
            <span>{value || '(Vacios)'}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
