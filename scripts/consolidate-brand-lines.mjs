// Tek seferlik veri düzeltmesi: ölçü/nesil'e göre ayrı marka kartlarına
// bölünmüş ürün hatlarını tek marka altında toplar.
//   Cform™-1/2", Cform™-1/4", Cform2™- ...  -> "Cform"
//   Ecutherm™-1/4", Ecutherm2™- , Ecutherm ... -> "Ecutherm"
// Eşleşme bn içinde (büyük/küçük harf duyarsız) alt dize ile yapılır.
// Yalnızca bn/b alanları değişir; ürün slug'ları (s) ve URL'ler aynı kalır.
//
// Kullanım:
//   node scripts/consolidate-brand-lines.mjs --dry
//   node scripts/consolidate-brand-lines.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'klimasun-2026/data/products.json');

// Sıra önemli değil; her kural bn içinde `match` alt dizesini arar.
const RULES = [
  { match: 'cform', bn: 'Cform', b: 'cform' },
  { match: 'ecutherm', bn: 'Ecutherm', b: 'ecutherm' },
];

const dry = process.argv.includes('--dry');
const products = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const report = new Map(); // hedef bn -> {from: Map(eskiBn->sayı), total}
for (const p of products) {
  const low = (p.bn || '').toLocaleLowerCase('tr');
  const rule = RULES.find((r) => low.includes(r.match));
  if (!rule) continue;
  if (p.bn === rule.bn && p.b === rule.b) continue; // zaten hedefte (yine de raporla)
  const r = report.get(rule.bn) || { from: new Map(), total: 0 };
  r.from.set(p.bn, (r.from.get(p.bn) || 0) + 1);
  r.total++;
  report.set(rule.bn, r);
  if (!dry) {
    p.bn = rule.bn;
    p.b = rule.b;
  }
}

for (const [target, r] of report) {
  console.log(`\n-> "${target}" (${r.total} ürün taşınıyor)`);
  for (const [from, n] of [...r.from.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`     ${String(n).padStart(3)}  ${from}`);
  }
}

if (!dry) {
  fs.writeFileSync(FILE, JSON.stringify(products));
  for (const rule of RULES) {
    const total = products.filter((p) => p.bn === rule.bn).length;
    console.log(`\nYazıldı. "${rule.bn}" toplam ürün: ${total}`);
  }
}
