import { useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader.jsx';
import { ErrorSummary } from './components/ErrorSummary.jsx';
import { FilterPanel } from './components/FilterPanel.jsx';
import { StatusBar } from './components/StatusBar.jsx';
import { VirtualDataTable } from './components/VirtualDataTable.jsx';
import { useDteActions } from './hooks/useDteActions.js';
import { extractRows } from './lib/extractor.js';

export default function App() {
  const [folder, setFolder] = useState('');
  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState([]);
  const [typeCode, setTypeCode] = useState('all');
  const [structureName, setStructureName] = useState('Estructura Hacienda DTE');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [status, setStatus] = useState('Seleccione una carpeta con archivos JSON o CSV.');
  const [loading, setLoading] = useState(false);
  const [apiConfig, setApiConfig] = useState({
    baseUrl: 'https://apitest.dtes.mh.gob.sv/fesv/recepciondte',
    endpoint: 'recepcion',
    token: ''
  });

  const rows = useMemo(
    () => markDuplicateRows(extractRows(documents, { typeCode, fromDate, toDate })),
    [documents, typeCode, fromDate, toDate]
  );

  const columns = useMemo(
    () => Array.from(new Set(rows.flatMap((row) => Object.keys(row).filter((key) => !key.startsWith('__'))))),
    [rows]
  );

  const filteredRows = useMemo(
    () => applyColumnFilters(rows, columnFilters),
    [rows, columnFilters]
  );

  const { exportExcel, selectFiles, selectFolder, testHacienda } = useDteActions({
    apiConfig,
    documents,
    rows: filteredRows,
    setDocuments,
    setErrors,
    setFolder,
    setLoading,
    setStatus
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <AppHeader />
      <FilterPanel
        apiConfig={apiConfig}
        folder={folder}
        fromDate={fromDate}
        loading={loading}
        onApiConfigChange={setApiConfig}
        onExportExcel={exportExcel}
        onSelectFiles={selectFiles}
        onFromDateChange={setFromDate}
        onClearDates={() => {
          setFromDate('');
          setToDate('');
        }}
        onSelectFolder={selectFolder}
        onStructureNameChange={setStructureName}
        onTestHacienda={testHacienda}
        onToDateChange={setToDate}
        onTypeCodeChange={setTypeCode}
        structureName={structureName}
        toDate={toDate}
        typeCode={typeCode}
      />

      <section className="px-6 py-4">
        <StatusBar
          columnCount={columns.length}
          loadedCount={documents.length}
          loading={loading}
          rowCount={filteredRows.length}
          status={status}
        />
        <VirtualDataTable
          columnFilters={columnFilters}
          columns={columns}
          filterSourceRows={rows}
          onColumnFilterChange={setColumnFilters}
          rows={filteredRows}
        />
        <ErrorSummary errors={errors} />
      </section>
    </main>
  );
}

function applyColumnFilters(rows, filters) {
  const activeFilters = Object.entries(filters)
    .map(([column, value]) => [column, Array.isArray(value) ? value : []])
    .filter(([, value]) => value.length);

  if (!activeFilters.length) return rows;

  return rows.filter((row) => activeFilters.every(([column, value]) => (
    value.includes(String(row[column] ?? ''))
  )));
}

function normalizeDuplicateKey(value) {
  return String(value || '').trim().toUpperCase();
}

function getDuplicateKey(row) {
  return normalizeDuplicateKey(row['Numero del Documento']) || normalizeDuplicateKey(row['Numero de Control']);
}

function markDuplicateRows(rows) {
  const filesByDocument = new Map();

  for (const row of rows) {
    const key = getDuplicateKey(row);
    if (!key) continue;
    if (!filesByDocument.has(key)) filesByDocument.set(key, new Set());
    filesByDocument.get(key).add(row.__sourceFile || `row:${filesByDocument.get(key).size}`);
  }

  return rows.map((row) => {
    const key = getDuplicateKey(row);
    return { ...row, __isDuplicate: Boolean(key && filesByDocument.get(key)?.size > 1) };
  });
}
