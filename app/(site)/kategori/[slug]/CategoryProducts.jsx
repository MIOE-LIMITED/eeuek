'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductGrid from '@/app/components/site/ProductGrid';

const TR = 'tr-TR';

export default function CategoryProducts({ slug }) {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    let alive = true;
    setData(null);
    fetch(`/veri/kategori/${slug}.json`)
      .then((r) => r.json())
      .then((d) => alive && setData(d))
      .catch(() => alive && setData({ items: [] }));
    return () => {
      alive = false;
    };
  }, [slug]);

  const list = useMemo(() => {
    if (!data) return [];
    const ql = q.trim().toLocaleLowerCase(TR);
    if (!ql) return data.items;
    return data.items.filter(([, code, name, brand]) =>
      (name + ' ' + code + ' ' + brand).toLocaleLowerCase(TR).includes(ql),
    );
  }, [data, q]);

  return (
    <div className="ks-page-body">
      <div className="ks-list-toolbar">
        <div className="ks-search-box narrow">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Bu kategoride ara: kod, ürün adı, marka…"
            aria-label="Kategoride ürün ara"
          />
          <span className="ks-search-ico">⌕</span>
        </div>
        <div className="ks-count">
          {data ? (
            <>
              <b>{list.length.toLocaleString(TR)}</b> ürün gösteriliyor
            </>
          ) : (
            'Ürünler yükleniyor…'
          )}
        </div>
      </div>
      <ProductGrid items={list} />
    </div>
  );
}
