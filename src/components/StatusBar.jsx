import { ExternalLink, Loader2, Stamp } from 'lucide-react';

export function StatusBar({
  columnCount,
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
    <div className="mb-3 flex items-center justify-between gap-4">
      <p className="text-sm font-semibold text-slate-700">
        {loading ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : null}
        {status}
      </p>
      <div className="flex items-center gap-3">
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
  );
}
