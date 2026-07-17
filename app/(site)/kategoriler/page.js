import Link from 'next/link';

export const metadata = {
  title: 'Kategoriler',
  description: '159 kategoride 9.799+ ürün — pano iklimlendirme, yedek parça, chiller ve daha fazlası.',
};

const CATS = [
  { icon: '⚙️', name: 'Yedek Parça', count: '4.222', subs: ['Valfler', 'Kompresörler', 'Borular & Bağlantı', 'Diğer Yedek Parça'] },
  { icon: '❄️', name: 'Pano İklimlendirme', count: '2.052', subs: ['Pano Kliması', 'Chiller Soğutma', 'IT Soğutma', 'Aksesuarlar'] },
  { icon: '🔧', name: 'RITTAL Yedek Parça', count: '1.404', subs: ['Aktif Bileşenler', 'Kontrol Elemanları', 'Fanlar', 'Sensörler'] },
  { icon: '🧩', name: 'Rittal Sistem Aksesuarları', count: '736', subs: ['Kablo Geçişleri', 'Kilit Sistemleri', 'Sistem Lambaları', 'Gözetleme Penceresi'] },
  { icon: '🧊', name: 'Chiller Soğutma', count: '248', subs: ['Su Soğutmalı Chiller', 'DCP Paket', 'Chiller / Proses', 'Free Cooling'] },
  { icon: '💨', name: 'Evaporatif Soğutma', count: '246', subs: ['FES Klima', 'FES Chill', 'Su Soğutma Kuleleri', 'Yedek Parça & Bakım'] },
  { icon: '🛠️', name: 'Rittal El Aletleri', count: '196', subs: ['Delme Aletleri', 'Vidalama Aletleri', 'Penseler'] },
  { icon: '♨️', name: 'FanCoil', count: '124', subs: ['Fan Coil Motorları', 'Fancoil Üniteleri', 'Termostatlar'] },
  { icon: '🖥️', name: 'Rittal Data Center', count: '105', subs: ['IT İzleme', 'DET-AC Söndürme', 'Kompakt BİM'] },
  { icon: '🍃', name: 'Havalandırma', count: '83', subs: ['Panel / Ön Filtre', 'HEPA / ULPA', 'Aktif Karbon', 'Hava Temizleme'] },
  { icon: '💧', name: 'Nem Kontrol', count: '49', subs: ['Nemlendirme', 'Nem Alma', 'Havuz Nem Alma'] },
  { icon: '♻️', name: '2.El Ürünler', count: '43', subs: ['Pano Kliması', 'Fanlar', 'Kontrol Kartları', 'Kompresörler'] },
  { icon: '🤖', name: 'Otomasyon', count: '42', subs: ['Sensörler & Anahtarlar', 'Termostatlar', 'Kontrolörler & Kartlar'] },
  { icon: '🌬️', name: 'Klimalar', count: '38', subs: ['Split / Duvar Tipi', 'Salon Tipi', 'Multi Split', 'Kaset Tipi'] },
  { icon: '🏢', name: 'Ticari İklimlendirme', count: '18', subs: ['WSHP Isı Pompası', 'Hassas Kontrollü', 'Kanal Tipi'] },
  { icon: '🌀', name: 'VRF Klimalar', count: '2', subs: ['VRF İç Üniteler', 'VRF Dış Üniteler'] },
];

export default function KategorilerPage() {
  return (
    <>
      <div className="ks-pagehero">
        <div className="ks-wrap">
          <div className="ks-crumb">
            <Link href="/">Ana Sayfa</Link> / <span className="ks-crumb-cur">Kategoriler</span>
          </div>
          <h1>Ürün Kategorileri</h1>
          <p>
            159 kategoride 9.799+ ürün. İhtiyacınız olan grubu seçin; alt kategorilerden doğrudan
            ürün listesine ulaşın.
          </p>
        </div>
      </div>

      <div className="ks-page-body">
        <div className="ks-grid-3">
          {CATS.map((c) => (
            <div className="ks-catcard" key={c.name}>
              <div className="ks-catcard-head">
                <span className="ks-catcard-ico">{c.icon}</span>
                <div>
                  <Link href="/urunler" className="ks-catcard-name">{c.name}</Link>
                  <div className="ks-catcard-count">{c.count} ürün</div>
                </div>
              </div>
              <div className="ks-subtags">
                {c.subs.map((s) => (
                  <Link href="/urunler" className="ks-subtag" key={s}>{s}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
