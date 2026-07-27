import { useCallback } from 'react';

export function useDteActions({
  rows,
  setDocuments,
  setErrors,
  setFolder,
  setLoading,
  setStatus
}) {
  const applyLoadResult = useCallback((result) => {
    setFolder(result.sourcePath);
    setDocuments(result.documents);
    setErrors(result.errors);
    setStatus(`${result.documents.length} registro(s) cargado(s) desde ${result.sourcePath}.`);
  }, [setDocuments, setErrors, setFolder, setStatus]);

  const selectFolder = useCallback(async () => {
    setLoading(true);
    setStatus('Leyendo carpeta y subcarpetas...');
    try {
      const result = await window.dteApp.selectFolder();
      if (!result) {
        setStatus('Seleccion cancelada.');
        return;
      }

      applyLoadResult(result);
    } catch (error) {
      setStatus(`Error al leer carpeta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [applyLoadResult, setLoading, setStatus]);

  const selectFiles = useCallback(async () => {
    setLoading(true);
    setStatus('Leyendo archivos CSV/JSON...');
    try {
      const result = await window.dteApp.selectFiles();
      if (!result) {
        setStatus('Seleccion cancelada.');
        return;
      }

      applyLoadResult(result);
    } catch (error) {
      setStatus(`Error al leer archivos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [applyLoadResult, setLoading, setStatus]);

  const exportExcel = useCallback(async () => {
    if (!rows.length) {
      setStatus('No hay datos para exportar.');
      return;
    }

    setLoading(true);
    try {
      const filePath = await window.dteApp.exportExcel(rows);
      if (filePath) setStatus(`Excel exportado: ${filePath}`);
    } catch (error) {
      setStatus(`No se pudo exportar Excel: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [rows, setLoading, setStatus]);

  return { exportExcel, selectFiles, selectFolder };
}
