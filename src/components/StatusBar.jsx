import { ExternalLink, Loader2 } from 'lucide-react';

export function StatusBar({
  columnCount,
  loadedCount,
  loading,
  onOpenHacienda,
  onQueryAllHacienda,
  rowCount,
  selectedQueryUrl,
  selectedRow,
  status
}) {
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
        <p className="text-sm text-slate-500">
          {rowCount} visible(s) de {loadedCount} cargado(s) | {columnCount} columna(s)
        </p>
      </div>
    </div>
  );
}
