'use client';

import { useState } from 'react';
import Link from 'next/link';
import Placeholder from '@/app/components/site/Placeholder';
import { CONDITIONS, useQuote } from '@/app/components/site/QuoteContext';
import { SAMPLE_DETAIL } from '@/lib/catalog';

const THUMBS = ['önden', 'yandan', 'montaj', 'etiket'];

export default function ProductDetail({ product }) {
  const p = product;
  const { addItem } = useQuote();
  const [qty, setQty] = useState(1);
  const [cond, setCond] = useState('Sıfır');
  const [activeThumb, setActiveThumb] = useState(0);

  function addToQuote() {
    for (let i = 0; i < qty; i++) addItem(p.code, cond);
  }

  return (
    <>
      <div className="ks-crumb-bar">
        <div className="ks-wrap">
          <Link href="/">Ana Sayfa</Link> / <Link href="/urunler">Ürün Listesi</Link> /{' '}
          <Link href="/kategoriler">{p.category}</Link> /{' '}
          <span className="ks-crumb-cur">{p.code}</span>
        </div>
      </div>

      <div className="ks-detail-top">
        <div className="ks-gallery">
          <Placeholder w={600} h={460} label={`${p.code} — ana ürün görseli`} className="ks-gallery-main" />
          <div className="ks-thumbs">
            {THUMBS.map((label, i) => (
              <Placeholder
                key={label}
                w={140}
                h={100}
                label={label}
                className={`ks-thumb${i === activeThumb ? ' is-active' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setActiveThumb(i)}
              />
            ))}
          </div>
        </div>

        <div className="ks-buy">
          <div className="ks-buy-tags">
            <span className="ks-buy-code">{p.code}</span>
            <span className="ks-badge stok">{p.badge}</span>
          </div>
          <h1>{p.name}</h1>
          <div className="ks-buy-facts">
            <div>Marka: <b>{p.brand}</b></div>
            <div>Kategori: <Link href="/kategoriler" style={{ fontWeight: 600 }}>{p.category}</Link></div>
            <div>Garanti: <b>{p.warranty}</b></div>
          </div>
          <p className="ks-buy-desc">{p.description}</p>

          <div className="ks-buy-box">
            <div className="ks-buy-condrow">
              <span className="ks-cond-lbl">TERCİH EDİLEN DURUM:</span>
              {CONDITIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`ks-cond-btn${c === cond ? ' is-active' : ''}`}
                  onClick={() => setCond(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="ks-qty">
              <div className="ks-qty-stepper">
                <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))} aria-label="Azalt">
                  −
                </button>
                <div className="ks-qty-val">{qty}</div>
                <button type="button" onClick={() => setQty((n) => n + 1)} aria-label="Artır">
                  +
                </button>
              </div>
              <button type="button" className="ks-buy-add" onClick={addToQuote}>
                TEKLİF AL
              </button>
            </div>
            <a
              href="https://wa.me/905324246219"
              className="ks-buy-wa"
              target="_blank"
              rel="noreferrer"
            >
              ✆ WhatsApp&apos;tan Sor — 0532 424 6219
            </a>
            <div className="ks-buy-note">
              Satışlarımız kurumsaldır; fiyat teklifle iletilir. Stoktan teslim — aynı iş günü kargoya
              hazır (kargo hariç). F-Gaz sertifikalı servis.
            </div>
          </div>
        </div>
      </div>

      <div className="ks-specs-wrap">
        <h2 className="ks-specs-h">TEKNİK ÖZELLİKLER</h2>
        <div className="ks-specs">
          {SAMPLE_DETAIL.specs.map(([k, v]) => (
            <div className="ks-spec" key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="ks-related-wrap">
        <div className="ks-related-head">
          <h2>BENZER ÜRÜNLER</h2>
          <Link href="/urunler">TÜMÜNÜ GÖR →</Link>
        </div>
        <div className="ks-grid-4">
          {SAMPLE_DETAIL.related.map((r) => (
            <div className="ks-prod-card" key={r.code}>
              <Placeholder w={300} h={170} label={r.code} />
              <div className="ks-related-body">
                <div className="ks-prod-code">{r.code}</div>
                <div className="ks-related-name">{r.name}</div>
                <button type="button" className="ks-related-add" onClick={() => addItem(r.code, 'Sıfır')}>
                  + TEKLİFE EKLE
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
