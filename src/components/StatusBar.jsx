import { Loader2 } from 'lucide-react';

export function StatusBar({ columnCount, loadedCount, loading, rowCount, status }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <p className="text-sm font-semibold text-slate-700">
        {loading ? <Loader2 className="mr-2 inline animate-spin" size={16} /> : null}
        {status}
      </p>
      <p className="text-sm text-slate-500">
        {rowCount} visible(s) de {loadedCount} cargado(s) | {columnCount} columna(s)
      </p>
    </div>
  );
}
