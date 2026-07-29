// Tek seferlik veri düzeltmesi (4. parti): kullanıcı isteğiyle, aşağıdaki marka
// etiketleri "Muhtelif Markalar" altında toplanır. Efect/Elektrik/Bobin/Cartel
// jenerik parça/malzeme adlarıdır; Full Gauge/Rotolok/Syslab gerçek üreticidir
// ancak site sahibi bunların da marka kartı olarak değil Muhtelif altında
// görünmesini tercih etti.
// Yalnızca bn/b değişir; ürün slug'ları (s) ve URL'ler aynı kalır.
//
// Kullanım:
//   node scripts/reassign-junk-brands-4.mjs --dry
//   node scripts/reassign-junk-brands-4.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'klimasun-2026/data/products.json');

const JUNK = new Set([
  'Full Gauge', 'Efect', 'Elektrik', 'Bobin', 'Cartel', 'Rotolok', 'Syslab',
]);

const TARGET_BN = 'Muhtelif Markalar';
const TARGET_B = 'muhtelif-markalar';

const dry = process.argv.includes('--dry');
const products = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const perBrand = new Map();
let changed = 0;
for (const p of products) {
  if (JUNK.has(p.bn)) {
    perBrand.set(p.bn, (perBrand.get(p.bn) || 0) + 1);
    if (!dry) {
      p.bn = TARGET_BN;
      p.b = TARGET_B;
    }
    changed++;
  }
}

for (const [b, n] of [...perBrand.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${String(n).padStart(3)}  ${b}`);
}
const missing = [...JUNK].filter((b) => !perBrand.has(b));
if (missing.length) console.log('Veride bulunamayan:', missing);
console.log(`Eşleşen etiket: ${perBrand.size}/${JUNK.size} | Taşınan ürün: ${changed}`);

if (!dry) {
  fs.writeFileSync(FILE, JSON.stringify(products));
  const after = products.filter((p) => p.bn === TARGET_BN).length;
  console.log(`Yazıldı. "${TARGET_BN}" toplam ürün: ${after}`);
}
