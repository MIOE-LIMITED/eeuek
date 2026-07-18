import '../globals.css';
import 'katex/dist/katex.min.css';
import Link from 'next/link';

// Klimasun yapay zekâ asistanı, koyu camgöbeği temayı korur.
export default function AssistantLayout({ children }) {
  return (
    <div className="assistant-root">
      <header className="site-header">
        <div className="container">
          <Link href="/asistan" className="brand">
            <span className="logo">❄️</span>
            <span>
              Klima<span className="accent">Sun</span> Asistan
            </span>
          </Link>
          <span className="tagline">Erdinç Klima · Endüstriyel Soğutma & HVAC</span>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="container">
          <Link href="/">← Klimasun ana siteye dön</Link> · Erdinç Klima endüstriyel soğutma & HVAC
          asistanı · Ücretsiz ve herkese açık
        </div>
      </footer>
    </div>
  );
}
