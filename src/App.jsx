import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Info, X } from 'lucide-react';
import { AppHeader } from './components/AppHeader.jsx';
import { ErrorSummary } from './components/ErrorSummary.jsx';
import { FilterPanel } from './components/FilterPanel.jsx';
import { IvaBooksView } from './components/IvaBooksView.jsx';
import { RegisterView } from './components/RegisterView.jsx';
import { SplashScreen } from './components/SplashScreen.jsx';
import { DteSummaryBar, StatusBar } from './components/StatusBar.jsx';
import { useDteActions } from './hooks/useDteActions.js';
import { DEFAULT_STRUCTURE_NAME, getStructureOptions } from './lib/dteStructureOptions.js';
import { MONEY_COLUMN_NAMES } from './lib/dteStructures.js';
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
const HOME_CLEAR_KEY = '1234';

function normalizeGenerationKey(value) {
  return String(value || '').replace(/-/g, '').trim().toUpperCase();
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
  const [status, setStatus] = useState('Seleccione una carpeta con archivos JSON.');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [fcfIvaBookRows, setFcfIvaBookRows] = useState([]);
  const [activeView, setActiveView] = useState('dte');
  const [showClearTableModal, setShowClearTableModal] = useState(false);
  const [showEmptyTableModal, setShowEmptyTableModal] = useState(false);
  const [clearTablePassword, setClearTablePassword] = useState('');

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
    setColumnFilters({});
    setSelectedRow(null);
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

  useEffect(() => {
    let cancelled = false;
    if (!documents.length) {
      setFcfIvaBookRows([]);
      return () => {
        cancelled = true;
      };
    }

    import('./lib/extractor.js').then(({ extractRows }) => {
      if (cancelled) return;
      const fcfRows = extractRows(documents, {
        typeCode: '01',
        structureName: 'FCF EMISOR',
        fromDate,
        toDate
      });
      const fexRows = extractRows(documents, {
        typeCode: '11',
        structureName: 'FEX EMISOR',
        fromDate,
        toDate
      });
      setFcfIvaBookRows([...fcfRows, ...fexRows]);
    });

    return () => {
      cancelled = true;
    };
  }, [documents, fromDate, toDate]);

  const columns = useMemo(
    () => getTableColumns(rows, typeCode),
    [rows, typeCode]
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
    setColumnFilters({});
    setSelectedRow(null);
    setTotalFileCount(0);
    setStatus('Tabla limpiada correctamente.');
    closeClearTableModal();
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
            onClearTable={openClearTableModal}
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
        </>
      ) : activeView.startsWith('iva-books') ? (
        <IvaBooksView
          key={activeView}
          sourceRows={activeView === 'iva-books-fcf-sales' ? fcfIvaBookRows : filteredRows}
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
