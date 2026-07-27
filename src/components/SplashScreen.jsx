import logoFevv from '../assets/logo-fevv-technologies.png';

export function SplashScreen() {
  return (
    <div className="splashScreen">
      <div className="splashContent">
        <img alt="FEVV Technologies" className="splashLogo" src={logoFevv} />
        <div className="splashLoader" />
      </div>
    </div>
  );
}
