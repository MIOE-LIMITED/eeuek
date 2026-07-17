'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuote } from '@/app/components/site/QuoteContext';

const ALL = [
  ['RITTAL', 3631, 'Pano kliması, soğutma üniteleri, yedek parça ve sistem aksesuarları'],
  ['Danfoss', 1401, 'Vanalar, kompresörler, basınç switch ve kontrol elemanları'],
  ['nVent HOFFMAN', 987, 'Pano iklimlendirme ve muhafaza çözümleri'],
  ['Cosmotec', 386, 'Pano klimaları ve ısı değiştiriciler'],
  ['FORM', 352, 'FES evaporatif soğutma, chiller ve ticari iklimlendirme'],
  ['Sanhua', 248, 'Genleşme valfleri ve soğutma komponentleri'],
  ['Hongsen', 245, 'Soğutma devre elemanları'],
  ['Embraco', 144, 'Hermetik kompresörler'],
  ['Dynaflex', 122, 'Esnek bağlantı ve titreşim elemanları'],
  ['Value', 120, 'Vakum pompaları ve servis ekipmanları'],
  ['GVN', 120, 'Soğutma yedek parçaları'],
  ['P&M', 95, 'Servis vanaları ve bağlantı elemanları'],
  ['YORK', 89, 'Chiller yedek parça, kontrol kartları ve sensörler'],
  ['Carrier', 76, 'Chiller ve ticari iklimlendirme yedek parçaları'],
  ['Alfa Laval', 64, 'Plakalı ısı değiştiriciler'],
  ['Carel', 52, 'Kontrolörler, nemlendirme ve sensörler'],
  ['Alarko Carrier', 48, 'Ticari iklimlendirme ve fan coil'],
  ['Bock', 31, 'Açık ve yarı hermetik kompresörler'],
  ['Stulz', 27, 'Hassas kontrollü klimalar ve pano soğutma'],
  ['Baymak', 22, 'Isıtma ve iklimlendirme ürünleri'],
];

export default function MarkalarPage() {
  const { openQuote } = useQuote();
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return ALL.filter(([n]) => !ql || n.toLowerCase().includes(ql));
  }, [q]);

  return (
    <>
      <div className="ks-pagehero">
        <div className="ks-wrap">
          <div className="ks-crumb">
            <Link href="/">Ana Sayfa</Link> / <span className="ks-crumb-cur">Markalar</span>
          </div>
          <h1>Markalar</h1>
          <p>
            226 üretici markasıyla çalışıyoruz. Kendi stoğumuz ve Avrupa&apos;daki uzman tedarikçi
            ağımızla, tek noktadan orijinal parça tedariği sağlıyoruz.
          </p>
        </div>
      </div>

      <div className="ks-page-body">
        <div className="ks-brands-toolbar">
          <div className="ks-search-box narrow">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Marka ara…" aria-label="Marka ara" />
            <span className="ks-search-ico">⌕</span>
          </div>
          <div className="ks-count"><b>{list.length}</b> / 226 marka</div>
        </div>

        <div className="ks-grid-4">
          {list.map(([name, count, tag]) => (
            <div className="ks-brandcard" key={name}>
              <div className="ks-brandcard-name">{name}</div>
              <div className="ks-brandcard-count">{count.toLocaleString('tr-TR')} ürün</div>
              <div className="ks-brandcard-tag">{tag}</div>
              <Link href="/urunler" className="ks-brandcard-link">
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
