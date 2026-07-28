import { useMemo, useEffect, useState } from 'react';
import { Check, Download, Pencil, Plus, X } from 'lucide-react';

const INITIAL_ROW_COUNT = 14;

const REGISTER_CONFIG = {
  clients: {
    title: 'REGISTRO DE CLIENTES',
    columns: [
      { header: 'CORR.', width: '72px' },
      { header: 'NRC', width: '140px' },
      { header: 'NIT', width: '150px' },
      { header: 'NOMBRE DEL CLIENTE', width: '380px' },
      { header: 'TIPO DE OPERACION', width: '190px' },
      { header: 'TIPO DE INGRESO', width: '190px' }
    ],
    tone: 'client'
  },
  providers: {
    title: 'REGISTRO DE PROVEEDORES',
    columns: [
      { header: 'CORR.', width: '72px' },
      { header: 'NRC', width: '140px' },
      { header: 'NIT', width: '150px' },
      { header: 'DUI', width: '135px' },
      { header: 'NOMBRE DEL PROVEEDOR', width: '380px' },
      { header: 'TIPO DE OPERACION (Renta)', width: '220px' },
      { header: 'CLASIFICACION (Renta)', width: '220px' },
      { header: 'SECTOR (Renta)', width: '190px' },
      { header: 'TIPO DE COSTO/GASTO (Renta)', width: '260px' }
    ],
    tone: 'provider'
  }
};

const IMPORTABLE_STRUCTURES = new Set([
  '01|FACTURA CONSUMIDOR FINAL EMISOR',
  '03|CCF EMISOR VENTA'
]);

function createRows(columns, count = INITIAL_ROW_COUNT) {
  return Array.from({ length: count }, () => createEmptyRow(columns));
}

function createEmptyRow(columns) {
  return Object.fromEntries(columns.map((column) => [column.header, '']));
}

function getStorageKey(type) {
  return `dte-registers-${type}`;
}

function loadRows(type, columns) {
  try {
    const savedRows = JSON.parse(window.localStorage.getItem(getStorageKey(type)) || '[]');
    if (!Array.isArray(savedRows) || !savedRows.length) return createRows(columns);
    return normalizeRows(savedRows.map((row) => ({
      ...createEmptyRow(columns),
      ...row
    })), columns);
  } catch {
    return createRows(columns);
  }
}

function hasUsefulData(row, columns) {
  return columns.some((column, index) => index > 0 && String(row[column.header] || '').trim());
}

function normalizeRows(rows, columns) {
  const filledRows = rows.filter((row) => hasUsefulData(row, columns));
  const emptyRowsNeeded = Math.max(INITIAL_ROW_COUNT - filledRows.length, 1);
  return [
    ...filledRows,
    ...createRows(columns, emptyRowsNeeded)
  ];
}

function normalizeKey(value) {
  return String(value || '').trim().toUpperCase();
}

function getRegisterKey(row, type) {
  const nameKey = type === 'providers' ? row['NOMBRE DEL PROVEEDOR'] : row['NOMBRE DEL CLIENTE'];
  return normalizeKey(row.NIT) || normalizeKey(row.NRC) || normalizeKey(nameKey);
}

function importableStructureKey(typeCode, structureName) {
  return `${typeCode}|${structureName}`;
}

function applyRegisterFilters(rows, filters, columns) {
  const activeFilters = Object.entries(filters).filter(([, values]) => values?.length);
  if (!activeFilters.length) return rows;

  return rows.filter((row) => {
    if (!hasUsefulData(row, columns)) return true;
    return activeFilters.every(([column, values]) => values.includes(String(row[column] || '')));
  });
}

function mapSourceRowToRegister(row, type) {
  if (type === 'providers') {
    return {
      NRC: row['NRC emisor'] || '',
      NIT: row['NIT emisor'] || '',
      DUI: '',
      'NOMBRE DEL PROVEEDOR': row['Nombre emisor'] || '',
      'TIPO DE OPERACION (Renta)': '',
      'CLASIFICACION (Renta)': '',
      'SECTOR (Renta)': '',
      'TIPO DE COSTO/GASTO (Renta)': ''
    };
  }

  return {
    NRC: row['NRC receptor'] || '',
    NIT: row['NIT receptor'] || '',
    'NOMBRE DEL CLIENTE': row['Nombre receptor'] || '',
    'TIPO DE OPERACION': '',
    'TIPO DE INGRESO': ''
  };
}

export function RegisterView({ sourceRows = [], sourceStructureName = '', sourceTypeCode = '', type }) {
  const config = REGISTER_CONFIG[type] || REGISTER_CONFIG.clients;
  const gridTemplateColumns = config.columns.map((column) => column.width).join(' ');
  const [rows, setRows] = useState(() => loadRows(type, config.columns));
  const [draftRow, setDraftRow] = useState(() => createEmptyRow(config.columns));
  const [filters, setFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState('');
  const visibleRows = useMemo(
    () => applyRegisterFilters(rows, filters, config.columns),
    [config.columns, filters, rows]
  );
  const openFilterValues = useMemo(() => {
    if (!openFilter) return [];
    return Array.from(new Set(
      rows
        .filter((row) => hasUsefulData(row, config.columns))
        .map((row) => String(row[openFilter] || ''))
    )).sort((a, b) => a.localeCompare(b, 'es'));
  }, [config.columns, openFilter, rows]);

  useEffect(() => {
    setRows(loadRows(type, config.columns));
    setDraftRow(createEmptyRow(config.columns));
    setFilters({});
    setOpenFilter(null);
    setFilterSearch('');
    setIsEditing(false);
    setMessage('');
  }, [config.columns, type]);

  useEffect(() => {
    window.localStorage.setItem(getStorageKey(type), JSON.stringify(rows));
  }, [rows, type]);

  function openAddModal() {
    setDraftRow(createEmptyRow(config.columns));
    setShowAddModal(true);
  }

  function saveDraftRow() {
    if (!hasUsefulData(draftRow, config.columns)) {
      setMessage('Complete al menos un campo antes de guardar.');
      return;
    }

    setRows((currentRows) => normalizeRows([draftRow, ...currentRows], config.columns));
    setShowAddModal(false);
    setMessage('Registro agregado correctamente.');
  }

  function updateExistingCell(targetRow, columnHeader, value) {
    setRows((currentRows) => currentRows.map((row) => (
      row === targetRow ? { ...row, [columnHeader]: value } : row
    )));
  }

  function toggleEditMode() {
    if (isEditing) {
      setRows((currentRows) => normalizeRows(currentRows, config.columns));
      setMessage('Cambios guardados.');
      setIsEditing(false);
      return;
    }

    setMessage('Edicion activada.');
    setIsEditing(true);
  }

  function importRows() {
    if (!IMPORTABLE_STRUCTURES.has(importableStructureKey(sourceTypeCode, sourceStructureName))) {
      setMessage('Importe disponible solo para 01 FACTURA CONSUMIDOR FINAL EMISOR y 03 CCF EMISOR VENTA.');
      return;
    }

    const importedRows = sourceRows
      .map((sourceRow) => ({
        ...createEmptyRow(config.columns),
        ...mapSourceRowToRegister(sourceRow, type)
      }))
      .filter((row) => hasUsefulData(row, config.columns));

    if (!importedRows.length) {
      setMessage('No se encontraron datos para importar desde la tabla de inicio.');
      return;
    }

    setRows((currentRows) => {
      const filledRows = currentRows.filter((row) => hasUsefulData(row, config.columns));
      const existingKeys = new Set(filledRows.map((row) => getRegisterKey(row, type)).filter(Boolean));
      const uniqueRows = importedRows.filter((row) => {
        const key = getRegisterKey(row, type);
        if (!key || existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

      setMessage(`${uniqueRows.length} registro(s) importado(s).`);
      return uniqueRows.length ? normalizeRows([...uniqueRows, ...filledRows], config.columns) : currentRows;
    });
  }

  return (
    <section className="registerView">
      <div className="registerSheet">
        <div className="registerToolbar">
          <h1 className="registerTitle">{config.title}</h1>
          <div className="registerActions">
            {message ? <span className="registerMessage">{message}</span> : null}
            <button className="actionButton" onClick={openAddModal} type="button">
              <Plus size={16} /> AGREGAR
            </button>
            <button className="actionButton" onClick={toggleEditMode} type="button">
              {isEditing ? <Check size={16} /> : <Pencil size={16} />}
              {isEditing ? 'GUARDAR' : 'EDITAR'}
            </button>
            <button className="actionButton" onClick={importRows} type="button">
              <Download size={16} /> IMPORTAR
            </button>
          </div>
        </div>
        <div className="registerTable" style={{ gridTemplateColumns }}>
          {config.columns.map((column) => (
            <div className={`registerHeadCell ${config.tone}`} key={column.header}>
              <span>{column.header}</span>
              {column.header !== 'CORR.' ? (
                <button
                  className={`excelFilterButton ${filters[column.header]?.length ? 'active' : ''}`}
                  onClick={() => {
                    setOpenFilter(openFilter === column.header ? null : column.header);
                    setFilterSearch('');
                  }}
                  title={`Filtrar ${column.header}`}
                  type="button"
                >
                  v
                </button>
              ) : null}
              {openFilter === column.header ? (
                <RegisterFilterMenu
                  column={column.header}
                  filterSearch={filterSearch}
                  onClose={() => setOpenFilter(null)}
                  onFilterSearchChange={setFilterSearch}
                  onFiltersChange={setFilters}
                  selectedValues={filters[column.header] || []}
                  values={openFilterValues}
                />
              ) : null}
            </div>
          ))}
          {visibleRows.flatMap((row, rowIndex) => (
            config.columns.map((column, columnIndex) => (
              <div
                className={`registerCell ${rowIndex % 2 === 0 ? 'odd' : 'even'}`}
                key={`${rowIndex}-${column.header}`}
              >
                {columnIndex === 0 ? (
                  rowIndex + 1
                ) : isEditing && hasUsefulData(row, config.columns) ? (
                  <input
                    className="registerEditInput"
                    onChange={(event) => updateExistingCell(row, column.header, event.target.value)}
                    value={row[column.header] || ''}
                  />
                ) : (
                  row[column.header] || ''
                )}
              </div>
            ))
          ))}
        </div>
      </div>
      {showAddModal ? (
        <div className="registerModalBackdrop">
          <div className="registerModal" role="dialog" aria-modal="true" aria-labelledby="register-modal-title">
            <div className="registerModalHeader">
              <h2 id="register-modal-title">Agregar registro</h2>
              <button className="modalIconButton" onClick={() => setShowAddModal(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <div className="registerFormGrid">
              {config.columns.slice(1).map((column) => (
                <label className="registerFormField" key={column.header}>
                  <span>{column.header}</span>
                  <input
                    value={draftRow[column.header] || ''}
                    onChange={(event) => setDraftRow((currentRow) => ({
                      ...currentRow,
                      [column.header]: event.target.value
                    }))}
                  />
                </label>
              ))}
            </div>
            <div className="registerModalActions">
              <button className="actionButton" onClick={() => setShowAddModal(false)} type="button">
                <X size={16} /> Cancelar
              </button>
              <button className="actionButton" onClick={saveDraftRow} type="button">
                <Check size={16} /> Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RegisterFilterMenu({
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
  const selectedSet = new Set(selectedValues);

  function setColumnValues(nextValues) {
    onFiltersChange((currentFilters) => ({
      ...currentFilters,
      [column]: nextValues
    }));
  }

  function toggleValue(value) {
    const nextValues = selectedSet.has(value)
      ? selectedValues.filter((selectedValue) => selectedValue !== value)
      : [...selectedValues, value];
    setColumnValues(nextValues);
  }

  return (
    <div className="excelFilterMenu registerFilterMenu">
      <div className="excelFilterTitle">{column}</div>
      <input
        className="excelFilterSearch"
        onChange={(event) => onFilterSearchChange(event.target.value)}
        placeholder="Buscar..."
        value={filterSearch}
      />
      <div className="excelFilterActions">
        <button onClick={() => setColumnValues(values)} type="button">Todo</button>
        <button onClick={() => setColumnValues([])} type="button">Limpiar</button>
        <button onClick={onClose} type="button">Cerrar</button>
      </div>
      <div className="excelFilterValues">
        {matchingValues.map((value) => (
          <label className="excelFilterOption" key={value || '(vacio)'}>
            <input
              checked={selectedSet.has(value)}
              onChange={() => toggleValue(value)}
              type="checkbox"
            />
            <span className="truncate">{value || '(vacio)'}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
