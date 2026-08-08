import { FileSpreadsheet } from 'lucide-react';

export function ErrorSummary({ errors, onExportExcel }) {
  if (!errors.length) return null;

  return (
    <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">{errors.length} archivo(s) no se pudieron leer.</p>
        <button className="actionButton" onClick={onExportExcel} type="button">
          <FileSpreadsheet size={16} /> Generar reporte Excel
        </button>
      </div>
      <ul className="mt-2 space-y-1">
        {errors.slice(0, 5).map((error) => (
          <li key={error.filePath}>
            <span className="font-medium">{error.filePath}</span>: {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
