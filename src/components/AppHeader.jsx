const NAV_ITEMS = ['Estructura JSON', 'Detalles', 'Estructura CSV', 'Generar CSV', 'Contacto', 'Donacion'];

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="flex h-10 items-center gap-6 px-4 text-sm font-medium">
        {NAV_ITEMS.map((item) => <span key={item}>{item}</span>)}
      </nav>
    </header>
  );
}
