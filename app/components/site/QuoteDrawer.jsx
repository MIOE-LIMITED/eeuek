'use client';

import { CONDITIONS, useQuote } from './QuoteContext';

export default function QuoteDrawer() {
  const {
    open,
    submitted,
    rows,
    name,
    contact,
    errors,
    loading,
    result,
    closeQuote,
    patchRow,
    removeRow,
    addRow,
    updateName,
    updateContact,
    submitQuote,
    resetQuote,
  } = useQuote();

  if (!open) return null;

  return (
    <>
      <div className="ks-drawer-scrim" onClick={closeQuote} />
      <aside className="ks-drawer" role="dialog" aria-label="Hızlı teklif oluştur">
        <div className="ks-drawer-head">
          <div className="t">HIZLI TEKLİF OLUŞTUR</div>
          <div className="ks-spacer" />
          <button type="button" className="ks-drawer-x" onClick={closeQuote} aria-label="Kapat">
            ✕
          </button>
        </div>

        {!submitted ? (
          <>
            <div className="ks-drawer-body">
              <div className="ks-drawer-cols">
                <div>ÜRÜN / PARÇA KODU</div>
                <div>ADET</div>
              </div>

              {rows.map((row) => (
                <div className="ks-qrow" key={row.id}>
                  <div className="ks-qrow-top">
                    <input
                      value={row.code}
                      onChange={(e) => patchRow(row.id, { code: e.target.value })}
                      placeholder="ör. SK 3304500"
                    />
                    <input
                      type="number"
                      min="1"
                      value={row.qty}
                      onChange={(e) => patchRow(row.id, { qty: e.target.value })}
                    />
                    <button
                      type="button"
                      className="ks-qrow-del"
                      title="Satırı sil"
                      onClick={() => removeRow(row.id)}
                    >
                      🗑
                    </button>
                  </div>
                  <div className="ks-qrow-cond">
                    <span className="ks-cond-lbl">DURUM:</span>
                    {CONDITIONS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        className={`ks-cond-btn${c === row.cond ? ' is-active' : ''}`}
                        onClick={() => patchRow(row.id, { cond: c })}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button type="button" className="ks-addrow" onClick={addRow}>
                + Satır ekle
              </button>
              {errors.rows ? <div className="ks-field-err">{errors.rows}</div> : null}

              <div className="ks-drop">
                Ürün listenizi veya ekleri buraya sürükleyin (.pdf, .xls, .jpg — maks. 20MB)
              </div>

              <div className="ks-drawer-fields">
                <input
                  className={errors.name ? 'is-error' : ''}
                  placeholder="Ad Soyad / Firma"
                  value={name}
                  onChange={(e) => updateName(e.target.value)}
                  aria-invalid={errors.name ? 'true' : 'false'}
                />
                {errors.name ? <div className="ks-field-err">{errors.name}</div> : null}
                <input
                  className={errors.contact ? 'is-error' : ''}
                  placeholder="E-posta veya telefon"
                  value={contact}
                  onChange={(e) => updateContact(e.target.value)}
                  aria-invalid={errors.contact ? 'true' : 'false'}
                />
                {errors.contact ? <div className="ks-field-err">{errors.contact}</div> : null}
              </div>

              {errors.form ? <div className="ks-form-err">{errors.form}</div> : null}

              <div className="ks-drawer-steps">
                <div><b>1.</b> Hızlı talep için bilgilerinizi girin</div>
                <div><b>2.</b> Müşteri temsilciniz aynı gün dönüş yapar</div>
                <div><b>3.</b> Siparişinizi kapınıza kadar biz takip ederiz</div>
              </div>
            </div>
            <div className="ks-drawer-foot">
              <button
                type="button"
                className="ks-drawer-submit"
                onClick={submitQuote}
                disabled={loading}
              >
                {loading ? 'GÖNDERİLİYOR…' : 'TEKLİF TALEBİ GÖNDER'}
              </button>
            </div>
          </>
        ) : (
          <div className="ks-drawer-done">
            <div className="ks-done-check">✓</div>
            <div className="ks-done-title">TALEBİNİZ ALINDI</div>
            {result ? (
              <div className="ks-done-ref">
                <div className="ks-done-ref-row">
                  <span>Talep No</span>
                  <b>{result.ref}</b>
                </div>
                <div className="ks-done-ref-row">
                  <span>Tarih / Saat</span>
                  <b>{result.tsLocal}</b>
                </div>
              </div>
            ) : null}
            <div className="ks-done-text">
              Temsilciniz en kısa sürede teklifinizle dönüş yapacak. Takip için bu talep numarasını
              saklayın.
            </div>
            <button type="button" className="ks-done-btn" onClick={resetQuote}>
              YENİ TALEP / ALIŞVERİŞE DEVAM
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
