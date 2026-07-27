export function ErrorSummary({ errors }) {
  if (!errors.length) return null;

  return (
    <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <p className="font-semibold">{errors.length} archivo(s) no se pudieron leer.</p>
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
