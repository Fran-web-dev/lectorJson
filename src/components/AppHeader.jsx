import logoFevv from '../assets/logo-fevv-technologies.png';

export function AppHeader() {
  return (
    <header className="brandHeader">
      <img alt="FEVV Technologies" className="brandLogo" src={logoFevv} />
    </header>
  );
}
