import fs from 'node:fs';
const SCRATCH = '/tmp/claude-0/-home-user-eeuek/87bb8fe6-1e37-5279-a5de-449f355847c0/scratchpad';
const items = JSON.parse(fs.readFileSync(SCRATCH + '/enriched19.json', 'utf8'));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const cards = items.map((p, i) => {
  const specs = Object.entries(p.f || {}).filter(([k]) => k !== 'Alt Kategori');
  const specHtml = specs.length
    ? `<dl class="specs">${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`
    : '';
  const faq = (p.faq || []).map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('');
  const url = `/urun/pano-iklimlendirme/pano-klimasi/${p.slug}`;
  return `<article class="card" id="${esc(p.slug)}">
  <div class="card__head">
    <span class="num">${String(i + 1).padStart(2, '0')}</span>
    <div>
      <h2>${esc(p.n)}</h2>
      <div class="meta"><span class="chip">${esc(p.bn || '—')}</span><code>${esc(url)}</code></div>
    </div>
  </div>
  <div class="before"><span class="tag tag--old">ÖNCE</span> Uzun açıklama boştu — sayfada yalnızca ürün adı vardı.</div>
  <div class="after">
    <span class="tag tag--new">SONRA · özgün açıklama</span>
    <p class="ld">${esc(p.ld)}</p>
    ${specHtml}
    <div class="faqwrap"><span class="tag tag--faq">FAQ · yapay-zeka aramaları için (FAQPage JSON-LD)</span>${faq}</div>
  </div>
</article>`;
}).join('\n');

const html = `<title>KlimaSun — Zenginleştirme Önizlemesi (Pano Kliması)</title>
<style>
  :root{
    --bg:#f4f7fa; --panel:#ffffff; --panel-2:#eef3f8; --ink:#0e1a26; --ink-soft:#40566a;
    --line:#d6e1ec; --accent:#0891b2; --accent-ink:#06617a; --old:#9aa7b4; --new:#0891b2;
    --shadow:0 1px 2px rgba(13,42,64,.06),0 8px 24px rgba(13,42,64,.06);
  }
  @media (prefers-color-scheme:dark){:root{
    --bg:#080e15; --panel:#0f1a24; --panel-2:#0b141c; --ink:#e7f0f6; --ink-soft:#8fa6b8;
    --line:#1d2c39; --accent:#22d3ee; --accent-ink:#7fe6f5; --old:#5a6a78; --new:#22d3ee;
    --shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px rgba(0,0,0,.35);
  }}
  :root[data-theme="light"]{
    --bg:#f4f7fa; --panel:#ffffff; --panel-2:#eef3f8; --ink:#0e1a26; --ink-soft:#40566a;
    --line:#d6e1ec; --accent:#0891b2; --accent-ink:#06617a; --old:#9aa7b4; --new:#0891b2;
    --shadow:0 1px 2px rgba(13,42,64,.06),0 8px 24px rgba(13,42,64,.06);
  }
  :root[data-theme="dark"]{
    --bg:#080e15; --panel:#0f1a24; --panel-2:#0b141c; --ink:#e7f0f6; --ink-soft:#8fa6b8;
    --line:#1d2c39; --accent:#22d3ee; --accent-ink:#7fe6f5; --old:#5a6a78; --new:#22d3ee;
    --shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px rgba(0,0,0,.35);
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);
    font-family:"Segoe UI",system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif;
    line-height:1.65;-webkit-font-smoothing:antialiased}
  .wrap{max-width:820px;margin:0 auto;padding:32px 20px 80px}
  header.top{display:flex;flex-direction:column;gap:14px;margin-bottom:28px}
  .brand{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:.02em;font-size:1.05rem}
  .brand .dot{width:11px;height:11px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 22%,transparent)}
  h1{font-size:clamp(1.5rem,4vw,2.1rem);line-height:1.15;margin:.2em 0 0;text-wrap:balance;letter-spacing:-.01em}
  .lede{color:var(--ink-soft);margin:0;max-width:62ch}
  .banner{display:flex;gap:12px;align-items:flex-start;background:var(--panel);border:1px solid var(--line);
    border-left:3px solid var(--accent);border-radius:12px;padding:14px 16px;box-shadow:var(--shadow)}
  .banner b{color:var(--accent-ink)}
  .banner p{margin:0;font-size:.92rem;color:var(--ink-soft)}
  .banner .ic{font-size:1.1rem;line-height:1.4}
  .count{display:inline-flex;gap:6px;align-items:baseline;font-variant-numeric:tabular-nums}
  .count b{font-size:1.05rem;color:var(--ink)}
  .cards{display:flex;flex-direction:column;gap:18px;margin-top:26px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px 20px 18px;box-shadow:var(--shadow)}
  .card__head{display:flex;gap:14px;align-items:flex-start}
  .num{font-variant-numeric:tabular-nums;font-weight:700;color:var(--accent);font-size:.85rem;
    border:1px solid var(--line);border-radius:8px;padding:4px 8px;min-width:34px;text-align:center}
  h2{font-size:1.12rem;margin:0 0 6px;line-height:1.25;letter-spacing:-.01em}
  .meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .chip{font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
    background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent-ink);
    border-radius:999px;padding:3px 10px}
  code{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:.76rem;color:var(--ink-soft);
    background:var(--panel-2);border:1px solid var(--line);border-radius:6px;padding:2px 7px;overflow-wrap:anywhere}
  .before{margin:14px 0 0;font-size:.86rem;color:var(--old)}
  .after{margin-top:12px;border-top:1px dashed var(--line);padding-top:14px}
  .tag{display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
    border-radius:6px;padding:2px 8px;margin-bottom:8px}
  .tag--old{color:var(--old);border:1px solid var(--line)}
  .tag--new{color:var(--new);border:1px solid color-mix(in srgb,var(--accent) 40%,var(--line))}
  .tag--faq{color:var(--ink-soft);border:1px solid var(--line);margin-top:14px}
  .ld{margin:.2em 0 0}
  .specs{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0;padding:0}
  .specs div{display:flex;gap:6px;background:var(--panel-2);border:1px solid var(--line);border-radius:8px;padding:4px 10px}
  .specs dt{margin:0;font-size:.78rem;color:var(--ink-soft)}
  .specs dd{margin:0;font-size:.78rem;font-weight:600}
  .faqwrap{display:flex;flex-direction:column;gap:8px;margin-top:4px}
  details{background:var(--panel-2);border:1px solid var(--line);border-radius:10px;padding:2px 14px}
  summary{cursor:pointer;padding:10px 0;font-weight:600;font-size:.92rem;list-style:none;position:relative;padding-right:24px}
  summary::-webkit-details-marker{display:none}
  summary::after{content:"+";position:absolute;right:2px;top:9px;color:var(--accent);font-weight:700;font-size:1.1rem;transition:transform .2s}
  details[open] summary::after{content:"−"}
  details p{margin:0 0 12px;color:var(--ink-soft);font-size:.9rem}
  footer{margin-top:40px;color:var(--ink-soft);font-size:.82rem;text-align:center;border-top:1px solid var(--line);padding-top:20px}
  a{color:var(--accent-ink)}
  @media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
<div class="wrap">
  <header class="top">
    <div class="brand"><span class="dot"></span> KlimaSun · içerik önizlemesi</div>
    <h1>Pano Kliması — 19 ince sayfanın zenginleştirilmiş hâli</h1>
    <p class="lede">Boş uzun açıklamalar, ürünün tipine ve modeline göre özgün metinle ve
      yapay-zeka aramalarına yönelik SSS (FAQPage) ile dolduruldu. Uydurma sayısal değer yok;
      fiyat ve stok iddiası yok.</p>
    <div class="banner">
      <span class="ic">⚠️</span>
      <p><b>Bu bir önizlemedir — henüz canlı değil.</b> Değişiklikler
      <code>claude/dihateknik-product-rules</code> dalında. Canlı site
      <b>klimasun.com</b> yalnızca <code>main</code> dalından yayınlanır; bu yüzden gerçek ürün
      adresi (ör. <code>/urun/pano-iklimlendirme/pano-klimasi/bkw-sk05e2v-pano-klimasi</code>) şu an
      hâlâ eski boş hâli gösterir. Onaylayıp <code>main</code>'e alınca bu içerik o adreslerde canlı olur.</p>
    </div>
    <div class="count"><b>${items.length}</b> ürün · <b>${items.reduce((a, p) => a + (p.faq?.length || 0), 0)}</b> yeni SSS · Pano Kliması kategorisi</div>
  </header>
  <div class="cards">
${cards}
  </div>
  <footer>KlimaSun içerik zenginleştirme örnek partisi · Bu sayfa yalnızca içeriği gösterir; canlı sitenin birebir görünümü değildir.</footer>
</div>`;

fs.writeFileSync(process.argv[2] || SCRATCH + '/preview.html', html);
console.log('yazıldı:', process.argv[2] || SCRATCH + '/preview.html', '·', items.length, 'ürün');
