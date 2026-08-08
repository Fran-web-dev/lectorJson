import { ExternalLink, Loader2, Stamp } from 'lucide-react';
import logoM from '../assets/LogoM.png';

const STATUS_COUNT_SEPARATOR = ' | ';

export function StatusBar({
  columnCount,
  dteSummary,
  loadedCount,
  loading,
  onFillReceptionStamps,
  onOpenHacienda,
  onQueryAllHacienda,
  rowCount,
  selectedQueryUrl,
  selectedRow,
  status,
  totalFileCount
}) {
  const notLoadedCount = Math.max((totalFileCount || loadedCount) - loadedCount, 0);

  return (
    <div className="statusMetrics" data-tour="status-metrics">
      <p className="statusText">
        {loading ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : null}
        {status}
      </p>
      <div className="statusActions" data-tour="hacienda-actions">
        <button
          className="actionButton statusActionButton"
          data-tour="fill-stamps-button"
          disabled={loading || !rowCount}
          onClick={onFillReceptionStamps}
          title="Rellenar Serie del Documento vacio usando la columna Sello de Recepcion"
          type="button"
        >
          <Stamp size={15} /> Agregar sello de recepcion
        </button>
        <button
          className="actionButton statusActionButton"
          data-tour="mass-query-button"
          disabled={loading || !rowCount}
          onClick={onQueryAllHacienda}
          title="Consultar Hacienda para todas las lineas visibles"
          type="button"
        >
          <img src={logoM} alt="Hacienda" className="h-4 w-4 object-contain" />
          Consulta masiva Hacienda
        </button>
        <button
          className="actionButton statusActionButton"
          data-tour="single-query-button"
          disabled={loading || !selectedRow}
          onClick={onOpenHacienda}
          title={selectedQueryUrl || 'Seleccione una fila con codigo de generacion y fecha'}
          type="button"
        >
          <ExternalLink size={15} /> Consulta individual Hacienda
        </button>
      </div>
      <p className="statusCounts">
        <span className="font-bold text-emerald-600">{rowCount} visible(s)</span>
        <span className="text-slate-400"> de </span>
        <span className="font-bold text-blue-600">{loadedCount} cargado(s)</span>
        <span className="text-slate-400">{STATUS_COUNT_SEPARATOR}</span>
        <span className="font-bold text-red-600">{notLoadedCount} no cargado(s)</span>
        <span className="text-slate-400">{STATUS_COUNT_SEPARATOR}</span>
        <span>{columnCount} columna(s)</span>
      </p>
    </div>
  );
}

export function DteSummaryBar({ dteSummary, duplicateCount = 0, invalidCount = 0, rejectedCount = 0 }) {
  if (!dteSummary?.length && !duplicateCount && !invalidCount && !rejectedCount) return null;

  return (
    <div className="mb-3" data-tour="dte-summary">
      <div className="flex flex-wrap items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm">
        {dteSummary?.length ? (
          <>
            <span className="font-bold text-slate-600">Resumen por tipo carpeta contenedora:</span>
          {dteSummary.map((item) => (
            <span className="rounded-sm border border-blue-200 bg-blue-50 px-2 py-1 font-bold text-blue-700" key={item.code}>
              DTE-{item.code}: {item.count}
            </span>
          ))}
          </>
        ) : null}
        <span className="rounded-sm border border-red-200 bg-red-50 px-2 py-1 font-bold text-red-700">
          DTE duplicados: {duplicateCount}
        </span>
        <span className="rounded-sm border border-violet-200 bg-violet-50 px-2 py-1 font-bold text-violet-700">
          DTE invalidados: {invalidCount}
        </span>
        <span className="rounded-sm border border-orange-200 bg-orange-50 px-2 py-1 font-bold text-orange-700">
          DTE rechazados: {rejectedCount}
        </span>
      </div>
    </div>
  );
}
