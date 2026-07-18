import Link from 'next/link';
import SearchBox from '@/app/components/SearchBox';
import { POPULAR } from '@/lib/popular';

export const metadata = {
  title: 'KlimaSun Asistan — HVAC Soru & Cevap',
  description:
    'Endüstriyel soğutma ve HVAC sorularınıza kaynaklı, ücretsiz cevaplar. F-Gaz, evaporatif soğutma, pano kliması, chiller.',
};

export default function AssistantHomePage() {
  return (
    <>
      <div className="ks-pagehero">
        <div className="ks-wrap">
          <div className="ks-crumb">
            <Link href="/">Ana Sayfa</Link> / <span className="ks-crumb-cur">Asistan</span>
          </div>
          <h1>Yapay Zekâ Asistanı</h1>
          <p>
            F-Gaz, evaporatif soğutma, pano kliması, chiller… 65 teknik katalogdan{' '}
            <b style={{ color: '#fff' }}>kaynak göstererek</b>, Türkçe ve üyeliksiz cevaplar.
          </p>
          <div className="ks-ask-hero">
            <SearchBox />
          </div>
        </div>
      </div>

      <section className="ks-section soft">
        <div className="ks-wrap">
          <h2 className="ks-h2">POPÜLER SORULAR</h2>
          <p className="ks-lead">
            En çok merak edilen konular — tıklayın, dokümanlara dayalı hazır cevabı görün.
          </p>
          <div className="ks-ask-grid">
            {POPULAR.map((item) => (
              <Link key={item.slug} href={`/soru/${item.slug}`} className="ks-ask-card" prefetch={false}>
                <span className="ks-ask-card-q">{item.question}</span>
                <span className="ks-ask-card-go">Cevabı gör <span>→</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
