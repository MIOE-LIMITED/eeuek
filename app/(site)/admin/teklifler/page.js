import { recentQuotes } from '@/lib/quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Teklif Talepleri',
  robots: { index: false, follow: false },
};

function TokenForm({ msg }) {
  return (
    <div className="ks-page-body">
      <div className="ks-admin-gate">
        <h1>Teklif Talepleri</h1>
        {msg ? <p className="ks-form-err">{msg}</p> : <p>Görüntülemek için erişim anahtarını girin.</p>}
        <form method="get" className="ks-admin-form">
          <input type="password" name="token" placeholder="Erişim anahtarı" autoComplete="off" />
          <button type="submit" className="ks-drawer-submit">GİRİŞ</button>
        </form>
      </div>
    </div>
  );
}

export default async function AdminTekliflerPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const token = (sp.token || '').toString();
  const admin = process.env.QUOTE_ADMIN_TOKEN;

  if (!admin) {
    return (
      <TokenForm msg="Bu özellik henüz etkin değil: sunucuda QUOTE_ADMIN_TOKEN tanımlanmalı (wrangler secret put QUOTE_ADMIN_TOKEN)." />
    );
  }
  if (token !== admin) {
    return <TokenForm msg={token ? 'Anahtar hatalı.' : null} />;
  }

  const quotes = await recentQuotes(300);

  return (
    <div className="ks-page-body">
      <div className="ks-admin-head">
        <h1>Teklif Talepleri</h1>
        <div className="ks-admin-meta">
          <span>{quotes.length} kayıt</span>
          <a className="ks-admin-json" href={`/api/quote?token=${encodeURIComponent(token)}&limit=500`}>
            JSON indir
          </a>
        </div>
      </div>

      {quotes.length === 0 ? (
        <p>Henüz talep yok. (Kalıcı depo yalnızca Cloudflare KV / Upstash tanımlıysa geçmişi tutar.)</p>
      ) : (
        <div className="ks-admin-tablewrap">
          <table className="ks-admin-table">
            <thead>
              <tr>
                <th>Tarih / Saat</th>
                <th>Talep No</th>
                <th>Ad / Firma</th>
                <th>İletişim</th>
                <th>Ürünler</th>
                <th>Not</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.ref}>
                  <td className="nowrap">{q.tsLocal || q.ts}</td>
                  <td className="mono">{q.ref}</td>
                  <td>{q.name}</td>
                  <td className="mono">{q.contact}</td>
                  <td>
                    {(q.rows || []).map((r, i) => (
                      <div key={i}>
                        {r.code} × {r.qty}
                        {r.cond && r.cond !== 'Sıfır' ? ` (${r.cond})` : ''}
                      </div>
                    ))}
                  </td>
                  <td>{q.note || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
