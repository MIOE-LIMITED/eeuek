// Blog/rehber içeriğinin tek kaynağı.
// Mevcut yazılar klimasun-2026/data/blog.json'dan gelir; yeni karşılaştırma/rehber
// yazıları (FAQ'lı, AEO/GEO odaklı) aşağıda GUIDES'ta tanımlanır.
// Şema: { s(slug), t(başlık), d(YYYY-MM-DD), cat, ic(emoji), ex(özet),
//         body(HTML), faq?[{q,a}], read?(dk) }

import EXISTING from '../klimasun-2026/data/blog.json';

const GUIDES = [
  {
    s: 'r404a-vs-r407c-sogutucu-akiskan-karsilastirma',
    t: 'R404A mı R407C mi? Soğutucu Akışkan Karşılaştırması ve Geçiş Rehberi',
    d: '2026-08-01',
    cat: 'Teknik Rehber',
    ic: '🧪',
    read: 7,
    ex: 'R404A ve R407C hangi sistemde kullanılır, GWP değerleri nedir ve F-Gaz kısıtları altında hangi düşük-GWP alternatife geçmelisiniz? Karşılaştırmalı rehber.',
    body: `<p>Soğutucu akışkan seçimi; sistemin verimini, yasal uygunluğunu ve işletme maliyetini doğrudan etkiler. R404A ve R407C, sahada en sık karşılaşılan iki HFC karışımıdır ancak farklı amaçlar için tasarlanmıştır. Bu rehber ikisini karşılaştırır ve F-Gaz kısıtları altında doğru geçiş akışkanını seçmenize yardımcı olur.</p>
<h2>Kısa cevap</h2>
<p><b>R404A</b> düşük ve orta sıcaklık <b>ticari soğutmada</b> (soğuk oda, market reyonu, şoklama) yaygındır. <b>R407C</b> ise ağırlıkla <b>klima ve orta sıcaklık</b> uygulamalarında, eski R22 sistemlerinin yerine kullanılır. En kritik fark <b>küresel ısınma potansiyelidir (GWP)</b>: R404A'nın GWP'si çok yüksektir ve F-Gaz mevzuatı bu akışkanı kademeli olarak kısıtlamaktadır.</p>
<h2>Karşılaştırma tablosu</h2>
<table>
<thead><tr><th>Özellik</th><th>R404A</th><th>R407C</th></tr></thead>
<tbody>
<tr><td>Tipik kullanım</td><td>Düşük/orta sıcaklık ticari soğutma</td><td>Klima, orta sıcaklık, R22 yerine</td></tr>
<tr><td>GWP (yaklaşık)</td><td>~3.922 (çok yüksek)</td><td>~1.774 (orta)</td></tr>
<tr><td>Sıcaklık kayması (glide)</td><td>Çok düşük (~0,5 K)</td><td>Yüksek (~7 K)</td></tr>
<tr><td>Karışım</td><td>R125/R143a/R134a</td><td>R32/R125/R134a</td></tr>
<tr><td>F-Gaz durumu</td><td>Kısıtlı — yeni sistemlerde önerilmez</td><td>Kullanımda, ancak uzun vadede düşük-GWP tercih edilir</td></tr>
</tbody>
</table>
<p><b>Not — glide:</b> R407C'nin yüksek sıcaklık kayması nedeniyle sistem şarjı <b>sıvı fazdan</b> yapılmalı ve kaçak sonrası tam boşaltıp yeniden şarj tercih edilmelidir; kısmi tamamlama karışım oranını bozar.</p>
<h2>F-Gaz ve düşük-GWP geçiş alternatifleri</h2>
<p>Yüksek GWP'li HFC'lerin kotası kademeli olarak düşürülmektedir; bu, R404A'nın fiyatını ve bulunabilirliğini olumsuz etkiler. Mevcut R404A sistemleri için yaygın <b>retrofit</b> alternatifleri:</p>
<ul>
<li><b>R448A / R449A</b> — GWP ~1.390; R404A'ya en yakın performansla düşük/orta sıcaklık soğutmada tercih edilir.</li>
<li><b>R407F / R407A</b> — orta sıcaklıkta R404A yerine kullanılabilen, daha düşük GWP'li seçenekler.</li>
</ul>
<p>Yeni kurulumlarda mümkünse baştan düşük-GWP akışkanla tasarım, uzun vadeli mevzuat ve maliyet riskini azaltır. Ayrıntılı F-Gaz yükümlülükleri için <a href="f-gaz-uyum-rehberi">F-Gaz uyum rehberimize</a> bakabilirsiniz.</p>
<h2>Nasıl seçmeli?</h2>
<p>Uygulama sıcaklığını (düşük/orta/klima), mevcut sistemin tasarım akışkanını ve F-Gaz uygunluğunu birlikte değerlendirin. Kaçak sonrası tamamlama mı yoksa retrofit mi gerektiğine karar vermek için sistem etiketini ve kompresör uyumunu kontrol edin.</p>`,
    faq: [
      { q: 'R404A yerine ne kullanılır?', a: 'Mevcut düşük/orta sıcaklık ticari soğutma sistemlerinde R404A yerine genellikle R448A veya R449A (GWP ~1.390) retrofit akışkanları kullanılır; bunlar benzer performansla çok daha düşük GWP sunar.' },
      { q: 'R404A ve R407C aynı sistemde birbirinin yerine kullanılabilir mi?', a: 'Hayır. Farklı basınç-sıcaklık özellikleri ve farklı glide değerleri vardır; sistem, kompresör ve genleşme elemanı belirli bir akışkana göre tasarlanır. Değişim ancak uygun retrofit prosedürü ve bileşen kontrolüyle yapılmalıdır.' },
      { q: 'R407C neden sıvı fazdan şarj edilir?', a: 'R407C yüksek sıcaklık kaymasına (glide) sahip bir karışım olduğu için gaz fazdan şarjda bileşenler farklı oranda buharlaşır ve karışım oranı bozulur. Doğru performans için şarj sıvı fazdan yapılır.' },
      { q: 'GWP neden önemli?', a: 'GWP, akışkanın atmosfere kaçması durumunda küresel ısınmaya katkısını gösterir. F-Gaz mevzuatı yüksek GWP\'li akışkanların kotasını düşürdüğü için yüksek GWP, hem çevresel hem de maliyet/bulunabilirlik açısından dezavantajdır.' },
    ],
  },
  {
    s: 'pano-sogutma-yontem-secimi-fan-esanjor-klima',
    t: 'Pano Soğutmada Doğru Yöntem: Filtreli Fan, Eşanjör ve Pano Kliması',
    d: '2026-07-25',
    cat: 'Teknik Rehber',
    ic: '🌡️',
    read: 8,
    ex: 'Elektrik panosunu soğutmanın üç yolu vardır: filtreli fan, hava/su eşanjörü ve pano kliması. Hangisi ne zaman doğru? Karar tablosuyla anlatıyoruz.',
    body: `<p>Bir elektrik panosunun içindeki sürücü, trafo ve kontrol bileşenleri çalışırken ısı üretir. Bu ısı uzaklaştırılmazsa pano iç sıcaklığı yükselir ve genel kural olarak <b>çalışma sıcaklığındaki her 10 °C artış elektroniğin ömrünü yarıya indirir</b>. Doğru soğutma yöntemi; ortam sıcaklığına, tesiste soğutma suyu olup olmamasına ve istenen koruma sınıfına göre değişir.</p>
<h2>Üç temel yöntem</h2>
<h3>1. Filtreli fan (fan + panjur)</h3>
<p>Serin dış havayı filtreden geçirerek pano içine alır, sıcak havayı dışarı atar. <b>Yalnızca dış ortam, hedef pano sıcaklığından daha serinse</b> işe yarar. En ekonomik çözümdür ancak filtre tozlandıkça verim düşer ve kapalı çevrim olmadığı için yüksek IP koruması sağlamaz.</p>
<h3>2. Hava/su eşanjörü</h3>
<p>Pano içindeki ısıyı, tesiste mevcut <b>soğutma suyuna</b> aktarır. Kompresör içermediği için düşük enerjiyle yüksek kapasite sunar ve sessizdir; ancak <b>soğutma suyu altyapısı</b> gerektirir.</p>
<h3>3. Pano kliması (kompresörlü soğutma ünitesi)</h3>
<p>Kapalı çevrimde kompresörlü soğutma yapar. <b>Dış ortam pano hedefinden sıcak olsa bile</b> soğutabilir; kapalı yapısı toz ve nem girişini engelleyerek yüksek IP korumasını korur. En esnek ama en yüksek enerjili çözümdür.</p>
<h2>Karar tablosu</h2>
<table>
<thead><tr><th>Durum</th><th>Önerilen yöntem</th></tr></thead>
<tbody>
<tr><td>Ortam pano hedefinden serin, ortam temiz</td><td>Filtreli fan</td></tr>
<tr><td>Tesiste soğutma suyu var, yüksek kapasite gerekli</td><td>Hava/su eşanjörü</td></tr>
<tr><td>Ortam sıcak/tozlu, yüksek IP koruması şart</td><td>Pano kliması</td></tr>
</tbody>
</table>
<h2>Kapasiteyi doğru seçin</h2>
<p>Yöntem hangisi olursa olsun, doğru boyutlandırma kritik. Isı yükü hesabı ve adım adım seçim için <a href="pano-klimasi-nasil-secilir">Pano Kliması Nasıl Seçilir</a> ve <a href="pano-ici-isi-yuku">Pano İçi Isı Yükü</a> rehberlerimizi inceleyin. Ürünler için <a href="/kategori/pano-iklimlendirme">Pano İklimlendirme</a> kategorisine bakabilirsiniz.</p>`,
    faq: [
      { q: 'Pano kliması mı filtreli fan mı?', a: 'Dış ortam panonun hedef sıcaklığından serin ve temizse filtreli fan ekonomiktir. Ortam sıcak/tozluysa veya yüksek IP koruması gerekiyorsa, kapalı çevrimli ve kompresörlü pano kliması doğru seçimdir.' },
      { q: 'Hava/su eşanjörü ne zaman mantıklı?', a: 'Tesiste hazır soğutma suyu (chiller veya proses suyu) varsa mantıklıdır; kompresör içermediği için düşük enerjiyle yüksek kapasiteli ve sessiz pano soğutması sağlar.' },
      { q: 'Filtreli fan neden her zaman yeterli değil?', a: 'Filtreli fan dış havayı içeri aldığı için yalnızca dış ortam hedeften serinse soğutur; sıcak yaz gününde pano içini hedefin altına indiremez. Ayrıca kapalı çevrim olmadığından toz/nem girer ve IP koruması düşer.' },
    ],
  },
  {
    s: 'kompresor-secimi-scroll-yari-hermetik-vidali',
    t: 'Kompresör Seçimi: Scroll, Yarı Hermetik Pistonlu ve Vidalı Karşılaştırması',
    d: '2026-07-18',
    cat: 'Teknik Rehber',
    ic: '⚙️',
    read: 7,
    ex: 'Scroll, yarı hermetik pistonlu ve vidalı kompresörler hangi kapasitede ve uygulamada doğru? Verim, servis ve seçim kriterleriyle karşılaştırma.',
    body: `<p>Kompresör, soğutma çevriminin kalbidir ve sistemin verimini, ses seviyesini ve servis maliyetini belirler. Doğru tip seçimi; gereken kapasiteye, uygulama sıcaklığına ve bakım beklentisine bağlıdır.</p>
<h2>Tipler ve tipik kullanım</h2>
<h3>Scroll kompresör</h3>
<p>Az hareketli parçası sayesinde <b>verimli ve sessizdir</b>. Klima ve orta sıcaklık ticari soğutmada, genellikle küçük-orta kapasitelerde yaygındır. Hermetik yapısı bakım gerektirmez ancak arızada komple değişir.</p>
<h3>Yarı hermetik pistonlu kompresör</h3>
<p><b>Servis edilebilir</b> yapısıyla öne çıkar; valf, segman ve conta gibi parçaları değiştirilebilir. Düşük ve orta sıcaklıkta geniş bir kapasite aralığını kapsar; soğuk oda ve proses soğutmada tercih edilir.</p>
<h3>Yarı hermetik vidalı kompresör</h3>
<p><b>Yüksek kapasiteli</b> uygulamalar için tasarlanmıştır. Sürekli çalışan büyük soğutma ve iklimlendirme sistemlerinde, kısmi yükte iyi verim ve düşük titreşim sunar.</p>
<h2>Karşılaştırma tablosu</h2>
<table>
<thead><tr><th>Kriter</th><th>Scroll</th><th>Yarı Hermetik Pistonlu</th><th>Vidalı</th></tr></thead>
<tbody>
<tr><td>Kapasite aralığı</td><td>Küçük–orta</td><td>Orta–büyük</td><td>Büyük</td></tr>
<tr><td>Servis edilebilirlik</td><td>Düşük (hermetik)</td><td>Yüksek</td><td>Orta–yüksek</td></tr>
<tr><td>Ses/titreşim</td><td>Düşük</td><td>Orta</td><td>Düşük</td></tr>
<tr><td>Tipik uygulama</td><td>Klima, market soğutma</td><td>Soğuk oda, proses</td><td>Büyük proses, endüstriyel</td></tr>
</tbody>
</table>
<h2>Seçim kriterleri</h2>
<p>Gerekli soğutma kapasitesini, buharlaşma/yoğuşma sıcaklıklarını (uygulama tipini) ve kullanılan <a href="r404a-vs-r407c-sogutucu-akiskan-karsilastirma">soğutucu akışkanla</a> uyumu birlikte değerlendirin. Sürekli çalışan büyük sistemlerde kısmi yük verimi; küçük sistemlerde ses ve ilk maliyet öne çıkar. Ürünler için <a href="/kategori/yedek-parca/kompresorler">Kompresörler</a> kategorisine bakabilirsiniz.</p>`,
    faq: [
      { q: 'Scroll mu yarı hermetik pistonlu kompresör mü?', a: 'Klima ve orta sıcaklık soğutmada, küçük-orta kapasitede, sessiz ve verimli çalışma için scroll tercih edilir. Düşük sıcaklık, geniş kapasite ve servis edilebilirlik gerekiyorsa yarı hermetik pistonlu daha uygundur.' },
      { q: 'Vidalı kompresör ne zaman gerekir?', a: 'Yüksek kapasiteli, sürekli çalışan büyük endüstriyel soğutma ve iklimlendirme sistemlerinde; kısmi yükte iyi verim ve düşük titreşim gereken uygulamalarda vidalı kompresör tercih edilir.' },
      { q: 'Kompresör seçiminde en önemli kriter nedir?', a: 'Gerekli soğutma kapasitesi ile uygulama sıcaklıkları (buharlaşma/yoğuşma) ve kullanılan soğutucu akışkanla uyum en kritik kriterlerdir; bunlar tip ve model seçimini belirler.' },
    ],
  },
];

function toTime(d) {
  const [y, m, day] = String(d).split('-').map(Number);
  return (y || 0) * 372 + (m || 0) * 31 + (day || 0); // Date.now() yok; sıralama için yeterli
}

export const POSTS = [...GUIDES, ...EXISTING].sort((a, b) => toTime(b.d) - toTime(a.d));
export const bySlug = (slug) => POSTS.find((p) => p.s === slug) || null;

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
export function trDate(d) {
  const [y, m, day] = String(d).split('-').map(Number);
  return `${day} ${AYLAR[(m || 1) - 1]} ${y}`;
}
