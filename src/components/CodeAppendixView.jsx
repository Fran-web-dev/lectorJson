import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CODE_APPENDIX_TABLES } from '../data/codeAppendixTables.js';

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function CodeAppendixView() {
  const [activeTableIndex, setActiveTableIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const activeTable = CODE_APPENDIX_TABLES[activeTableIndex] || CODE_APPENDIX_TABLES[0];

  const filteredRows = useMemo(() => {
    if (!activeTable) return [];
    const query = normalizeText(searchTerm);
    if (!query) return activeTable.rows;

    return activeTable.rows.filter((row) => (
      row.some((cell) => normalizeText(cell).includes(query))
    ));
  }, [activeTable, searchTerm]);

  return (
    <section className="codeAppendixView">
      <aside className="codeAppendixSidebar">
        <div>
          <h1>APENDICE DE CODIGOS</h1>
        </div>
        <div className="codeAppendixNav" aria-label="Tablas del apendice">
          {CODE_APPENDIX_TABLES.map((table, index) => (
            <button
              className={`codeAppendixNavButton ${index === activeTableIndex ? 'active' : ''}`}
              key={table.title}
              onClick={() => {
                setActiveTableIndex(index);
                setSearchTerm('');
              }}
              type="button"
            >
              <span>{table.title}</span>
              <strong>{table.rows.length}</strong>
            </button>
          ))}
        </div>
      </aside>

      <div className="codeAppendixPanel">
        <div className="codeAppendixToolbar">
          <div>
            <span className="codeAppendixEyebrow">Tabla activa</span>
            <h2>{activeTable?.title || 'Sin tablas'}</h2>
          </div>
          <label className="codeAppendixSearch">
            <Search size={16} />
            <input
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar codigo, nombre o descripcion..."
              type="search"
              value={searchTerm}
            />
          </label>
          <span className="codeAppendixCounter">
            {filteredRows.length}
            {' '}
            registro(s)
          </span>
        </div>

        <div className="codeAppendixTableViewport">
          {activeTable ? (
            <table className="codeAppendixTable">
              <thead>
                <tr>
                  {activeTable.headers.map((header, index) => (
                    <th key={`${header}-${index}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length ? filteredRows.map((row, rowIndex) => (
                  <tr key={`${activeTable.title}-${rowIndex}`}>
                    {activeTable.headers.map((_, cellIndex) => (
                      <td key={`${activeTable.title}-${rowIndex}-${cellIndex}`}>
                        {row[cellIndex] || ''}
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr>
                    <td className="codeAppendixEmpty" colSpan={activeTable.headers.length}>
                      No hay coincidencias para la busqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="empty">Sin tablas disponibles</div>
          )}
        </div>
      </div>
    </section>
  );
}
