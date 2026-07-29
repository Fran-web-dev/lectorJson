import { useMemo, useEffect, useState } from 'react';
import { Check, Download, FileSpreadsheet, Pencil, Plus, Trash2, X } from 'lucide-react';

const INITIAL_ROW_COUNT = 14;
const REGISTER_CLEAR_KEY = '1234';

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

const IMPORTABLE_STRUCTURES = {
  clients: new Set([
    '01|FCF EMISOR',
    '03|CCF EMISOR VENTA'
  ]),
  providers: new Set([
    '03|CCF RECEPTOR COMPRA',
    '14|FSE EMISOR'
  ])
};

const IMPORTABLE_STRUCTURE_MESSAGES = {
  clients: 'Importe disponible solo para 01 FCF EMISOR y 03 CCF EMISOR VENTA.',
  providers: 'Importe disponible solo para 03 CCF RECEPTOR COMPRA y 14 FSE EMISOR.'
};

function createRows(columns, count = INITIAL_ROW_COUNT) {
  return Array.from({ length: count }, () => createEmptyRow(columns));
}

function createEmptyRow(columns) {
  return Object.fromEntries(columns.map((column) => [column.header, '']));
}

function toRegisterUppercase(value) {
  return String(value || '').toLocaleUpperCase('es-SV');
}

function normalizeRegisterRow(row, columns) {
  return Object.fromEntries(columns.map((column, index) => [
    column.header,
    index === 0 ? '' : toRegisterUppercase(row[column.header])
  ]));
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
  const normalizedRows = rows.map((row) => normalizeRegisterRow(row, columns));
  const filledRows = normalizedRows.filter((row) => hasUsefulData(row, columns));
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

function splitProviderDocument(value) {
  const rawValue = String(value || '').trim();
  const digitCount = rawValue.replace(/\D/g, '').length;

  return {
    nit: digitCount === 14 ? rawValue : '',
    dui: digitCount >= 9 && digitCount !== 14 ? rawValue : ''
  };
}

function mapSourceRowToRegister(row, type, sourceTypeCode) {
  if (type === 'providers') {
    if (sourceTypeCode === '14') {
      const document = splitProviderDocument(row['Doc ID Sujeto Excluido']);

      return {
        NRC: '',
        NIT: document.nit,
        DUI: document.dui,
        'NOMBRE DEL PROVEEDOR': row['Nombre sujetoExcluido'] || '',
        'TIPO DE OPERACION (Renta)': '',
        'CLASIFICACION (Renta)': '',
        'SECTOR (Renta)': '',
        'TIPO DE COSTO/GASTO (Renta)': ''
      };
    }

    const document = splitProviderDocument(row['NIT emisor']);

    return {
      NRC: row['NRC emisor'] || '',
      NIT: document.nit,
      DUI: document.dui,
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
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
    setShowClearConfirm(false);
    setClearPassword('');
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
      row === targetRow ? { ...row, [columnHeader]: toRegisterUppercase(value) } : row
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

  function mergeImportedRegisterRows(importedRows, successMessage) {
    const normalizedImportedRows = importedRows
      .map((row) => normalizeRegisterRow({
        ...createEmptyRow(config.columns),
        ...row
      }, config.columns))
      .filter((row) => hasUsefulData(row, config.columns));

    if (!normalizedImportedRows.length) {
      setMessage('No se encontraron registros validos para importar.');
      return;
    }

    setRows((currentRows) => {
      const filledRows = currentRows.filter((row) => hasUsefulData(row, config.columns));
      const existingKeys = new Set(filledRows.map((row) => getRegisterKey(row, type)).filter(Boolean));
      const uniqueRows = normalizedImportedRows.filter((row) => {
        const key = getRegisterKey(row, type);
        if (!key || existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

      setMessage(successMessage(uniqueRows.length));
      return uniqueRows.length ? normalizeRows([...uniqueRows, ...filledRows], config.columns) : currentRows;
    });
  }

  function importRows() {
    const importableStructures = IMPORTABLE_STRUCTURES[type] || IMPORTABLE_STRUCTURES.clients;
    if (!importableStructures.has(importableStructureKey(sourceTypeCode, sourceStructureName))) {
      setMessage(IMPORTABLE_STRUCTURE_MESSAGES[type] || IMPORTABLE_STRUCTURE_MESSAGES.clients);
      return;
    }

    const importedRows = sourceRows
      .map((sourceRow) => ({
        ...createEmptyRow(config.columns),
        ...mapSourceRowToRegister(sourceRow, type, sourceTypeCode)
      }))
      .filter((row) => hasUsefulData(row, config.columns));

    if (!importedRows.length) {
      setMessage('No se encontraron datos para importar desde la tabla de inicio.');
      return;
    }

    mergeImportedRegisterRows(importedRows, (count) => `${count} registro(s) importado(s).`);
  }

  async function exportExcelTemplate() {
    try {
      if (!window.dteApp?.exportRegisterTemplate) {
        setMessage('Reinicie la aplicacion para generar plantillas.');
        return;
      }

      const filePath = await window.dteApp.exportRegisterTemplate({
        columns: config.columns.map((column) => column.header),
        title: config.title
      });
      if (filePath) setMessage(`Plantilla creada: ${filePath}`);
    } catch (error) {
      setMessage(`No se pudo crear la plantilla: ${error.message}`);
    }
  }

  async function exportRegisterTable() {
    try {
      if (!window.dteApp?.exportRegisterTable) {
        setMessage('Reinicie la aplicacion para exportar registros.');
        return;
      }

      const exportRows = visibleRows
        .filter((row) => hasUsefulData(row, config.columns))
        .map((row, index) => ({
          ...row,
          'CORR.': String(index + 1)
        }));

      if (!exportRows.length) {
        setMessage('No hay registros con datos para exportar.');
        return;
      }

      const filePath = await window.dteApp.exportRegisterTable({
        columns: config.columns.map((column) => column.header),
        rows: exportRows,
        title: config.title,
        tone: config.tone
      });
      if (filePath) setMessage(`Tabla exportada: ${filePath}`);
    } catch (error) {
      setMessage(`No se pudo exportar la tabla: ${error.message}`);
    }
  }

  async function importExcelTemplate() {
    try {
      if (!window.dteApp?.importRegisterExcel) {
        setMessage('Reinicie la aplicacion para importar Excel.');
        return;
      }

      const importedRows = await window.dteApp.importRegisterExcel({
        columns: config.columns.map((column) => column.header),
        title: config.title
      });
      if (!importedRows) return;
      mergeImportedRegisterRows(importedRows, (count) => `${count} registro(s) importado(s) desde Excel.`);
    } catch (error) {
      setMessage(`No se pudo importar Excel: ${error.message}`);
    }
  }

  function deleteRow(targetRow) {
    setRows((currentRows) => normalizeRows(
      currentRows.filter((row) => row !== targetRow),
      config.columns
    ));
    setMessage('Registro eliminado.');
  }

  function clearRows() {
    setRows(createRows(config.columns));
    setFilters({});
    setOpenFilter(null);
    setFilterSearch('');
    setIsEditing(false);
    setShowClearConfirm(false);
    setClearPassword('');
    setMessage('Todos los registros fueron eliminados.');
  }

  function openClearConfirm() {
    setClearPassword('');
    setShowClearConfirm(true);
  }

  function closeClearConfirm() {
    setShowClearConfirm(false);
    setClearPassword('');
  }

  function confirmClearRows() {
    if (clearPassword !== REGISTER_CLEAR_KEY) {
      setMessage('Clave incorrecta. No se eliminaron registros.');
      return;
    }

    clearRows();
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
            <button className="actionButton dangerActionButton" onClick={openClearConfirm} type="button">
              <Trash2 size={16} /> LIMPIAR TODO
            </button>
            <button className="actionButton" onClick={exportExcelTemplate} type="button">
              <FileSpreadsheet size={16} /> PLANTILLA EXCEL
            </button>
            <button className="actionButton" onClick={exportRegisterTable} type="button">
              <FileSpreadsheet size={16} /> EXPORTAR TABLA EXCEL
            </button>
            <button className="actionButton" onClick={importExcelTemplate} type="button">
              <FileSpreadsheet size={16} /> IMPORTAR EXCEL
            </button>
            <button className="actionButton" onClick={importRows} type="button">
              <Download size={16} /> IMPORTAR
            </button>
          </div>
        </div>
        <div className={`registerTable ${config.tone}`} style={{ gridTemplateColumns }}>
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
                  <div className="registerCorrCell">
                    <span>{rowIndex + 1}</span>
                    <button
                      className="registerDeleteButton"
                      disabled={!hasUsefulData(row, config.columns)}
                      onClick={() => deleteRow(row)}
                      title="Borrar registro"
                      type="button"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
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
                      [column.header]: toRegisterUppercase(event.target.value)
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
      {showClearConfirm ? (
        <div className="registerModalBackdrop">
          <div className="registerModal clearConfirmModal" role="dialog" aria-modal="true" aria-labelledby="clear-modal-title">
            <div className="registerModalHeader">
              <h2 id="clear-modal-title">Estas seguro que quieres borrar todo?</h2>
              <button className="modalIconButton" onClick={closeClearConfirm} type="button">
                <X size={18} />
              </button>
            </div>
            <p className="clearConfirmText">
              Esta accion eliminara todos los registros guardados de esta tabla. Para confirmar, escriba la clave
              <strong> 1234 </strong>
              en el campo de abajo.
            </p>
            <label className="registerFormField">
              <span>Clave de confirmacion</span>
              <input
                autoFocus
                onChange={(event) => setClearPassword(event.target.value)}
                placeholder="Escriba la clave de confirmacion"
                type="password"
                value={clearPassword}
              />
            </label>
            <div className="registerModalActions">
              <button className="actionButton" onClick={closeClearConfirm} type="button">
                <X size={16} /> NO
              </button>
              <button className="actionButton dangerActionButton" disabled={clearPassword !== REGISTER_CLEAR_KEY} onClick={confirmClearRows} type="button">
                <Trash2 size={16} /> SI
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
