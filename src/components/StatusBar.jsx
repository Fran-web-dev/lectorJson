import { ExternalLink, Loader2, Stamp } from 'lucide-react';
import logoM from '../assets/LogoM.png';

export function StatusBar({
  loading,
  onFillReceptionStamps,
  onOpenHacienda,
  onQueryAllHacienda,
  rowCount,
  selectedQueryUrl,
  selectedRow,
  status
}) {
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
    </div>
  );
}

export function DteSummaryBar({
  columnCount = 0,
  dteSummary,
  duplicateCount = 0,
  invalidCount = 0,
  loadedCount = 0,
  rejectedCount = 0,
  rowCount = 0,
  totalFileCount = 0
}) {
  const notLoadedCount = Math.max((totalFileCount || loadedCount) - loadedCount, 0);
  if (
    !dteSummary?.length
    && !duplicateCount
    && !invalidCount
    && !rejectedCount
    && !loadedCount
    && !rowCount
    && !columnCount
    && !notLoadedCount
  ) return null;

  return (
    <div className="dteSummaryWrap" data-tour="dte-summary">
      <div className="dteSummaryBar">
        {dteSummary?.length ? (
          <>
            <span className="dteSummaryLabel">Resumen por tipo carpeta contenedora:</span>
          {dteSummary.map((item) => (
            <span className="dteSummaryChip dteSummaryTypeChip" key={item.code}>
              DTE-{item.code}: {item.count}
            </span>
          ))}
          </>
        ) : null}
        <span className="dteSummaryChip dteSummaryDuplicateChip">
          DTE duplicados: {duplicateCount}
        </span>
        <span className="dteSummaryChip dteSummaryInvalidChip">
          DTE invalidados: {invalidCount}
        </span>
        <span className="dteSummaryChip dteSummaryRejectedChip">
          DTE rechazados: {rejectedCount}
        </span>
        <span className="dteSummaryCounts">
          <span className="font-bold text-emerald-600">{rowCount} visible(s)</span>
          <span className="text-slate-400">de</span>
          <span className="font-bold text-blue-600">{loadedCount} cargado(s)</span>
          <span className="px-1 text-slate-400">|</span>
          <span className="font-bold text-red-600">{notLoadedCount} no cargado(s)</span>
          <span className="px-1 text-slate-400">|</span>
          <span>{columnCount} columna(s)</span>
        </span>
      </div>
    </div>
  );
}
