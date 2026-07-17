// Klimasun ürün kataloğu (prototip verisi — placeholder).
// Gerçek envanter API'sine bağlanana kadar liste ve detay sayfaları bunu paylaşır.

export const PRODUCTS = [
  { code: 'MKP0240TH', name: 'MKS Clima MKP0240TH Pano Tipi Klima 240 W (Panel Montaj)', brand: 'MKS Clima', badge: 'Stoktan Teslim', cond: 'Sıfır' },
  { code: 'MKP0533TH', name: 'MKS Clima MKP0533TH Pano Tipi Klima 500 W (Panel Montaj)', brand: 'MKS Clima', badge: 'Stoktan Teslim', cond: 'Sıfır' },
  { code: 'MKP0833TH', name: 'MKS Clima MKP0833TH Pano Tipi Klima 800 W (Panel Montaj)', brand: 'MKS Clima', badge: 'Stoktan Teslim', cond: 'Sıfır' },
  { code: 'MKP2033TH', name: 'MKS Clima MKP2033TH Pano Tipi Klima 2.000 W (Panel Montaj)', brand: 'MKS Clima', badge: 'Stoktan Teslim', cond: 'Sıfır' },
  { code: 'MKP3033CH', name: 'MKS Clima MKP3033CH Pano Tipi Klima 3.000 W 3F (Panel Montaj)', brand: 'MKS Clima', badge: 'Stoktan Teslim', cond: 'Sıfır' },
  { code: 'SK 3302100', name: 'Rittal SK 3302100 Duvara Monte Pano Kliması (2.El) — 310 W', brand: 'RITTAL', badge: 'Stoktan Teslim', cond: '2.El' },
  { code: 'SK 3328500', name: 'Rittal SK 3328500 Yana Kapı / Panel Montajlı Pano Kliması (2.El) — 2.000 W', brand: 'RITTAL', badge: 'Stoktan Teslim', cond: '2.El' },
  { code: 'SK 3383100', name: 'Rittal SK 3383100 Tavan Montajlı Pano Kliması (2.El) — 1.000 W', brand: 'RITTAL', badge: 'Stoktan Teslim', cond: '2.El' },
  { code: 'SK 3304500', name: 'Rittal SK 3304500 Yana Kapı / Panel Montajlı Pano Kliması (2.El) — 1.000 W', brand: 'RITTAL', badge: 'Stoktan Teslim', cond: '2.El' },
  { code: '025LO2777-000', name: '025LO2777-000 Micro Opto PCB', brand: 'YORK', badge: 'Temin Edilebilir', cond: 'Sıfır' },
  { code: '031-01095-002', name: 'York Main Board 031-01095-002', brand: 'YORK', badge: 'Temin Edilebilir', cond: 'Sıfır' },
  { code: 'STF-02U1G3', name: 'Danfoss-Saginomiya STF-02U1G3 Dört Yollu Vana', brand: 'Danfoss', badge: 'Temin Edilebilir', cond: 'Sıfır' },
];

export const BRAND_COUNTS = [
  ['MKS Clima', 5],
  ['RITTAL', 3631],
  ['YORK', 89],
  ['Danfoss', 1401],
  ['Cosmotec', 386],
];

// Prototipte ayrıntısı tanımlı örnek ürün.
export const SAMPLE_DETAIL = {
  code: 'MKP3033CH',
  name: 'MKS Clima MKP3033CH Pano Tipi Klima 3.000 W 3F (Panel Montaj)',
  brand: 'MKS Clima',
  category: 'Pano Kliması',
  warranty: '2 Yıl',
  badge: 'STOKTAN TESLİM',
  description:
    "MKP3033CH, MKS Clima'nın 3.000 W net soğutma kapasiteli (A35-A35) üç fazlı 400 V panel montaj " +
    'pano tipi klimasıdır. R134a gaz, Aluzinc gövde, filtresiz autopulente kondenser ve dijital ' +
    'termostat ile ±1 °C hassasiyette çalışır. OG-AG ve enerji dağıtım panoları için tasarlanmıştır.',
  specs: [
    ['Net soğutma kapasitesi (A35-A35)', '3.000 W'],
    ['Besleme', '400 V / 3~ / 50 Hz'],
    ['Soğutucu akışkan', 'R134a'],
    ['Montaj tipi', 'Panel (yana/kapı) montaj'],
    ['Gövde', 'Aluzinc çelik'],
    ['Kondenser', 'Filtresiz, autopulente'],
    ['Termostat', 'Dijital, ±1 °C hassasiyet'],
    ['Koruma sınıfı (iç devre)', 'IP54'],
    ['Çalışma aralığı', '+20 °C … +55 °C'],
    ['Kullanım alanı', 'OG-AG ve enerji dağıtım panoları'],
  ],
  related: [
    { code: 'MKP2033TH', name: 'MKS Clima MKP2033TH Pano Tipi Klima 2.000 W' },
    { code: 'MKP2533CH', name: 'MKS Clima MKP2533CH Pano Tipi Klima 2.500 W 3F' },
    { code: 'SK 3328500', name: 'Rittal SK 3328500 Panel Montajlı Pano Kliması (2.El) — 2.000 W' },
    { code: 'SK 3304500', name: 'Rittal SK 3304500 Panel Montajlı Pano Kliması (2.El) — 1.000 W' },
  ],
};

export function findProduct(code) {
  return PRODUCTS.find((p) => p.code === code) || null;
}
