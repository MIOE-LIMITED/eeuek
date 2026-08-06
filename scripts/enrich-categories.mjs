// Kategori hub sayfalarına özgün SEO/AEO intro metni üretir.
// intro -> hem kategori sayfasında <p> hem meta description (ilk 155 krktr).
// Düz metin (sayfa React ile escape eder). Fiyat/stok iddiası yok, uydurma yok.
//
// Kullanım:
//   node scripts/enrich-categories.mjs            (kuru — ilk 12 örnek)
//   node scripts/enrich-categories.mjs --all      (tüm intro'ları göster)
//   node scripts/enrich-categories.mjs --write     (categories.json'a yaz)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'klimasun-2026/data/categories.json');
const args = new Set(process.argv.slice(2));

function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h >>> 0; }
const pick = (a, s) => a[((s >>> 0) % a.length + a.length) % a.length];
const trNum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// [regex, tanım (ne olduğu), uygulama/fayda]
const FAM = [
  [/pano ısıt|pano isıt|ısıtıcı|isitici|heater/i, 'pano ve ekipmanlarda yoğuşmayı önleyen elektrikli ısıtıcılar', 'düşük sıcaklık ve nemli ortamlarda elektroniklerin güvenli çalışmasını sağlar'],
  [/pano klima|enclosure ac|pano tipi klima/i, 'elektrik panolarını içten soğutan kapalı çevrim pano klimaları', 'tozlu ve sıcak ortamlarda pano içi sıcaklığı sabit tutarak elektronikleri korur'],
  [/peltier|termoelektrik/i, 'küçük panolar için kompakt termoelektrik soğutucular', 'düşük ısı yüklü, dar hacimli panolarda sessiz soğutma sağlar'],
  [/chiller|su soğut|proses su|ısı pompas|oil cooler|yağ chiller|free cooling/i, 'proses ve makine soğutması için chiller ve su soğutma üniteleri', 'soğutma sıvısını sabit sıcaklıkta tutarak makine ve proseslerin kararlı çalışmasını sağlar'],
  [/it soğut|data ?center|it izleme|bilgi işlem|yangın alarm|det-ac/i, 'sunucu ve veri merkezi kabinleri için soğutma ve izleme çözümleri', 'yüksek yoğunluklu IT ekipmanının kesintisiz ve güvenli çalışmasını destekler'],
  [/filtre fan|çevre havası|filtreli|panjur/i, 'pano havalandırması için filtreli fan ve panjur çözümleri', 'serin dış havayı filtreleyerek pano içine alır, ısı dengesini korur'],
  [/fan coil motor|fancoil|fan coil/i, 'fan coil üniteleri ve yedek bileşenleri', 'ısıtma-soğutmada mahal iklimlendirmesi için verimli çözüm sunar'],
  [/valf|vana|solenoid|selenoid/i, 'soğutma devrelerinde akışı kontrol eden valf ve vanalar', 'akışkanın yönünü ve geçişini yöneterek sistemin güvenli çalışmasını sağlar'],
  [/genleşme|genlesme|expansion/i, 'evaporatöre kontrollü besleme yapan genleşme valfleri', 'aşırı kızdırmayı ayarlayarak soğutma verimini ve kararlılığını belirler'],
  [/kompres/i, 'soğutma çevriminin kalbi olan kompresörler', 'soğutucu akışkanı sıkıştırıp dolaştırarak soğutma çevrimini çalıştırır'],
  [/kurutucu|drayer|dryer/i, 'devredeki nem ve partikülleri tutan kurutucu filtreler', 'korozyon ve tıkanmayı önleyerek kompresör ömrünü uzatır'],
  [/gözetleme cam|sight glass/i, 'soğutucu akışkan ve nem durumunu gösteren gözetleme camları', 'devredeki akışkan seviyesi ve nem varlığının görsel kontrolünü sağlar'],
  [/ısı değiştir|isi degistir|eşanjör|esanjor|kondens|evapor|heat exchang/i, 'soğutma sistemlerinde ısı transferini sağlayan eşanjör, kondenser ve evaporatörler', 'akışkanlar arasında verimli ısı aktarımıyla soğutma performansını belirler'],
  [/drenaj|pompa|pump/i, 'yoğuşma suyu ve soğutma sıvısı için pompalar', 'suyu devrede dolaştırarak ısı taşınmasını ve tahliyesini sağlar'],
  [/marş|mars|çalıştırma kit|start/i, 'motor ve kompresörler için marş / çalıştırma kitleri', 'motorun güvenli yol almasını sağlayan röle ve kapasitör setleri sunar'],
  [/transformat|trafo/i, 'kontrol ve besleme devreleri için transformatörler', 'gerilim dönüşümüyle kartların ve yardımcı devrelerin güvenli beslenmesini sağlar'],
  [/kart|elektronik|display|pcb|kumanda set|akıllı kart/i, 'cihaz kumandası için kontrol ve güç kartları', 'arızalı kartın uyumlu parçayla değişimi hızlı ve ekonomik onarım sağlar'],
  [/sıcaklık.*basınç|termostat|presostat|switch|anahtar|sensör|sensor|izleme/i, 'sıcaklık, basınç ve akışı izleyen kontrol ve algılama elemanları', 'sistemi güvenli sınırlarda tutarak arıza ve aşırı yükten korur'],
  [/gaz algıla|kaçak tespit|kacak tespit|leak/i, 'gaz algılama ve kaçak tespit sistemleri', 'soğutucu akışkan kaçaklarını erken tespit ederek güvenliği ve iş sürekliliğini artırır'],
  [/soğutucu akışkan|soğutucu gaz|refriger|gaz\b/i, 'soğutma sistemleri için soğutucu akışkanlar (gaz)', 'buharlaşıp yoğuşarak ısı taşır; doğru akışkan seçimi verimi belirler'],
  [/kaynak|lehim|braz/i, 'bakır hat birleştirme için kaynak ve lehim malzemeleri', 'soğutucu akışkan hatlarında sızdırmaz ve dayanıklı bağlantı sağlar'],
  [/boru|bağlant|baglant|fitings|rakor/i, 'bakır boru, rakor ve bağlantı elemanları', 'soğutucu akışkan hatlarının sızdırmaz ve güvenli montajını sağlar'],
  [/fan motor|türbin|turbin|\bfan\b|blower|aksiyal|radyal/i, 'soğutma ve havalandırma için fanlar ve fan motorları', 'pano ve cihazlarda ısıyı uzaklaştıracak hava hareketini sağlar'],
  [/kablo geçiş|kablo giriş|gland/i, 'panoya sızdırmaz kablo girişi için kablo geçiş elemanları', 'panonun IP korumasını korurken kabloları düzenli ve güvenli döşer'],
  [/kilit|menteşe|mentese|kapı iç|handle|kol sistem/i, 'pano kapı güvenliği için kilit, kol ve menteşe sistemleri', 'kapının güvenli, sızdırmaz kapanmasını ve erişim kontrolünü sağlar'],
  [/sistem lamba|lamba|aydınlat|light/i, 'pano içi aydınlatma için sistem lambaları', 'montaj, bakım ve arıza tespitinde net görüş sağlar'],
  [/gözetleme pencere|pencere|window/i, 'pano içini kapatmadan izlemek için gözetleme pencereleri', 'göstergelerin panoyu açmadan güvenli okunmasını sağlar'],
  [/topraklama|emc|earth/i, 'elektriksel güvenlik ve EMC için topraklama bileşenleri', 'panoda güvenli topraklama ve elektromanyetik uyumluluğu destekler'],
  [/sinyal kolon|signal|uyarı/i, 'görsel ve sesli uyarı için sinyal kolonları', 'makine ve proses durumunu uzaktan görünür kılar'],
  [/arayüz|arayuz|interface/i, 'veri ve güç bağlantısı için arayüz elemanları', 'pano dışına düzenli ve korumalı bağlantı noktaları sağlar'],
  [/el alet|delme|vidalama|pense|tornavida|alet çanta|tool/i, 'pano montajı için profesyonel el aletleri', 'delme, vidalama ve kablolama işlerinde hassas, güvenli çalışma sağlar'],
  [/evaporatif|fes|adyabat|soğutma kule|feschill/i, 'evaporatif ve adyabatik soğutma cihaz ve yedekleri', 'suyun buharlaşmasıyla düşük enerjili, ekonomik soğutma sağlar'],
  [/nemlendir|humidif/i, 'ortam nemini artıran nemlendirme cihazları', 'üretim ve depolama alanlarında hedef nem seviyesini korur'],
  [/nem alma|dehumidif|nem kontrol/i, 'ortam nemini düşüren nem alma cihazları', 'yoğuşma, küf ve korozyon riskini azaltarak ortamı korur'],
  [/hepa|ulpa|torba|panel|aktif karbon|kartuş|ffu|hava temiz|hava kalite|filtre kas|metal.*filtre|filtre/i, 'havalandırma ve temiz oda için hava filtreleri', 'partikül ve gazları tutarak istenen hava kalitesini sağlar'],
  [/hrv|ısı geri kazan|ahu|santral|rooftop|çatı tipi|paket klima/i, 'havalandırma ve ısı geri kazanım üniteleri', 'taze hava sağlarken enerji geri kazanımıyla verimi artırır'],
  [/split|kaset|kanal|salon|multi|portatif|duvar tipi|yer.*tavan|vrf|ısı pompas/i, 'konfor ve ticari iklimlendirme klimaları', 'mahal ısıtma-soğutmasında verimli ve sessiz çözüm sunar'],
  [/precision|hassas kontrol|wshp|q-ton|ticari/i, 'ticari ve hassas kontrollü iklimlendirme sistemleri', 'sürekli ve hassas sıcaklık-nem kontrolü gereken alanlarda kullanılır'],
  [/duman|ısı tahliye|isi tahliye|kapak/i, 'duman ve ısı tahliye kapak sistemleri', 'yangında dumanı tahliye ederek can ve mal güvenliğini destekler'],
  [/aydınlat|ışıklık|isiklik|ışık tüp|polikarbon|dogal/i, 'çatı ışıklıkları ve doğal aydınlatma çözümleri', 'gün ışığını içeri alarak aydınlatma enerjisini azaltır'],
  [/gaz algıla|kaçak tespit|leak/i, 'gaz algılama ve kaçak tespit sistemleri', 'soğutucu akışkan kaçaklarını erken tespit ederek güvenliği artırır'],
  [/motorlu vana|aktüatör|aktuator|damper|kontrolör|otomasyon|sunucu|ağ geçidi/i, 'bina ve proses otomasyonu bileşenleri', 'vana, damper ve kontrolörlerle sistemlerin otomatik yönetimini sağlar'],
  [/filtrasyon|sunvia|duman.*tahliye/i, 'filtrasyon ve özel çözüm ürünleri', 'endüstriyel tesislerde özel ihtiyaçlara yönelik ürünler sunar'],
  [/kimyasal/i, 'soğutma sistemleri için kimyasal bakım ürünleri', 'temizlik, koruma ve kaçak tespiti gibi bakım işlemlerini destekler'],
  [/servis ekipman|aksesuar|montaj|cover|kapak/i, 'montaj ve servis için ekipman ve aksesuarlar', 'kurulum ve bakım süreçlerini kolaylaştıran tamamlayıcı ürünler sunar'],
];

function fam(name) {
  for (const [re, d, u] of FAM) if (re.test(name)) return { d, u };
  return { d: 'endüstriyel soğutma ve iklimlendirme ürünleri', u: 'pano ve soğutma sistemlerinde güvenilir çözümler sunar' };
}

function introFor(node, parentName) {
  const { d, u } = fam(node.name + ' ' + (node.slug || ''));
  const seed = hash(node.slug || node.name);
  const cnt = node.count > 0 ? `${trNum(node.count)} ürün/model` : 'geniş bir ürün yelpazesi';
  const kids = (node.children || []).filter((c) => c.count > 0).slice(0, 4).map((c) => c.name);
  const kidHint = kids.length ? ` ${kids.join(', ')} gibi alt gruplarla` : '';
  const openers = [
    `${node.name}, ${d} kategorisidir; ${u}.`,
    `${node.name} kategorisinde ${d} bulunur — ${u}.`,
    `${node.name}: ${d}. ${u.charAt(0).toUpperCase() + u.slice(1)}.`,
  ];
  const bodies = [
    ` Klimasun kataloğunda${kidHint} ${cnt} yer alır; doğru ürünü seçmek için teknik ekibimizden destek alabilirsiniz.`,
    ` Klimasun'da bu kategoride ${cnt} listelenir${kids.length ? ` (${kids.join(', ')}…)` : ''}; uygun model için teklif sepetine ekleyin, teknik seçimde yardımcı olalım.`,
    ` Bu sayfada${kidHint} ${cnt} bulabilir, ihtiyacınıza uygun modeli teknik desteğimizle belirleyebilirsiniz.`,
  ];
  return pick(openers, seed) + pick(bodies, seed >>> 5);
}

const cats = JSON.parse(fs.readFileSync(FILE, 'utf8'));
let n = 0;
const samples = [];
for (const top of cats.tree) {
  const ti = introFor(top, null);
  samples.push([top.name, top.count, ti]);
  if (args.has('--write')) top.intro = ti;
  n++;
  for (const ch of top.children || []) {
    const ci = introFor(ch, top.name);
    samples.push(['  ' + ch.name, ch.count, ci]);
    if (args.has('--write')) ch.intro = ci;
    n++;
  }
}

if (args.has('--write')) {
  fs.writeFileSync(FILE, JSON.stringify(cats));
  console.log(`YAZILDI: ${n} kategoriye intro eklendi.`);
} else {
  const show = args.has('--all') ? samples : samples.slice(0, 12);
  for (const [name, cnt, intro] of show) {
    console.log(`\n▸ ${name} (${cnt})`);
    console.log('  META(155):', intro.slice(0, 155));
    console.log('  TAM:', intro);
  }
  console.log(`\nToplam kategori: ${n}`);
}
