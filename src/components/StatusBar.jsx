import { ExternalLink, Loader2, Stamp } from 'lucide-react';

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
    <div className="mb-3 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-700">
          {loading ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : null}
          {status}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            className="actionButton"
            disabled={loading || !rowCount}
            onClick={onFillReceptionStamps}
            title="Rellenar Serie del Documento vacio usando la columna Sello de Recepcion"
            type="button"
          >
            <Stamp size={16} /> Agregar sello de recepcion
          </button>
          <button
            className="actionButton"
            disabled={loading || !rowCount}
            onClick={onQueryAllHacienda}
            title="Consultar Hacienda para todas las lineas visibles"
            type="button"
          >
            <ExternalLink size={16} /> Consulta masiva Hacienda
          </button>
          <button
            className="actionButton"
            disabled={loading || !selectedRow}
            onClick={onOpenHacienda}
            title={selectedQueryUrl || 'Seleccione una fila con codigo de generacion y fecha'}
            type="button"
          >
            <ExternalLink size={16} /> Consulta individual Hacienda
          </button>
          <p className="whitespace-nowrap text-sm text-slate-500">
            <span className="font-bold text-emerald-600">{rowCount} visible(s)</span>
            <span className="text-slate-400"> de </span>
            <span className="font-bold text-blue-600">{loadedCount} cargado(s)</span>
            <span className="text-slate-400"> | </span>
            <span className="font-bold text-red-600">{notLoadedCount} no cargado(s)</span>
            <span className="text-slate-400"> | </span>
            <span>{columnCount} columna(s)</span>
          </p>
        </div>
      </div>
      {dteSummary?.length ? (
        <div className="flex flex-wrap items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm">
          <span className="font-bold text-slate-600">Resumen por tipo:</span>
          {dteSummary.map((item) => (
            <span className="rounded-sm border border-blue-200 bg-blue-50 px-2 py-1 font-bold text-blue-700" key={item.code}>
              DTE-{item.code}: {item.count}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
