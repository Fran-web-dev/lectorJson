import { useCallback, useRef } from 'react';

export function useDteActions({
  folder,
  rows,
  setDocuments,
  setErrors,
  setLoadedFilePaths,
  setFolder,
  setLoading,
  setShowLoadCancelledModal,
  setStatus,
  setTotalFileCount
}) {
  const loadCancelledRef = useRef(false);

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
    if (loadCancelledRef.current) return;
    setFolder(result.sourcePath);
    setDocuments(result.documents);
    setErrors(result.errors);
    setLoadedFilePaths?.(Array.isArray(result.filePaths) ? result.filePaths : []);
    setTotalFileCount(result.totalFiles || result.documents.length);
    const reportText = result.errorReportPath ? ` Reporte de no cargados: ${result.errorReportPath}` : '';
    setStatus(`${result.documents.length} registro(s) cargado(s) desde ${result.sourcePath}.${reportText}`);
  }, [setDocuments, setErrors, setFolder, setLoadedFilePaths, setStatus, setTotalFileCount]);

  const selectFolder = useCallback(async () => {
    loadCancelledRef.current = false;
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
      if (/cancelada/i.test(error.message)) {
        setStatus('Carga cancelada por el usuario.');
        setShowLoadCancelledModal?.(true);
      } else {
        setStatus(`Error al leer carpeta: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [applyLoadResult, setLoading, setShowLoadCancelledModal, setStatus, withFileLoadProgress]);

  const selectFiles = useCallback(async () => {
    loadCancelledRef.current = false;
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
      if (/cancelada/i.test(error.message)) {
        setStatus('Carga cancelada por el usuario.');
        setShowLoadCancelledModal?.(true);
      } else {
        setStatus(`Error al leer archivos: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [applyLoadResult, setLoading, setShowLoadCancelledModal, setStatus, withFileLoadProgress]);

  const reloadFolder = useCallback(async () => {
    const folderPath = String(folder || '').trim();
    if (!folderPath) {
      setStatus('Seleccione una carpeta antes de cargar JSON.');
      return;
    }

    loadCancelledRef.current = false;
    setLoading(true);
    setStatus('Cargando JSON de la carpeta seleccionada...');
    try {
      if (!window.dteApp?.reloadFolder) {
        throw new Error('Reinicie la aplicacion para habilitar la carga por ruta pegada.');
      }
      const result = await withFileLoadProgress(() => window.dteApp.reloadFolder(folderPath));
      applyLoadResult(result);
    } catch (error) {
      if (/cancelada/i.test(error.message)) {
        setStatus('Carga cancelada por el usuario.');
        setShowLoadCancelledModal?.(true);
      } else {
        setStatus(`Error al cargar JSON: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [applyLoadResult, folder, setLoading, setShowLoadCancelledModal, setStatus, withFileLoadProgress]);

  const cancelFileLoad = useCallback(async () => {
    loadCancelledRef.current = true;
    setStatus('Cancelando carga...');
    try {
      if (!window.dteApp?.cancelFileLoad) return;
      await window.dteApp.cancelFileLoad();
    } catch (error) {
      setStatus(`No se pudo cancelar la carga: ${error.message}`);
    }
  }, [setStatus]);

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

  return { cancelFileLoad, exportExcel, reloadFolder, selectFiles, selectFolder };
}
