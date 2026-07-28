// Tek seferlik veri düzeltmesi: gerçek üretici olmayan "marka" etiketlerini
// (ölçü, soğutucu akışkan kodu, model kodu, malzeme/parça adı vb.) tek bir
// "Muhtelif Markalar" markası altında topla. Yalnızca bn/b alanlarını değiştirir;
// ürün slug'ları (s) ve URL'ler değişmez.
//
// Kullanım:
//   node scripts/reassign-junk-brands.mjs --dry   (sadece rapor)
//   node scripts/reassign-junk-brands.mjs         (uygula)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'klimasun-2026/data/products.json');

// Kaldırılacak marka etiketleri (bn ile birebir eşleşir). Kullanıcı listesi.
const JUNK = new Set([
  'Bakır', 'Fan Kanadı', 'Kılcal',
  '1/2', '10k', '3/8', '5/8', '5k', 'Krank',
  '1/4', '3/4', '50', 'R-134A', 'R-404A', 'R-407C', 'R-410A',
  "1/2''", "1/4''", '27', "3/4''", "3/8''", '40', "5/8''", '60', '61', "7/8''", '70', 'Aksa',
  'DSF-11B', 'DSF-20', 'DSF-34D', 'DSF-4', 'DSF-50', 'DSF-9', 'DSF-9B', 'DX5079',
  'K-1769E+L', 'Kombi', 'KT-1000', 'KT-4000', 'KT-518', 'KT-9018E', 'KT-B02', 'KT-e03', 'KT-e05',
  'QD80c', 'R', 'R-23', 'R-245Fa', 'R-32', 'R-407A', 'R-407F', 'R-417A', 'R-422D',
  'R-507', 'R-508B', 'R134A', 'R227Ea', 'R32', 'R404A', 'R407C', 'R410A',
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

const missing = [...JUNK].filter((b) => !perBrand.has(b));
console.log(`Eşleşen marka etiketi: ${perBrand.size}/${JUNK.size}`);
if (missing.length) console.log('Veride bulunamayan:', missing);
console.log(`Taşınan ürün: ${changed}`);

if (!dry) {
  fs.writeFileSync(FILE, JSON.stringify(products));
  const after = products.filter((p) => p.bn === TARGET_BN).length;
  console.log(`Yazıldı. "${TARGET_BN}" toplam ürün: ${after}`);
}
