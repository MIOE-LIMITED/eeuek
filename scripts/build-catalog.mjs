// Katalog üretimi: klimasun-2026/data/* kaynaklarından site verisini üretir.
//   public/veri/katalog.json   — ürün listesi için ince indeks (istemci çeker)
//   public/veri/detay/N.json   — ürün detayları, slug hash'ine göre 64 parça
//   lib/catalog-slugs.json     — sitemap için slug listesi (build'de import edilir)
//   public/gorseller/          — klimasun-2026/assets/products kopyası (yoksa)
// `npm run build` ve `npm run deploy` öncesinde otomatik çalışır.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'klimasun-2026');
const SHARDS = 64;

// lib/catalog-server.js içindeki shardOf ile birebir aynı olmalı.
function shardOf(slug) {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) h = ((h * 33) ^ slug.charCodeAt(i)) >>> 0;
  return h % SHARDS;
}

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const products = readJson(path.join(SRC, 'data/products.json'));
const brands = readJson(path.join(SRC, 'data/brands.json'));
const catFlat = readJson(path.join(SRC, 'data/categories.json')).flat;

const catName = new Map(catFlat.map((c) => [c.slug, c.name]));
const gorsel = (p) => (p ? '/gorseller/' + p.replace(/^assets\/products\//, '') : '');
const isSecondHand = (p) =>
  p.dom === '2-el-urunler' || p.pc.startsWith('2-el') || p.cats.some((c) => c.startsWith('2-el'));

// --- 1) Liste indeksi: [slug, kod, ad, marka, 2.el(0/1), stok(0/1), küçük görsel]
const items = products.map((p) => [
  p.s,
  p.c,
  p.n,
  p.bn,
  isSecondHand(p) ? 1 : 0,
  p.st === 'Stokta' ? 1 : 0,
  gorsel(p.th),
]);

const katalog = {
  count: products.length,
  brands: brands.map((b) => [b.name, b.count]),
  items,
};

const veriDir = path.join(ROOT, 'public/veri');
fs.mkdirSync(path.join(veriDir, 'detay'), { recursive: true });
fs.writeFileSync(path.join(veriDir, 'katalog.json'), JSON.stringify(katalog));

// --- 2) Detay parçaları (aynı ana kategorideki komşular "benzer ürünler" olur)
const byPc = new Map();
products.forEach((p, i) => {
  if (!byPc.has(p.pc)) byPc.set(p.pc, []);
  byPc.get(p.pc).push(i);
});

const shards = Array.from({ length: SHARDS }, () => ({}));
for (const p of products) {
  const siblings = byPc.get(p.pc) || [];
  const at = siblings.findIndex((i) => products[i].s === p.s);
  const rel = [];
  for (let step = 1; rel.length < 4 && step <= siblings.length; step++) {
    const pick = siblings[(at + step) % siblings.length];
    const r = products[pick];
    if (r.s === p.s) break;
    rel.push({ s: r.s, c: r.c, n: r.n, th: gorsel(r.th) });
  }
  shards[shardOf(p.s)][p.s] = {
    c: p.c,
    n: p.n,
    b: p.bn,
    img: gorsel(p.img),
    desc: p.ld || p.sd || '',
    f: p.f || {},
    cat: catName.get(p.pc) || catName.get(p.cats[0]) || 'Ürünler',
    cond: isSecondHand(p) ? '2.El' : 'Sıfır',
    stok: p.st === 'Stokta' ? 1 : 0,
    rel,
  };
}
shards.forEach((s, i) => {
  fs.writeFileSync(path.join(veriDir, 'detay', `${i}.json`), JSON.stringify(s));
});

// --- 3) Sitemap slug listesi
fs.writeFileSync(
  path.join(ROOT, 'lib/catalog-slugs.json'),
  JSON.stringify(products.map((p) => p.s)),
);

// --- 4) Görseller (tek seferlik kopya; varsa dokunma)
const imgSrc = path.join(SRC, 'assets/products');
const imgDst = path.join(ROOT, 'public/gorseller');
if (!fs.existsSync(imgDst)) {
  console.log('Görseller kopyalanıyor (public/gorseller) — ilk seferde birkaç dakika sürebilir…');
  fs.cpSync(imgSrc, imgDst, { recursive: true });
}

console.log(
  `Katalog üretildi: ${products.length} ürün, ${brands.length} marka, ${SHARDS} detay parçası.`,
);
