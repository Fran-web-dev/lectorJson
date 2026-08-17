import { Braces, Download, FilePlus2, Menu, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  CUSTOM_JSON_STRUCTURES_KEY,
  CUSTOM_JSON_STRUCTURES_UPDATED_EVENT
} from '../lib/dteStructureOptions.js';
import { NAMED_STRUCTURES_BY_DTE, PUBLIC_QUERY_COLUMNS } from '../lib/dteStructures.js';

const DEFAULT_BLUE_COLUMNS = [
  { name: 'Fecha', path: 'identificacion.fecEmi', color: 'blue' },
  { name: 'Numero de Control', path: 'identificacion.numeroControl', color: 'blue' },
  { name: 'Codigo de generacion local', path: 'identificacion.codigoGeneracion', color: 'blue' },
  { name: 'Sello de Recepcion', path: 'selloRecibido', color: 'blue' }
];

const DEFAULT_GREEN_COLUMNS = [
  { name: 'Estado del DTE', path: 'consultaPublica.estadoDoc', color: 'green' },
  { name: 'Descripcion del DTE', path: 'consultaPublica.descripcionEstado', color: 'green' },
  { name: 'Tipo de DTE', path: 'consultaPublica.tipoDte', color: 'green' },
  { name: 'Fecha y hora de generacion', path: 'consultaPublica.fechaProcesado', color: 'green' },
  { name: 'Codigo de Generacion', path: 'consultaPublica.codGen', color: 'green' },
  { name: 'Sello de Recepcion', path: 'consultaPublica.selloVal', color: 'green' },
  { name: 'Numero de Control Consulta', path: 'consultaPublica.identificacion.numeroControl', color: 'green' },
  { name: 'Documento ajustado', path: 'consultaPublica.documentoAjustado', color: 'green' },
  { name: 'Documento con Evento aplicado', path: 'consultaPublica.documentoConEventoAplicado', color: 'green' },
  { name: 'Observaciones', path: 'consultaPublica.observaciones', color: 'green' },
  { name: 'Documentos Relacionados', path: 'consultaPublica.documentosRelacionados', color: 'green' }
];

const HIDDEN_BUILTIN_JSON_STRUCTURES_KEY = 'hiddenBuiltinJsonStructures';

function ruleToPath(rule) {
  if (rule.customPath) return rule.customPath;

  const sections = Array.isArray(rule.sections) ? rule.sections.filter(Boolean) : [];
  const fields = Array.isArray(rule.fields) ? rule.fields.filter((field) => field && field !== '*') : [];
  const prefix = rule.source === 'publicQuery' ? ['consultaPublica'] : [];
  const pathParts = [...prefix, ...sections, fields[0]].filter(Boolean);
  return pathParts.join('.');
}

function builtinRuleToColumn(rule) {
  const isPublicQuery = rule.source === 'publicQuery';
  return {
    id: crypto.randomUUID(),
    name: rule.name || '',
    path: ruleToPath(rule),
    color: isPublicQuery ? 'green' : 'blue'
  };
}

function getBuiltinStructures() {
  return Object.entries(NAMED_STRUCTURES_BY_DTE).flatMap(([typeCode, structuresByName]) => (
    Object.entries(structuresByName).map(([structureName, rules]) => ({
      id: `builtin-${typeCode}-${structureName}`,
      typeCode,
      structureName,
      source: 'builtin',
      columns: [...(rules || []), ...PUBLIC_QUERY_COLUMNS].map(builtinRuleToColumn)
    }))
  ));
}

function loadCustomStructures() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(CUSTOM_JSON_STRUCTURES_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveCustomStructures(structures) {
  try {
    window.localStorage.setItem(CUSTOM_JSON_STRUCTURES_KEY, JSON.stringify(structures));
    window.dispatchEvent(new Event(CUSTOM_JSON_STRUCTURES_UPDATED_EVENT));
  } catch {
    // La pantalla sigue funcionando aunque el almacenamiento local falle.
  }
}

function loadHiddenBuiltinStructures() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(HIDDEN_BUILTIN_JSON_STRUCTURES_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveHiddenBuiltinStructures(structureIds) {
  try {
    window.localStorage.setItem(HIDDEN_BUILTIN_JSON_STRUCTURES_KEY, JSON.stringify(structureIds));
  } catch {
    // La pantalla sigue funcionando aunque el almacenamiento local falle.
  }
}

function createNewDraft() {
  return {
    id: crypto.randomUUID(),
    typeCode: '',
    structureName: '',
    columns: [...DEFAULT_BLUE_COLUMNS, ...DEFAULT_GREEN_COLUMNS].map((column) => ({ ...column, id: crypto.randomUUID() }))
  };
}

function escapeCsvCell(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function buildStructureCsv(structure) {
  const header = ['Orden', 'Tipo DTE', 'Nombre de estructura', 'Columna visible', 'Ruta JSON', 'Grupo / Color'];
  const rows = buildStructureRows(structure).map((row) => [
    row.order,
    row.typeCode,
    row.structureName,
    row.columnName,
    row.path,
    row.color
  ]);

  return [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(';'))
    .join('\r\n');
}

function buildStructureRows(structure) {
  return (structure.columns || []).map((column, index) => ({
    order: index + 1,
    typeCode: structure.typeCode || '',
    structureName: structure.structureName || '',
    columnName: column.name || '',
    path: column.path || '',
    color: column.color === 'green' ? 'Verde' : column.color === 'blue' ? 'Azul' : 'Normal'
  }));
}

function safeFileName(value) {
  return String(value || 'estructura-json')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function JsonStructureView() {
  const [structures, setStructures] = useState(loadCustomStructures);
  const [hiddenBuiltinStructureIds, setHiddenBuiltinStructureIds] = useState(loadHiddenBuiltinStructures);
  const [draft, setDraft] = useState(null);
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [draggedColumnId, setDraggedColumnId] = useState('');
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [structurePendingDelete, setStructurePendingDelete] = useState(null);
  const [message, setMessage] = useState('');

  const builtinStructures = useMemo(getBuiltinStructures, []);
  const visibleStructures = useMemo(() => {
    const customKeys = new Set(structures.map((structure) => (
      `${String(structure.typeCode || '').padStart(2, '0')}|${String(structure.structureName || '').trim().toUpperCase()}`
    )));
    const availableBuiltins = builtinStructures.filter((structure) => (
      !customKeys.has(`${String(structure.typeCode || '').padStart(2, '0')}|${String(structure.structureName || '').trim().toUpperCase()}`)
      && !hiddenBuiltinStructureIds.includes(structure.id)
    ));
    return [...structures.map((structure) => ({ ...structure, source: 'custom' })), ...availableBuiltins];
  }, [builtinStructures, hiddenBuiltinStructureIds, structures]);

  const activeDownloadStructure = useMemo(() => {
    if (draft) return draft;
    return visibleStructures.find((structure) => structure.id === selectedStructureId) || null;
  }, [draft, selectedStructureId, visibleStructures]);

  const tableRows = useMemo(() => {
    if (draft) {
      return draft.columns.map((column, index) => ({
        ...column,
        id: column.id || `${draft.id}-column-${index}`,
        structureId: draft.id,
        structureName: draft.structureName,
        typeCode: draft.typeCode
      }));
    }

    const structuresToShow = selectedStructureId
      ? visibleStructures.filter((structure) => structure.id === selectedStructureId)
      : visibleStructures;

    return structuresToShow.flatMap((structure) => (
      (structure.columns || []).map((column, index) => ({
        ...column,
        id: column.id || `${structure.id}-column-${index}`,
        structureId: structure.id,
        structureName: structure.structureName,
        typeCode: structure.typeCode,
        source: structure.source
      }))
    ));
  }, [draft, selectedStructureId, visibleStructures]);

  function startNewStructure() {
    setDraft(createNewDraft());
    setSelectedStructureId('');
    setSelectedColumnId('');
    setMessage('Nueva estructura creada. Complete el tipo DTE, nombre y rutas JSON.');
  }

  function selectStructure(structureId) {
    if (draft) return;
    const structure = visibleStructures.find((item) => item.id === structureId);
    if (!structure) return;

    setSelectedStructureId(structureId);
    setSelectedColumnId('');
    setMessage(`Estructura ${structure.structureName} seleccionada. Presione el lapiz para editar.`);
  }

  function editStructure(structureId) {
    const structure = visibleStructures.find((item) => item.id === structureId);
    if (!structure) return;

    setDraft({
      id: structure.source === 'builtin' ? crypto.randomUUID() : structure.id,
      typeCode: structure.typeCode,
      structureName: structure.structureName,
      columns: (structure.columns || []).map((column) => ({
        ...column,
        id: column.id || crypto.randomUUID()
      }))
    });
    setSelectedStructureId(structureId);
    setSelectedColumnId('');
    setMessage(`Editando estructura ${structure.structureName}. Al guardar, INICIO usara esta version personalizada.`);
  }

  function cancelDraft() {
    setDraft(null);
    setDraggedColumnId('');
    setSelectedColumnId('');
    setMessage('');
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateColumn(columnId, field, value) {
    setDraft((current) => ({
      ...current,
      columns: current.columns.map((column) => (
        column.id === columnId ? { ...column, [field]: value } : column
      ))
    }));
  }

  function addColumn() {
    const newColumnId = crypto.randomUUID();
    setDraft((current) => ({
      ...current,
      columns: [
        {
          id: newColumnId,
          name: '',
          path: '',
          color: 'green'
        },
        ...current.columns
      ]
    }));
    setSelectedColumnId(newColumnId);
  }

  function deleteColumn(columnId) {
    setDraft((current) => ({
      ...current,
      columns: current.columns.filter((column) => column.id !== columnId)
    }));
    if (selectedColumnId === columnId) {
      setSelectedColumnId('');
    }
  }

  function requestDeleteStructure(structure) {
    if (!structure) return;
    setStructurePendingDelete(structure);
  }

  function closeDeleteStructureModal() {
    setStructurePendingDelete(null);
  }

  function confirmDeleteStructure() {
    if (!structurePendingDelete) return;
    const structureId = structurePendingDelete.id;

    if (structurePendingDelete.source === 'builtin') {
      const nextHiddenIds = [...new Set([...hiddenBuiltinStructureIds, structureId])];
      setHiddenBuiltinStructureIds(nextHiddenIds);
      saveHiddenBuiltinStructures(nextHiddenIds);
      if (selectedStructureId === structureId) {
        setSelectedStructureId('');
      }
      setMessage(`Estructura ${structurePendingDelete.structureName} eliminada de la lista.`);
      setStructurePendingDelete(null);
      return;
    }

    const structure = structures.find((item) => item.id === structureId);
    const next = structures.filter((item) => item.id !== structureId);
    setStructures(next);
    saveCustomStructures(next);

    if (draft?.id === structureId) {
      setDraft(null);
      setSelectedStructureId('');
      setSelectedColumnId('');
    }

    if (selectedStructureId === structureId) {
      setSelectedStructureId('');
    }

    setMessage(structure ? `Estructura ${structure.structureName} eliminada.` : 'Estructura eliminada.');
    setStructurePendingDelete(null);
  }

  function moveColumn(dragColumnId, targetColumnId) {
    if (!dragColumnId || !targetColumnId || dragColumnId === targetColumnId) return;

    setDraft((current) => {
      const columns = [...current.columns];
      const dragIndex = columns.findIndex((column) => column.id === dragColumnId);
      const targetIndex = columns.findIndex((column) => column.id === targetColumnId);
      if (dragIndex < 0 || targetIndex < 0) return current;

      const [draggedColumn] = columns.splice(dragIndex, 1);
      columns.splice(targetIndex, 0, draggedColumn);
      return { ...current, columns };
    });
  }

  function saveStructure() {
    if (!draft?.typeCode.trim() || !draft?.structureName.trim()) {
      setMessage('Complete Tipo DTE y Nombre de estructura antes de guardar.');
      return;
    }

    const normalizedDraft = {
      ...draft,
      typeCode: draft.typeCode.trim().padStart(2, '0'),
      structureName: draft.structureName.trim().toUpperCase(),
      columns: draft.columns
        .map((column) => ({
          ...column,
          name: column.name.trim(),
          path: column.path.trim(),
          color: column.color || 'green'
        }))
        .filter((column) => column.name || column.path)
    };

    if (!normalizedDraft.columns.length) {
      setMessage('Agregue al menos una columna antes de guardar.');
      return;
    }

    setStructures((current) => {
      const next = [
        ...current.filter((structure) => structure.id !== normalizedDraft.id),
        normalizedDraft
      ];
      saveCustomStructures(next);
      return next;
    });
    setDraft(null);
    setSelectedStructureId(normalizedDraft.id);
    setSelectedColumnId('');
    setMessage('Estructura JSON guardada correctamente.');
  }

  function downloadCurrentStructureCsv() {
    if (!activeDownloadStructure) {
      setMessage('Seleccione una estructura antes de descargar.');
      return;
    }

    const csv = buildStructureCsv(activeDownloadStructure);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName(`${activeDownloadStructure.typeCode}-${activeDownloadStructure.structureName}`)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadMenuOpen(false);
    setMessage('Estructura descargada en formato CSV para Excel.');
  }

  async function downloadCurrentStructureExcel() {
    if (!activeDownloadStructure) {
      setMessage('Seleccione una estructura antes de descargar.');
      return;
    }

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Estructura JSON');
    worksheet.columns = [
      { header: 'Orden', key: 'order', width: 10 },
      { header: 'Tipo DTE', key: 'typeCode', width: 12 },
      { header: 'Nombre de estructura', key: 'structureName', width: 34 },
      { header: 'Columna visible', key: 'columnName', width: 34 },
      { header: 'Ruta JSON', key: 'path', width: 48 },
      { header: 'Grupo / Color', key: 'color', width: 16 }
    ];
    worksheet.addRows(buildStructureRows(activeDownloadStructure));
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEAF6FF' }
    };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName(`${activeDownloadStructure.typeCode}-${activeDownloadStructure.structureName}`)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadMenuOpen(false);
    setMessage('Estructura descargada en formato Excel.');
  }

  return (
    <section className="jsonStructureView">
      <div className="jsonStructurePanel">
        <div className="jsonStructureToolbar">
          <div>
            <div className="jsonStructureEyebrow">Configuracion</div>
            <h1>ESTRUCTURA JSON</h1>
          </div>
          <button className="actionButton" onClick={startNewStructure} type="button">
            <FilePlus2 size={16} />
            NUEVA ESTRUCTURA
          </button>
          <button
            className={`actionButton ${historyOpen ? 'activeActionButton' : ''}`}
            onClick={() => setHistoryOpen((current) => !current)}
            type="button"
          >
            <Menu size={17} />
            HISTORIAL
          </button>
          <button className="actionButton" disabled={!draft} onClick={addColumn} type="button">
            <Plus size={16} />
            AGREGAR COLUMNA
          </button>
          <div className="jsonStructureDownloadMenu">
            <button
              className={`actionButton ${downloadMenuOpen ? 'activeActionButton' : ''}`}
              disabled={!activeDownloadStructure}
              onClick={() => setDownloadMenuOpen((current) => !current)}
              type="button"
            >
              <Download size={16} />
              DESCARGAR
            </button>
            {downloadMenuOpen ? (
              <div className="jsonStructureDownloadOptions">
                <button onClick={downloadCurrentStructureExcel} type="button">Excel</button>
                <button onClick={downloadCurrentStructureCsv} type="button">CSV</button>
              </div>
            ) : null}
          </div>
          <button className="actionButton" disabled={!draft} onClick={saveStructure} type="button">
            <Save size={16} />
            GUARDAR
          </button>
          <button className="actionButton secondary" disabled={!draft} onClick={cancelDraft} type="button">
            <X size={16} />
            CANCELAR
          </button>
        </div>

        <div className="jsonStructureBody">
          <div className="jsonStructureIntro">
            <span className="jsonStructureIcon">
              <Braces size={26} />
            </span>
            <div>
              <h2>Administrador de estructuras JSON</h2>
              <p>
                Cree nombres de estructura, columnas visibles y rutas del JSON sin modificar codigo manualmente.
              </p>
              {message ? <span className="jsonStructureMessage">{message}</span> : null}
            </div>
          </div>

          {draft ? (
            <div className="jsonStructureForm">
              <label>
                <span>Tipo DTE</span>
                <input
                  inputMode="numeric"
                  onChange={(event) => updateDraft('typeCode', event.target.value.replace(/\D/g, '').slice(0, 2))}
                  placeholder="03"
                  value={draft.typeCode}
                />
              </label>
              <label>
                <span>Nombre de estructura</span>
                <input
                  onChange={(event) => updateDraft('structureName', event.target.value)}
                  placeholder="NOMBRE DE ESTRUCTURA"
                  value={draft.structureName}
                />
              </label>
            </div>
          ) : null}

          <div className={`jsonStructureHistory ${historyOpen ? 'isOpen' : ''}`}>
            <div className="jsonStructureHistoryHeader">
              <button
                className="jsonStructureHistoryToggle"
                onClick={() => setHistoryOpen((current) => !current)}
                type="button"
              >
                <Menu size={16} />
                <h2>Historial de estructuras creadas</h2>
              </button>
              <span>{visibleStructures.length} disponible(s)</span>
            </div>
            {historyOpen && visibleStructures.length ? (
              <div className="jsonStructureHistoryList">
                {visibleStructures.map((structure) => (
                  <div
                    className={`jsonStructureHistoryRow ${(draft && selectedStructureId === structure.id) || (!draft && selectedStructureId === structure.id) ? 'isActive' : ''}`}
                    key={structure.id}
                  >
                    <button
                      className="jsonStructureHistoryItem"
                      onClick={() => selectStructure(structure.id)}
                      type="button"
                    >
                      <strong>{structure.typeCode || '--'} - {structure.structureName || 'SIN NOMBRE'}</strong>
                      <span>{structure.source === 'builtin' ? 'Base' : 'Personalizada'} - {(structure.columns || []).length} columna(s)</span>
                    </button>
                    <div className="jsonStructureHistoryActions">
                      <button
                        className="jsonStructureSmallButton"
                        onClick={() => editStructure(structure.id)}
                        title="Editar estructura"
                        type="button"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="jsonStructureSmallDangerButton"
                        onClick={() => requestDeleteStructure(structure)}
                        title="Eliminar estructura"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : historyOpen ? (
              <div className="jsonStructureEmptyHistory">Todavia no hay estructuras guardadas.</div>
            ) : null}
          </div>

          <div className="jsonStructureTableWrap">
            <table className="jsonStructureTable">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Tipo DTE</th>
                  <th>Nombre de estructura</th>
                  <th>Columna visible</th>
                  <th>Ruta JSON</th>
                  <th>Grupo / Color</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length ? tableRows.map((row, index) => (
                  <tr
                    className={[
                      row.color === 'green' ? 'jsonStructureGreenRow' : row.color === 'blue' ? 'jsonStructureBlueRow' : '',
                      draft ? 'jsonStructureDraggableRow' : '',
                      selectedColumnId === row.id ? 'jsonStructureSelectedRow' : ''
                    ].filter(Boolean).join(' ')}
                    draggable={Boolean(draft)}
                    key={`${row.structureId}-${row.id}`}
                    onClick={() => {
                      if (draft) setSelectedColumnId(row.id);
                    }}
                    onDragEnd={() => setDraggedColumnId('')}
                    onDragOver={(event) => {
                      if (!draft) return;
                      event.preventDefault();
                    }}
                    onDragStart={(event) => {
                      if (!draft) return;
                      setDraggedColumnId(row.id);
                      setSelectedColumnId(row.id);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      moveColumn(draggedColumnId, row.id);
                      setDraggedColumnId('');
                    }}
                  >
                    <td>{draft ? index + 1 : '-'}</td>
                    <td>{row.typeCode || '-'}</td>
                    <td>{row.structureName || '-'}</td>
                    <td>
                      {draft ? (
                        <input
                          className="jsonStructureCellInput"
                          onChange={(event) => updateColumn(row.id, 'name', event.target.value)}
                          value={row.name}
                        />
                      ) : row.name}
                    </td>
                    <td>
                      {draft ? (
                        <input
                          className="jsonStructureCellInput"
                          onChange={(event) => updateColumn(row.id, 'path', event.target.value)}
                          value={row.path}
                        />
                      ) : row.path}
                    </td>
                    <td>
                      {draft ? (
                        <select
                          className="jsonStructureCellInput"
                          onChange={(event) => updateColumn(row.id, 'color', event.target.value)}
                          value={row.color}
                        >
                          <option value="blue">Azul</option>
                          <option value="green">Verde</option>
                          <option value="">Normal</option>
                        </select>
                      ) : (
                        <span className={`jsonStructureColorBadge ${row.color === 'green' ? 'green' : row.color === 'blue' ? 'blue' : 'normal'}`}>
                          {row.color === 'green' ? 'Verde' : row.color === 'blue' ? 'Azul' : 'Normal'}
                        </span>
                      )}
                    </td>
                    <td>
                      {draft ? (
                        <button
                          className="jsonStructureDeleteButton"
                          onClick={() => deleteColumn(row.id)}
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7}>Sin estructuras personalizadas creadas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {structurePendingDelete ? (
        <div className="registerModalBackdrop">
          <div className="registerModal jsonStructureDeleteConfirmModal" role="dialog" aria-modal="true" aria-labelledby="json-structure-delete-modal-title">
            <div className="registerModalHeader">
              <h2 id="json-structure-delete-modal-title">Eliminar estructura</h2>
              <button className="modalIconButton" onClick={closeDeleteStructureModal} type="button">
                <X size={18} />
              </button>
            </div>
            <div className="jsonStructureDeleteConfirmBody">
              <p>Se borrara la estructura seleccionada. Esta accion no se puede deshacer.</p>
              <strong>Seguro que quieres eliminar la estructura?</strong>
            </div>
            <div className="registerModalActions">
              <button className="actionButton dangerActionButton" onClick={confirmDeleteStructure} type="button">
                Aceptar
              </button>
              <button className="actionButton" onClick={closeDeleteStructureModal} type="button">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
