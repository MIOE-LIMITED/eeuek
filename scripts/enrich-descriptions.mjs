// İnce ürün sayfalarını zenginleştirir: boş/kısa `ld` (uzun açıklama) ve
// `rich.faq` (FAQPage JSON-LD -> AEO) alanlarını, ürünün TİPİNE + markasına +
// modeline + kategorisine göre ÖZGÜN metinle doldurur.
//
// İlkeler (DIHATEKNIK-AKTARIM-KURALLARI.md ile uyumlu):
//   - Kopya yok: metin sıfırdan, tip-bazlı uzman şablonundan üretilir.
//   - Uydurma spec yok: sayısal değer YALNIZCA ürün adında/f'inde gerçekten
//     geçiyorsa (regex ile çıkarılır) kullanılır.
//   - Fiyat yok, "stokta" iddiası yok.
//   - Mükerrer/doorway riskini azaltmak için cümle varyantları slug hash'iyle
//     seçilir; her sayfa modele özgü farklılaşır.
//   - Idempotent: yalnızca `ld` ince olan ve TİPİ tanınan ürünlere dokunur.
//
// Kullanım:
//   node scripts/enrich-descriptions.mjs --cat=pano-iklimlendirme--pano-klimasi --limit=20            (kuru çalışma)
//   node scripts/enrich-descriptions.mjs --cat=pano-iklimlendirme--pano-klimasi --write                (yaz)
//   node scripts/enrich-descriptions.mjs --cat=pano-iklimlendirme--pano-klimasi --review=out.md        (örnek md üret)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'klimasun-2026/data');
const PRODUCTS = path.join(DATA, 'products.json');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

const empty = (s) => !s || !String(s).trim();
const thin = (p) => empty(p.ld) || String(p.ld).length < 160;

// slug -> deterministik sayı (varyant seçimi için; Math.random KULLANMA)
function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}
const pick = (arr, seed) => arr[((seed >>> 0) % arr.length + arr.length) % arr.length];

// --- Ürün adından/f'inden GERÇEK teknik değerleri çıkar (yoksa boş) --------
function extractSpecs(p) {
  const hay = `${p.n} ${Object.values(p.f || {}).join(' ')}`;
  const specs = [];
  const grab = (re, label, unit) => {
    const m = hay.match(re);
    if (m) specs.push(`${label} ${m[1].replace(',', '.')}${unit}`);
  };
  grab(/(\d+(?:[.,]\d+)?)\s*kW\b/i, 'soğutma/güç kapasitesi', ' kW');
  grab(/(\d{3,5})\s*W\b/i, 'güç', ' W');
  grab(/(\d{3,5})\s*(?:BTU|Btu)\b/i, 'kapasite', ' BTU/h');
  grab(/(\d{2,5})\s*m3\/h|(\d{2,5})\s*m³\/h/i, 'hava debisi', ' m³/h');
  grab(/(\d+(?:[.,]\d+)?)\s*HP\b/i, 'güç', ' HP');
  grab(/\b(\d{3})\s*[Vv]\b/, 'besleme gerilimi', ' V');
  grab(/\bIP\s?(\d{2})\b/i, 'koruma sınıfı IP', '');
  return specs;
}

// --- Tip tespiti ------------------------------------------------------------
function detectType(p) {
  const n = (p.n + ' ' + (p.f?.['Alt Kategori'] || '')).toLowerCase();
  if (/pano klima|enclosure cool|schaltschrank/.test(n)) return 'pano-klimasi';
  if (/chiller|rückkühl|ruckkuhl|water.?chiller/.test(n)) return 'chiller';
  if (/aksiyal|aksiyel|axial/.test(n)) return 'aksiyal-fan';
  if (/radyal|radial|evapar|evapor.*fan/.test(n)) return 'radyal-fan';
  return null;
}

// --- Tip şablonları (ÖZGÜN metin; {marka}{model} interpolasyonu) -----------
const TYPES = {
  'pano-klimasi': {
    label: 'pano kliması',
    intro: [
      (b, m) =>
        `${b} ${m} pano kliması, elektrik panosu içindeki ısıyı dışarı atarak kart, sürücü ve kontrol bileşenlerini aşırı sıcaklığa karşı koruyan kapalı çevrim bir soğutma ünitesidir.`,
      (b, m) =>
        `${b} ${m}, pano içi sıcaklığı ortam koşullarından bağımsız olarak sabit tutmak için tasarlanmış bir pano tipi iklimlendirme cihazıdır; içerideki elektronik ekipmanın ömrünü ve kararlılığını artırır.`,
      (b, m) =>
        `${b} ${m} pano kliması, tozlu ve sıcak endüstriyel ortamlarda panonun iç havasını dış ortamdan izole ederek soğutan bir çözümdür; panoyu açmadan ısı yükünü uzaklaştırır.`,
    ],
    body: [
      'Ünite, panonun iç havasını çevrim içinde soğutur; dış ortamla temas etmeyen kapalı yapısı sayesinde toz, nem ve kirli havanın hassas bileşenlere ulaşmasını önler. Bu yönüyle filtreli fan-panjur çözümlerine göre kirli ve nemli ortamlarda daha yüksek koruma sağlar.',
      'Kompresörlü soğutma prensibiyle çalıştığı için ortam sıcaklığı pano hedef sıcaklığının üzerindeyken bile soğutma yapabilir; bu, yaz koşullarında veya ısı üreten sürücülerin bulunduğu panolarda kritik bir avantajdır.',
      'Yan/kapı montajına uygun tasarımı, endüstriyel makine panoları, otomasyon dolapları, CNC ve enjeksiyon makineleri ile saha tipi kontrol panolarında yaygın kullanılır.',
    ],
    close: [
      'Doğru model seçimi, panonun ısı yüküne (W) ve hedef iç sıcaklığa göre yapılmalıdır; kapasite hesabı için teknik ekibimizden destek alabilirsiniz.',
      'Uygun kapasitenin belirlenmesi için pano boyutu, içindeki ekipmanın ısı kaybı ve ortam sıcaklığı birlikte değerlendirilmelidir.',
    ],
    faq: (b, m, hasCap) => [
      {
        q: `${b} ${m} pano kliması ne işe yarar?`,
        a: `Elektrik panosu içindeki ısıyı dışarı atarak pano içi sıcaklığı kontrol altında tutar ve içindeki elektronik bileşenleri aşırı ısınmaya bağlı arızalardan korur.`,
      },
      {
        q: 'Pano kliması gücü nasıl seçilir?',
        a: 'Seçim, panonun içindeki ekipmanın ürettiği ısı yüküne (Watt), pano yüzey alanına, hedeflenen iç sıcaklığa ve ortam sıcaklığına göre yapılır. Bu değerlerle uygun soğutma kapasitesi belirlenir.',
      },
      {
        q: 'Pano kliması ile filtreli fan arasındaki fark nedir?',
        a: 'Filtreli fan yalnızca dış ortam havası pano içinden serinse işe yarar; pano kliması ise kompresörlü soğutma yaptığı için sıcak ve tozlu ortamlarda, dış hava sıcak olsa bile pano içini soğutabilir ve kapalı çevrimi sayesinde toz/nem girişini engeller.',
      },
    ],
  },
  chiller: {
    label: 'chiller (su soğutma ünitesi)',
    intro: [
      (b, m) =>
        `${b} ${m} chiller, proses veya makine soğutmasında kullanılan suyu/soğutma sıvısını istenen sıcaklığa düşürüp sabit tutan bir su soğutma (rückkühl) ünitesidir.`,
      (b, m) =>
        `${b} ${m}, kapalı devrede dolaşan soğutma sıvısını soğutarak makinelerin ve proseslerin sabit sıcaklıkta çalışmasını sağlayan bir chiller ünitesidir.`,
    ],
    body: [
      'Ünite, soğutulan sıvıyı bir kompresör-kondenser devresiyle soğutur ve pompa ile prosese geri gönderir; böylece işlem sıcaklığı dar bir bantta sabit tutulur.',
      'Enjeksiyon ve ekstrüzyon makineleri, lazer/CNC tezgâhları, kaynak ekipmanı ve laboratuvar proseslerinde sıcaklık kararlılığı gereken uygulamalarda kullanılır.',
    ],
    close: [
      'Model seçimi, soğutulacak yük (kW), hedef sıvı sıcaklığı ve debiye göre yapılmalıdır; kapasite doğrulaması için teknik ekibimize danışabilirsiniz.',
    ],
    faq: (b, m) => [
      {
        q: `${b} ${m} chiller nerede kullanılır?`,
        a: 'Sabit sıcaklıkta soğutma sıvısı gerektiren endüstriyel proseslerde; enjeksiyon/ekstrüzyon makineleri, CNC ve lazer tezgâhları, kaynak ve laboratuvar uygulamalarında kullanılır.',
      },
      {
        q: 'Chiller kapasitesi nasıl belirlenir?',
        a: 'Prosesin uzaklaştırılması gereken ısı yükü (kW), hedeflenen sıvı çıkış sıcaklığı ve gerekli debi birlikte değerlendirilerek uygun soğutma kapasitesi seçilir.',
      },
    ],
  },
  'aksiyal-fan': {
    label: 'aksiyal fan',
    intro: [
      (b, m) =>
        `${b} ${m} aksiyal fan, havayı mil eksenine paralel yönde ileterek yüksek debide hava hareketi sağlayan bir fandır; pano ve cihaz havalandırmasında ısıyı uzaklaştırmak için kullanılır.`,
      (b, m) =>
        `${b} ${m}, düşük basınç kaybı olan uygulamalarda yüksek hava debisi veren bir aksiyal fandır ve pano/ekipman soğutmasında yaygın tercih edilir.`,
    ],
    body: [
      'Aksiyal yapısı düşük statik basınçta yüksek debi verir; bu nedenle pano panjuru, kondenser/evaporatör havalandırması ve genel cihaz soğutmasında etkilidir.',
      'Genellikle filtreli panjurla birlikte kullanılır; dış havayı pano içine alarak veya iç sıcak havayı dışarı atarak ısı dengesini sağlar.',
    ],
    close: [
      'Doğru fan seçimi gerekli hava debisi (m³/h) ve besleme gerilimine göre yapılmalıdır.',
    ],
    faq: (b, m) => [
      {
        q: `${b} ${m} aksiyal fan ne için kullanılır?`,
        a: 'Pano ve cihazların içindeki sıcak havayı dışarı atmak veya serin dış havayı içeri almak için, düşük basınç kaybıyla yüksek debide hava hareketi sağlamak amacıyla kullanılır.',
      },
      {
        q: 'Aksiyal fan ile radyal fan farkı nedir?',
        a: 'Aksiyal fan düşük basınçta yüksek debi verir ve serbest havalandırmaya uygundur; radyal fan ise daha yüksek statik basınç üretir ve kanal/dirençli sistemlerde tercih edilir.',
      },
    ],
  },
  'radyal-fan': {
    label: 'radyal fan',
    intro: [
      (b, m) =>
        `${b} ${m} radyal fan, havayı kanatların merkezine alıp dışa doğru savurarak yüksek statik basınç üreten bir fandır; kanallı ve dirençli havalandırma sistemlerinde kullanılır.`,
      (b, m) =>
        `${b} ${m}, yüksek basınç gerektiren hava taşıma ve soğutma uygulamaları için tasarlanmış bir radyal fandır.`,
    ],
    body: [
      'Radyal (santrifüj) yapısı sayesinde kanal, filtre veya eşanjör gibi dirençli hatlarda debiyi koruyabilir; evaporatör/kondenser havalandırması ve pano soğutmasında kullanılır.',
    ],
    close: [
      'Seçim, gerekli hava debisi (m³/h), sistem basıncı ve besleme gerilimine göre yapılmalıdır.',
    ],
    faq: (b, m) => [
      {
        q: `${b} ${m} radyal fan nerede kullanılır?`,
        a: 'Kanallı, filtreli veya eşanjörlü gibi hava direncinin yüksek olduğu sistemlerde, yüksek statik basınç altında hava debisini korumak için kullanılır.',
      },
    ],
  },
};

function buildLd(p, type) {
  const t = TYPES[type];
  const b = p.bn || p.b || '';
  const model = (p.c && p.n.includes(p.c) ? p.c : p.n.replace(new RegExp(b, 'i'), '').replace(new RegExp(t.label, 'i'), '')).trim() || p.n;
  const seed = hash(p.s);
  const specs = extractSpecs(p);
  const parts = [];
  parts.push(pick(t.intro, seed)(b, model));
  parts.push(pick(t.body, seed >>> 3));
  if (specs.length) {
    parts.push(`Ürün künyesinde öne çıkan değerler: ${specs.join(', ')}.`);
  }
  parts.push(pick(t.close, seed >>> 6));
  const ld = parts.filter(Boolean).join(' ');
  const faq = t.faq(b, model, specs.length > 0);
  return { ld, faq, model };
}

// --- Çalıştır ---------------------------------------------------------------
const products = JSON.parse(fs.readFileSync(PRODUCTS, 'utf8'));
const cat = args.cat;
const limit = args.limit ? Number(args.limit) : Infinity;

let candidates = products.filter((p) => (cat ? p.pc === cat : true) && thin(p) && detectType(p));
const total = candidates.length;
if (limit !== Infinity) candidates = candidates.slice(0, limit);

let changed = 0;
const samples = [];
for (const p of candidates) {
  const type = detectType(p);
  const before = p.ld || '';
  const { ld, faq } = buildLd(p, type);
  samples.push({ n: p.n, s: p.s, type, before, ld, faq });
  if (args.write) {
    p.ld = ld;
    p.rich = { ...(p.rich || {}), faq };
    changed++;
  }
}

if (args.write) {
  fs.writeFileSync(PRODUCTS, JSON.stringify(products));
  console.log(`YAZILDI: ${changed} ürün zenginleştirildi (kategori: ${cat || 'tümü'}). Toplam aday: ${total}.`);
} else {
  console.log(`KURU ÇALIŞMA — kategori: ${cat || 'tümü'} | aday (ince+tip tanınan): ${total} | gösterilen: ${samples.length}\n`);
  for (const s of samples.slice(0, Number(args.show || 4))) {
    console.log('■', s.n, `[${s.type}]`);
    console.log('  ÖNCE ld:', JSON.stringify(s.before));
    console.log('  SONRA ld:', s.ld);
    console.log('  FAQ:', s.faq.map((f) => f.q).join(' | '));
    console.log('');
  }
}

if (args.review) {
  const md = ['# Zenginleştirme Örnekleri — ' + (cat || 'tümü'), '', `Aday (ince + tipi tanınan): **${total}** ürün. Aşağıda ilk ${samples.length} örnek.`, ''];
  for (const s of samples) {
    md.push(`## ${s.n}`);
    md.push(`- **Tip:** ${s.type}`);
    md.push(`- **ÖNCE:** ${s.before ? s.before : '_(boş)_'}`);
    md.push(`- **SONRA:** ${s.ld}`);
    md.push('- **FAQ:**');
    for (const f of s.faq) md.push(`  - **S:** ${f.q}  \n    **C:** ${f.a}`);
    md.push('');
  }
  const rel = args.review === true ? 'zenginlestirme-ornek.md' : args.review;
  const out = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
  fs.writeFileSync(out, md.join('\n'));
  console.log('Örnek dosyası yazıldı:', out);
}
