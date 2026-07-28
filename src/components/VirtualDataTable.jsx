import { memo, useMemo, useState } from 'react';

const ROW_HEIGHT = 22;
const OVERSCAN = 8;
const AUTO_WIDTH_SAMPLE_SIZE = 300;
const BOTTOM_SCROLL_PADDING = 24;
const PUBLIC_QUERY_COLUMNS = new Set([
  'Estado del DTE',
  'Descripcion del DTE',
  'Tipo de DTE',
  'Fecha y hora de generacion',
  'Codigo de Generacion',
  'Sello de Recepcion',
  'Numero de Control Consulta',
  'Documento ajustado',
  'Documento con Evento aplicado',
  'Documentos Relacionados'
]);

function getVisibleRange(scrollTop, viewportHeight, rowCount) {
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(rowCount, startIndex + visibleCount);
  return { endIndex, startIndex };
}

function getColumnWidthBounds(column) {
  if (/descr|descripcion|producto|observaciones|relacionados|evento|direccion|actividad/i.test(column)) {
    return { max: 680, min: 220 };
  }
  if (/codigo|generacion|control|documento|sello|serie/i.test(column)) {
    return { max: 380, min: 180 };
  }
  if (isMoneyColumn(column)) {
    return { max: 190, min: 135 };
  }
  if (/fecha|hora|tipo dte|nrc|nit|pais/i.test(column)) {
    return { max: 180, min: 90 };
  }
  return { max: 320, min: 120 };
}

function measureCellText(value) {
  const lines = String(value ?? '').split(/\r?\n/);
  const longest = lines.reduce((max, line) => Math.max(max, line.trim().length), 0);
  return longest;
}

function getAutoColumnWidth(column, rows) {
  const { max, min } = getColumnWidthBounds(column);
  let maxLength = measureCellText(column);
  const sampleLength = Math.min(rows.length, AUTO_WIDTH_SAMPLE_SIZE);
  for (let index = 0; index < sampleLength; index += 1) {
    maxLength = Math.max(maxLength, measureCellText(rows[index]?.[column]));
  }

  const estimatedWidth = Math.ceil(maxLength * 7.2) + 34;
  return Math.min(Math.max(estimatedWidth, min), max);
}

function isMoneyColumn(column) {
  return /total|monto|credito|debito|fovial|cotrans|percepciones|retencion|retenido|percibido|compra|gravado|exenta|sujetas|desc\.|sub-total|pagar/i.test(column)
    && !/letras/i.test(column);
}

function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value || '').trim();
  if (!text) return 0;
  const normalized = text.replace(/[$,\s]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

const totalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatTotal(value) {
  return `$${totalFormatter.format(value)}`;
}

function DataRow({ columns, gridTemplateColumns, isSelected, onRowSelect, row, rowIndex }) {
  const isRejectedOrInvalid = /invalidado|rechazado/i.test(String(row['Estado del DTE'] || ''));

  return (
    <div
      className={`virtualRow ${rowIndex % 2 === 0 ? 'evenRow' : 'oddRow'} ${row.__isDuplicate ? 'duplicateRow' : ''} ${isRejectedOrInvalid ? 'alertRow' : ''} ${isSelected ? 'selectedRow' : ''}`}
      onClick={() => onRowSelect(row)}
      role="row"
      style={{ gridTemplateColumns, transform: `translateY(${rowIndex * ROW_HEIGHT}px)` }}
    >
      {columns.map((column) => (
        <div
          className={`virtualCell ${row.__isDuplicate ? 'duplicateCell' : ''}`}
          key={column}
          role="cell"
          title={String(row[column] ?? '')}
        >
          {row[column]}
        </div>
      ))}
    </div>
  );
}

const MemoDataRow = memo(DataRow, (previous, next) => (
  previous.columns === next.columns
  && previous.gridTemplateColumns === next.gridTemplateColumns
  && previous.isSelected === next.isSelected
  && previous.onRowSelect === next.onRowSelect
  && previous.row === next.row
  && previous.rowIndex === next.rowIndex
));

export function VirtualDataTable({
  columnFilters,
  columns,
  filterSourceRows,
  onColumnFilterChange,
  onRowSelect,
  rows,
  selectedRow
}) {
  const [viewport, setViewport] = useState({ height: 480, scrollTop: 0 });
  const [scrollLeft, setScrollLeft] = useState(0);
  const [openFilter, setOpenFilter] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');

  const visibleRange = useMemo(
    () => getVisibleRange(viewport.scrollTop, viewport.height, rows.length),
    [rows.length, viewport]
  );
  const visibleRows = useMemo(
    () => rows.slice(visibleRange.startIndex, visibleRange.endIndex),
    [rows, visibleRange]
  );
  const columnWidths = useMemo(
    () => columns.map((column) => getAutoColumnWidth(column, rows)),
    [columns, rows]
  );
  const gridTemplateColumns = useMemo(
    () => columnWidths.map((width) => `${width}px`).join(' '),
    [columnWidths]
  );
  const tableWidth = useMemo(
    () => columnWidths.reduce((total, width) => total + width, 0),
    [columnWidths]
  );
  const columnTotals = useMemo(() => {
    const totals = {};
    for (const column of columns) {
      if (!isMoneyColumn(column)) continue;
      let total = 0;
      for (const row of rows) total += parseMoney(row[column]);
      totals[column] = formatTotal(total);
    }
    return totals;
  }, [columns, rows]);
  const openFilterValues = useMemo(() => {
    if (!openFilter) return [];
    return Array.from(new Set(filterSourceRows.map((row) => String(row[openFilter] ?? '')))).sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  }, [filterSourceRows, openFilter]);

  function handleScroll(event) {
    const target = event.currentTarget;
    setViewport({ height: target.clientHeight, scrollTop: target.scrollTop });
  }

  if (!rows.length) {
    return (
      <div className="tableFrame">
        <div className="empty">Sin datos cargados</div>
      </div>
    );
  }

  return (
    <div className="tableFrame">
      <div className="tableViewport" onScroll={handleScroll}>
        <div
          className="virtualTable"
          role="table"
          style={{ transform: `translateX(${-scrollLeft}px)`, width: tableWidth }}
        >
          <div className="virtualTotals" role="row" style={{ gridTemplateColumns }}>
            {columns.map((column) => (
              <div className={`virtualTotalCell ${columnTotals[column] ? 'hasTotal' : ''}`} key={column} role="cell">
                {columnTotals[column] || ''}
              </div>
            ))}
          </div>
          <div className="virtualHeader" role="row" style={{ gridTemplateColumns }}>
            {columns.map((column) => (
              <div
                className={`virtualHeadCell ${PUBLIC_QUERY_COLUMNS.has(column) ? 'publicQueryHeadCell' : ''}`}
                key={column}
                role="columnheader"
              >
                <span className="truncate">{column}</span>
                <button
                  className={`excelFilterButton ${columnFilters[column]?.length ? 'active' : ''}`}
                  onClick={() => {
                    setOpenFilter(openFilter === column ? null : column);
                    setFilterSearch('');
                  }}
                  title={`Filtrar ${column}`}
                  type="button"
                >
                  v
                </button>
                {openFilter === column ? (
                  <FilterMenu
                    column={openFilter}
                    filterSearch={filterSearch}
                    onClose={() => setOpenFilter(null)}
                    onFilterSearchChange={setFilterSearch}
                    onColumnFilterChange={onColumnFilterChange}
                    selectedValues={columnFilters[openFilter] || []}
                    values={openFilterValues}
                  />
                ) : null}
              </div>
            ))}
          </div>
          <div className="virtualBody" role="rowgroup" style={{ height: rows.length * ROW_HEIGHT + BOTTOM_SCROLL_PADDING }}>
            {visibleRows.map((row, index) => (
              <MemoDataRow
                columns={columns}
                gridTemplateColumns={gridTemplateColumns}
                isSelected={row === selectedRow}
                key={`${visibleRange.startIndex + index}`}
                onRowSelect={onRowSelect}
                row={row}
                rowIndex={visibleRange.startIndex + index}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="horizontalScrollbar" onScroll={(event) => setScrollLeft(event.currentTarget.scrollLeft)}>
        <div style={{ height: 1, width: tableWidth }} />
      </div>
    </div>
  );
}

function FilterMenu({
  column,
  filterSearch,
  onClose,
  onColumnFilterChange,
  onFilterSearchChange,
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
    onColumnFilterChange((filters) => ({
      ...filters,
      [column]: nextValues.length === values.length ? [] : nextValues
    }));
  }

  function handleSearchChange(event) {
    const nextSearch = event.target.value;
    const nextSearchNormalized = nextSearch.trim().toLowerCase();
    const nextMatchingValues = nextSearchNormalized
      ? values.filter((value) => value.toLowerCase().includes(nextSearchNormalized))
      : [];

    onFilterSearchChange(nextSearch);
    setColumnValues(nextMatchingValues);
  }

  return (
    <div className="excelFilterMenu">
      <div className="excelFilterTitle">{column}</div>
      <input
        className="excelFilterSearch"
        onChange={handleSearchChange}
        placeholder="Buscar"
        value={filterSearch}
      />
      <div className="excelFilterActions">
        <button onClick={() => setColumnValues(values)} type="button">
          Todos
        </button>
        <button onClick={() => setColumnValues([])} type="button">
          Limpiar
        </button>
        <button onClick={onClose} type="button">
          Cerrar
        </button>
      </div>
      <div className="excelFilterValues">
        {searchedValues.map((value) => {
          const checked = effectiveSelected.includes(value);
          return (
            <label className="excelFilterOption" key={value || '__blank__'}>
              <input
                checked={checked}
                onChange={(event) => {
                  const next = event.target.checked
                    ? Array.from(new Set([...effectiveSelected, value]))
                    : effectiveSelected.filter((item) => item !== value);
                  setColumnValues(next);
                }}
                type="checkbox"
              />
              <span>{value || '(Vacios)'}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

