# dihateknik.com — Kaynak Envanteri (index türevi)

> **Yöntem/uyarı:** Kaynak site bu ortamın çıkış (egress) politikasıyla **bloklu**
> olduğundan **canlı taranamadı**. Aşağıdaki envanter, arama motoru index'inden
> (WebSearch) sistematik sorgularla derlenmiştir → **yaklaşık**tır; sayımlar kesin
> değildir, kategori kapsamı temsilîdir. Tam/kesin envanter için doğrudan erişim
> ya da dışa aktarım gerekir (bkz. `DIHATEKNIK-AKTARIM-KURALLARI.md` §8).

## Platform gerçekleri

- **Altyapı:** OpenCart (URL izleri: `index.php?route=product/category&path=…`, `manufacturer_id=…`).
- **Ölçek:** ~**11.000** ürün, **200+** marka ("Türkiye'nin Soğutma Marketi").
- **URL kalıpları:**
  - Ürün (yeni): `/<slug>-P<id>` — ör. `/dorin-h-405-cc-yari-hermetik-kompresor-P54528`
  - Ürün (eski): `/<kategori>/<id>-<slug>-<barkod>.html` — ör. `/hermetik-kompresorler/2630-embraco-njx-2215-us-8680026306601.html`
  - Kategori: `/<id>-<slug>` (ör. `/17-rotary-kompresorler`) veya adlandırılmış (`/fitings/`, `/kapasitor/`)
  - Marka: `/marka/<marka>/` (+ `?s=<sıralama>&p=<sayfa>&category=<id>`)
- **Barkod:** Eski ürün URL'lerinde EAN barkod var (8680…) → **dedup için güçlü anahtar** (kod `c` yanında ikinci eşleştirici).

---

## Kategori Envanteri → Hedef Eşleme + Dedup Verdikti

| # | Kaynak ürün ailesi (gözlenen alt tipler) | Hedef ana → alt kategori | Bizde karşılığı | Verdikt (§6) |
| --- | --- | --- | --- | --- |
| 1 | **Kompresörler** — Scroll, Hermetik Pistonlu, Rotary, Yarı Hermetik, Yarı Hermetik Vidalı, Açık Tip, Oto/Buzdolabı motoru | Yedek Parça → `kompresorler` | ~647 ürün var | ✅ mevcut/benzer güçlü |
| 2 | **Genleşme vanaları** — Termostatik, Elektronik (TF410W vb.) | Yedek Parça → `genlesme-vanalari` | ~339 var | ✅ güçlü |
| 3 | **Solenoid / akış kontrol vanaları** (EVR25 vb.) | Yedek Parça → `valfler` | ~744 var | ✅ güçlü |
| 4 | **Kurutucu filtreler (Drayer)** — Çelik, Bakır | Yedek Parça → `kurutucu-filtreler-drayer` | ~266 var | ✅ güçlü |
| 5 | **Gözetleme camları** | Yedek Parça → `valfler`/`diger-bilesenler` | var | ✅ |
| 6 | **Soğutucu akışkan/gaz** — R134a, R404A, R410A, R22, R407C, R1234yf | Yedek Parça → `sogutucu-akiskanlar` | ~100 var | ✅ + SEO fırsatı |
| 7 | **Soğutucu/kompresör yağı, yağ ayırıcı, yağ tutucu** | Yedek Parça → `sogutucu-akiskanlar`/`diger-bilesenler` | var | ✅ |
| 8 | **Fanlar** — Aksiyel, Radyal, Plug/EC Plug (ebmpapst), Yuvarlak Kanal, Aspiratör | Yedek Parça → `fan-motorlari-turbinler` **/** Havalandırma | ~244 + Havalandırma(83) | ✅ güçlü |
| 9 | **Isı eşanjörleri** — Plakalı (Alfa Laval vb.) | Chiller Soğutma / Yedek Parça → `diger-bilesenler` | Chiller(248) | ✅ |
| 10 | **Termostat / Presostat / Sıcaklık-Basınç kontrol** — Mekanik, Dijital | Yedek Parça → `sicaklik-basinc-kontrol` | ~132 var | ✅ güçlü |
| 11 | **Manometreler** — Gliserinli (Refco MR-406 vb.) | Yedek Parça → `sicaklik-basinc-kontrol`/`servis-ekipmanlari` | var | ✅ |
| 12 | **Kapasitörler** | Yedek Parça → `otomasyon-kont…`/`diger-bilesenler` | var | ✅ |
| 13 | **Rezistanslar** — Fişek, Çubuk, Endüstriyel | Yedek Parça → `diger-bilesenler` | kısmi | ⚠️ fırsata bağlı |
| 14 | **Fitings / bakır bağlantı** — Dirsek, Manşon, Kör Tapa, Rakor, Pirinç | Yedek Parça → `borular-baglanti` | ~498 var | ✅ güçlü |
| 15 | **İzolasyonlu/bakır borular, kaynak telleri** | Yedek Parça → `borular-baglanti`/`servis-ekipmanlari` | var | ✅ |
| 16 | **Nem kontrol / Frigoduman** | Nem Kontrol | ~49 var | ✅ |
| 17 | **Servis ekipmanı** — Geri toplama cihazı, vakum, şarj | Yedek Parça → `servis-ekipmanlari` | ~143 var | ✅ |
| 18 | **Klima montaj kiti / aksesuar** | Diğer Ürünler / Klimalar | kısmi | ⚠️ fırsata bağlı |
| 19 | Eşleşmeyen / belirsiz | Diğer Ürünler (son çare) | — | ⛔ default: alma |

**Sonuç:** Kaynak katalog **ağırlıklı olarak bizim "Yedek Parça" ağacımızla örtüşüyor**
(satır 1–8, 10–15, 17 → hepsinde mevcut/benzer var). Bu, dedup + fırsat filtresinin
**yeşil** olduğu bölge; katalog derinleştirme için en değerli aday havuzu burası.

---

## Marka Envanteri (gözlenen)

Danfoss, Bitzer, Dorin, Embraco, Copeland, Bock, Aspera, Bristol, Cubigel, Zingfa,
Mitsubishi, Daikin, Hitachi, LG, Panasonic, Samsung, Toshiba, Ebmpapst, Friterm,
Refco, Errecom, Hongsen, SRMtec, Kayites, Teknik Isısan, AFS, Frigoduman …

> **Onay kapısı:** Bu markalar üründe `bn` etiketi olarak taşınır ama **markalar
> sayfasında yalnızca `lib/visible-brands.json`'a eklenen onaylı markalar görünür**
> (mevcut `build-catalog.mjs` davranışı). Yeni marka görünürlüğü **ayrı onay** ister.

---

## Kapsam / Boşluk Analizi (bizim katalog vs kaynak)

- **Örtüşen çekirdek:** Kompresör, vana, filtre, gaz/yağ, fan, kontrol/termostat,
  fitings → her iki katalogda da güçlü. Burada iş = **dedup** (kopya sayfa üretme,
  mevcut sayfayı zenginleştir) + **boşluk doldurma** (bizde olmayan model kodları).
- **Bizde güçlü, kaynakta zayıf:** Rittal ekosistemi (pano iklimlendirme, data center,
  el aletleri, sistem aksesuarları — ~4.500 ürün). Kaynaktan buraya katkı beklenmez.
- **Kaynakta olası fırsat:** Belirli marka/model kompresör, gaz ve fan model kodları
  (yüksek arama hacmi, net teknik terim) — bizde eşleniği yoksa özgün sayfa fırsatı.

---

## Önerilen İlk Ölçekli Parti (veri erişimi çözülünce)

1. **Kompresörler** (aile #1) — en yüksek örtüşme + arama hacmi; dedup en anlamlı.
2. **Soğutucu akışkan/gaz** (aile #6) — net model kodları, güçlü SEO/AEO fırsatı.
3. **Genleşme + solenoid vanalar** (aile #2–3) — bol model kodu, düşük belirsizlik.

Her partide akış: aday çıkar → **dedup/fırsat filtresi** → **özet tablo (onay)** →
`products.json` + filigransız görsel (varsa) → `npm run build` → yayın.
Ana sayfa/marka değişikliği **ayrı onay**.
