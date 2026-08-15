import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

const ROW_HEIGHT = 22;
const OVERSCAN = 8;
const AUTO_WIDTH_SAMPLE_SIZE = 80;
const BOTTOM_SCROLL_PADDING = 56;
const ACTIONS_COLUMN_WIDTH = 78;
const TOTALS_CHUNK_SIZE = 2500;
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
  'Observaciones',
  'Documentos Relacionados'
]);
const NO_FILTER_VALUES_SELECTED = '__DTE_FILTER_NONE_SELECTED__';

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
  return /total|monto|valor|iva|credito|debito|fovial|cotrans|percepciones|retencion|retenido|percibido|compra|gravado|exenta|sujetas|desc\.|sub-?total|pagar|comision|liq\./i.test(column)
    && !/letras/i.test(column);
}

function isDateColumn(column) {
  return /^fecha$/i.test(String(column).trim());
}

function hasActiveColumnFilter(selectedValues = [], values = []) {
  if (!selectedValues.length) return false;
  if (selectedValues.includes(NO_FILTER_VALUES_SELECTED)) return true;
  return selectedValues.length < values.length;
}

function parseFilterDate(value) {
  const text = String(value || '').trim();
  const dayFirst = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const yearFirst = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (yearFirst) {
    const [, year, month, day] = yearFirst;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return '';
}

function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const text = String(value || '').trim();
  if (!text) return 0;
  const normalized = text.replace(/[$,\s]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

export function compareCellValues(aValue, bValue, column) {
  if (isDateColumn(column)) {
    const aDate = parseFilterDate(aValue);
    const bDate = parseFilterDate(bValue);
    if (aDate || bDate) return aDate.localeCompare(bDate);
  }

  if (isMoneyColumn(column)) {
    return parseMoney(aValue) - parseMoney(bValue);
  }

  const aNumber = Number(String(aValue ?? '').replace(/[$,\s]/g, ''));
  const bNumber = Number(String(bValue ?? '').replace(/[$,\s]/g, ''));
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
    return aNumber - bNumber;
  }

  return String(aValue ?? '').localeCompare(String(bValue ?? ''), 'es', {
    numeric: true,
    sensitivity: 'base'
  });
}

const totalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function formatTotal(value) {
  return `$${totalFormatter.format(value)}`;
}

export function sortTableRows(rows, sortConfig = { column: '', direction: 'asc' }) {
  if (!sortConfig.column) return rows;
  const direction = sortConfig.direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => compareCellValues(a?.[sortConfig.column], b?.[sortConfig.column], sortConfig.column) * direction);
}

function getMoneyColumns(columns) {
  return columns.filter(isMoneyColumn);
}

function calculateColumnTotals(moneyColumns, rows) {
  const totals = {};

  for (const column of moneyColumns) {
    totals[column] = 0;
  }

  return totals;
}

function DataRow({ columns, gridTemplateColumns, isSelected, onRowDelete, onRowSelect, row, rowIndex }) {
  const isRejectedOrInvalid = /invalidado|rechazado/i.test(String(row['Estado del DTE'] || ''));

  return (
    <div
      className={`virtualRow ${rowIndex % 2 === 0 ? 'evenRow' : 'oddRow'} ${row.__isDuplicate ? 'duplicateRow' : ''} ${isRejectedOrInvalid ? 'alertRow' : ''} ${isSelected ? 'selectedRow' : ''}`}
      onClick={() => onRowSelect(row)}
      role="row"
      style={{ gridTemplateColumns, transform: `translateY(${rowIndex * ROW_HEIGHT}px)` }}
    >
      <div className={`virtualCell virtualActionsCell ${row.__isDuplicate ? 'duplicateCell' : ''}`} role="cell">
        <button
          className="virtualRowDeleteButton"
          onClick={(event) => {
            event.stopPropagation();
            onRowDelete?.(row);
          }}
          title="Borrar linea"
          type="button"
        >
          <Trash2 size={13} />
        </button>
      </div>
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
  && previous.onRowDelete === next.onRowDelete
  && previous.onRowSelect === next.onRowSelect
  && previous.row === next.row
  && previous.rowIndex === next.rowIndex
));

export function VirtualDataTable({
  columnFilters,
  columns,
  filterSourceRows,
  onColumnFilterChange,
  onRowDelete,
  onRowSelect,
  onSortConfigChange,
  rows,
  selectedRow,
  sortConfig = { column: '', direction: 'asc' }
}) {
  const [viewport, setViewport] = useState({ height: 480, scrollTop: 0 });
  const [scrollLeft, setScrollLeft] = useState(0);
  const [openFilter, setOpenFilter] = useState(null);
  const [filterPosition, setFilterPosition] = useState({ left: 0, top: 0 });
  const [filterSearch, setFilterSearch] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState({ from: '', to: '' });
  const [manualColumnWidths, setManualColumnWidths] = useState({});
  const [columnTotals, setColumnTotals] = useState({});
  const scrollFrameRef = useRef(0);
  const pendingViewportRef = useRef(viewport);
  const totalsJobRef = useRef(0);
  
  const sortedRows = useMemo(() => {
    return sortTableRows(rows, sortConfig);
  }, [rows, sortConfig]);

  const visibleRange = useMemo(
    () => getVisibleRange(viewport.scrollTop, viewport.height, sortedRows.length),
    [sortedRows.length, viewport]
  );
  const visibleRows = useMemo(
    () => sortedRows.slice(visibleRange.startIndex, visibleRange.endIndex),
    [sortedRows, visibleRange]
  );
  const autoColumnWidths = useMemo(
    () => columns.map((column) => getAutoColumnWidth(column, rows)),
    [columns, rows]
  );
  const columnWidths = useMemo(
    () => columns.map((column, index) => manualColumnWidths[column] || autoColumnWidths[index]),
    [autoColumnWidths, columns, manualColumnWidths]
  );
  const gridTemplateColumns = useMemo(
    () => `${ACTIONS_COLUMN_WIDTH}px ${columnWidths.map((width) => `${width}px`).join(' ')}`,
    [columnWidths]
  );
  const tableWidth = useMemo(
    () => ACTIONS_COLUMN_WIDTH + columnWidths.reduce((total, width) => total + width, 0),
    [columnWidths]
  );
  const moneyColumns = useMemo(() => getMoneyColumns(columns), [columns]);

  useEffect(() => {
    let cancelled = false;
    const jobId = totalsJobRef.current + 1;
    totalsJobRef.current = jobId;
    setColumnTotals({});

    if (!moneyColumns.length || !sortedRows.length) return () => {
      cancelled = true;
    };

    const nextTotals = calculateColumnTotals(moneyColumns, sortedRows);
    let rowIndex = 0;
    let timerId = 0;

    function processChunk() {
      const end = Math.min(sortedRows.length, rowIndex + TOTALS_CHUNK_SIZE);

      for (; rowIndex < end; rowIndex += 1) {
        const row = sortedRows[rowIndex];
        for (const column of moneyColumns) {
          nextTotals[column] += parseMoney(row[column]);
        }
      }

      if (cancelled || totalsJobRef.current !== jobId) return;

      if (rowIndex < sortedRows.length) {
        timerId = window.setTimeout(processChunk, 0);
        return;
      }

      setColumnTotals(Object.fromEntries(
        moneyColumns.map((column) => [column, formatTotal(nextTotals[column])])
      ));
    }

    timerId = window.setTimeout(processChunk, 0);

    return () => {
      cancelled = true;
      if (timerId) window.clearTimeout(timerId);
    };
  }, [moneyColumns, sortedRows]);

  useEffect(() => () => {
    if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
  }, []);

  const openFilterValues = useMemo(() => {
    if (!openFilter) return [];
    return Array.from(new Set(filterSourceRows.map((row) => String(row[openFilter] ?? '')))).sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  }, [filterSourceRows, openFilter]);
  const filterValuesByColumn = useMemo(() => {
    const entries = columns.map((column) => [
      column,
      Array.from(new Set(filterSourceRows.map((row) => String(row[column] ?? ''))))
    ]);
    return Object.fromEntries(entries);
  }, [columns, filterSourceRows]);

  const handleScroll = useCallback((event) => {
    const target = event.currentTarget;
    pendingViewportRef.current = {
      height: target.clientHeight,
      scrollTop: target.scrollTop
    };

    if (scrollFrameRef.current) return;
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = 0;
      setViewport(pendingViewportRef.current);
    });
  }, []);

const handleHorizontalScroll = useCallback((event) => {
  setScrollLeft(event.currentTarget.scrollLeft);
}, []);

function startColumnResize(event, column, currentWidth) {
  event.preventDefault();
  event.stopPropagation();

  const initialMouseX = event.clientX;
  const initialWidth = currentWidth;

  function handleMouseMove(moveEvent) {
    const difference = moveEvent.clientX - initialMouseX;
    const { min, max } = getColumnWidthBounds(column);

    const nextWidth = Math.min(
      Math.max(initialWidth + difference, min),
      max
    );

    setManualColumnWidths((current) => ({
      ...current,
      [column]: nextWidth
    }));
  }

  function handleMouseUp() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function resetColumnWidth(event, column) {
  event.preventDefault();
  event.stopPropagation();

  setManualColumnWidths((current) => {
    const nextWidths = { ...current };

    delete nextWidths[column];

    return nextWidths;
  });
}

  function toggleSort(column) {
    onSortConfigChange?.((current) => ({
      column,
      direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    setViewport((current) => ({ ...current, scrollTop: 0 }));
  }

  if (!sortedRows.length && !columns.length) {
    return (
      <div className="tableFrame" data-tour="home-data-table">
        <div className="empty">Sin datos cargados</div>
      </div>
    );
  }

  return (
    <div className="tableFrame">
      <div className="tableViewport" data-tour="home-data-table" onScroll={handleScroll}>
        <div
          className="virtualTable"
          role="table"
          style={{ transform: `translateX(${-scrollLeft}px)`, width: tableWidth }}
        >
          <div className="virtualTotals" role="row" style={{ gridTemplateColumns }}>
            <div className="virtualTotalCell virtualActionsTotalCell" role="cell" />
            {columns.map((column) => (
              <div className={`virtualTotalCell ${columnTotals[column] ? 'hasTotal' : ''}`} key={column} role="cell">
                {columnTotals[column] || ''}
              </div>
            ))}
          </div>
          <div className="virtualHeader" role="row" style={{ gridTemplateColumns }}>
            <div className="virtualHeadCell virtualActionsHeadCell" role="columnheader">
              ACCIONES
            </div>
            {columns.map((column, columnIndex) => (
              <div
                className={`virtualHeadCell ${PUBLIC_QUERY_COLUMNS.has(column) ? 'publicQueryHeadCell' : ''}`}
                key={column}
                onClick={() => toggleSort(column)}
                role="columnheader"
                title={`Ordenar ${column}`}
              >
                <span className="truncate">{column}</span>
                {sortConfig.column === column ? (
                  <span className="sortIndicator">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                ) : null}
                <button
                  className={`excelFilterButton ${hasActiveColumnFilter(columnFilters[column], filterValuesByColumn[column]) ? 'active' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    const rect = event.currentTarget.getBoundingClientRect();
                    setFilterPosition({
                      left: Math.max(8, Math.min(rect.right - 288, window.innerWidth - 304)),
                      top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 360))
                    });
                    setOpenFilter(openFilter === column ? null : column);
                    setFilterSearch('');
                    setDateRangeFilter({ from: '', to: '' });
                  }}
                  title={`Filtrar ${column}`}
                  type="button"
                >
                  v
                </button>
                {openFilter === column ? createPortal(
                  <FilterMenu
                    column={openFilter}
                    filterSearch={filterSearch}
                    onClose={() => setOpenFilter(null)}
                    onFilterSearchChange={setFilterSearch}
                    onColumnFilterChange={onColumnFilterChange}
                    onDateRangeChange={setDateRangeFilter}
                    selectedValues={columnFilters[openFilter] || []}
                    dateRange={dateRangeFilter}
                    position={filterPosition}
                    isDateFilter={isDateColumn(openFilter)}
                    values={openFilterValues}
                  />,
                  document.body
                ) : null}
                <span
                  className="columnResizeHandle"
                  onClick={(event) => event.stopPropagation()}
                  onDoubleClick={(event) => resetColumnWidth(event, column)}
                  onMouseDown={(event) => startColumnResize(event, column, columnWidths[columnIndex])}
                  onPointerDown={(event) => event.stopPropagation()}
                  title="Arrastrar para ajustar ancho. Doble click para autoajustar."
                />
              </div>
            ))}
          </div>
          <div className="virtualBody" role="rowgroup" style={{ height: sortedRows.length * ROW_HEIGHT + BOTTOM_SCROLL_PADDING }}>
            {visibleRows.map((row, index) => (
              <MemoDataRow
                columns={columns}
                gridTemplateColumns={gridTemplateColumns}
                isSelected={row === selectedRow}
                key={`${visibleRange.startIndex + index}`}
                onRowDelete={onRowDelete}
                onRowSelect={onRowSelect}
                row={row}
                rowIndex={visibleRange.startIndex + index}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="horizontalScrollbar" onScroll={handleHorizontalScroll}>
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
  onDateRangeChange,
  onFilterSearchChange,
  dateRange,
  position,
  isDateFilter,
  selectedValues,
  values
}) {
  const normalizedSearch = filterSearch.trim().toLowerCase();
  const matchingValues = normalizedSearch
    ? values.filter((value) => value.toLowerCase().includes(normalizedSearch))
    : values;
  const searchedValues = matchingValues.slice(0, 200);
  const isNoneSelected = selectedValues.includes(NO_FILTER_VALUES_SELECTED);
  const effectiveSelected = isNoneSelected ? [] : selectedValues.length ? selectedValues : values;
  const allValuesSelected = values.length > 0
    && effectiveSelected.length === values.length
    && values.every((value) => effectiveSelected.includes(value));

  function setColumnValues(nextValues) {
    onColumnFilterChange((filters) => ({
      ...filters,
      [column]: nextValues
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

  function applyDateRange(nextRange) {
    onDateRangeChange(nextRange);

    if (!nextRange.from && !nextRange.to) {
      setColumnValues(values);
      return;
    }

    const nextValues = values.filter((value) => {
      const comparableDate = parseFilterDate(value);
      if (!comparableDate) return false;
      if (nextRange.from && comparableDate < nextRange.from) return false;
      if (nextRange.to && comparableDate > nextRange.to) return false;
      return true;
    });
    setColumnValues(nextValues);
  }

  return (
    <div className="excelFilterMenu" onClick={(event) => event.stopPropagation()} style={{ left: position.left, top: position.top }}>
      <div className="excelFilterTitle">{column}</div>
      <input
        className="excelFilterSearch"
        onChange={handleSearchChange}
        placeholder="Buscar"
        value={filterSearch}
      />
      {isDateFilter ? (
        <div className="excelDateFilter">
          <label>
            Desde
            <input
              onChange={(event) => applyDateRange({ ...dateRange, from: event.target.value })}
              type="date"
              value={dateRange.from}
            />
          </label>
          <label>
            Hasta
            <input
              onChange={(event) => applyDateRange({ ...dateRange, to: event.target.value })}
              type="date"
              value={dateRange.to}
            />
          </label>
        </div>
      ) : null}
      <div className="excelFilterActions">
        <button onClick={() => setColumnValues(allValuesSelected ? [NO_FILTER_VALUES_SELECTED] : values)} type="button">
          Todos
        </button>
        <button onClick={(event) => {
          event.stopPropagation();
          onClose();
        }} type="button">
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

