'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Placeholder from '@/app/components/site/Placeholder';
import { useQuote } from '@/app/components/site/QuoteContext';

const PAGE_SIZE = 24;
const TR = 'tr-TR';

const CATEGORY_LINKS = [
  'Pano Kliması',
  'Chiller Soğutma',
  'Yedek Parça',
  'Evaporatif Soğutma',
  '2.El Ürünler',
];

// katalog.json satırı: [slug, kod, ad, marka, 2.el(0/1), stok(0/1), küçük görsel]
function UrunlerContent() {
  const { addItem, openQuote } = useQuote();
  const searchParams = useSearchParams();
  const [data, setData] = useState(null);
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [cond, setCond] = useState('Tümü');
  const [brands, setBrands] = useState({});
  const [page, setPage] = useState(1);
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

  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleBrand = (label) => {
    setBrands((s) => ({ ...s, [label]: !s[label] }));
    setPage(1);
  };
  const goPage = (n) => {
    setPage(n);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };

  const pageNums = useMemo(() => {
    const nums = new Set([1, pageCount, safePage - 1, safePage, safePage + 1]);
    return [...nums].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  }, [safePage, pageCount]);

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
                  onClick={() => {
                    setCond(label);
                    setPage(1);
                  }}
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
              {CATEGORY_LINKS.map((label) => (
                <Link href="/kategoriler" key={label}>{label}</Link>
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
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
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

          <div className="ks-prod-grid">
            {visible.map(([slug, code, name, brand, , stok, th]) => (
              <div className="ks-prod-card" key={slug}>
                <Link href={`/urun/${slug}`} style={{ display: 'block' }}>
                  {th ? (
                    <img src={th} alt={name} className="ks-prod-img" loading="lazy" />
                  ) : (
                    <Placeholder w={300} h={190} label={`${code} — görsel hazırlanıyor`} />
                  )}
                </Link>
                <div className="ks-prod-body">
                  <div className="ks-prod-code">{code}</div>
                  <Link href={`/urun/${slug}`} className="ks-prod-name">
                    {name}
                  </Link>
                  <div className="ks-prod-meta">
                    <span className="ks-prod-brand">{brand}</span>
                    <span className={`ks-badge ${stok ? 'stok' : 'temin'}`}>
                      {stok ? 'Stoktan Teslim' : 'Temin Edilebilir'}
                    </span>
                  </div>
                  <div className="ks-prod-actions">
                    <button type="button" className="ks-prod-add" onClick={() => addItem(code, 'Sıfır')}>
                      + TEKLİFE EKLE
                    </button>
                    <Link href={`/urun/${slug}`} className="ks-prod-view">
                      İNCELE
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data && list.length === 0 && (
            <div className="ks-empty">
              <div className="t">SONUÇ BULUNAMADI</div>
              Aramanızı değiştirin veya parça kodunu hızlı teklif formuyla gönderin — tedariği biz
              üstlenelim.
            </div>
          )}

          {pageCount > 1 && (
            <div className="ks-pager">
              {safePage > 1 && (
                <button type="button" className="next" onClick={() => goPage(safePage - 1)}>
                  ← Önceki
                </button>
              )}
              {pageNums.map((n, i) => (
                <span key={n} style={{ display: 'contents' }}>
                  {i > 0 && pageNums[i - 1] !== n - 1 && <span className="dots">…</span>}
                  {n === safePage ? (
                    <span className="cur">{n.toLocaleString(TR)}</span>
                  ) : (
                    <button type="button" onClick={() => goPage(n)}>
                      {n.toLocaleString(TR)}
                    </button>
                  )}
                </span>
              ))}
              {safePage < pageCount && (
                <button type="button" className="next" onClick={() => goPage(safePage + 1)}>
                  Sonraki →
                </button>
              )}
            </div>
          )}
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
