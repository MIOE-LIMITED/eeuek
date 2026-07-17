'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Placeholder from '@/app/components/site/Placeholder';
import { useQuote } from '@/app/components/site/QuoteContext';
import { PRODUCTS as ALL, BRAND_COUNTS as BRANDS } from '@/lib/catalog';

const CATEGORY_LINKS = [
  ['Pano Kliması', false],
  ['Chiller Soğutma', false],
  ['Yedek Parça', false],
  ['Evaporatif Soğutma', false],
  ['2.El Ürünler', false],
];

export default function UrunlerPage() {
  const { addItem, openQuote } = useQuote();
  const [q, setQ] = useState('');
  const [cond, setCond] = useState('Tümü');
  const [brands, setBrands] = useState({});

  const list = useMemo(() => {
    const anyBrand = Object.values(brands).some(Boolean);
    const ql = q.trim().toLowerCase();
    return ALL.filter(
      (p) =>
        (!ql || (p.name + p.code + p.brand).toLowerCase().includes(ql)) &&
        (cond === 'Tümü' || p.cond === cond) &&
        (!anyBrand || brands[p.brand]),
    );
  }, [q, cond, brands]);

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
            9.799+ ürünlük envanterimizde arayın. Fiyat görmek için ürünleri teklif sepetine ekleyin —
            satışlarımız kurumsaldır, teklifiniz aynı gün hazırlanır.
          </p>
        </div>
      </div>

      <div className="ks-list-layout">
        <aside className="ks-aside">
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
            <div className="ks-brand-filters">
              {BRANDS.map(([label, count]) => (
                <label key={label}>
                  <input type="checkbox" checked={!!brands[label]} onChange={() => toggleBrand(label)} />
                  {label} <span className="cnt">({count.toLocaleString('tr-TR')})</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="ks-filter-h">KATEGORİLER</h3>
            <div className="ks-cat-links">
              {CATEGORY_LINKS.map(([label]) => (
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
                onChange={(e) => setQ(e.target.value)}
                placeholder="Bu listede ara: kod, ürün adı, marka…"
                aria-label="Ürün ara"
              />
              <span className="ks-search-ico">⌕</span>
            </div>
            <div className="ks-count"><b>{list.length}</b> ürün gösteriliyor</div>
          </div>

          <div className="ks-prod-grid">
            {list.map((p) => (
              <div className="ks-prod-card" key={p.code}>
                <Link href={`/urun/${encodeURIComponent(p.code)}`} style={{ display: 'block' }}>
                  <Placeholder w={300} h={190} label={`${p.code} — ürün görseli`} />
                </Link>
                <div className="ks-prod-body">
                  <div className="ks-prod-code">{p.code}</div>
                  <Link href={`/urun/${encodeURIComponent(p.code)}`} className="ks-prod-name">
                    {p.name}
                  </Link>
                  <div className="ks-prod-meta">
                    <span className="ks-prod-brand">{p.brand}</span>
                    <span className={`ks-badge ${p.badge === 'Stoktan Teslim' ? 'stok' : 'temin'}`}>
                      {p.badge}
                    </span>
                  </div>
                  <div className="ks-prod-actions">
                    <button type="button" className="ks-prod-add" onClick={() => addItem(p.code, p.cond)}>
                      + TEKLİFE EKLE
                    </button>
                    <Link href={`/urun/${encodeURIComponent(p.code)}`} className="ks-prod-view">
                      İNCELE
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {list.length === 0 && (
            <div className="ks-empty">
              <div className="t">SONUÇ BULUNAMADI</div>
              Aramanızı değiştirin veya parça kodunu hızlı teklif formuyla gönderin — tedariği biz
              üstlenelim.
            </div>
          )}

          <div className="ks-pager">
            <span className="cur">1</span>
            <a href="#">2</a>
            <a href="#">3</a>
            <span className="dots">…</span>
            <a href="#">817</a>
            <a href="#" className="next">Sonraki →</a>
          </div>
        </main>
      </div>
    </>
  );
}
