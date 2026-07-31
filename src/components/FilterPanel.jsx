import { FileJson, FolderOpen, Trash2 } from 'lucide-react';
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
  onFromDateChange,
  onFolderChange,
  onReloadFolder,
  onSelectFiles,
  onSelectFolder,
  onStructureNameChange,
  onToDateChange,
  onTypeCodeChange,
  structureName,
  toDate,
  typeCode
}) {
  const structureOptions = getStructureOptions(typeCode);

  return (
    <section className="border-b border-slate-200 bg-white px-5 py-3">
      <div className="grid grid-cols-[minmax(300px,430px)_240px_280px_560px] items-start gap-4">
        <div className="min-w-0">
          <label className="label">Seleccione la carpeta contenedora de los archivos JSON</label>
          <div className="flex items-end gap-2">
            <input
              className="field"
              onChange={(event) => onFolderChange(event.target.value)}
              placeholder="Pegue la ruta o busquela manualmente..."
              title={folder}
              value={folder}
            />
            <button className="iconButton" disabled={loading} onClick={onSelectFolder} title="Seleccionar carpeta">
              <FolderOpen size={18} />
            </button>
          </div>
        </div>

        <div>
          <label className="label">Tipo de Documento</label>
          <select className="select" value={typeCode} onChange={(event) => onTypeCodeChange(event.target.value)}>
            {DTE_TYPES.map((type) => (
              <option key={type.code} value={type.code}>
                {type.code === 'all' ? type.label : `${type.code} ${type.label}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Nombre de estructura</label>
          <select className="select" disabled={!structureOptions.length} value={structureName} onChange={(event) => onStructureNameChange(event.target.value)}>
            {structureOptions.length ? structureOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            )) : (
              <option value="">Sin estructura configurada</option>
            )}
          </select>
        </div>

        <div className="flex items-end gap-2 pt-6">
          <button className="actionButton" disabled={loading} onClick={onExportExcel}>
            <span className="excelLogoIcon" aria-hidden="true">
              <span className="excelLogoPanel">X</span>
              <span className="excelLogoSheet" />
            </span>
            Exportar Excel
          </button>
          <button className="actionButton" disabled={loading} onClick={onSelectFiles}>
            <FileJson size={16} /> Seleccionar archivos
          </button>
          <button className="actionButton" disabled={loading || !folder.trim()} onClick={onReloadFolder}>
            <FileJson size={16} /> Cargar JSON
          </button>
          <button className="actionButton dangerActionButton" disabled={loading} onClick={onClearTable}>
            <Trash2 size={16} /> Limpiar
          </button>
        </div>

        <div className="filterBottomBar">
          <div className="filterDateControls">
            <div>
              <label className="label">Fecha Desde</label>
              <input className="dateInput w-36" type="date" value={fromDate} onChange={(event) => onFromDateChange(event.target.value)} />
            </div>
            <div>
              <label className="label">Fecha Hasta</label>
              <input className="dateInput w-36" type="date" value={toDate} onChange={(event) => onToDateChange(event.target.value)} />
            </div>
            <button className="actionButton" disabled={loading} onClick={onClearDates}>
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
