import { BookOpen, Building2, ChevronDown, FileText, HelpCircle, TableProperties, Users } from 'lucide-react';
import logoFevv from '../assets/logo-fevv-technologies-startup.jpg';

export function AppHeader({ activeView, onNavigate, onStartTour }) {
  return (
    <header className="brandHeader">
      <img alt="FEVV Technologies" className="brandLogo" src={logoFevv} />
      <nav className="mainNav" aria-label="Menu principal">
        <button
          className={`navButton ${activeView === 'dte' ? 'active' : ''}`}
          data-tour="nav-inicio"
          onClick={() => onNavigate('dte')}
          type="button"
        >
          <FileText size={16} />
          INICIO
        </button>
        <div className="navDropdown navDropdownRegisters">
          <button
            className={`navButton ${activeView.startsWith('registers') ? 'active' : ''}`}
            data-tour="nav-registros"
            onClick={() => onNavigate('registers-clients')}
            type="button"
          >
            <Users size={16} />
            REGISTROS
            <ChevronDown className="navChevron" size={15} />
          </button>
          <div className="navDropdownMenu">
            <button onClick={() => onNavigate('registers-clients')} type="button">
              <Users size={15} />
              Registros de clientes
            </button>
            <button onClick={() => onNavigate('registers-providers')} type="button">
              <Building2 size={15} />
              Registros de proveedores
            </button>
          </div>
        </div>
        <div className="navDropdown">
          <button
            className={`navButton ${activeView.startsWith('iva-books') ? 'active' : ''}`}
            data-tour="nav-libros-iva"
            onClick={() => onNavigate('iva-books-purchases')}
            type="button"
          >
            <BookOpen size={16} />
            LIBROS DE IVA
            <ChevronDown className="navChevron" size={15} />
          </button>
          <div className="navDropdownMenu">
            <button onClick={() => onNavigate('iva-books-purchases')} type="button">
              <BookOpen size={15} />
              Libro de compras
            </button>
            <button onClick={() => onNavigate('iva-books-ccf-sales')} type="button">
              <BookOpen size={15} />
              Libro de ventas CCF
            </button>
            <button onClick={() => onNavigate('iva-books-fcf-sales')} type="button">
              <BookOpen size={15} />
              Libro de ventas FCF
            </button>
          </div>
        </div>
        <div className="navDropdown">
          <button
            className={`navButton ${activeView.startsWith('anexos') ? 'active' : ''}`}
            data-tour="nav-anexos"
            onClick={() => onNavigate('anexos-sales-ccf')}
            type="button"
          >
            <TableProperties size={16} />
            ANEXOS
            <ChevronDown className="navChevron" size={15} />
          </button>
          <div className="navDropdownMenu">
            <button onClick={() => onNavigate('anexos-sales-ccf')} type="button">
              <TableProperties size={15} />
              Anexo venta CCF
            </button>
            <button onClick={() => onNavigate('anexos-sales-fcf')} type="button">
              <TableProperties size={15} />
              Anexo venta FCF
            </button>
            <button onClick={() => onNavigate('anexos-purchases')} type="button">
              <TableProperties size={15} />
              Anexo compras
            </button>
            <button onClick={() => onNavigate('anexos-excluded-subject')} type="button">
              <TableProperties size={15} />
              Anexo compra sujeto excluido FSE
            </button>
            <button onClick={() => onNavigate('anexos-advance-vat')} type="button">
              <TableProperties size={15} />
              Anexo anticipo IVA 2%
            </button>
            <button onClick={() => onNavigate('anexos-retention-vat')} type="button">
              <TableProperties size={15} />
              Anexo retencion IVA 1%
            </button>
            <button onClick={() => onNavigate('anexos-perception-vat')} type="button">
              <TableProperties size={15} />
              Anexo percepcion IVA 1%
            </button>
            <button onClick={() => onNavigate('anexos-invalid-documents')} type="button">
              <TableProperties size={15} />
              Anexo documentos invalidados
            </button>
          </div>
        </div>
      </nav>
      <button className="tourStartButton" data-tour="start-guide" onClick={onStartTour} type="button">
        <HelpCircle size={16} />
        GUÍA
      </button>
    </header>
  );
}
