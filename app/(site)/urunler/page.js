'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ProductGrid from '@/app/components/site/ProductGrid';
import { useQuote } from '@/app/components/site/QuoteContext';

const TR = 'tr-TR';

const CATEGORY_LINKS = [
  ['Pano İklimlendirme', 'pano-iklimlendirme'],
  ['Yedek Parça', 'yedek-parca'],
  ['Chiller Soğutma', 'chiller-sogutma'],
  ['Evaporatif Soğutma', 'evaporatif-sogutma'],
  ['2.El Ürünler', '2-el-urunler'],
];

// katalog.json satırı: [slug, kod, ad, marka, 2.el(0/1), stok(0/1), küçük görsel]
function UrunlerContent() {
  const { openQuote } = useQuote();
  const searchParams = useSearchParams();
  const [data, setData] = useState(null);
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [cond, setCond] = useState('Tümü');
  const [brands, setBrands] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/veri/katalog.json')
      .then((r) => r.json())
      .then((d) => alive && setData(d))
      .catch(() => alive && setData({ count: 0, brands: [], items: [] }));
    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => {
    if (!data) return [];
    const anyBrand = Object.values(brands).some(Boolean);
    const ql = q.trim().toLocaleLowerCase(TR);
    return data.items.filter(
      ([, code, name, brand, el2]) =>
        (!ql || (name + ' ' + code + ' ' + brand).toLocaleLowerCase(TR).includes(ql)) &&
        (cond === 'Tümü' || (cond === '2.El') === Boolean(el2)) &&
        (!anyBrand || brands[brand]),
    );
  }, [data, q, cond, brands]);

  const toggleBrand = (label) => setBrands((s) => ({ ...s, [label]: !s[label] }));

  return (
    <>
      <div className="ks-pagehero">
        <div className="ks-wrap">
          <div className="ks-crumb">
            <Link href="/">Ana Sayfa</Link> / <span className="ks-crumb-cur">Ürün Listesi</span>
          </div>
          <h1>Ürün Listesi</h1>
          <p>
            {data ? data.count.toLocaleString(TR) : '9.799'}+ ürünlük envanterimizde arayın. Fiyat
            görmek için ürünleri teklif sepetine ekleyin — satışlarımız kurumsaldır, teklifiniz aynı
            gün hazırlanır.
          </p>
        </div>
      </div>

      <div className="ks-list-layout">
        <button
          type="button"
          className="ks-filter-toggle"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((v) => !v)}
        >
          FİLTRELE {filtersOpen ? '▴' : '▾'}
        </button>
        <aside className={`ks-aside${filtersOpen ? ' is-open' : ''}`}>
          <div>
            <h3 className="ks-filter-h">DURUM</h3>
            <div className="ks-cond-filters">
              {['Tümü', 'Sıfır', '2.El'].map((label) => (
                <button
                  type="button"
                  key={label}
                  className={`ks-cond-filter${label === cond ? ' is-active' : ''}`}
                  onClick={() => setCond(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="ks-filter-h">MARKA</h3>
            <div className="ks-brand-filters ks-brand-scroll">
              {(data ? data.brands : []).map(([label, count]) => (
                <label key={label}>
                  <input type="checkbox" checked={!!brands[label]} onChange={() => toggleBrand(label)} />
                  {label} <span className="cnt">({count.toLocaleString(TR)})</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="ks-filter-h">KATEGORİLER</h3>
            <div className="ks-cat-links">
              {CATEGORY_LINKS.map(([label, slug]) => (
                <Link href={`/kategori/${slug}`} key={slug}>{label}</Link>
              ))}
              <Link href="/kategoriler" className="all">Tüm kategoriler →</Link>
            </div>
          </div>

          <div className="ks-aside-cta">
            <div className="t">ARADIĞINIZI BULAMADINIZ MI?</div>
            <p>Parça kodunu gönderin, Avrupa ağımızdan orijinal tedarik edelim.</p>
            <button type="button" className="ks-btn-amber" onClick={openQuote}>HIZLI TEKLİF →</button>
          </div>
        </aside>

        <main>
          <div className="ks-list-toolbar">
            <div className="ks-search-box">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Bu listede ara: kod, ürün adı, marka…"
                aria-label="Ürün ara"
              />
              <span className="ks-search-ico">⌕</span>
            </div>
            <div className="ks-count">
              {data ? (
                <>
                  <b>{list.length.toLocaleString(TR)}</b> ürün gösteriliyor
                </>
              ) : (
                'Katalog yükleniyor…'
              )}
            </div>
          </div>

          <ProductGrid items={list} />
        </main>
      </div>
    </>
  );
}

export default function UrunlerPage() {
  return (
    <Suspense fallback={null}>
      <UrunlerContent />
    </Suspense>
  );
}
