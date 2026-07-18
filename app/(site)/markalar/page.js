'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuote } from '@/app/components/site/QuoteContext';

const TR = 'tr-TR';

// Bilinen markalar için kısa açıklama; listedeki adlar gerçek katalog
// verisinden (katalog.json) gelir, açıklama varsa gösterilir.
const TAGS = {
  RITTAL: 'Pano kliması, soğutma üniteleri, yedek parça ve sistem aksesuarları',
  Danfoss: 'Vanalar, kompresörler, basınç switch ve kontrol elemanları',
  'nVent HOFFMAN': 'Pano iklimlendirme ve muhafaza çözümleri',
  Cosmotec: 'Pano klimaları ve ısı değiştiriciler',
  'Stulz Cosmotec': 'Hassas kontrollü klimalar ve pano soğutma',
  FORM: 'FES evaporatif soğutma, chiller ve ticari iklimlendirme',
  Sanhua: 'Genleşme valfleri ve soğutma komponentleri',
  Hongsen: 'Soğutma devre elemanları',
  Embraco: 'Hermetik kompresörler',
  Dynaflex: 'Esnek bağlantı ve titreşim elemanları',
  Value: 'Vakum pompaları ve servis ekipmanları',
  GVN: 'Soğutma yedek parçaları',
  'P&M': 'Servis vanaları ve bağlantı elemanları',
  YORK: 'Chiller yedek parça, kontrol kartları ve sensörler',
  Carrier: 'Chiller ve ticari iklimlendirme yedek parçaları',
  'Alfa Laval': 'Plakalı ısı değiştiriciler',
  Carel: 'Kontrolörler, nemlendirme ve sensörler',
  Mitsubishi: 'Split, multi ve VRF klima sistemleri',
  GES: 'Fan coil vana, motor ve termostatları',
  pfannenberg: 'Pano soğutma ve sinyalizasyon',
  Resideo: 'Kontrol ve otomasyon elemanları',
};

export default function MarkalarPage() {
  const { openQuote } = useQuote();
  const [q, setQ] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch('/veri/katalog.json')
      .then((r) => r.json())
      .then((d) => alive && setData(d))
      .catch(() => alive && setData({ brands: [] }));
    return () => {
      alive = false;
    };
  }, []);

  const brands = data?.brands || [];
  const list = useMemo(() => {
    const ql = q.trim().toLocaleLowerCase(TR);
    return brands.filter(([n]) => !ql || n.toLocaleLowerCase(TR).includes(ql));
  }, [brands, q]);

  return (
    <>
      <div className="ks-pagehero">
        <div className="ks-wrap">
          <div className="ks-crumb">
            <Link href="/">Ana Sayfa</Link> / <span className="ks-crumb-cur">Markalar</span>
          </div>
          <h1>Markalar</h1>
          <p>
            {brands.length ? brands.length.toLocaleString(TR) : '226'} üretici markasıyla
            çalışıyoruz. Kendi stoğumuz ve Avrupa&apos;daki uzman tedarikçi ağımızla, tek noktadan
            orijinal parça tedariği sağlıyoruz.
          </p>
        </div>
      </div>

      <div className="ks-page-body">
        <div className="ks-brands-toolbar">
          <div className="ks-search-box narrow">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Marka ara…" aria-label="Marka ara" />
            <span className="ks-search-ico">⌕</span>
          </div>
          <div className="ks-count">
            {data ? (
              <>
                <b>{list.length.toLocaleString(TR)}</b> / {brands.length.toLocaleString(TR)} marka
              </>
            ) : (
              'Markalar yükleniyor…'
            )}
          </div>
        </div>

        <div className="ks-grid-4">
          {list.map(([name, count]) => (
            <div className="ks-brandcard" key={name}>
              <div className="ks-brandcard-name">{name}</div>
              <div className="ks-brandcard-count">{count.toLocaleString(TR)} ürün</div>
              {TAGS[name] && <div className="ks-brandcard-tag">{TAGS[name]}</div>}
              <Link href={`/urunler?marka=${encodeURIComponent(name)}`} className="ks-brandcard-link">
                TÜM ÜRÜNLERİ GÖR <span>→</span>
              </Link>
            </div>
          ))}
        </div>

        <div className="ks-cta-strip">
          <div style={{ flex: 1 }}>
            <div className="t">MARKANIZI GÖREMİYOR MUSUNUZ?</div>
            <p>
              Listede olmayan markaların parçalarını da Almanya ve İtalya başta olmak üzere
              Avrupa&apos;dan sipariş üzerine orijinal tedarik ediyoruz.
            </p>
          </div>
          <button type="button" onClick={openQuote}>HIZLI TEKLİF →</button>
        </div>
      </div>
    </>
  );
}
