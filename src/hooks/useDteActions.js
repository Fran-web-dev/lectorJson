import { useCallback } from 'react';

export function useDteActions({
  folder,
  rows,
  setDocuments,
  setErrors,
  setFolder,
  setLoading,
  setStatus,
  setTotalFileCount
}) {
  const withFileLoadProgress = useCallback(async (action) => {
    let removeProgressListener = () => {};

    if (window.dteApp?.onFileLoadProgress) {
      removeProgressListener = window.dteApp.onFileLoadProgress((progress) => {
        const completed = Number(progress?.completed || 0);
        const total = Number(progress?.total || 0);

        if (total > 0) {
          setStatus(`Cargando archivos: ${completed}/${total} archivo(s) cargado(s)...`);
        }
      });
    }

    try {
      return await action();
    } finally {
      removeProgressListener();
    }
  }, [setStatus]);

  const applyLoadResult = useCallback((result) => {
    setFolder(result.sourcePath);
    setDocuments(result.documents);
    setErrors(result.errors);
    setTotalFileCount(result.totalFiles || result.documents.length);
    setStatus(`${result.documents.length} registro(s) cargado(s) desde ${result.sourcePath}.`);
  }, [setDocuments, setErrors, setFolder, setStatus, setTotalFileCount]);

  const selectFolder = useCallback(async () => {
    setLoading(true);
    setStatus('Leyendo carpeta y subcarpetas...');
    try {
      const result = await withFileLoadProgress(() => window.dteApp.selectFolder());
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
  }, [applyLoadResult, setLoading, setStatus, withFileLoadProgress]);

  const selectFiles = useCallback(async () => {
    setLoading(true);
    setStatus('Leyendo archivos CSV/JSON...');
    try {
      const result = await withFileLoadProgress(() => window.dteApp.selectFiles());
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
  }, [applyLoadResult, setLoading, setStatus, withFileLoadProgress]);

  const reloadFolder = useCallback(async () => {
    const folderPath = String(folder || '').trim();
    if (!folderPath) {
      setStatus('Seleccione una carpeta antes de cargar JSON.');
      return;
    }

    setLoading(true);
    setStatus('Cargando JSON de la carpeta seleccionada...');
    try {
      if (!window.dteApp?.reloadFolder) {
        throw new Error('Reinicie la aplicacion para habilitar la carga por ruta pegada.');
      }
      const result = await withFileLoadProgress(() => window.dteApp.reloadFolder(folderPath));
      applyLoadResult(result);
    } catch (error) {
      setStatus(`Error al cargar JSON: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [applyLoadResult, folder, setLoading, setStatus, withFileLoadProgress]);

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

  return { exportExcel, reloadFolder, selectFiles, selectFolder };
}
