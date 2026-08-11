import { FileJson, FileSpreadsheet, FolderOpen, Trash2 } from 'lucide-react';
import { getStructureOptions } from '../lib/dteStructureOptions.js';
import { DTE_TYPES } from '../lib/dteTypes.js';

export function FilterPanel({
  folder,
  fromDate,
  loading,
  metricsSlot,
  onClearDates,
  onClearTable,
  onExportExcel,
  onExportLoadErrorsExcel,
  onFromDateChange,
  onFolderChange,
  onReloadFolder,
  onSelectFiles,
  onSelectFolder,
  onStructureNameChange,
  onToDateChange,
  onTypeCodeChange,
  notLoadedCount = 0,
  structureName,
  toDate,
  typeCode
}) {
  const structureOptions = getStructureOptions(typeCode);

  return (
    <section className="border-b border-slate-200 bg-white px-5 py-3" data-tour="home-filters">
      <div className="grid grid-cols-[minmax(300px,430px)_240px_280px_560px] items-start gap-4">
        <div className="min-w-0" data-tour="folder-picker">
          <label className="label">Seleccione la carpeta contenedora de los archivos JSON</label>
          <div className="flex items-end gap-2">
            <input
              className="field"
              onChange={(event) => onFolderChange(event.target.value)}
              placeholder="Pegue la ruta o busquela manualmente..."
              title={folder}
              value={folder}
            />
            <button className="iconButton" data-tour="select-folder-button" disabled={loading} onClick={onSelectFolder} title="Seleccionar carpeta">
              <FolderOpen size={18} />
            </button>
          </div>
        </div>

        <div data-tour="document-type">
          <label className="label">Tipo de Documento</label>
          <select className="select" data-tour="document-type-select" value={typeCode} onChange={(event) => onTypeCodeChange(event.target.value)}>
            {DTE_TYPES.map((type) => (
              <option key={type.code} value={type.code}>
                {type.code === 'all' ? type.label : `${type.code} ${type.label}`}
              </option>
            ))}
          </select>
        </div>

        <div data-tour="structure-selector">
          <label className="label">Nombre de estructura</label>
          <select className="select" data-tour="structure-select" disabled={!structureOptions.length} value={structureName} onChange={(event) => onStructureNameChange(event.target.value)}>
            {structureOptions.length ? structureOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            )) : (
              <option value="">Sin estructura configurada</option>
            )}
          </select>
        </div>

        <div className="flex items-end gap-2 pt-6" data-tour="home-actions">
          <button className="actionButton" data-tour="export-excel-button" disabled={loading} onClick={onExportExcel}>
            <span className="excelLogoIcon" aria-hidden="true">
              <span className="excelLogoPanel">X</span>
              <span className="excelLogoSheet" />
            </span>
            Exportar Excel
          </button>
          <button className="actionButton" data-tour="load-json-button" disabled={loading || !folder.trim()} onClick={onReloadFolder}>
            <FileJson size={16} /> Cargar JSON
          </button>
          <button
            className="actionButton"
            disabled={loading || !notLoadedCount}
            onClick={onExportLoadErrorsExcel}
            title={notLoadedCount ? 'Generar reporte Excel de archivos no cargados' : 'No hay archivos no cargados para reportar'}
            type="button"
          >
            <FileSpreadsheet size={16} /> Reporte no cargados
          </button>
          <button className="actionButton dangerActionButton" data-tour="clear-home-button" disabled={loading} onClick={onClearTable}>
            <Trash2 size={16} /> Limpiar
          </button>
        </div>

        <div className="filterBottomBar">
          <div className="filterDateControls">
            <div>
              <label className="label">Fecha Desde</label>
              <input className="dateInput w-36" data-tour="date-from-input" type="date" value={fromDate} onChange={(event) => onFromDateChange(event.target.value)} />
            </div>
            <div>
              <label className="label">Fecha Hasta</label>
              <input className="dateInput w-36" data-tour="date-to-input" type="date" value={toDate} onChange={(event) => onToDateChange(event.target.value)} />
            </div>
            <button className="actionButton" data-tour="clear-dates-button" disabled={loading} onClick={onClearDates}>
              Limpiar fechas
            </button>
          </div>
          <div className="filterMetricsSlot">
            {metricsSlot}
          </div>
        </div>
      </div>
    </section>
  );
}
