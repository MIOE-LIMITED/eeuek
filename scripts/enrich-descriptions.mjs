// İnce ürün sayfalarını zenginleştirir: boş/kısa `ld`, `md` (meta description)
// ve `rich.faq` (FAQPage JSON-LD -> AEO) alanlarını, ürünün TİPİNE + markasına +
// modeline + kategorisine göre ÖZGÜN, SEO/GEO/AEO odaklı metinle doldurur.
//
// İlkeler:
//   - Kopya yok: metin sıfırdan, tip-bazlı uzman şablonundan üretilir.
//   - Uydurma spec yok: sayısal değer YALNIZCA ürün adında/f'inde gerçekten
//     geçiyorsa (regex ile) kullanılır.
//   - Fiyat yok, "stokta" iddiası yok.
//   - Mükerrer/doorway riskini azaltmak için varyantlar slug hash'iyle seçilir;
//     her sayfa marka+model+kategori ile farklılaşır.
//   - Idempotent: yalnızca `ld` ince olan ürünlere dokunur.
//
// Kullanım:
//   node scripts/enrich-descriptions.mjs --stats
//   node scripts/enrich-descriptions.mjs --cat=<pc-slug> [--limit=N] [--show=4] [--review=out.md]
//   node scripts/enrich-descriptions.mjs --all --write          (TÜM ince ürünleri yaz)
//   node scripts/enrich-descriptions.mjs --cat=<pc-slug> --write

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'klimasun-2026/data');
const PRODUCTS = path.join(DATA, 'products.json');
const categories = JSON.parse(fs.readFileSync(path.join(DATA, 'categories.json'), 'utf8'));
const catName = new Map(categories.flat.map((c) => [c.slug, c.name]));

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);

const empty = (s) => !s || !String(s).trim();
const thin = (p) => empty(p.ld) || String(p.ld).length < 160;

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}
const pick = (arr, seed) => arr[((seed >>> 0) % arr.length + arr.length) % arr.length];

// --- Gerçek teknik değerleri çıkar (yoksa boş) -----------------------------
function extractSpecs(p) {
  const hay = `${p.n} ${Object.values(p.f || {}).join(' ')}`;
  const out = [];
  const grab = (re, label, unit) => {
    const m = hay.match(re);
    if (m) out.push(`${label} ${(m[1] || m[2]).replace(',', '.')}${unit}`);
  };
  grab(/(\d+(?:[.,]\d+)?)\s*kW\b/i, 'kapasite/güç', ' kW');
  grab(/(\d{2,5})\s*W\b/, 'güç', ' W');
  grab(/(\d{3,6})\s*(?:BTU|Btu)\b/, 'kapasite', ' BTU/h');
  grab(/(\d{2,5})\s*m3\/h|(\d{2,5})\s*m³\/h/i, 'hava debisi', ' m³/h');
  grab(/(\d+(?:[.,]\d+)?)\s*(?:l\/dk|lt\/dk|l\/min)\b/i, 'debi', ' l/dk');
  grab(/(\d+(?:[.,]\d+)?)\s*HP\b/, 'güç', ' HP');
  grab(/\b(\d{3})\s*[Vv](?:AC|DC)?\b/, 'besleme gerilimi', ' V');
  grab(/\b(\d{1,3})\s*[Aa]\b(?!\w)/, 'akım', ' A');
  grab(/\bIP\s?(\d{2})\b/i, 'koruma sınıfı', ' IP');
  grab(/\bNEMA\s?(\w+)\b/i, 'NEMA', '');
  return out;
}

const brandOf = (p) => p.bn || p.b || '';
function modelOf(p, label) {
  const b = brandOf(p);
  let m = p.c && p.n.includes(p.c) ? p.c : p.n;
  if (m === p.n) {
    m = p.n.replace(new RegExp(b, 'ig'), '');
    if (label) m = m.replace(new RegExp(label, 'ig'), '');
    m = m.replace(/\s{2,}/g, ' ').trim();
  }
  return m || p.n;
}

// --- Tip çözümleyici: Alt Kategori -> kategori adı -> ad anahtarları --------
const RULES = [
  [/pano klima|modüler montajl|moduler montajl|yana ?\/ ?kapı|schaltschrank|enclosure cool/i, 'pano-klimasi'],
  [/chiller|rückkühl|ruckkuhl|su geri soğut|wasserrück/i, 'chiller'],
  [/hava ?\/ ?su eşanjör|plakalı eşanjör|eşanjör|wärmetausch|heat exchang/i, 'esanjor'],
  [/kondens/i, 'kondenser'],
  [/evapor/i, 'evaporator'],
  [/aksiyal|aksiyel|axial/i, 'fan-aksiyal'],
  [/radyal|radial|evapar/i, 'fan-radyal'],
  [/pompa|pump/i, 'pompa'],
  [/kompres/i, 'kompresor'],
  [/expansion valf|genleşme|genlesme|expansion valve/i, 'genlesme-valf'],
  [/\bvalf\b|\bvana\b|solenoid|selenoid|valve/i, 'valf'],
  [/basınç switch|flow swich|flow switch|presostat|akış switch|pressure switch/i, 'switch'],
  [/sensör|sensor|ısı sensör|termostat/i, 'sensor'],
  [/güç kart|guc kart|kontrol kart|power card|elektronik|pcb|kart\b/i, 'kart'],
  [/transformat|trafo/i, 'transformator'],
  [/kablo geçiş|kablo döşeme|kablo kanal|gland|rakor.*kablo|kablo bush|kablo giriş/i, 'kablo-gecisi'],
  [/kilit|tutma kol|kapı kol|menteşe|locking|handle/i, 'kilit'],
  [/izgara|grill|panjur|filtre.*panjur|louvre/i, 'izgara'],
  [/sistem lamba|lamba|aydınlatma|light/i, 'lamba'],
  [/tornavida|sac delici|el alet|anahtar|pense|screwdriver|tool/i, 'el-aleti'],
  [/it soğut|rack|server|19''|data ?center|veri merkez/i, 'it-sogutma'],
  [/kurutucu filtre|drayer|dryer filter/i, 'kurutucu'],
  [/soğutucu gaz|soğutucu akışkan|refriger|\br134|\br404|\br410|\br407|\br22\b/i, 'gaz'],
  [/rezistans|heater|ısıtıcı rezist/i, 'rezistans'],
  [/kapasitör|kondansatör|capacitor/i, 'kapasitor'],
  [/manometre|gauge/i, 'manometre'],
  [/montaj|cover|kapak|braket|bracket|aksesuar|mount/i, 'montaj'],
];
function detectType(p) {
  const hay = `${p.f?.['Alt Kategori'] || ''} | ${catName.get(p.pc) || ''} | ${p.n}`;
  for (const [re, key] of RULES) if (re.test(hay)) return key;
  return null;
}

// ===========================================================================
// TİP PROFİLLERİ — her biri: intro[], body[], close[], faq(b,m,specs)
// ===========================================================================
const T = {
  'pano-klimasi': {
    label: 'pano kliması',
    intro: [
      (b, m) => `${b} ${m} pano kliması, elektrik panosu içindeki ısıyı dışarı atarak kart, sürücü ve kontrol bileşenlerini aşırı sıcaklığa karşı koruyan kapalı çevrim bir soğutma ünitesidir.`,
      (b, m) => `${b} ${m}, pano içi sıcaklığı ortam koşullarından bağımsız olarak sabit tutmak için tasarlanmış kompresörlü bir pano tipi iklimlendirme cihazıdır.`,
      (b, m) => `${b} ${m} pano kliması, tozlu ve sıcak endüstriyel ortamlarda panonun iç havasını dış ortamdan izole ederek soğutur; panoyu açmadan ısı yükünü uzaklaştırır.`,
    ],
    body: [
      'Kapalı çevrim yapısı, dış ortamla temas etmediği için toz, nem ve kirli havanın hassas bileşenlere ulaşmasını önler; bu yönüyle filtreli fan-panjur çözümlerine göre kirli ortamlarda daha yüksek IP koruması sağlar.',
      'Kompresörlü soğutma prensibiyle çalıştığından ortam sıcaklığı pano hedef sıcaklığının üzerindeyken bile soğutabilir; yaz koşullarında ve ısı üreten sürücülerin bulunduğu panolarda kritik avantaj sunar.',
      'Yan veya kapı montajına uygun tasarımıyla makine panoları, otomasyon dolapları, CNC ve enjeksiyon makineleri ile saha tipi kontrol panolarında yaygın kullanılır; enerji verimli modeller çalışma maliyetini düşürür.',
    ],
    close: [
      'Doğru model, panonun ısı yüküne (W) ve hedef iç sıcaklığa göre seçilir; kapasite hesabı için teknik ekibimizden destek alabilirsiniz.',
      'Uygun kapasite; pano boyutu, içindeki ekipmanın ısı kaybı ve ortam sıcaklığı birlikte değerlendirilerek belirlenir.',
    ],
    faq: (b, m) => [
      { q: `${b} ${m} pano kliması ne işe yarar?`, a: 'Elektrik panosu içindeki ısıyı dışarı atarak pano içi sıcaklığı kontrol altında tutar ve içindeki elektronik bileşenleri aşırı ısınmaya bağlı arızalardan korur.' },
      { q: 'Pano kliması gücü nasıl seçilir?', a: 'Seçim; panodaki ekipmanın ürettiği ısı yüküne (Watt), pano yüzey alanına, hedef iç sıcaklığa ve ortam sıcaklığına göre yapılır. Bu değerlerle uygun soğutma kapasitesi belirlenir.' },
      { q: 'Pano kliması ile filtreli fan arasındaki fark nedir?', a: 'Filtreli fan yalnızca dış hava pano içinden serinse işe yarar; pano kliması kompresörlü soğutma yaptığı için sıcak ve tozlu ortamlarda, dış hava sıcak olsa bile pano içini soğutur ve kapalı çevrimi sayesinde toz/nem girişini engeller.' },
    ],
  },
  chiller: {
    label: 'chiller',
    intro: [
      (b, m) => `${b} ${m} chiller, proses veya makine soğutmasında kullanılan soğutma sıvısını istenen sıcaklığa düşürüp sabit tutan bir su soğutma ünitesidir.`,
      (b, m) => `${b} ${m}, kapalı devrede dolaşan sıvıyı soğutarak makinelerin ve proseslerin sabit sıcaklıkta çalışmasını sağlayan bir chiller ünitesidir.`,
    ],
    body: [
      'Ünite, soğutulan sıvıyı kompresör-kondenser devresiyle soğutur ve pompayla prosese geri gönderir; böylece işlem sıcaklığı dar bir bantta sabit tutulur.',
      'Enjeksiyon ve ekstrüzyon makineleri, lazer/CNC tezgâhları, kaynak ekipmanı ve laboratuvar proseslerinde sıcaklık kararlılığı gereken uygulamalarda kullanılır.',
    ],
    close: ['Model seçimi; soğutulacak yük (kW), hedef sıvı sıcaklığı ve debiye göre yapılır. Kapasite doğrulaması için teknik ekibimize danışabilirsiniz.'],
    faq: (b, m) => [
      { q: `${b} ${m} chiller nerede kullanılır?`, a: 'Sabit sıcaklıkta soğutma sıvısı gerektiren endüstriyel proseslerde; enjeksiyon/ekstrüzyon makineleri, CNC ve lazer tezgâhları, kaynak ve laboratuvar uygulamalarında kullanılır.' },
      { q: 'Chiller kapasitesi nasıl belirlenir?', a: 'Prosesin uzaklaştırılması gereken ısı yükü (kW), hedeflenen sıvı çıkış sıcaklığı ve gerekli debi birlikte değerlendirilerek uygun soğutma kapasitesi seçilir.' },
    ],
  },
  esanjor: {
    label: 'ısı eşanjörü',
    intro: [
      (b, m) => `${b} ${m} ısı eşanjörü, iki akışkan arasında karışma olmadan ısı transferi sağlayan, pano ve proses soğutmasında kullanılan bir bileşendir.`,
      (b, m) => `${b} ${m}, hava/su veya su/su akışları arasında verimli ısı aktarımı için tasarlanmış bir eşanjördür.`,
    ],
    body: ['Yüksek ısı transfer yüzeyi sayesinde kompakt gövdede yüksek kapasite sunar; pano yan/kapı montajlı hava-su soğutma ve proses hatlarında kullanılır.'],
    close: ['Seçim; transfer edilecek ısı yükü, akışkan sıcaklıkları ve debiye göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} eşanjör ne işe yarar?`, a: 'İki akışkan arasında karışma olmadan ısı transferi sağlar; pano içindeki ısıyı soğutma suyuna aktararak veya prosesi soğutarak sıcaklığı kontrol altında tutar.' },
      { q: 'Hava/su eşanjör pano soğutmada neden tercih edilir?', a: 'Tesiste soğutma suyu mevcutsa, kompresörlü klimaya göre daha düşük enerjiyle yüksek kapasiteli ve sessiz pano soğutması sağladığı için tercih edilir.' },
    ],
  },
  kondenser: {
    label: 'kondenser',
    intro: [
      (b, m) => `${b} ${m} kondenser, soğutma çevriminde gaz halindeki soğutucu akışkanı yoğuşturarak ısıyı dış ortama atan bir ısı değiştiricidir.`,
      (b, m) => `${b} ${m}, soğutma sisteminde yüksek basınçlı soğutucu gazın ısısını dışarı vererek sıvıya dönüşmesini sağlayan kondenserdir.`,
    ],
    body: ['Kanatlı boru veya mikrokanal yapısıyla yüksek ısı atma yüzeyi sunar; soğuk oda, market soğutma ve proses soğutma sistemlerinde kullanılır.'],
    close: ['Seçim; sistemin ısı atma kapasitesine, soğutucu akışkana ve fan/hava debisine göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} kondenser ne işe yarar?`, a: 'Soğutma çevriminde kompresörden gelen sıcak, yüksek basınçlı gazı soğutup yoğuşturarak sıvıya çevirir ve sistemin ısısını dış ortama atar.' },
    ],
  },
  evaporator: {
    label: 'evaporatör',
    intro: [
      (b, m) => `${b} ${m} evaporatör, soğutma çevriminde soğutucu akışkanın buharlaşarak ortamdan ısı çektiği ve soğutmanın gerçekleştiği ısı değiştiricidir.`,
      (b, m) => `${b} ${m}, soğuk oda ve soğutma dolaplarında havayı soğutan, kanatlı borulu bir evaporatördür.`,
    ],
    body: ['Fanlı yapısıyla soğutulan hacimde homojen sıcaklık dağılımı sağlar; soğuk oda, şoklama ve market soğutma uygulamalarında kullanılır.'],
    close: ['Seçim; soğutulacak hacim, hedef sıcaklık ve soğutucu akışkana göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} evaporatör ne işe yarar?`, a: 'Soğutucu akışkanın buharlaşarak ortamdan ısı çektiği bileşendir; soğuk oda veya dolabın içindeki havayı soğutarak istenen düşük sıcaklığı sağlar.' },
    ],
  },
  'fan-aksiyal': {
    label: 'aksiyal fan',
    intro: [
      (b, m) => `${b} ${m} aksiyal fan, havayı mil eksenine paralel yönde ileterek düşük basınç kaybında yüksek debi sağlayan bir fandır; pano ve cihaz havalandırmasında ısıyı uzaklaştırır.`,
      (b, m) => `${b} ${m}, düşük statik basınçta yüksek hava debisi veren, pano/ekipman soğutmasında yaygın kullanılan bir aksiyal fandır.`,
    ],
    body: ['Genellikle filtreli panjurla birlikte kullanılır; serin dış havayı pano içine alarak veya iç sıcak havayı dışarı atarak ısı dengesini sağlar.'],
    close: ['Doğru fan; gerekli hava debisi (m³/h) ve besleme gerilimine göre seçilir.'],
    faq: (b, m) => [
      { q: `${b} ${m} aksiyal fan ne için kullanılır?`, a: 'Pano ve cihazların içindeki sıcak havayı dışarı atmak veya serin dış havayı içeri almak için, düşük basınç kaybıyla yüksek debide hava hareketi sağlar.' },
      { q: 'Aksiyal fan ile radyal fan farkı nedir?', a: 'Aksiyal fan düşük basınçta yüksek debi verir ve serbest havalandırmaya uygundur; radyal fan daha yüksek statik basınç üretir ve kanallı/dirençli sistemlerde tercih edilir.' },
    ],
  },
  'fan-radyal': {
    label: 'radyal fan',
    intro: [
      (b, m) => `${b} ${m} radyal fan, havayı kanatların merkezine alıp dışa savurarak yüksek statik basınç üreten bir fandır; kanallı ve dirençli havalandırma sistemlerinde kullanılır.`,
      (b, m) => `${b} ${m}, yüksek basınç gerektiren hava taşıma ve soğutma uygulamaları için tasarlanmış bir radyal (santrifüj) fandır.`,
    ],
    body: ['Kanal, filtre veya eşanjör gibi dirençli hatlarda debiyi koruyabilir; evaporatör/kondenser havalandırması ve pano soğutmasında kullanılır.'],
    close: ['Seçim; gerekli hava debisi (m³/h), sistem basıncı ve besleme gerilimine göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} radyal fan nerede kullanılır?`, a: 'Kanallı, filtreli veya eşanjörlü gibi hava direncinin yüksek olduğu sistemlerde, yüksek statik basınç altında hava debisini korumak için kullanılır.' },
    ],
  },
  pompa: {
    label: 'pompa',
    intro: [
      (b, m) => `${b} ${m} pompa, soğutma ve iklimlendirme sistemlerinde suyu/soğutma sıvısını devrede dolaştıran bir sirkülasyon bileşenidir.`,
      (b, m) => `${b} ${m}, chiller ve soğutma hatlarında akışkanı gerekli debi ve basınçta ileten bir pompadır.`,
    ],
    body: ['Kararlı debi ve basınç sağlayarak eşanjör, kondenser veya soğutma serpantinine sıvının sürekli akışını temin eder; su geri soğutma ve proses hatlarında kullanılır.'],
    close: ['Seçim; gerekli debi (l/dk) ve basma yüksekliğine göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} pompa ne işe yarar?`, a: 'Soğutma sistemindeki suyu veya soğutma sıvısını devrede dolaştırarak ısı taşınmasını sağlar; chiller, eşanjör ve soğutma serpantinlerine sürekli akış temin eder.' },
    ],
  },
  kompresor: {
    label: 'kompresör',
    intro: [
      (b, m) => `${b} ${m} kompresör, soğutma çevriminin kalbidir; soğutucu akışkanı sıkıştırarak sistemde dolaşımını ve ısı transferini sağlar.`,
      (b, m) => `${b} ${m}, soğutma ve iklimlendirme sistemlerinde soğutucu gazı basınçlandıran bir kompresördür.`,
    ],
    body: ['Verimli sıkıştırma ve servis dostu tasarımıyla market soğutma, soğuk oda, proses soğutma ve iklimlendirme sistemlerinde kullanılır.'],
    close: ['Seçim; soğutma kapasitesi, çalışma sıcaklık aralığı ve uyumlu soğutucu akışkana göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} kompresör ne işe yarar?`, a: 'Soğutucu akışkanı sıkıştırıp sistemde dolaştırarak soğutma çevrimini çalıştırır; düşük basınçlı gazı yüksek basınca çıkararak ısının kondenserde atılmasını sağlar.' },
      { q: 'Kompresör seçiminde nelere dikkat edilir?', a: 'Gerekli soğutma kapasitesi, buharlaşma/yoğuşma sıcaklıkları (uygulama tipi) ve kullanılan soğutucu akışkanla uyum birlikte değerlendirilir.' },
    ],
  },
  'genlesme-valf': {
    label: 'genleşme valfi',
    intro: [
      (b, m) => `${b} ${m} genleşme valfi, soğutma çevriminde soğutucu akışkanın basıncını düşürerek evaporatöre kontrollü besleme yapan bir kısılma elemanıdır.`,
      (b, m) => `${b} ${m}, evaporatöre giren soğutucu akışkan miktarını ayarlayarak sistem verimini belirleyen bir genleşme valfidir.`,
    ],
    body: ['Doğru aşırı kızdırma (superheat) kontrolü sağlayarak evaporatörün verimli ve güvenli çalışmasını temin eder; soğuk oda, klima ve proses soğutma sistemlerinde kullanılır.'],
    close: ['Seçim; sistemin kapasitesine, soğutucu akışkana ve buharlaşma sıcaklığına göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} genleşme valfi ne işe yarar?`, a: 'Soğutucu akışkanın basıncını düşürüp evaporatöre kontrollü besleme yaparak aşırı kızdırmayı ayarlar; sistemin verimli ve kararlı çalışmasını sağlar.' },
    ],
  },
  valf: {
    label: 'valf',
    intro: [
      (b, m) => `${b} ${m}, soğutma ve iklimlendirme hatlarında akışkanın yönünü veya geçişini kontrol eden bir valftir.`,
      (b, m) => `${b} ${m} valf, soğutma devresinde akışı açma/kapama veya yönlendirme için kullanılan bir kontrol elemanıdır.`,
    ],
    body: ['Güvenilir sızdırmazlık ve dayanıklı gövdesiyle soğutucu akışkan hatlarında kullanılır; sistemin kontrolünü ve güvenli çalışmasını destekler.'],
    close: ['Seçim; hat çapı, akışkan tipi ve çalışma basıncına göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} valf nerede kullanılır?`, a: 'Soğutma ve iklimlendirme devrelerinde akışkanın geçişini açıp kapatmak veya yönlendirmek için hat üzerinde kullanılır.' },
    ],
  },
  switch: {
    label: 'switch / şalter',
    intro: [
      (b, m) => `${b} ${m}, soğutma sisteminde basınç veya akış değerini izleyerek belirlenen eşikte devreyi kontrol eden bir switch/şalterdir.`,
      (b, m) => `${b} ${m} switch, sistemin güvenli sınırlar içinde çalışmasını sağlayan bir izleme ve koruma elemanıdır.`,
    ],
    body: ['Ayarlanan eşik aşıldığında kontağı açıp/kapayarak kompresör veya pompayı korur; arıza ve aşırı yük durumlarında sistemi güvenceye alır.'],
    close: ['Seçim; izlenecek değer (basınç/akış), ayar aralığı ve kontak tipine göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} ne işe yarar?`, a: 'Basınç veya akış değerini sürekli izler; belirlenen eşiğe ulaşıldığında devreyi keserek kompresör, pompa ve sistemi aşırı yük ve arızalardan korur.' },
    ],
  },
  sensor: {
    label: 'sensör',
    intro: [
      (b, m) => `${b} ${m}, sıcaklık veya ortam değerini ölçerek kontrol sistemine ileten bir sensördür; pano ve soğutma otomasyonunda kullanılır.`,
      (b, m) => `${b} ${m} sensör, ölçtüğü değere göre klima/kontrol ünitesinin doğru çalışmasını sağlayan bir algılama elemanıdır.`,
    ],
    body: ['Hassas ve kararlı ölçümüyle pano kliması, chiller ve otomasyon devrelerinde geri besleme sağlar; sistemin hedef değerde çalışmasını mümkün kılar.'],
    close: ['Seçim; ölçüm aralığı, montaj tipi ve uyumlu kontrol ünitesine göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} sensör ne işe yarar?`, a: 'Sıcaklık gibi bir değeri ölçüp kontrol ünitesine ileterek sistemin geri beslemeli ve doğru çalışmasını sağlar; hatalı sensör pano sıcaklık kontrolünü bozabilir.' },
    ],
  },
  kart: {
    label: 'kontrol/güç kartı',
    intro: [
      (b, m) => `${b} ${m}, pano kliması veya kontrol ünitesinin çalışmasını yöneten bir elektronik güç/kontrol kartıdır.`,
      (b, m) => `${b} ${m} kart, cihazın kumanda ve güç fonksiyonlarını sağlayan orijinal uyumlu bir yedek parçadır.`,
    ],
    body: ['Arızalı kartın orijinal uyumlu parçayla değişimi, cihazı komple değiştirmeye göre hızlı ve ekonomik bir onarım sağlar; doğru model uyumu kritik önemdedir.'],
    close: ['Doğru kart; cihazın model ve seri numarasına göre seçilmelidir. Uyum kontrolü için teknik ekibimize danışabilirsiniz.'],
    faq: (b, m) => [
      { q: `${b} ${m} kart hangi cihazda kullanılır?`, a: 'İlgili pano kliması / kontrol ünitesi modelinin kumanda ve güç fonksiyonlarını sağlar. Uyum, cihazın model ve seri numarasıyla doğrulanmalıdır.' },
      { q: 'Kartı değiştirmek cihazı yenilemekten neden avantajlı?', a: 'Arızalı kartın orijinal uyumlu parçayla değişimi, cihazın tamamını değiştirmeye göre çok daha hızlı ve düşük maliyetlidir; cihaz ömrünü uzatır.' },
    ],
  },
  transformator: {
    label: 'transformatör',
    intro: [
      (b, m) => `${b} ${m} transformatör, cihaz veya panonun ihtiyaç duyduğu gerilimi sağlamak için kullanılan bir güç bileşenidir.`,
      (b, m) => `${b} ${m}, kontrol ve besleme devrelerinde gerilim dönüşümü yapan orijinal uyumlu bir transformatördür.`,
    ],
    body: ['Kararlı gerilim dönüşümüyle kontrol kartları ve yardımcı devrelerin güvenli beslenmesini sağlar; arızalı parçanın uyumlu modelle değişimi onarımı hızlandırır.'],
    close: ['Doğru parça; cihazın modeline ve gerilim değerlerine göre seçilir.'],
    faq: (b, m) => [
      { q: `${b} ${m} transformatör ne işe yarar?`, a: 'Cihaz veya kontrol devresinin ihtiyaç duyduğu gerilimi sağlar; besleme gerilimini dönüştürerek kartların ve yardımcı devrelerin güvenli çalışmasını mümkün kılar.' },
    ],
  },
  'kablo-gecisi': {
    label: 'kablo geçişi',
    intro: [
      (b, m) => `${b} ${m}, panoya kabloların düzenli, sızdırmaz ve mekanik korumalı biçimde girişini sağlayan bir kablo geçiş / rakor bileşenidir.`,
      (b, m) => `${b} ${m} kablo geçişi, pano içi kabloların düzenli döşenmesi ve dış etkenlere karşı korunması için kullanılan bir sistem aksesuarıdır.`,
    ],
    body: ['Sızdırmaz geçiş sayesinde panonun IP koruma sınıfını korur; toz ve nem girişini engellerken kabloların gerginlik almasını önler. Modüler yapı montajı kolaylaştırır.'],
    close: ['Seçim; kablo çapı, pano delik ölçüsü ve gereken koruma sınıfına göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} ne işe yarar?`, a: 'Kabloların panoya düzenli ve sızdırmaz girişini sağlar; panonun toz/nem korumasını (IP sınıfı) korurken kabloları mekanik gerginlik ve hasara karşı korur.' },
    ],
  },
  kilit: {
    label: 'kilit / kol sistemi',
    intro: [
      (b, m) => `${b} ${m}, pano kapağının güvenli kapanması ve kilitlenmesi için kullanılan bir kilit / kol sistemi bileşenidir.`,
      (b, m) => `${b} ${m} kilit sistemi, pano erişim güvenliğini ve kapı sızdırmazlığını sağlayan bir sistem aksesuarıdır.`,
    ],
    body: ['Dayanıklı mekanizmasıyla kapının güvenli ve sızdırmaz kapanmasını sağlar; yetkisiz erişimi önlerken panonun koruma sınıfını destekler.'],
    close: ['Seçim; pano tipi, kapı yapısı ve istenen kilitleme standardına göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} nerede kullanılır?`, a: 'Elektrik/otomasyon panolarının kapağını güvenli ve sızdırmaz biçimde kapatıp kilitlemek için kullanılır; erişim güvenliği ve koruma sınıfını destekler.' },
    ],
  },
  izgara: {
    label: 'ızgara / panjur',
    intro: [
      (b, m) => `${b} ${m}, pano havalandırmasında hava giriş/çıkışını sağlayan ve içeriyi toza/yabancı cisme karşı koruyan bir filtreli ızgara / panjur bileşenidir.`,
      (b, m) => `${b} ${m} panjur, fanla birlikte pano iç sıcaklığını dengelemek için hava akışını yöneten bir sistem aksesuarıdır.`,
    ],
    body: ['Filtre elemanıyla toz tutarken hava akışına izin verir; fanla eşleştirildiğinde pano içindeki sıcak havanın tahliyesini veya serin havanın alınmasını sağlar.'],
    close: ['Seçim; pano açıklığı, hava debisi ve eşleştirileceği fana göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} ne işe yarar?`, a: 'Pano havalandırmasında hava giriş/çıkışını sağlar ve filtresiyle toz/yabancı cisim girişini önler; fanla birlikte pano iç sıcaklığını dengeler.' },
    ],
  },
  lamba: {
    label: 'pano lambası',
    intro: [
      (b, m) => `${b} ${m}, pano içini aydınlatarak montaj, bakım ve arıza çalışmalarını kolaylaştıran bir sistem aydınlatma bileşenidir.`,
      (b, m) => `${b} ${m} pano lambası, servis ve bakım sırasında pano içinde net görüş sağlayan bir aksesuardır.`,
    ],
    body: ['Verimli aydınlatma ve pratik montajıyla pano içi çalışmalarda görüşü artırır; hareket/kapı sensörü seçenekleriyle enerji tasarrufu sağlayabilir.'],
    close: ['Seçim; pano boyutu, montaj tipi ve besleme gerilimine göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} nerede kullanılır?`, a: 'Elektrik/otomasyon panolarının içini aydınlatmak için kullanılır; montaj, bakım ve arıza tespiti sırasında net görüş sağlar.' },
    ],
  },
  'el-aleti': {
    label: 'el aleti',
    intro: [
      (b, m) => `${b} ${m}, pano ve elektrik montaj işlerinde kullanılan profesyonel bir el aletidir.`,
      (b, m) => `${b} ${m} el aleti, montaj ve bakım çalışmalarını hızlı ve güvenli kılan bir ekipmandır.`,
    ],
    body: ['Ergonomik ve dayanıklı yapısıyla saha ve atölye montaj işlerinde hassas, güvenli ve verimli çalışma sağlar.'],
    close: ['Seçim; iş tipi, ölçü ve kullanım sıklığına göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} ne için kullanılır?`, a: 'Pano montajı, kablolama ve bakım gibi elektrik/otomasyon işlerinde hassas ve güvenli çalışma için kullanılan bir el aletidir.' },
    ],
  },
  'it-sogutma': {
    label: 'IT / veri merkezi bileşeni',
    intro: [
      (b, m) => `${b} ${m}, sunucu ve veri merkezi kabinlerinde ısı yönetimi ve altyapı için kullanılan bir IT soğutma bileşenidir.`,
      (b, m) => `${b} ${m}, rack kabinlerinde yüksek yoğunluklu ekipmanın güvenli çalışması için tasarlanmış bir veri merkezi aksesuarıdır.`,
    ],
    body: ['Rack ısı yükünü kontrol altında tutarak sunucuların kesintisiz ve verimli çalışmasını destekler; koridor kapatma ve hassas iklimlendirme çözümleriyle uyumludur.'],
    close: ['Seçim; kabin ısı yükü (kW), rack ölçüsü ve altyapı standardına göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} nerede kullanılır?`, a: 'Sunucu/rack kabinlerinde ve veri merkezlerinde ısı yönetimi ve altyapı amacıyla kullanılır; yüksek yoğunluklu ekipmanın güvenli ve kesintisiz çalışmasını destekler.' },
    ],
  },
  kurutucu: {
    label: 'kurutucu filtre',
    intro: [
      (b, m) => `${b} ${m} kurutucu filtre, soğutma devresindeki nem ve partikülleri tutarak sistemin tıkanmasını ve korozyonu önleyen bir bileşendir.`,
      (b, m) => `${b} ${m}, soğutucu akışkan hattındaki nemi ve kirliliği filtreleyen bir kurutucu (drayer) filtredir.`,
    ],
    body: ['Nem ve asit oluşumunu engelleyerek kompresör ömrünü uzatır ve genleşme valfinin tıkanmasını önler; her devre onarımında değişimi önerilir.'],
    close: ['Seçim; hat çapı, soğutucu akışkan ve sistem kapasitesine göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} kurutucu filtre ne işe yarar?`, a: 'Soğutma devresindeki nemi ve partikülleri tutarak sistemin tıkanmasını, korozyonu ve asit oluşumunu önler; kompresörü korur ve sistem verimini korur.' },
    ],
  },
  gaz: {
    label: 'soğutucu akışkan',
    intro: [
      (b, m) => `${b} ${m}, soğutma ve iklimlendirme sistemlerinde ısı taşıyan soğutucu akışkandır (soğutucu gaz).`,
      (b, m) => `${b} ${m}, soğutma çevriminde buharlaşıp yoğuşarak ısı transferini sağlayan bir soğutucu akışkandır.`,
    ],
    body: ['Uygun basınç-sıcaklık özellikleriyle sistemin verimli çalışmasını sağlar; doğru akışkan seçimi ve şarj miktarı sistem performansı için kritiktir.'],
    close: ['Seçim; sistemin tasarlandığı akışkan tipi ve uygulama sıcaklığına göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} nerede kullanılır?`, a: 'Soğutma ve iklimlendirme sistemlerinde ısı taşıyıcı akışkan olarak kullanılır; buharlaşıp yoğuşarak ortamdan ısı çeker ve dışarı atar.' },
    ],
  },
  rezistans: {
    label: 'rezistans',
    intro: [
      (b, m) => `${b} ${m} rezistans, ısıtma ve nem alma amacıyla kullanılan bir elektrikli ısıtıcı bileşendir.`,
      (b, m) => `${b} ${m}, pano ve ekipmanlarda yoğuşmayı önlemek veya proses ısıtması için kullanılan bir rezistanstır.`,
    ],
    body: ['Kontrollü ısı üreterek pano içinde yoğuşmayı ve donmayı engeller; termostatla birlikte hedef sıcaklığı korur.'],
    close: ['Seçim; gerekli güç (W), montaj tipi ve besleme gerilimine göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} rezistans ne işe yarar?`, a: 'Elektrik enerjisini ısıya çevirerek pano/ekipman içinde yoğuşma ve donmayı önler veya proses ısıtması sağlar; genellikle termostatla birlikte kullanılır.' },
    ],
  },
  kapasitor: {
    label: 'kapasitör',
    intro: [
      (b, m) => `${b} ${m} kapasitör, motor ve kompresörlerin çalıştırma/çalışma devrelerinde kullanılan bir elektriksel bileşendir.`,
      (b, m) => `${b} ${m}, fan ve kompresör motorlarının verimli yol alması ve çalışması için kullanılan bir kapasitördür.`,
    ],
    body: ['Motorun gerekli faz kaymasını sağlayarak yol alma ve çalışma performansını destekler; arızalı kapasitör motorun çalışmamasına yol açabilir.'],
    close: ['Seçim; kapasite (µF) ve gerilim değerine göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} kapasitör ne işe yarar?`, a: 'Fan veya kompresör motorunun yol almasını ve verimli çalışmasını sağlar; arızalandığında motor çalışmayabilir veya zorlanarak ısınabilir.' },
    ],
  },
  manometre: {
    label: 'manometre',
    intro: [
      (b, m) => `${b} ${m} manometre, soğutma sisteminde basıncı ölçmek için kullanılan bir gösterge cihazıdır.`,
      (b, m) => `${b} ${m}, servis ve bakım sırasında soğutucu akışkan basıncını okumak için kullanılan bir manometredir.`,
    ],
    body: ['Net ve dayanıklı göstergesiyle sistem basıncını doğru okumayı sağlar; şarj, kaçak tespiti ve performans kontrolünde kullanılır.'],
    close: ['Seçim; ölçüm aralığı, soğutucu akışkan skalası ve bağlantı tipine göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} ne için kullanılır?`, a: 'Soğutma sisteminin basıncını ölçmek için kullanılır; gaz şarjı, kaçak tespiti ve sistem performansının kontrolünde servis teknisyenine gösterge sağlar.' },
    ],
  },
  montaj: {
    label: 'montaj aksesuarı',
    intro: [
      (b, m) => `${b} ${m}, pano ve soğutma ekipmanlarının montajını tamamlayan bir aksesuar/bileşendir.`,
      (b, m) => `${b} ${m}, kurulum ve sabitleme işlerinde kullanılan orijinal uyumlu bir montaj aksesuarıdır.`,
    ],
    body: ['Doğru montaj aksesuarı, ekipmanın güvenli sabitlenmesini ve sızdırmaz/temiz bir kurulumu sağlar; sistemin uzun ömürlü çalışmasına katkı verir.'],
    close: ['Seçim; uyumlu olduğu ekipman modeli ve montaj ölçülerine göre yapılır.'],
    faq: (b, m) => [
      { q: `${b} ${m} nerede kullanılır?`, a: 'İlgili pano/soğutma ekipmanının kurulumunu ve güvenli sabitlenmesini tamamlamak için kullanılan bir montaj aksesuarıdır.' },
    ],
  },
};

// --- Kategori-duyarlı genel fallback (tip tanınmayan ince ürünler) ----------
const DOM_LABEL = {
  'rittal-yedek-parca': 'endüstriyel pano yedek parçası',
  'sistem-aksesuarlari': 'pano sistem aksesuarı',
  'pano-iklimlendirme': 'pano iklimlendirme bileşeni',
  'rittal-el-aletleri': 'endüstriyel montaj el aleti',
  'data-center': 'veri merkezi / IT altyapı bileşeni',
  'yedek-parca': 'soğutma sistemi yedek parçası',
  'diger-urunler': 'endüstriyel soğutma ürünü',
  fancoil: 'fan coil bileşeni',
  'chiller-sogutma': 'chiller / su soğutma bileşeni',
  'evaporatif-sogutma': 'evaporatif soğutma bileşeni',
  havalandirma: 'havalandırma bileşeni',
  aksesuarlar: 'sistem aksesuarı',
  otomasyon: 'otomasyon bileşeni',
};
function genericProfile(p) {
  const cl = (catName.get(p.pc) || 'ürün').toLowerCase();
  const dl = DOM_LABEL[p.dom] || 'endüstriyel soğutma ve iklimlendirme bileşeni';
  return {
    label: cl,
    intro: [
      (b, m) => `${b} ${m}, ${cl} kategorisinde yer alan bir ${dl}dir; endüstriyel soğutma ve iklimlendirme sistemlerinde kullanılır.`,
      (b, m) => `${b} ${m}, ${dl} olarak pano ve soğutma sistemlerinin güvenilir çalışmasına katkı sağlayan bir bileşendir.`,
    ],
    body: [
      'Dayanıklı yapısı ve model uyumuyla sistemin bütünlüğünü korur; orijinal/uyumlu parça kullanımı arıza riskini azaltır ve ekipman ömrünü uzatır.',
      'Endüstriyel kullanıma uygun tasarımıyla montaj ve bakım süreçlerini kolaylaştırır; doğru model seçimi sistemin kesintisiz çalışması için önemlidir.',
    ],
    close: [
      'Doğru ürün; uyumlu olduğu cihaz modeline ve teknik gereksinimlere göre seçilmelidir. Uygunluk kontrolü için teknik ekibimize danışabilirsiniz.',
    ],
    faq: (b, m) => [
      { q: `${b} ${m} nedir, nerede kullanılır?`, a: `${cl.charAt(0).toUpperCase() + cl.slice(1)} kategorisinde yer alan bir ${dl}dir; endüstriyel pano, soğutma ve iklimlendirme sistemlerinde ilgili işlevi görmek üzere kullanılır.` },
      { q: 'Doğru/uyumlu parçayı nasıl seçerim?', a: 'Uyumluluk, kullandığınız cihazın model ve seri numarasıyla doğrulanmalıdır. Emin değilseniz teknik ekibimiz doğru parça seçiminde yardımcı olur.' },
    ],
  };
}

function buildContent(p) {
  const key = detectType(p);
  const prof = key ? T[key] : genericProfile(p);
  const b = brandOf(p);
  const model = modelOf(p, prof.label);
  const seed = hash(p.s);
  const specs = extractSpecs(p);
  const parts = [];
  parts.push(pick(prof.intro, seed)(b, model));
  parts.push(pick(prof.body, seed >>> 3));
  if (specs.length) parts.push(`Ürün künyesinde öne çıkan değerler: ${specs.join(', ')}.`);
  parts.push(pick(prof.close, seed >>> 6));
  const ld = parts.filter(Boolean).join(' ');
  const faq = prof.faq(b, model, specs);
  const md = ld.slice(0, 155).replace(/\s+\S*$/, '') + (ld.length > 155 ? '…' : '');
  return { ld, faq, md, type: key || `genel:${p.dom}` };
}

// --- Çalıştır ---------------------------------------------------------------
const products = JSON.parse(fs.readFileSync(PRODUCTS, 'utf8'));

if (args.stats) {
  const byType = new Map();
  let n = 0;
  for (const p of products) {
    if (!thin(p)) continue;
    n++;
    const k = detectType(p) || `genel:${p.dom}`;
    byType.set(k, (byType.get(k) || 0) + 1);
  }
  console.log('İnce ürün:', n, '| tip sayısı:', byType.size);
  [...byType.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, c]) => console.log(String(c).padStart(5), k));
  process.exit(0);
}

const cat = args.cat;
const limit = args.limit ? Number(args.limit) : Infinity;
let candidates = products.filter((p) => (args.all || !cat ? true : p.pc === cat) && thin(p));
const total = candidates.length;
if (limit !== Infinity) candidates = candidates.slice(0, limit);

let changed = 0;
const samples = [];
for (const p of candidates) {
  const { ld, faq, md, type } = buildContent(p);
  samples.push({ n: p.n, s: p.s, type, before: p.ld || '', ld, faq });
  if (args.write) {
    p.ld = ld;
    p.md = md;
    p.rich = { ...(p.rich || {}), faq };
    changed++;
  }
}

if (args.write) {
  fs.writeFileSync(PRODUCTS, JSON.stringify(products));
  console.log(`YAZILDI: ${changed} ürün zenginleştirildi (${args.all ? 'TÜM ince' : cat}). Aday: ${total}.`);
} else {
  console.log(`KURU ÇALIŞMA — ${args.all ? 'TÜM ince' : cat || 'tümü'} | aday: ${total} | gösterilen: ${samples.length}\n`);
  for (const s of samples.slice(0, Number(args.show || 4))) {
    console.log('■', s.n, `[${s.type}]`);
    console.log('  SONRA:', s.ld);
    console.log('  FAQ:', s.faq.map((f) => f.q).join(' | '), '\n');
  }
}

if (args.review) {
  const md = [`# Zenginleştirme Örnekleri — ${args.all ? 'TÜM ince' : cat || 'tümü'}`, '', `Aday: **${total}**. İlk ${samples.length} örnek.`, ''];
  for (const s of samples) {
    md.push(`## ${s.n}  \n\`${s.type}\``);
    md.push(`**SONRA:** ${s.ld}`, '', '**FAQ:**');
    for (const f of s.faq) md.push(`- **S:** ${f.q}  \n  **C:** ${f.a}`);
    md.push('');
  }
  const rel = args.review === true ? 'zenginlestirme-ornek.md' : args.review;
  fs.writeFileSync(path.isAbsolute(rel) ? rel : path.join(ROOT, rel), md.join('\n'));
  console.log('Örnek dosyası yazıldı:', rel);
}
