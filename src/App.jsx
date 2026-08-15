import { lazy, startTransition, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { CircleX, Info, LogOut, Power, X } from 'lucide-react';
import { AppHeader } from './components/AppHeader.jsx';
import { AppTour } from './components/AppTour.jsx';
import { ErrorSummary } from './components/ErrorSummary.jsx';
import { FilterPanel } from './components/FilterPanel.jsx';
import { SplashScreen } from './components/SplashScreen.jsx';
import { DteSummaryBar, StatusBar } from './components/StatusBar.jsx';
import { useDteActions } from './hooks/useDteActions.js';
import { DEFAULT_STRUCTURE_NAME, getStructureOptions } from './lib/dteStructureOptions.js';
import { MONEY_COLUMN_NAMES } from './lib/dteStructures.js';
import { sortTableRows } from './lib/tableSortUtils.js';
import {
  buildHaciendaQueryUrl,
  getDocumentGenerationCode,
  getSelectedEnvironment,
  getSelectedGenerationCode,
  getSelectedIssueDate,
  getUniqueQueryableRows
} from './lib/haciendaUtils.js';
import {
  loadPersistedFilters,
  loadPersistedSort,
  resolveFilterUpdate,
  resolveSortUpdate,
  savePersistedFilters,
  savePersistedSort
} from './lib/filterPersistence.js';
import {
  applyColumnFilters,
  extractRowsForSummary,
  markDuplicateRows,
  orderColumns,
  summarizeDteTypes
} from './lib/tableRowUtils.js';

import closeIcon from './assets/close.png';
import warningFlaticonIcon from './assets/warning-flaticon.svg';

const VirtualDataTable = lazy(() => import('./components/VirtualDataTable.jsx').then((module) => ({
  default: module.VirtualDataTable
})));
const AnexosView = lazy(() => import('./components/AnexosView.jsx').then((module) => ({
  default: module.AnexosView
})));
const IvaBooksView = lazy(() => import('./components/IvaBooksView.jsx').then((module) => ({
  default: module.IvaBooksView
})));
const RegisterView = lazy(() => import('./components/RegisterView.jsx').then((module) => ({
  default: module.RegisterView
})));
const CodeAppendixView = lazy(() => import('./components/CodeAppendixView.jsx').then((module) => ({
  default: module.CodeAppendixView
})));
const HOME_CLEAR_KEY = '1234';
const HOME_FILTER_STORAGE_PREFIX = 'dte-home-column-filters';
const HOME_SORT_STORAGE_PREFIX = 'dte-home-column-sort';
const NO_FILTER_VALUES_SELECTED = '__DTE_FILTER_NONE_SELECTED__';
const ANEXOS_VIEW_TYPES = {
  'anexos-sales-ccf': 'salesCcf',
  'anexos-sales-fcf': 'salesFcf',
  'anexos-purchases': 'purchases',
  'anexos-excluded-subject': 'excludedSubject',
  'anexos-advance-vat': 'advanceVat',
  'anexos-retention-vat': 'retentionVat',
  'anexos-perception-vat': 'perceptionVat',
  'anexos-invalid-documents': 'invalidDocuments',
  'anexos-f14': 'f14'
};

function getHomeFilterStorageKey(typeCode, structureName) {
  return `${HOME_FILTER_STORAGE_PREFIX}-${typeCode || 'all'}-${structureName || 'default'}`;
}

function getHomeSortStorageKey(typeCode, structureName) {
  return `${HOME_SORT_STORAGE_PREFIX}-${typeCode || 'all'}-${structureName || 'default'}`;
}

function normalizeGenerationKey(value) {
  return String(value || '').replace(/-/g, '').trim().toUpperCase();
}

function getRowDeleteKey(row) {
  return {
    controlNumber: normalizeGenerationKey(row?.['Numero de Control']),
    generationCode: normalizeGenerationKey(row?.['Codigo de generacion local'] || row?.['Numero del Documento'] || row?.['Codigo de Generacion']),
    sourceFile: String(row?.__sourceFile || '')
  };
}

function documentMatchesRow(document, rowKey) {
  if (!document || !rowKey?.sourceFile || document.sourceFile !== rowKey.sourceFile) return false;

  const documentGenerationCode = normalizeGenerationKey(getDocumentGenerationCode(document));
  const documentControlNumber = normalizeGenerationKey(document.payload?.identificacion?.numeroControl);

  return Boolean(
    (rowKey.generationCode && documentGenerationCode === rowKey.generationCode)
    || (rowKey.controlNumber && documentControlNumber === rowKey.controlNumber)
  );
}

function getTableColumns(rows, typeCode) {
  const columnSet = new Set();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!key.startsWith('__')) columnSet.add(key);
    }
  }

  const columns = Array.from(columnSet);
  const visibleColumns = typeCode === 'all'
    ? columns.filter((column) => !MONEY_COLUMN_NAMES.has(column))
    : columns;

  return orderColumns(visibleColumns);
}

function getInicioAlertCounts(rows) {
  let duplicateCount = 0;
  let invalidCount = 0;
  let rejectedCount = 0;

  for (const row of rows) {
    if (row?.__isDuplicate) duplicateCount += 1;
    const status = String(row?.['Estado del DTE'] || '').toLowerCase();
    if (status.includes('invalidado')) invalidCount += 1;
    if (status.includes('rechazado')) rejectedCount += 1;
  }

  return { duplicateCount, invalidCount, rejectedCount };
}

function getNotLoadedCount(totalFileCount, loadedCount) {
  return Math.max((totalFileCount || loadedCount) - loadedCount, 0);
}

function buildLoadErrorReportRows(errors, notLoadedCount, folder) {
  const errorRows = Array.isArray(errors) ? [...errors] : [];
  const missingCount = Math.max(notLoadedCount - errorRows.length, 0);

  if (!missingCount) return errorRows;

  return [
    ...errorRows,
    ...Array.from({ length: missingCount }, (_, index) => ({
      filePath: folder || '',
      fileName: 'Archivo no identificado',
      message: `Archivo no cargado sin detalle tecnico registrado (${index + 1} de ${missingCount}). Revise que el JSON tenga identificacion.tipoDte, una estructura compatible con el tipo seleccionado y que no este duplicado o fuera de los filtros aplicados.`
    }))
  ];
}

function getPathFileName(filePath) {
  return String(filePath || '').split(/[\\/]/).filter(Boolean).pop() || '';
}

function normalizeFilePathKey(filePath) {
  return String(filePath || '').trim().toLowerCase();
}

function buildExactLoadErrorReportRows({ documents, errors, filePaths, folder, notLoadedCount }) {
  const errorRows = Array.isArray(errors) ? [...errors] : [];
  const erroredFilePaths = new Set(errorRows.map((error) => normalizeFilePathKey(error?.filePath)).filter(Boolean));
  const loadedFilePaths = new Set((documents || []).map((document) => normalizeFilePathKey(document?.sourceFile)).filter(Boolean));
  const missingRows = [];

  for (const filePath of filePaths || []) {
    const normalizedPath = normalizeFilePathKey(filePath);
    if (!normalizedPath || loadedFilePaths.has(normalizedPath) || erroredFilePaths.has(normalizedPath)) continue;
    missingRows.push({
      filePath,
      fileName: getPathFileName(filePath),
      message: 'El archivo fue revisado, pero no genero registros visibles para la estructura seleccionada. Revise si corresponde a otro tipo de DTE, si fue filtrado por la estructura actual o si no contiene datos utiles para cargar.'
    });
  }

  const reportRows = [...errorRows, ...missingRows];
  return reportRows.length ? reportRows : buildLoadErrorReportRows(errorRows, notLoadedCount, folder);
}

function pruneUnavailableFilters(filters, rows, columns) {
  const availableColumns = new Set(columns);
  const nextFilters = {};
  let changed = false;

  for (const [column, selectedValues] of Object.entries(filters || {})) {
    const values = Array.isArray(selectedValues) ? selectedValues : [];
    if (!values.length) continue;

    if (!availableColumns.has(column)) {
      changed = true;
      continue;
    }

    if (values.includes(NO_FILTER_VALUES_SELECTED)) {
      nextFilters[column] = [NO_FILTER_VALUES_SELECTED];
      continue;
    }

    const availableValues = new Set(rows.map((row) => String(row[column] ?? '')));
    const validValues = values.filter((value) => availableValues.has(String(value)));

    if (validValues.length !== values.length) changed = true;
    if (validValues.length) nextFilters[column] = validValues;
  }

  return { changed, filters: nextFilters };
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [folder, setFolder] = useState('');
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loadedFilePaths, setLoadedFilePaths] = useState([]);
  const [totalFileCount, setTotalFileCount] = useState(0);
  const [typeCode, setTypeCode] = useState('01');
  const [structureName, setStructureName] = useState(DEFAULT_STRUCTURE_NAME);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [columnFilters, setColumnFilters] = useState(() => loadPersistedFilters(getHomeFilterStorageKey(typeCode, structureName)));
  const [homeFiltersByKey, setHomeFiltersByKey] = useState(() => {
    const key = getHomeFilterStorageKey(typeCode, structureName);
    return { [key]: loadPersistedFilters(key) };
  });
  const [homeSortConfig, setHomeSortConfig] = useState(() => loadPersistedSort(getHomeSortStorageKey(typeCode, structureName)));
  const [homeSortByKey, setHomeSortByKey] = useState(() => {
    const key = getHomeSortStorageKey(typeCode, structureName);
    return { [key]: loadPersistedSort(key) };
  });
  const [selectedRow, setSelectedRow] = useState(null);
  const [status, setStatus] = useState('Seleccione una carpeta con archivos JSON.');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [ivaBookRowsByType, setIvaBookRowsByType] = useState({});
  const [anexoRowsByType, setAnexoRowsByType] = useState({});
  const [activeView, setActiveView] = useState('dte');
  const [tourRunId, setTourRunId] = useState(0);
  const [showClearTableModal, setShowClearTableModal] = useState(false);
  const [showEmptyTableModal, setShowEmptyTableModal] = useState(false);
  const [showLoadCancelledModal, setShowLoadCancelledModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [clearTablePassword, setClearTablePassword] = useState('');
  const [rowPendingDelete, setRowPendingDelete] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 120);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!window.dteApp?.onCloseRequest) return undefined;
    return window.dteApp.onCloseRequest(() => setShowExitConfirmModal(true));
  }, []);

  useEffect(() => {
    const warmup = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 2500));
    const cancelWarmup = window.cancelIdleCallback || window.clearTimeout;
    const warmupId = warmup(() => {
      import('./lib/extractor.js');
    }, { timeout: 3000 });
    return () => cancelWarmup(warmupId);
  }, []);

  useEffect(() => {
    const structureOptions = getStructureOptions(typeCode);
    if (!structureOptions.includes(structureName)) {
      setStructureName(structureOptions[0] || '');
    }
  }, [structureName, typeCode]);

  const homeFilterStorageKey = useMemo(
    () => getHomeFilterStorageKey(typeCode, structureName),
    [structureName, typeCode]
  );
  const homeSortStorageKey = useMemo(
    () => getHomeSortStorageKey(typeCode, structureName),
    [structureName, typeCode]
  );

  useEffect(() => {
    setColumnFilters(homeFiltersByKey[homeFilterStorageKey] || loadPersistedFilters(homeFilterStorageKey));
    setHomeSortConfig(homeSortByKey[homeSortStorageKey] || loadPersistedSort(homeSortStorageKey));
    setSelectedRow(null);
  }, [homeFilterStorageKey, homeSortStorageKey]);

  useEffect(() => {
    if (activeView !== 'dte') return;
    setColumnFilters(homeFiltersByKey[homeFilterStorageKey] || loadPersistedFilters(homeFilterStorageKey));
    setHomeSortConfig(homeSortByKey[homeSortStorageKey] || loadPersistedSort(homeSortStorageKey));
  }, [activeView, homeFilterStorageKey, homeSortStorageKey]);

  const handleColumnFiltersChange = useCallback((update) => {
    setColumnFilters((currentFilters) => {
      const nextFilters = resolveFilterUpdate(update, currentFilters);
      setHomeFiltersByKey((current) => ({ ...current, [homeFilterStorageKey]: nextFilters }));
      savePersistedFilters(homeFilterStorageKey, nextFilters);
      return nextFilters;
    });
  }, [homeFilterStorageKey]);

  const handleHomeSortConfigChange = useCallback((update) => {
    setHomeSortConfig((currentSort) => {
      const nextSort = resolveSortUpdate(update, currentSort);
      setHomeSortByKey((current) => ({ ...current, [homeSortStorageKey]: nextSort }));
      savePersistedSort(homeSortStorageKey, nextSort);
      return nextSort;
    });
  }, [homeSortStorageKey]);

  useEffect(() => {
    if (!rowPendingDelete) return undefined;

    function handleDeleteRowModalKeyDown(event) {
      if (event.key === 'Escape') setRowPendingDelete(null);
    }

    window.addEventListener('keydown', handleDeleteRowModalKeyDown);
    return () => window.removeEventListener('keydown', handleDeleteRowModalKeyDown);
  }, [rowPendingDelete]);

  useEffect(() => {
    if (!showLoadCancelledModal) return undefined;

    function handleLoadCancelledModalKeyDown(event) {
      if (event.key === 'Escape') setShowLoadCancelledModal(false);
    }

    window.addEventListener('keydown', handleLoadCancelledModalKeyDown);
    return () => window.removeEventListener('keydown', handleLoadCancelledModalKeyDown);
  }, [showLoadCancelledModal]);

  useEffect(() => {
    if (!showExitConfirmModal) return undefined;

    function handleExitConfirmModalKeyDown(event) {
      if (event.key === 'Escape') setShowExitConfirmModal(false);
    }

    window.addEventListener('keydown', handleExitConfirmModalKeyDown);
    return () => window.removeEventListener('keydown', handleExitConfirmModalKeyDown);
  }, [showExitConfirmModal]);

  function confirmExitApp() {
    window.dteApp?.confirmCloseApp?.();
  }

  useEffect(() => {
    let cancelled = false;
    if (!documents.length) {
      setRows([]);
      return () => {
        cancelled = true;
      };
    }

    import('./lib/extractor.js').then(async ({ extractRowsInBatches }) => {
      if (!cancelled) {
        setStatus(`Preparando tabla: 0/${documents.length} documento(s)...`);
        const nextRows = markDuplicateRows(await extractRowsInBatches(documents, {
          typeCode,
          structureName,
          fromDate,
          toDate,
          onProgress: ({ completed, total, rows: extractedRows }) => {
            if (!cancelled) setStatus(`Preparando tabla: ${completed}/${total} documento(s). ${extractedRows} fila(s) encontrada(s).`);
          },
          shouldCancel: () => cancelled
        }));
        if (cancelled) return;
        startTransition(() => {
          setRows(nextRows);
        });
        setStatus(`${nextRows.length} registro(s) cargado(s) desde ${folder || 'archivos seleccionados'}.`);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [documents, typeCode, structureName, fromDate, toDate]);

  const columns = useMemo(
    () => getTableColumns(rows, typeCode),
    [rows, typeCode]
  );

  const filteredRows = useMemo(
    () => applyColumnFilters(rows, columnFilters),
    [rows, columnFilters]
  );

  const sortedFilteredRows = useMemo(
    () => sortTableRows(filteredRows, homeSortConfig),
    [filteredRows, homeSortConfig]
  );

  useEffect(() => {
    if (!rows.length) return;
    if (!Object.values(columnFilters || {}).some((values) => Array.isArray(values) && values.length)) return;

    const { changed, filters: prunedFilters } = pruneUnavailableFilters(columnFilters, rows, columns);
    const hasActiveFilters = Object.values(prunedFilters).some((values) => values.length);
    const hasNoneSelection = Object.values(prunedFilters).some((values) => values.includes(NO_FILTER_VALUES_SELECTED));
    const nextFilters = hasNoneSelection || (hasActiveFilters && applyColumnFilters(rows, prunedFilters).length)
      ? prunedFilters
      : {};

    if (!changed && nextFilters === prunedFilters) return;

    setColumnFilters(nextFilters);
    setHomeFiltersByKey((current) => ({ ...current, [homeFilterStorageKey]: nextFilters }));
    savePersistedFilters(homeFilterStorageKey, nextFilters);
  }, [columnFilters, columns, homeFilterStorageKey, rows]);

  const dteSummary = useMemo(
    () => summarizeDteTypes(extractRowsForSummary(documents)),
    [documents]
  );
  const inicioAlertCounts = useMemo(
    () => getInicioAlertCounts(rows),
    [rows]
  );
  const notLoadedCount = useMemo(
    () => getNotLoadedCount(totalFileCount, documents.length),
    [documents.length, totalFileCount]
  );

  const activeIvaBookType = activeView === 'iva-books-ccf-sales'
    ? 'ccfSales'
    : activeView === 'iva-books-fcf-sales'
      ? 'fcfSales'
      : 'purchases';

  const handleIvaBookRowsChange = useCallback((nextRows) => {
    setIvaBookRowsByType((current) => (
      current[activeIvaBookType] === nextRows
        ? current
        : {
            ...current,
            [activeIvaBookType]: nextRows
          }
    ));
  }, [activeIvaBookType]);

  const activeAnexoType = ANEXOS_VIEW_TYPES[activeView] || 'salesCcf';

  const handleAnexoRowsChange = useCallback((nextRows) => {
    setAnexoRowsByType((current) => (
      current[activeAnexoType] === nextRows
        ? current
        : {
            ...current,
            [activeAnexoType]: nextRows
          }
    ));
  }, [activeAnexoType]);

  const { cancelFileLoad, exportExcel, reloadFolder, selectFiles, selectFolder } = useDteActions({
    documents,
    folder,
    rows: sortedFilteredRows,
    setDocuments,
    setErrors,
    setLoadedFilePaths,
    setFolder,
    setLoading,
    setShowLoadCancelledModal,
    setStatus,
    setTotalFileCount
  });

  const selectedQueryUrl = useMemo(() => buildHaciendaQueryUrl(selectedRow), [selectedRow]);

  async function exportLoadErrorsExcel() {
    const reportRows = buildExactLoadErrorReportRows({
      documents,
      errors,
      filePaths: loadedFilePaths,
      folder,
      notLoadedCount
    });
    if (!reportRows.length) {
      setStatus('No hay archivos no cargados para generar reporte.');
      return;
    }

    try {
      setLoading(true);
      const filePath = await window.dteApp.exportLoadErrorExcel(reportRows);
      if (filePath) setStatus(`Reporte de archivos no cargados exportado: ${filePath}`);
    } catch (error) {
      setStatus(`No se pudo generar el reporte de no cargados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function querySelectedInHacienda() {
    if (!selectedRow) {
      setStatus('Seleccione una fila antes de consultar Hacienda.');
      return;
    }

    if (!selectedQueryUrl) {
      setStatus('La fila seleccionada no tiene codigo de generacion o fecha validos.');
      return;
    }

    try {
      setLoading(true);
      const publicData = await queryPublicHaciendaRow(selectedRow);
      if (publicData && publicData.estadoDoc !== 'Error') {
        const selectedCode = getSelectedGenerationCode(selectedRow);
        updateDocumentsWithPublicData(new Map([[normalizeGenerationKey(selectedCode), publicData]]));
      }

      if (!window.dteApp?.openExternal) throw new Error('Reinicie la aplicacion para cargar el abridor externo.');
      await window.dteApp.openExternal(selectedQueryUrl);
      setStatus('Datos de Hacienda actualizados y consulta abierta en el navegador predeterminado.');
    } catch (error) {
      setStatus(`No se pudo abrir el navegador predeterminado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function queryAllRowsInHacienda() {
    const queryableRows = getUniqueQueryableRows(filteredRows);
    if (!queryableRows.length) {
      setStatus('No hay lineas con codigo de generacion y fecha validos para consultar Hacienda.');
      return;
    }

    setLoading(true);
    setStatus(`Consultando Hacienda para ${queryableRows.length} documento(s)...`);

    let removeProgressListener = () => {};

    try {
      if (window.dteApp?.onPublicHaciendaBatchProgress) {
        removeProgressListener = window.dteApp.onPublicHaciendaBatchProgress((progress) => {
          setStatus(`Consultando Hacienda: ${progress.completed}/${progress.total} documento(s)...`);
        });
      }

      const results = await queryPublicHaciendaRows(queryableRows);
      const publicDataByCode = new Map();
      let failed = 0;

      for (const result of results) {
        if (result?.data && result.data.estadoDoc !== 'Error') {
          const responseCode = result.data.codGen || result.data.codigoGeneracion || result.codigoGeneracion;
          publicDataByCode.set(normalizeGenerationKey(responseCode), result.data);
        } else {
          failed += 1;
        }
      }

      updateDocumentsWithPublicData(publicDataByCode, (updatedCount) => {
        setStatus(`Consulta Hacienda terminada: ${updatedCount} documento(s) actualizado(s), ${failed} sin respuesta.`);
      });
    } catch (error) {
      setStatus(`No se pudo completar la consulta masiva: ${error.message}`);
    } finally {
      removeProgressListener();
      setLoading(false);
    }
  }

  async function queryPublicHaciendaRow(row) {
    return window.dteApp.publicHaciendaQuery({
      ambiente: getSelectedEnvironment(row),
      codigoGeneracion: getSelectedGenerationCode(row),
      fechaEmi: getSelectedIssueDate(row)
    });
  }

  async function queryPublicHaciendaRows(queryableRows) {
    if (!window.dteApp?.publicHaciendaBatchQuery) {
      return Promise.all(queryableRows.map(async (row) => ({
        codigoGeneracion: getSelectedGenerationCode(row),
        data: await queryPublicHaciendaRow(row)
      })));
    }

    return window.dteApp.publicHaciendaBatchQuery({
      queries: queryableRows.map((row) => ({
        ambiente: getSelectedEnvironment(row),
        codigoGeneracion: getSelectedGenerationCode(row),
        fechaEmi: getSelectedIssueDate(row)
      }))
    });
  }

  function fillMissingReceptionStamps() {
    const stampsByCode = new Map();

    for (const row of filteredRows) {
      const code = normalizeGenerationKey(getSelectedGenerationCode(row));
      const localStamp = String(row['Serie del Documento'] || row['Serie de Documento'] || row['Serie Documento'] || '').trim();
      const publicStamp = String(row['Sello de Recepcion'] || row['selloVal'] || '').trim();
      if (code && !localStamp && publicStamp) stampsByCode.set(code, publicStamp);
    }

    if (!stampsByCode.size) {
      setStatus('No hay campos vacios en Serie del Documento con Sello de Recepcion disponible.');
      return;
    }

    let updatedCount = 0;
    setDocuments((currentDocuments) => currentDocuments.map((document) => {
      const documentCode = normalizeGenerationKey(getDocumentGenerationCode(document));
      const publicStamp = stampsByCode.get(documentCode);
      const currentStamp = String(
        document?.payload?.selloRecepcion
        || document?.payload?.selloRecibido
        || document?.payload?.sello
        || document?.payload?.SelloRecibido
        || ''
      ).trim();

      if (!publicStamp || currentStamp) return document;

      updatedCount += 1;
      return {
        ...document,
        payload: {
          ...document.payload,
          selloRecepcion: publicStamp,
          selloRecibido: publicStamp
        }
      };
    }));

    setStatus(`${updatedCount} campo(s) vacio(s) de Serie del Documento rellenado(s) desde Sello de Recepcion.`);
  }

  function updateDocumentsWithPublicData(publicDataByCode, onUpdated) {
    setDocuments((currentDocuments) => {
      let updatedCount = 0;
      const updatedDocuments = currentDocuments.map((document) => {
        const documentCode = normalizeGenerationKey(getDocumentGenerationCode(document));
        const publicData = publicDataByCode.get(documentCode);
        if (!publicData) return document;
        updatedCount += 1;
        return { ...document, payload: { ...document.payload, __consultaPublica: publicData } };
      });

      if (onUpdated) window.queueMicrotask(() => onUpdated(updatedCount));
      return updatedDocuments;
    });
  }

  function openClearTableModal() {
    if (!rows.length && !documents.length) {
      setShowEmptyTableModal(true);
      return;
    }

    setClearTablePassword('');
    setShowClearTableModal(true);
  }

  function closeClearTableModal() {
    setClearTablePassword('');
    setShowClearTableModal(false);
  }

  function confirmClearTable() {
    if (clearTablePassword !== HOME_CLEAR_KEY) {
      setStatus('Clave incorrecta. No se limpio la tabla.');
      return;
    }

    setDocuments([]);
    setRows([]);
    setErrors([]);
    setLoadedFilePaths([]);
    setColumnFilters({});
    setHomeSortConfig({ column: '', direction: 'asc' });
    setHomeFiltersByKey((current) => ({ ...current, [homeFilterStorageKey]: {} }));
    setHomeSortByKey((current) => ({ ...current, [homeSortStorageKey]: { column: '', direction: 'asc' } }));
    savePersistedFilters(homeFilterStorageKey, {});
    savePersistedSort(homeSortStorageKey, { column: '', direction: 'asc' });
    setSelectedRow(null);
    setTotalFileCount(0);
    setStatus('Tabla limpiada correctamente.');
    closeClearTableModal();
  }

  function requestDeleteInicioRow(row) {
    setRowPendingDelete(row);
  }

  function closeDeleteRowModal() {
    setRowPendingDelete(null);
  }

  function confirmDeleteInicioRow() {
    const row = rowPendingDelete;
    if (!row) return;
    const rowKey = getRowDeleteKey(row);
    setDocuments((currentDocuments) => {
      const nextDocuments = currentDocuments.filter((document) => !documentMatchesRow(document, rowKey));
      const deletedCount = currentDocuments.length - nextDocuments.length;
      window.queueMicrotask(() => {
        setStatus(deletedCount ? `${deletedCount} linea(s) eliminada(s).` : 'No se pudo identificar la linea para eliminar.');
      });
      return nextDocuments;
    });
    if (selectedRow === row) setSelectedRow(null);
    setRowPendingDelete(null);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {showSplash ? <SplashScreen /> : null}
      <AppHeader
        activeView={activeView}
        onNavigate={setActiveView}
        onStartTour={() => setTourRunId((current) => current + 1)}
      />
      <AppTour onNavigate={setActiveView} runId={tourRunId} />
      {activeView === 'dte' ? (
        <>
          <FilterPanel
            folder={folder}
            fromDate={fromDate}
            loading={loading}
            metricsSlot={(
              <StatusBar
                loading={loading}
                onFillReceptionStamps={fillMissingReceptionStamps}
                onOpenHacienda={querySelectedInHacienda}
                onQueryAllHacienda={queryAllRowsInHacienda}
                rowCount={filteredRows.length}
                selectedRow={selectedRow}
                selectedQueryUrl={selectedQueryUrl}
                status={status}
              />
            )}
            onExportExcel={exportExcel}
            onCancelLoad={cancelFileLoad}
            onClearTable={openClearTableModal}
            onExportLoadErrorsExcel={exportLoadErrorsExcel}
            onReloadFolder={reloadFolder}
            onSelectFiles={selectFiles}
            onFromDateChange={setFromDate}
            onFolderChange={setFolder}
            onClearDates={() => {
              setFromDate('');
              setToDate('');
            }}
            onSelectFolder={selectFolder}
            onStructureNameChange={setStructureName}
            onToDateChange={setToDate}
            onTypeCodeChange={setTypeCode}
            notLoadedCount={notLoadedCount}
            structureName={structureName}
            toDate={toDate}
            typeCode={typeCode}
          />

          <section className="px-6 py-4">
            <DteSummaryBar
              columnCount={columns.length}
              duplicateCount={inicioAlertCounts.duplicateCount}
              dteSummary={dteSummary}
              invalidCount={inicioAlertCounts.invalidCount}
              loadedCount={documents.length}
              rejectedCount={inicioAlertCounts.rejectedCount}
              rowCount={filteredRows.length}
              totalFileCount={totalFileCount}
            />
            {documents.length ? (
              <Suspense fallback={<div className="tableFrame"><div className="empty">Preparando tabla...</div></div>}>
                <VirtualDataTable
                  columnFilters={columnFilters}
                  columns={columns}
                  filterSourceRows={rows}
                  onColumnFilterChange={handleColumnFiltersChange}
                  onRowDelete={requestDeleteInicioRow}
                  onRowSelect={setSelectedRow}
                  onSortConfigChange={handleHomeSortConfigChange}
                  rows={filteredRows}
                  selectedRow={selectedRow}
                  sortConfig={homeSortConfig}
                />
              </Suspense>
            ) : (
              <div className="tableFrame">
                <div className="empty">Sin datos cargados</div>
              </div>
            )}
            <ErrorSummary errors={errors} onExportExcel={exportLoadErrorsExcel} />
          </section>
          {showClearTableModal ? (
            <div className="registerModalBackdrop">
              <div className="registerModal clearConfirmModal" role="dialog" aria-modal="true" aria-labelledby="home-clear-modal-title">
                <div className="registerModalHeader">
                  <h2 id="home-clear-modal-title">Estas seguro que quieres limpiar la tabla?</h2>
                  <button className="modalIconButton" onClick={closeClearTableModal} type="button">
                    <X size={18} />
                  </button>
                </div>
                <p className="clearConfirmText">
                  Esta accion borrara todos los datos cargados en INICIO. Para confirmar, escriba la clave
                  {' '}
                  <strong>{HOME_CLEAR_KEY}</strong>
                  .
                </p>
                <label className="registerFormField">
                  <span>Clave de confirmacion</span>
                  <input
                    autoFocus
                    onChange={(event) => setClearTablePassword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && clearTablePassword === HOME_CLEAR_KEY) confirmClearTable();
                    }}
                    placeholder="Escriba la clave de confirmacion"
                    type="password"
                    value={clearTablePassword}
                  />
                </label>
                <div className="registerModalActions">
                  <button className="actionButton" onClick={closeClearTableModal} type="button">
                    NO
                  </button>
                  <button className="actionButton dangerActionButton" disabled={clearTablePassword !== HOME_CLEAR_KEY} onClick={confirmClearTable} type="button">
                    SI
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {rowPendingDelete ? (
            <div className="registerModalBackdrop">
              <div className="registerModal deleteRowConfirmModal" role="dialog" aria-modal="true" aria-labelledby="delete-row-modal-title">
                <div className="registerModalHeader">
                  <h2 id="delete-row-modal-title">Deseas borrar el registro</h2>
                  <button className="modalIconButton" onClick={closeDeleteRowModal} type="button">
                    <X size={18} />
                  </button>
                </div>
                <div className="registerModalActions">
                  <button className="actionButton" onClick={closeDeleteRowModal} type="button">
                    NO
                  </button>
                  <button className="actionButton dangerActionButton" onClick={confirmDeleteInicioRow} type="button">
                    SI
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {showEmptyTableModal ? (
            <div className="registerModalBackdrop">
              <div className="registerModal emptyTableModal" role="dialog" aria-modal="true" aria-labelledby="empty-table-modal-title">
                <div className="registerModalHeader">
                  <div className="emptyTableTitle">
                    <span className="emptyTableIcon">
                      <Info size={18} />
                    </span>
                    <h2 id="empty-table-modal-title">Tabla sin registros</h2>
                  </div>
                  <button className="modalIconButton" onClick={() => setShowEmptyTableModal(false)} type="button">
                    <X size={18} />
                  </button>
                </div>
                <div className="emptyTableBody">
                  <p>No hay datos cargados en INICIO para eliminar.</p>
                  <span>Cargue una carpeta o seleccione archivos antes de usar esta accion.</span>
                </div>
                <div className="registerModalActions">
                  <button className="primaryModalButton" onClick={() => setShowEmptyTableModal(false)} type="button">
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {showLoadCancelledModal ? (
            <div className="registerModalBackdrop">
              <div className="registerModal emptyTableModal" role="dialog" aria-modal="true" aria-labelledby="load-cancelled-modal-title">
                <div className="registerModalHeader">
                  <div className="emptyTableTitle">
                    <span className="emptyTableIcon">
                      <Info size={18} />
                    </span>
                    <h2 id="load-cancelled-modal-title">Carga cancelada</h2>
                  </div>
                  <button className="modalIconButton" onClick={() => setShowLoadCancelledModal(false)} type="button">
                    <X size={18} />
                  </button>
                </div>
                <div className="emptyTableBody">
                  <p>Carga cancelada</p>
                </div>
                <div className="registerModalActions">
                  <button className="primaryModalButton" onClick={() => setShowLoadCancelledModal(false)} type="button">
                    Aceptar
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {false && showExitConfirmModal ? (
            <div className="registerModalBackdrop">
              <div className="registerModal clearConfirmModal" role="dialog" aria-modal="true" aria-labelledby="exit-confirm-modal-title">
                <div className="registerModalHeader">
                  <span className="modalIcon">
                    <img src={closeIcon} alt="Exit icon"  style={{ width: '22px', height: '22px' }} />
                  </span>
                  <h2 id="exit-confirm-modal-title">Salir del sistema</h2>
                  <button className="modalIconButton" onClick={() => setShowExitConfirmModal(false)} type="button">
                    <X size={18} />
                  </button>
                </div>
                <div>
                    <p className="font-bold underline clearConfirmText">
                  Se borrara toda la informacion cargada.
                </p>
                </div>
                <p className="clearConfirmText">
                  Esta acción no se puede deshacer.
                </p>
                <div className="registerModalActions">
                  <button className="actionButton dangerActionButton" onClick={confirmExitApp} type="button">
                    Aceptar
                  </button>
                  <button className="actionButton" onClick={() => setShowExitConfirmModal(false)} type="button">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : activeView.startsWith('iva-books') ? (
        <Suspense fallback={<div className="tableFrame"><div className="empty">Preparando libro...</div></div>}>
          <IvaBooksView
            key={activeView}
            onNavigateRegister={setActiveView}
            savedRows={ivaBookRowsByType[activeIvaBookType]}
            onRowsChange={handleIvaBookRowsChange}
            sourceRows={sortedFilteredRows}
            sourceStructureName={structureName}
            sourceTypeCode={typeCode}
            type={
              activeView === 'iva-books-ccf-sales'
                ? 'ccfSales'
                : activeView === 'iva-books-fcf-sales'
                  ? 'fcfSales'
                  : 'purchases'
            }
          />
        </Suspense>
      ) : activeView.startsWith('anexos') ? (
        <Suspense fallback={<div className="tableFrame"><div className="empty">Preparando anexos...</div></div>}>
          <AnexosView
            key={activeAnexoType}
            ccfSalesRows={ivaBookRowsByType.ccfSales || []}
            fcfSalesRows={ivaBookRowsByType.fcfSales || []}
            homeRows={rows}
            purchaseRows={ivaBookRowsByType.purchases || []}
            onRowsChange={handleAnexoRowsChange}
            savedRows={anexoRowsByType[activeAnexoType]}
            type={activeAnexoType}
          />
        </Suspense>
      ) : activeView === 'code-appendix' ? (
        <Suspense fallback={<div className="tableFrame"><div className="empty">Preparando apendice...</div></div>}>
          <CodeAppendixView />
        </Suspense>
      ) : (
        <Suspense fallback={<div className="tableFrame"><div className="empty">Preparando registros...</div></div>}>
          <RegisterView
            key={activeView}
            sourceRows={rows}
            sourceStructureName={structureName}
            sourceTypeCode={typeCode}
            type={
              activeView === 'registers-providers'
                ? 'providers'
                : activeView === 'registers-providers-f14'
                  ? 'providersF14'
                  : 'clients'
            }
          />
        </Suspense>
      )}
      {showExitConfirmModal ? (
        <div className="registerModalBackdrop exitConfirmBackdrop">
          <div className="registerModal clearConfirmModal exitConfirmModal" role="dialog" aria-modal="true" aria-labelledby="exit-confirm-modal-title">
            <div className="registerModalHeader exitConfirmHeader">
              <div className="exitConfirmTitle">
                <span className="exitConfirmIcon">
                  <Power size={34} strokeWidth={3} />
                </span>
                <span className="exitConfirmDivider" aria-hidden="true" />
                <h2 id="exit-confirm-modal-title">Salir del sistema</h2>
              </div>
              <button className="modalIconButton exitConfirmCloseButton" onClick={() => setShowExitConfirmModal(false)} type="button">
                <X size={42} strokeWidth={3} />
              </button>
            </div>
            <div className="exitConfirmBody">
              <div className="exitConfirmWarningIcon">
                <img className="exitConfirmWarningImage" src={warningFlaticonIcon} alt="Advertencia" />
              </div>
              <span className="exitConfirmBodyDivider" aria-hidden="true" />
              <div className="exitConfirmMessage">
                <p className="exitConfirmPrimaryText">Se borrara todo la informacion cargada. Esta accion no se puede deshacer.</p>
                <p className="exitConfirmSecondaryText">Seguro que quieres salir del sistema?</p>
              </div>
            </div>
            <div className="registerModalActions exitConfirmActions">
              <button className="exitConfirmAcceptButton" onClick={confirmExitApp} type="button">
                <LogOut size={24} />
                Aceptar
              </button>
              <button className="exitConfirmCancelButton" onClick={() => setShowExitConfirmModal(false)} type="button">
                <CircleX size={24} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
