// Tek seferlik veri düzeltmesi: adı "Lamilux" olan ancak marka etiketi (bn)
// yanlışlıkla "FORM" yazılmış ürünleri "Lamilux" markasına taşır.
// Yalnızca bn/b değişir; ürün slug'ları (s) ve URL'ler aynı kalır.
//
// Kullanım:
//   node scripts/fix-lamilux-brand.mjs --dry
//   node scripts/fix-lamilux-brand.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'klimasun-2026/data/products.json');

const dry = process.argv.includes('--dry');
const products = JSON.parse(fs.readFileSync(FILE, 'utf8'));

let changed = 0;
for (const p of products) {
  if (p.n && p.n.toLocaleLowerCase('tr').includes('lamilux') && p.bn !== 'Lamilux') {
    if (!dry) {
      p.bn = 'Lamilux';
      p.b = 'lamilux';
    }
    changed++;
  }
}

console.log(`Lamilux'e taşınan (bn!=Lamilux olan Lamilux ürünleri): ${changed}`);

if (!dry) {
  fs.writeFileSync(FILE, JSON.stringify(products));
  console.log(`Yazıldı. "Lamilux" toplam ürün: ${products.filter((p) => p.bn === 'Lamilux').length}`);
}
