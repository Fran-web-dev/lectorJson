import { FileJson, FolderOpen, Sheet } from 'lucide-react';
import { DTE_TYPES } from '../lib/dteStructures.js';

export function FilterPanel({
  folder,
  fromDate,
  loading,
  onClearDates,
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
  return (
    <section className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="grid grid-cols-[minmax(320px,1fr)_260px_260px_140px] gap-4">
        <div>
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
            <option value="all">Todos los documentos</option>
            {DTE_TYPES.map((type) => (
              <option key={type.code} value={type.code}>{type.code} {type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Nombre de estructura</label>
          <input className="input" value={structureName} onChange={(event) => onStructureNameChange(event.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <button className="actionButton" disabled={loading} onClick={onExportExcel}>
            <Sheet size={16} /> Exportar Excel
          </button>
          <button className="actionButton" disabled={loading} onClick={onSelectFiles}>
            <FileJson size={16} /> Seleccionar archivos
          </button>
          <button className="actionButton" disabled={loading || !folder.trim()} onClick={onReloadFolder}>
            <FileJson size={16} /> Cargar JSON
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="label">Fecha Desde</label>
          <input className="dateInput" type="date" value={fromDate} onChange={(event) => onFromDateChange(event.target.value)} />
        </div>
        <div>
          <label className="label">Fecha Hasta</label>
          <input className="dateInput" type="date" value={toDate} onChange={(event) => onToDateChange(event.target.value)} />
        </div>
        <button className="actionButton" disabled={loading} onClick={onClearDates}>
          Limpiar fechas
        </button>
      </div>
    </section>
  );
}
