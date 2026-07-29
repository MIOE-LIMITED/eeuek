'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProductGrid from './ProductGrid';
import { useQuote } from './QuoteContext';
import VISIBLE_BRANDS from '@/lib/visible-brands.json';

const TR = 'tr-TR';
// Marka filtresinde yalnızca onaylı markalar gösterilir (markalar sayfasıyla aynı
// beyaz liste). Liste boşsa tüm markalar gösterilir. Ürünler filtrelenmez —
// gizli markaların ürünleri listede ve aramada çıkmaya devam eder.
const VISIBLE_BRAND_SET = new Set(VISIBLE_BRANDS);

// Ortak katalog tarayıcı: durum + marka filtreleri, arama, sayaç, ürün ızgarası.
// Hem /urunler (tüm katalog) hem /kategori/[slug] (kategori ürünleri) kullanır.
// items satırı: [slug, kod, ad, marka, 2.el(0/1), stok(0/1), küçük görsel]
// Marka sayıları bağlamsaldır: aktif arama + durum seçimine göre yeniden hesaplanır.
export default function CatalogBrowser({ items, loading = false, initialQuery = '', initialBrand = '', categoryLinks = null, searchPlaceholder }) {
  const { openQuote } = useQuote();
  const [q, setQ] = useState(initialQuery);
  const [cond, setCond] = useState('Tümü');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [brands, setBrands] = useState(() => (initialBrand ? { [initialBrand]: true } : {}));
  const [filtersOpen, setFiltersOpen] = useState(false);

  const ql = q.trim().toLocaleLowerCase(TR);

  // Arama filtresi (durum ve markadan bağımsız taban küme)
  const searched = useMemo(() => {
    if (!ql) return items;
    return items.filter(([, code, name, brand]) =>
      (name + ' ' + code + ' ' + brand).toLocaleLowerCase(TR).includes(ql),
    );
  }, [items, ql]);

  // Durum sayaçları aramaya göre; marka sayıları arama + duruma göre güncellenir.
  const condCounts = useMemo(() => {
    const c = { 'Tümü': searched.length, 'Sıfır': 0, '2.El': 0 };
    for (const it of searched) c[it[4] ? '2.El' : 'Sıfır']++;
    return c;
  }, [searched]);

  const afterCond = useMemo(
    () => (cond === 'Tümü' ? searched : searched.filter((it) => (cond === '2.El') === Boolean(it[4]))),
    [searched, cond],
  );

  // Stok sayacı bağlamsaldır (arama + durum). it[5] === 1 -> stoktan teslim.
  const stockCount = useMemo(() => afterCond.reduce((n, it) => n + (it[5] ? 1 : 0), 0), [afterCond]);

  // "Sadece stoktakiler" seçiliyse yalnızca stoktan teslim ürünler kalır.
  const afterStock = useMemo(
    () => (inStockOnly ? afterCond.filter((it) => it[5]) : afterCond),
    [afterCond, inStockOnly],
  );

  const brandCounts = useMemo(() => {
    const onlyVisible = VISIBLE_BRAND_SET.size > 0;
    const m = new Map();
    for (const it of afterStock) {
      const b = it[3];
      if (onlyVisible && !VISIBLE_BRAND_SET.has(b)) continue; // onaylı olmayan markalar filtrede gösterilmez
      m.set(b, (m.get(b) || 0) + 1);
    }
    // Seçili ama artık 0 sonuçlu (veya onaylı olmayan) markalar listede kalsın ki seçim kaldırılabilsin.
    for (const [b, sel] of Object.entries(brands)) if (sel && !m.has(b)) m.set(b, 0);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], TR));
  }, [afterStock, brands]);

  const anyBrand = Object.values(brands).some(Boolean);
  const list = useMemo(
    () => (anyBrand ? afterStock.filter((it) => brands[it[3]]) : afterStock),
    [afterStock, anyBrand, brands],
  );

  const toggleBrand = (label) => setBrands((s) => ({ ...s, [label]: !s[label] }));

  return (
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
                {label} ({condCounts[label].toLocaleString(TR)})
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="ks-filter-h">STOK</h3>
          <label className="ks-stock-filter">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={() => setInStockOnly((v) => !v)}
            />
            Sadece stoktakiler <span className="cnt">({stockCount.toLocaleString(TR)})</span>
          </label>
        </div>

        <div>
          <h3 className="ks-filter-h">MARKA</h3>
          <div className="ks-brand-filters ks-brand-scroll">
            {brandCounts.map(([label, count]) => (
              <label key={label}>
                <input type="checkbox" checked={!!brands[label]} onChange={() => toggleBrand(label)} />
                {label} <span className="cnt">({count.toLocaleString(TR)})</span>
              </label>
            ))}
            {loading && <span className="cnt">Markalar yükleniyor…</span>}
          </div>
        </div>

        {categoryLinks && (
          <div>
            <h3 className="ks-filter-h">KATEGORİLER</h3>
            <div className="ks-cat-links">
              {categoryLinks.map(([label, href, all]) => (
                <Link href={href} key={href + label} className={all ? 'all' : undefined}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}

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
              placeholder={searchPlaceholder || 'Bu listede ara: kod, ürün adı, marka…'}
              aria-label="Ürün ara"
            />
            <span className="ks-search-ico">⌕</span>
          </div>
          <div className="ks-count">
            {loading ? (
              'Katalog yükleniyor…'
            ) : (
              <>
                <b>{list.length.toLocaleString(TR)}</b> ürün gösteriliyor
              </>
            )}
          </div>
        </div>

        <ProductGrid items={list} />
      </main>
    </div>
  );
}
