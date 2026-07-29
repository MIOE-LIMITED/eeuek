// Tek seferlik veri düzeltmesi: aynı üreticinin farklı yazımlarını tek marka
// altında toplar (bn birebir eşleşir). Yalnızca bn/b değişir; slug/URL aynı kalır.
//   "Euro Motors Fan Coil Motoru" -> "Euro Motors"
//   "Rittal"                       -> "RITTAL"
//
// Kullanım:
//   node scripts/merge-brands.mjs --dry
//   node scripts/merge-brands.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'klimasun-2026/data/products.json');

// eskiBn -> { bn: hedefAd, b: hedefSlug }
const MAP = {
  'Euro Motors Fan Coil Motoru': { bn: 'Euro Motors', b: 'euro-motors' },
  'Rittal': { bn: 'RITTAL', b: 'rittal' },
};

const dry = process.argv.includes('--dry');
const products = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const moved = new Map();
for (const p of products) {
  const t = MAP[p.bn];
  if (!t) continue;
  moved.set(p.bn, (moved.get(p.bn) || 0) + 1);
  if (!dry) {
    p.bn = t.bn;
    p.b = t.b;
  }
}

for (const [from, n] of moved) console.log(`${String(n).padStart(4)}  ${from}  ->  ${MAP[from].bn}`);
const missing = Object.keys(MAP).filter((k) => !moved.has(k));
if (missing.length) console.log('Veride bulunamayan:', missing);

if (!dry) {
  fs.writeFileSync(FILE, JSON.stringify(products));
  for (const t of new Set(Object.values(MAP).map((v) => v.bn))) {
    console.log(`Yazıldı. "${t}" toplam ürün: ${products.filter((p) => p.bn === t).length}`);
  }
}
