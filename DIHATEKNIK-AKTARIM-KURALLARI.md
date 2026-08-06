# dihateknik.com Ürün Aktarımı — Sabit Kurallar & Yöntem

Bu doküman, dihateknik.com kaynaklı ürünlerin **görselleriyle çekilip işlenmesi**
sürecinde **her seferinde otomatik uygulanacak sabit kuralları**, kaynak sitenin
yapısının **bizim katalog yapımıza eşlenmesini** ve **teknik aktarım yöntemini**
tanımlar. Amaç: kopya olmadan, özgün ve SEO/AEO/GEO güçlü, telif/marka riski
taşımayan, onaydan geçmeden yayına girmeyen bir katalog büyütme akışı.

> Bu kurallar, projenin mevcut yaklaşımıyla **birebir tutarlıdır**: katalog üretimi
> zaten fiyat/tedarik verisini gizler, yalnızca **onaylı markaları** listeler ve
> telif/marka riskini sınırlamak üzere tasarlanmıştır
> (bkz. `scripts/build-catalog.mjs`).

---

## 1. Sabit Kurallar (her turda otomatik)

| # | Kural | Uygulama (teknik karşılık) |
| --- | --- | --- |
| 1 | **Kategori + filtre yapısını bizim yapımıza uyarla** | Kaynak kategorileri, mevcut 21 ana + alt kategori ağacına (`data/categories.json`) eşle; yeni kategori uydurma. Bkz. §3. |
| 2 | **Açıklamalar özgün (kopya yok), SEO/AEO/GEO güçlü** | `sd` (kısa) ve `ld` (uzun) alanları sıfırdan yazılır; kaynaktan cümle kopyalanmaz. AEO için soru-cevap/öne-çıkan-özet, GEO için net teknik künye. Bkz. §4. |
| 3 | **Kaynak adı yok** | "dihateknik" / kaynak site adı hiçbir alanda (ad, açıklama, dosya adı, alt-metin, commit) geçmez. |
| 4 | **Fiyat yok** | `pr: ""` ve `prc: null`. Fiyat/teklif/alış verisi hiçbir yere yazılmaz. |
| 5 | **Asla "Stokta" değil** | `st: "Stokta Yok"`. Yeni aktarılan ürün asla stoklu işaretlenmez (yalnız Egem/Zoho stok kaynağı stok verebilir). |
| 6 | **Watermark'lı görsel yok** | Üzerinde kaynak logosu/filigranı olan görsel alınmaz. Temiz, filigransız, tercihen beyaz zemin ürün görseli; yoksa görselsiz bırak. Bkz. §5. |
| 7 | **Dedup + fırsat filtresi** | Katalogda **mevcut/benzer** yoksa **ve** net bir **SEO fırsatı** yoksa **işleme**. Bkz. §6. |
| 8 | **Onaysız yayın yok** | Ana sayfa ve markalar sayfasına onay olmadan hiçbir şey eklenmez. Akış: **önce özet → onay → sonra yayın**. Bkz. §7. |
| 9 | **İlk tur = tüm siteyi dökme** | Önce yapı çıkarılır, kategori/ürün envanteri ve **1–2 örnek ürünle yöntem** onaylatılır, **sonra** ölçeklenir. |

---

## 2. Kaynak Sitenin Yapısı (WebSearch ile çıkarıldı)

> Not: Site, bu ortamın **çıkış (egress) politikasıyla bloklu** olduğundan doğrudan
> taranamadı; yapı, arama motoru index'inden çıkarıldı. Tam veri/görsel çekimi için
> bkz. §8 (Engel & İlerleme Seçenekleri).

- **Tür:** Soğutma/iklimlendirme yedek parça & ekipman e-ticareti ("Soğutma Marketi"), ~11.000 ürün.
- **URL kalıpları:**
  - Ürün: `/<slug>-P<id>` — örn. `/bitzer-4pes-12y-...-P53594`, `/dorin-h-405-cc-...-P54528`
  - Kategori: `/<id>-<slug>` — örn. `/17-rotary-kompresorler`, `/83-geri-toplama-cihazi`; ayrıca adlandırılmış sayfalar (`/fitings/`, `/kapasitor/`, `/fan-2/`)
  - Marka: `/marka/<marka>/` — örn. `/marka/errecom/`, `/marka/mitsubishi/`, `/marka/kayites/`
- **Gözlenen kategori aileleri:** Kompresörler (Scroll, Hermetik Pistonlu, Rotary, Yarı Hermetik, mini rotary, buzdolabı/oto-klima motoru), Fanlar (Plug, Radyal, EC Plug, Aksiyal, aspiratör/havalandırma), Genleşme Vanaları, Kurutucu Filtreler (Drayer), Soğutucu Akışkanlar (gaz) & Yağlar, Kapasitör, Fitings (bakır bağlantı), Manometreler, Isıtıcı Rezistans, Yağ Ayırıcılar, Titreşim Önleyiciler, Kılcal Boru, Presostat/Basınç Kontrol, Akış Switch, Isı Eşanjörleri, Drenaj Pompası, Kaynak Telleri, Chiller Kontrol Cihazı, Geri Toplama Cihazı, Termostatlar.
- **Gözlenen markalar:** Embraco, Danfoss, Bitzer, Dorin, Mitsubishi, Errecom, Viessmann, Kayites, Teknik Isısan …

---

## 3. Yapı Eşlemesi (kaynak → bizim yapımız)

Bizim yapımız: **21 ana kategori**, iki seviyeli ağaç (`data/categories.json` →
`tree` + `flat`). Kaynak katalog neredeyse tümüyle bizim **"Yedek Parça"** ağacıyla
örtüşüyor; bu da dedup/fırsat için güçlü bir zemindir.

| Kaynak kategori ailesi | Hedef ana kategori | Hedef alt kategori (slug) |
| --- | --- | --- |
| Kompresörler (tüm tipler) | Yedek Parça | `yedek-parca--kompresorler` |
| Genleşme vanaları | Yedek Parça | `yedek-parca--genlesme-vanalari` |
| Vanalar / valfler | Yedek Parça | `yedek-parca--valfler` |
| Kurutucu filtreler (drayer) | Yedek Parça | `yedek-parca--kurutucu-filtreler-drayer` |
| Soğutucu akışkan (gaz) & yağ | Yedek Parça | `yedek-parca--sogutucu-akiskanlar` |
| Fan motorları / türbin / aksiyal / radyal | Yedek Parça | `yedek-parca--fan-motorlari-turbinler` |
| Presostat / manometre / basınç-sıcaklık kontrol | Yedek Parça | `yedek-parca--sicaklik-basinc-kontrol` |
| Fitings / bakır boru & bağlantı | Yedek Parça | `yedek-parca--borular-baglanti` |
| Servis ekipmanı (geri toplama, kaynak vb.) | Yedek Parça | `yedek-parca--servis-ekipmanlari` |
| Chiller / chiller kontrol | Chiller Soğutma | *(uygun alt kategori)* |
| Havalandırma fanı / aspiratör | Havalandırma | *(uygun alt kategori)* |
| Otomasyon / kontrol kartları | Otomasyon | *(uygun alt kategori)* |
| Eşleşmeyen / belirsiz | Diğer Ürünler | *(son çare; §6 filtresine takılırsa alınmaz)* |

> **Kural:** Eşleme belirsizse ürün **alınmaz** (yeni kategori uydurmak yerine
> §6 fırsat filtresine bırakılır). Kategori sayaçları (`count`) build sırasında
> gerçek üründen yeniden hesaplandığı için elle güncellenmez.

---

## 4. Özgün Açıklama Standardı (SEO / AEO / GEO)

Her ürün için **sıfırdan** yazılır; kaynaktan tek cümle bile kopyalanmaz.

- **`n` (ad):** Marka + model/kod + ürün tipi (ör. "Bitzer 4PES-12Y Yarı Hermetik Kompresör"). Kaynak site adı geçmez.
- **`sd` (kısa açıklama):** 1–2 cümle, ana kullanım + öne çıkan teknik değer. AEO için "nedir/ne işe yarar" sorusunu ilk cümlede yanıtlar.
- **`ld` (uzun açıklama):** Özgün paragraf(lar) + teknik künye (kapasite, soğutucu akışkan, bağlantı, voltaj/faz vb.) + tipik uygulama alanı. GEO için net, alıntılanabilir, iddiasız-doğru teknik ifadeler.
- **`kw` (anahtar kelimeler):** Model kodu varyasyonları + Türkçe eş anlamlılar + kategori terimleri (küçük harf, aramaya yardımcı).
- **Yasak:** Fiyat, stok taahhüdü ("stokta var", "hemen teslim"), kaynak/rakip adı, abartılı iddia, kopya metin.

---

## 5. Görsel Kuralları

- Kaynak: yalnızca **filigransız/logosuz**, temiz ürün görseli. Filigran varsa **alma**.
- Hedef yol: `assets/products/<id>/<marka>-<n>.jpg` + `_min.jpg` küçük görsel
  (`img` ve `th` alanları). `id`, mevcut `assets/products/` numaralandırmasıyla
  çakışmayacak şekilde verilir.
- Dosya adında kaynak site adı geçmez.
- Görsel yoksa ürün **görselsiz** eklenebilir (boş `img`/`th`) — uydurma/placeholder görsel konmaz.
- `build-catalog.mjs`, `assets/products` → `public/gorseller` kopyasını ilk üretimde otomatik yapar.

---

## 6. Dedup + Fırsat Filtresi (alınır / alınmaz kararı)

Bir ürün **yalnızca** şu iki koşuldan **en az biri** sağlanınca işlenir:

1. **Mevcut/benzer var:** Katalogdaki 9.856 üründe aynı/again benzer ürün var
   (aynı model kodu `c`, ya da aynı alt kategoride yakın model). → Katalog
   derinleşir, kategori güçlenir.
2. **Net SEO fırsatı var:** Model koduna/ürün terimine organik arama talebi var ve
   bizde bu ürün/eşleniği **yok**. → Boşluğu dolduran özgün sayfa.

**Dedup mantığı (öneri):** `c` (kod) normalize edilip mevcut kodlara bakılır; tam
eşleşme = kopya (alınmaz, sadece mevcut sayfayı zenginleştir). Yakın eşleşme =
"benzer var" (koşul 1 sağlanır). Hiç eşleşme + arama talebi yok = **alınmaz**.

> Bu filtre, "her şeyi dök" yerine katalogu **anlamlı** büyütür ve ince/zayıf
> sayfa üretimini engeller.

---

## 7. Onay Kapısı (yayın öncesi)

1. Aday ürünler hazırlanır (products.json'a **henüz yazılmadan**) → **özet tablo** sunulur:
   ad, hedef kategori, dedup/fırsat gerekçesi, görsel var/yok.
2. **Onay** alınır.
3. Onaylı ürünler `data/products.json`'a eklenir, görseller `assets/products/`'a konur.
4. **Ana sayfa** ve **markalar** sayfasına dokunulacaksa **ayrı onay** gerekir
   (yeni marka, markalar sayfasında ancak `lib/visible-brands.json` onayıyla görünür).
5. `npm run build` → `build-catalog.mjs` katalog verisini üretir → yayın.

---

## 8. Engel & İlerleme Seçenekleri (ÖNEMLİ)

**Bu ortamdan dihateknik.com'a doğrudan erişilemiyor:** çıkış proxy'si, host'u
organizasyon egress politikasıyla **reddediyor** (CONNECT 403 — hem WebFetch hem
curl). Dolayısıyla ürün sayfaları ve **görseller otomatik indirilemiyor**. Yapı
envanteri arama motoru index'inden çıkarıldı; **tam veri/görsel çekimi engelli**.

İlerlemek için seçenekler:
- **(A)** dihateknik.com host'unu bu ortamın **izinli listesine** ekletmek (ortam ağ
  politikası ayarı) → otomatik çekim + görsel indirme mümkün olur.
- **(B)** Kaynak veriyi **dışa aktarım** (CSV/XML/ürün listesi + görsel bağlantıları)
  olarak sağlamak → bu doküman kurallarıyla işlenir, `products.json`'a hazırlanır.
- **(C)** Belirli ürün/kategori URL'lerini **kopyala-yapıştır** ile vermek → sınırlı
  ölçekte örnek işleme.

---

## 9. Örnek Ürün — Yöntem Şablonu (henüz yayınlanmadı)

Aşağıda, kurallara göre işlenmiş **örnek** bir ürün kaydının hedef şeması gösterilir.
Bu kayıt **products.json'a eklenmemiştir** (§7 onay kapısı gereği); yalnızca yöntemi
gösterir. Model, "Yedek Parça → Kompresörler" alt kategorisinde **benzeri bulunan**
(dedup koşulu 1 ✓) temsili bir yarı hermetik kompresördür.

```jsonc
{
  "s": "bitzer-4pes-12y-yari-hermetik-kompresor",   // slug (kaynak adı yok)
  "n": "Bitzer 4PES-12Y Yarı Hermetik Kompresör",   // marka + model + tip
  "c": "4PES-12Y",                                   // model kodu (dedup anahtarı)
  "b": "bitzer",
  "bn": "Bitzer",                                    // markalar sayfasında ancak onayla görünür
  "img": "",                                          // filigransız temiz görsel yoksa boş
  "th": "",
  "cats": ["yedek-parca--kompresorler"],             // §3 eşlemesi
  "sd": "Orta/düşük sıcaklık ticari soğutma sistemleri için Ecoline serisi yarı hermetik pistonlu kompresör; yüksek verim ve geniş soğutucu akışkan uyumu sunar.",
  "ld": "4PES-12Y, Ecoline ailesinin 4 silindirli yarı hermetik pistonlu modelidir. Market soğutma, soğuk oda ve proses soğutma uygulamalarında, R404A/R507 gibi akışkanlarla kararlı kapasite ve düşük ses seviyesi hedefler. Kısmi yük verimi ve servis dostu tasarımıyla sürekli çalışan soğutma hatlarında tercih edilir. (Özgün metin — teknik künye ürün doğrulandıktan sonra netleştirilir.)",
  "kw": "bitzer 4pes-12y 4pes12y yari hermetik kompresor ecoline yarı hermetik ticari soğutma",
  "st": "Stokta Yok",                                // asla "Stokta" değil
  "pr": "",                                            // fiyat yok
  "tg": [],
  "dom": "yedek-parca",
  "f": {},                                             // teknik filtre alanları doğrulanınca doldurulur
  "pc": "yedek-parca--kompresorler"
}
```

**Neden bu ürün alınır (§6):** Katalogda "Kompresörler" alt kategorisi (~647 ürün)
zaten var → *mevcut/benzer var* koşulu sağlanıyor; yarı hermetik kompresör model
kodları organik arama çeken terimler → *SEO fırsatı* da var.

> Gerçek `img`/`f`/`ld` teknik künye alanları, ürün kaynaktan doğrulanıp
> (filigransız görsel + teknik veri) **onaydan** geçtikten sonra netleştirilir.
