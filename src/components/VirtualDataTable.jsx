import { memo, useMemo, useState } from 'react';

const ROW_HEIGHT = 72;
const HEADER_HEIGHT = 42;
const OVERSCAN = 8;
const DEFAULT_COLUMN_WIDTH = 180;
const COLUMN_WIDTHS = {
  Archivo: 180,
  Carpeta: 160,
  'Tipo Documento': 260,
  'Tipo DTE': 90,
  Hora: 110,
  Fecha: 130,
  'Numero de Control': 300,
  'Numero del Documento': 320,
  'Serie del Documento': 300,
  'NRC emisor': 130,
  'NIT emisor': 180,
  'NRC receptor': 140,
  'Nombre receptor': 300,
  'Nombre emisor': 320,
  'Cant,NP,PU,VTAGR': 620,
  'Total Gravado': 160,
  'Total Exenta': 150,
  'Total no Sujetas': 170,
  'Desc. Gravado': 150,
  'Desc. no Sujeta': 160,
  'Desc. Exenta': 150,
  'Total Desc.': 150,
  'Sub-total': 150,
  'Credito Fiscal': 160,
  'Monto total de la operacion': 230,
  FOVIAL: 130,
  COTRANS: 130,
  Percepciones: 150,
  'Retencion Renta': 160,
  'Total de Compra': 170,
  'Valor en Letras': 280,
  'Condicion de la operacion': 220,
  Observaciones: 360,
  Item: 90,
  'Tipo Item': 100,
  Cantidad: 100,
  Codigo: 180,
  Descripcion: 360,
  'Precio Unitario': 150,
  'Descuento Item': 150,
  'Venta Gravada': 150,
  Compra: 150
};

function getVisibleRange(scrollTop, viewportHeight, rowCount) {
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(rowCount, startIndex + visibleCount);
  return { endIndex, startIndex };
}

function getColumnWidth(column) {
  if (column.startsWith('item.')) return 220;
  if (column.includes('.')) return 240;
  return COLUMN_WIDTHS[column] || DEFAULT_COLUMN_WIDTH;
}

function DataRow({ columns, gridTemplateColumns, row, rowIndex }) {
  return (
    <div
      className={`virtualRow ${row.__isDuplicate ? 'duplicateRow' : ''}`}
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

const MemoDataRow = memo(DataRow);

export function VirtualDataTable({ columnFilters, columns, filterSourceRows, onColumnFilterChange, rows }) {
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
  const gridTemplateColumns = useMemo(
    () => columns.map((column) => `${getColumnWidth(column)}px`).join(' '),
    [columns]
  );
  const tableWidth = useMemo(
    () => columns.reduce((total, column) => total + getColumnWidth(column), 0),
    [columns]
  );
  const uniqueValuesByColumn = useMemo(() => {
    const values = {};
    for (const column of columns) {
      values[column] = Array.from(new Set(filterSourceRows.map((row) => String(row[column] ?? '')))).sort((a, b) =>
        a.localeCompare(b, 'es')
      );
    }
    return values;
  }, [columns, filterSourceRows]);

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
          <div className="virtualHeader" role="row" style={{ gridTemplateColumns }}>
            {columns.map((column) => (
              <div className="virtualHeadCell" key={column} role="columnheader">
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
                    values={uniqueValuesByColumn[openFilter] || []}
                  />
                ) : null}
              </div>
            ))}
          </div>
          <div className="virtualBody" role="rowgroup" style={{ height: rows.length * ROW_HEIGHT + HEADER_HEIGHT }}>
            {visibleRows.map((row, index) => (
              <MemoDataRow
                columns={columns}
                gridTemplateColumns={gridTemplateColumns}
                key={`${visibleRange.startIndex + index}`}
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
