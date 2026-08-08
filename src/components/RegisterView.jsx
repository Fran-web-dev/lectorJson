import { useMemo, useEffect, useRef, useState } from 'react';
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
    '03|CCF EMISOR VENTA',
    '07|COMPROBANTE DE RETENCION RECEPTOR',
    '09|DCL RECEPTOR'
  ]),
  providers: new Set([
    '03|CCF RECEPTOR COMPRA',
    '09|DCL RECEPTOR',
    '14|FSE EMISOR'
  ])
};

const IMPORTABLE_STRUCTURE_MESSAGES = {
  clients: 'Importe disponible solo para 01 FCF EMISOR, 03 CCF EMISOR VENTA, 07 COMPROBANTE DE RETENCION RECEPTOR y 09 DCL RECEPTOR.',
  providers: 'Importe disponible solo para 03 CCF RECEPTOR COMPRA, 09 DCL RECEPTOR y 14 FSE EMISOR.'
};

const CLIENT_TYPE_OPERATION_OPTIONS = [
  '0 PARA PERIODOS ANTERIORES A ENERO 2025',
  '01 GRAVADA',
  '02 NO GRAVADA O EXENTA',
  '03 EXCLUIDO O NO CONSTITUYE RENTA',
  '04 MIXTA (SE REFIERE CUANDO EN UN MISMO DOCUMENTO SE ENCUENTRE UNA OPERACION GRAVADA Y EXENTA.)',
  '12 INGRESOS QUE YA FUERON SUJETOS DE RETENCION EN F910',
  '13 SUJETOS PASIVOS EXCLUIDOS (ART. 6 LISR) E INGRESOS QUE NO CONSTITUYEN HECHO GENERADOR DEL ISR'
];

const CLIENT_TYPE_INCOME_OPTIONS = [
  '0 PARA PERIODOS ANTERIORES A ENERO 2025',
  '01 PROFESIONES, ARTES Y OFICIOS',
  '02 ACTIVIDADES DE SERVICIOS',
  '03 ACTIVIDADES COMERCIALES',
  '04 ACTIVIDADES INDUSTRIALES',
  '05 ACTIVIDADES AGROPECUARIAS',
  '06 UTILIDADES Y DIVIDENDOS',
  '07 EXPORTACIONES DE BIENES',
  '08 SERVICIOS REALIZADOS EN EL EXTERIOR Y UTILIZADOS EN EL SALVADOR',
  '09 EXPORTACIONES DE SERVICIOS',
  '10 OTRAS RENTAS GRAVABLES',
  '12 INGRESOS QUE YA FUERON SUJETOS DE RETENCION EN F910',
  '13 SUJETOS PASIVOS EXCLUIDOS (ART. 6 LISR) E INGRESOS QUE NO CONSTITUYEN HECHO GENERADOR DEL ISR'
];

const PROVIDER_TYPE_OPERATION_OPTIONS = [
  '1 GRAVADA',
  '2 NO GRAVADA O EXENTA',
  '3 EXCLUIDO O NO CONSTITUYE RENTA',
  '4 MIXTA (CONTRIBUYENTES QUE GOZAN DE REGIMENES ESPECIALES CON INCENTIVOS FISCALES)',
  '8 OPERACIONES INFORMADAS EN MAS DE 1 ANEXO',
  '9 EXCEPCIONES (INSTITUCIONES PUBLICAS, NO INSCRITOS A IVA, OPERACIONES NO DEDUCIBLES PARA RENTA, ENTRE OTROS.)',
  '0 CUANDO SE TRATE DE PERIODOS TRIBUTARIOS ANTERIORES A FEBRERO DE 2024'
];

const PROVIDER_CLASSIFICATION_OPTIONS = [
  '1 COSTO',
  '2 GASTO',
  '8 OPERACIONES INFORMADAS EN MAS DE 1 ANEXO',
  '9 EXCEPCIONES (INSTITUCIONES PUBLICAS, NO INSCRITOS A IVA, OPERACIONES NO DEDUCIBLES PARA RENTA, ENTRE OTROS.)',
  '0 CUANDO SE TRATE DE PERIODOS TRIBUTARIOS ANTERIORES A FEBRERO DE 2024'
];

const PROVIDER_SECTOR_OPTIONS = [
  '1 INDUSTRIA',
  '2 COMERCIO',
  '3 AGROPECUARIA',
  '4 SERVICIOS, PROFESIONES, ARTES Y OFICIOS',
  '8 OPERACIONES INFORMADAS EN MAS DE 1 ANEXO',
  '9 EXCEPCIONES (INSTITUCIONES PUBLICAS, NO INSCRITOS A IVA, OPERACIONES NO DEDUCIBLES PARA RENTA, ENTRE OTROS.)',
  '0 CUANDO SE TRATE DE PERIODOS TRIBUTARIOS ANTERIORES A FEBRERO DE 2024'
];

const PROVIDER_COST_EXPENSE_OPTIONS = [
  '1 GASTO DE VENTA SIN DONACION',
  '2 GASTO DE ADMINISTRACION SIN DONACION',
  '3 GASTOS FINANCIEROS SIN DONACION',
  '4 COSTO ARTICULOS PRODUCIDOS/COMPRADOS IMPORTACIONES/INTERNACIONES',
  '5 COSTO ARTICULOS PRODUCIDOS/COMPRADOS INTERNO',
  '6 COSTO INDIRECTOS DE FABRICACION',
  '7 MANO DE OBRA',
  '8 OPERACIONES INFORMADAS EN MAS DE 1 ANEXO',
  '9 EXCEPCIONES (INSTITUCIONES PUBLICAS, NO INSCRITOS A IVA, OPERACIONES NO DEDUCIBLES PARA RENTA, ENTRE OTROS.)',
  '0 CUANDO SE TRATE DE PERIODOS TRIBUTARIOS ANTERIORES A FEBRERO DE 2024'
];

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

function parseColumnWidth(width) {
  const parsedWidth = Number.parseInt(String(width || ''), 10);
  return Number.isFinite(parsedWidth) ? parsedWidth : 120;
}

function getRegisterColumnOptions(type, header, value = '') {
  const options = type === 'clients'
    ? header === 'TIPO DE OPERACION'
      ? CLIENT_TYPE_OPERATION_OPTIONS
      : header === 'TIPO DE INGRESO'
        ? CLIENT_TYPE_INCOME_OPTIONS
        : []
    : type === 'providers'
      ? header === 'TIPO DE OPERACION (Renta)'
        ? PROVIDER_TYPE_OPERATION_OPTIONS
        : header === 'CLASIFICACION (Renta)'
          ? PROVIDER_CLASSIFICATION_OPTIONS
          : header === 'SECTOR (Renta)'
            ? PROVIDER_SECTOR_OPTIONS
            : header === 'TIPO DE COSTO/GASTO (Renta)'
              ? PROVIDER_COST_EXPENSE_OPTIONS
              : []
      : [];
  if (!options.length) return [];
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue || options.includes(normalizedValue)) return options;
  return [normalizedValue, ...options];
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
  const digits = rawValue.replace(/\D/g, '');

  return {
    nit: digits.length === 14 ? digits : '',
    dui: digits.length === 9 ? digits : ''
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

    if (sourceTypeCode === '09') {
      const document = splitProviderDocument(row['NIT Emisor'] || row['NIT emisor']);

      return {
        NRC: row['NRC Emisor'] || row['NRC emisor'] || '',
        NIT: document.nit,
        DUI: document.dui,
        'NOMBRE DEL PROVEEDOR': row['Nombre emisor'] || '',
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

  if (sourceTypeCode === '07' || sourceTypeCode === '09') {
    return {
      NRC: row['NRC Emisor'] || row['NRC emisor'] || '',
      NIT: row['NIT Emisor'] || row['NIT emisor'] || '',
      'NOMBRE DEL CLIENTE': row['Nombre emisor'] || row['Nombre Emisor'] || '',
      'TIPO DE OPERACION': '',
      'TIPO DE INGRESO': ''
    };
  }

  return {
    NRC: row['NRC receptor'] || row['NRC Receptor'] || '',
    NIT: row['NIT receptor'] || row['NIT Receptor'] || '',
    'NOMBRE DEL CLIENTE': row['Nombre receptor'] || row['Nombre Receptor'] || '',
    'TIPO DE OPERACION': '',
    'TIPO DE INGRESO': ''
  };
}

export function RegisterView({ sourceRows = [], sourceStructureName = '', sourceTypeCode = '', type }) {
  const config = REGISTER_CONFIG[type] || REGISTER_CONFIG.clients;
  const [manualColumnWidths, setManualColumnWidths] = useState({});
  const columnWidths = useMemo(
    () => config.columns.map((column) => manualColumnWidths[column.header] || parseColumnWidth(column.width)),
    [config.columns, manualColumnWidths]
  );
  const gridTemplateColumns = columnWidths.map((width) => `${width}px`).join(' ');
  const [rows, setRows] = useState(() => loadRows(type, config.columns));
  const [draftRow, setDraftRow] = useState(() => createEmptyRow(config.columns));
  const [filters, setFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [activeComboKey, setActiveComboKey] = useState('');
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

  function startColumnResize(event, column, currentWidth) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const minWidth = column.header === 'CORR.' ? 56 : 90;

    function handleMouseMove(moveEvent) {
      const nextWidth = Math.max(minWidth, currentWidth + moveEvent.clientX - startX);
      setManualColumnWidths((current) => ({
        ...current,
        [column.header]: Math.round(nextWidth)
      }));
    }

    function handleMouseUp() {
      document.body.classList.remove('isColumnResizing');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    document.body.classList.add('isColumnResizing');
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function resetColumnWidth(event, column) {
    event.preventDefault();
    event.stopPropagation();
    setManualColumnWidths((current) => {
      const next = { ...current };
      delete next[column.header];
      return next;
    });
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
    setActiveComboKey('');
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
    <section className="registerView" data-tour="register-view">
      <div className="registerSheet">
        <div className="registerToolbar" data-tour="register-toolbar">
          <h1 className="registerTitle">{config.title}</h1>
          <div className="registerActions">
            {message ? <span className="registerMessage">{message}</span> : null}
            <button className="actionButton" data-tour="register-add-button" onClick={openAddModal} type="button">
              <Plus size={16} /> AGREGAR
            </button>
            <button className="actionButton" data-tour="register-edit-button" onClick={toggleEditMode} type="button">
              {isEditing ? <Check size={16} /> : <Pencil size={16} />}
              {isEditing ? 'GUARDAR' : 'EDITAR'}
            </button>
            <button className="actionButton dangerActionButton" data-tour="register-clear-button" onClick={openClearConfirm} type="button">
              <Trash2 size={16} /> LIMPIAR TODO
            </button>
            <button className="actionButton" data-tour="register-template-button" onClick={exportExcelTemplate} type="button">
              <FileSpreadsheet size={16} /> PLANTILLA EXCEL
            </button>
            <button className="actionButton" data-tour="register-export-button" onClick={exportRegisterTable} type="button">
              <FileSpreadsheet size={16} /> EXPORTAR TABLA EXCEL
            </button>
            <button className="actionButton" data-tour="register-import-button" onClick={importExcelTemplate} type="button">
              <FileSpreadsheet size={16} /> IMPORTAR EXCEL
            </button>
            <button className="actionButton" data-tour="register-load-button" onClick={importRows} type="button">
              <Download size={16} /> CARGAR
            </button>
          </div>
        </div>
        <div className="registerTableViewport">
          <div className={`registerTable ${config.tone}`} style={{ gridTemplateColumns }}>
            {config.columns.map((column, columnIndex) => (
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
                <span
                  className="columnResizeHandle registerColumnResizeHandle"
                  onDoubleClick={(event) => resetColumnWidth(event, column)}
                  onMouseDown={(event) => startColumnResize(event, column, columnWidths[columnIndex])}
                  title="Arrastrar para ajustar ancho. Doble click para autoajustar."
                />
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
                    <RegisterFieldControl
                      activeComboKey={activeComboKey}
                      className="registerEditInput"
                      comboKey={`${rowIndex}-${column.header}`}
                      column={column}
                      onChange={(value) => updateExistingCell(row, column.header, value)}
                      options={getRegisterColumnOptions(type, column.header, row[column.header])}
                      setActiveComboKey={setActiveComboKey}
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
                  <RegisterFieldControl
                    column={column}
                    options={getRegisterColumnOptions(type, column.header, draftRow[column.header])}
                    value={draftRow[column.header] || ''}
                    onChange={(value) => setDraftRow((currentRow) => ({
                      ...currentRow,
                      [column.header]: toRegisterUppercase(value)
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

function RegisterFieldControl({
  activeComboKey = '',
  className = '',
  column,
  comboKey = '',
  onChange,
  options = [],
  setActiveComboKey,
  value
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const closeTimerRef = useRef(null);
  const comboRef = useRef(null);
  const isControlledCombo = Boolean(comboKey && setActiveComboKey);
  const comboIsOpen = isControlledCombo ? activeComboKey === comboKey : isOpen;

  function openOptions() {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    const rect = comboRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuStyle({
        left: `${rect.left}px`,
        top: `${rect.bottom + 2}px`,
        width: `${Math.max(rect.width, 360)}px`
      });
    }
    if (isControlledCombo) {
      setActiveComboKey(comboKey);
    } else {
      setIsOpen(true);
    }
  }

  function scheduleClose() {
    closeTimerRef.current = window.setTimeout(() => {
      if (isControlledCombo) {
        setActiveComboKey('');
      } else {
        setIsOpen(false);
      }
    }, 140);
  }

  if (options.length) {
    return (
      <div className={`registerCombobox ${comboIsOpen ? 'open' : ''}`} ref={comboRef}>
        <input
          className={className}
          onBlur={scheduleClose}
          onClick={openOptions}
          onChange={(event) => onChange(event.target.value)}
          onFocus={openOptions}
          placeholder="SELECCIONE O PEGUE UN VALOR..."
          value={value}
        />
        <button
          className="registerComboboxButton"
          onMouseDown={(event) => {
            event.preventDefault();
            if (comboIsOpen) {
              if (isControlledCombo) setActiveComboKey('');
              else setIsOpen(false);
            } else {
              openOptions();
            }
          }}
          tabIndex={-1}
          type="button"
        >
          v
        </button>
        {comboIsOpen ? (
          <div className="registerComboboxMenu" style={menuStyle}>
            {options.map((option) => (
              <button
                className="registerComboboxOption"
                key={option}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(option);
                  if (isControlledCombo) setActiveComboKey('');
                  else setIsOpen(false);
                }}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <input
      className={className}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
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
