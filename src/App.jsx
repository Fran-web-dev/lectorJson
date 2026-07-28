import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader.jsx';
import { ErrorSummary } from './components/ErrorSummary.jsx';
import { FilterPanel } from './components/FilterPanel.jsx';
import { RegisterView } from './components/RegisterView.jsx';
import { SplashScreen } from './components/SplashScreen.jsx';
import { DteSummaryBar, StatusBar } from './components/StatusBar.jsx';
import { useDteActions } from './hooks/useDteActions.js';
import { DEFAULT_STRUCTURE_NAME, getStructureOptions } from './lib/dteStructureOptions.js';
import {
  buildHaciendaQueryUrl,
  getDocumentGenerationCode,
  getSelectedEnvironment,
  getSelectedGenerationCode,
  getSelectedIssueDate,
  getUniqueQueryableRows
} from './lib/haciendaUtils.js';
import {
  applyColumnFilters,
  extractRowsForSummary,
  markDuplicateRows,
  orderColumns,
  summarizeDteTypes
} from './lib/tableRowUtils.js';

const VirtualDataTable = lazy(() => import('./components/VirtualDataTable.jsx').then((module) => ({
  default: module.VirtualDataTable
})));

const HACIENDA_QUERY_CONCURRENCY = 6;

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [folder, setFolder] = useState('');
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState([]);
  const [totalFileCount, setTotalFileCount] = useState(0);
  const [typeCode, setTypeCode] = useState('01');
  const [structureName, setStructureName] = useState(DEFAULT_STRUCTURE_NAME);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [status, setStatus] = useState('Seleccione una carpeta con archivos JSON o CSV.');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [activeView, setActiveView] = useState('dte');

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1100);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const structureOptions = getStructureOptions(typeCode);
    if (!structureOptions.includes(structureName)) {
      setStructureName(structureOptions[0] || '');
    }
  }, [structureName, typeCode]);

  useEffect(() => {
    let cancelled = false;
    if (!documents.length) {
      setRows([]);
      return () => {
        cancelled = true;
      };
    }

    import('./lib/extractor.js').then(({ extractRows }) => {
      if (!cancelled) {
        setRows(markDuplicateRows(extractRows(documents, { typeCode, structureName, fromDate, toDate })));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [documents, typeCode, structureName, fromDate, toDate]);

  const columns = useMemo(
    () => orderColumns(Object.keys(rows[0] || {}).filter((key) => !key.startsWith('__'))),
    [rows]
  );

  const filteredRows = useMemo(
    () => applyColumnFilters(rows, columnFilters),
    [rows, columnFilters]
  );

  const dteSummary = useMemo(
    () => summarizeDteTypes(extractRowsForSummary(documents)),
    [documents]
  );

  const { exportExcel, reloadFolder, selectFiles, selectFolder } = useDteActions({
    documents,
    folder,
    rows: filteredRows,
    setDocuments,
    setErrors,
    setFolder,
    setLoading,
    setStatus,
    setTotalFileCount
  });

  const selectedQueryUrl = useMemo(() => buildHaciendaQueryUrl(selectedRow), [selectedRow]);

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
        updateDocumentsWithPublicData(new Map([[selectedCode, publicData]]));
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

    const publicDataByCode = new Map();
    let completed = 0;
    let failed = 0;
    let nextIndex = 0;

    async function worker() {
      while (nextIndex < queryableRows.length) {
        const row = queryableRows[nextIndex];
        nextIndex += 1;
        try {
          const publicData = await queryPublicHaciendaRow(row);
          if (publicData && publicData.estadoDoc !== 'Error') {
            publicDataByCode.set(getSelectedGenerationCode(row), publicData);
          } else {
            failed += 1;
          }
        } catch {
          failed += 1;
        } finally {
          completed += 1;
          if (completed % 10 === 0 || completed === queryableRows.length) {
            setStatus(`Consultando Hacienda: ${completed}/${queryableRows.length} documento(s)...`);
          }
        }
      }
    }

    await Promise.all(Array.from(
      { length: Math.min(HACIENDA_QUERY_CONCURRENCY, queryableRows.length) },
      () => worker()
    ));

    updateDocumentsWithPublicData(publicDataByCode);
    setLoading(false);
    setStatus(`Consulta Hacienda terminada: ${publicDataByCode.size} actualizado(s), ${failed} sin respuesta.`);
  }

  async function queryPublicHaciendaRow(row) {
    return window.dteApp.publicHaciendaQuery({
      ambiente: getSelectedEnvironment(row),
      codigoGeneracion: getSelectedGenerationCode(row),
      fechaEmi: getSelectedIssueDate(row)
    });
  }

  function fillMissingReceptionStamps() {
    const stampsByCode = new Map();

    for (const row of filteredRows) {
      const code = getSelectedGenerationCode(row);
      const localStamp = String(row['Serie del Documento'] || '').trim();
      const publicStamp = String(row['Sello de Recepcion'] || '').trim();
      if (code && !localStamp && publicStamp) stampsByCode.set(code, publicStamp);
    }

    if (!stampsByCode.size) {
      setStatus('No hay campos vacios en Serie del Documento con Sello de Recepcion disponible.');
      return;
    }

    let updatedCount = 0;
    setDocuments((currentDocuments) => currentDocuments.map((document) => {
      const documentCode = getDocumentGenerationCode(document);
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
          selloRecepcion: publicStamp
        }
      };
    }));

    setStatus(`${updatedCount} campo(s) vacio(s) de Serie del Documento rellenado(s) desde Sello de Recepcion.`);
  }

  function updateDocumentsWithPublicData(publicDataByCode) {
    setDocuments((currentDocuments) => currentDocuments.map((document) => {
      const documentCode = getDocumentGenerationCode(document);
      const publicData = publicDataByCode.get(documentCode);
      return publicData ? { ...document, payload: { ...document.payload, __consultaPublica: publicData } } : document;
    }));
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {showSplash ? <SplashScreen /> : null}
      <AppHeader activeView={activeView} onNavigate={setActiveView} />
      {activeView === 'dte' ? (
        <>
          <FilterPanel
            folder={folder}
            fromDate={fromDate}
            loading={loading}
            metricsSlot={(
              <StatusBar
                columnCount={columns.length}
                loadedCount={documents.length}
                loading={loading}
                onFillReceptionStamps={fillMissingReceptionStamps}
                onOpenHacienda={querySelectedInHacienda}
                onQueryAllHacienda={queryAllRowsInHacienda}
                rowCount={filteredRows.length}
                selectedRow={selectedRow}
                selectedQueryUrl={selectedQueryUrl}
                status={status}
                totalFileCount={totalFileCount}
              />
            )}
            onExportExcel={exportExcel}
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
            structureName={structureName}
            toDate={toDate}
            typeCode={typeCode}
          />

          <section className="px-6 py-4">
            <DteSummaryBar dteSummary={dteSummary} />
            {documents.length ? (
              <Suspense fallback={<div className="tableFrame"><div className="empty">Preparando tabla...</div></div>}>
                <VirtualDataTable
                  columnFilters={columnFilters}
                  columns={columns}
                  filterSourceRows={rows}
                  onColumnFilterChange={setColumnFilters}
                  onRowSelect={setSelectedRow}
                  rows={filteredRows}
                  selectedRow={selectedRow}
                />
              </Suspense>
            ) : (
              <div className="tableFrame">
                <div className="empty">Sin datos cargados</div>
              </div>
            )}
            <ErrorSummary errors={errors} />
          </section>
        </>
      ) : (
        <RegisterView
          key={activeView}
          sourceRows={rows}
          sourceStructureName={structureName}
          sourceTypeCode={typeCode}
          type={activeView === 'registers-providers' ? 'providers' : 'clients'}
        />
      )}
    </main>
  );
}
