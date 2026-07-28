import { Building2, ChevronDown, FileText, Users } from 'lucide-react';
import logoFevv from '../assets/logo-fevv-technologies-startup.jpg';

export function AppHeader({ activeView, onNavigate }) {
  return (
    <header className="brandHeader">
      <img alt="FEVV Technologies" className="brandLogo" src={logoFevv} />
      <nav className="mainNav" aria-label="Menu principal">
        <button
          className={`navButton ${activeView === 'dte' ? 'active' : ''}`}
          onClick={() => onNavigate('dte')}
          type="button"
        >
          <FileText size={16} />
          INICIO
        </button>
        <div className="navDropdown">
          <button
            className={`navButton ${activeView.startsWith('registers') ? 'active' : ''}`}
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
      </nav>
    </header>
  );
}
