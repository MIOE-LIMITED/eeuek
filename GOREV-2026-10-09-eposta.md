# GÖREV — klimasun.com e-posta kurulumu (09.10.2026)

**Kime:** İbrahim (klimasun.com'un bağlı olduğu Cloudflare hesabına erişimi olan kişi)
**Kimden:** Eşref Erdinç Uslu (hazırlayan: Claude)
**Neden:** IdeaSoft'tan (info@klimasun.com.tr) ve Yandex 360'tan (info@klimasun.com) çıkıyoruz; ikisine de bu yıl ücret ödenmeyecek. klimasun.com'a gelen tüm postalar **ücretsiz Cloudflare Email Routing** ile merkez kutuya, **info@erdincklima.com**'a yönlendirilecek.

> ⚠️ **Siteye dokunma.** Worker, A/AAAA, CNAME ve site kayıtları aynen kalacak. Yalnız aşağıdaki e-posta kayıtları değişecek.
> Her değişiklikten önce eski değeri bu dosyanın sonundaki "Geri alma" bölümüne not et.

## Yapılacaklar

| # | İş | ✓ |
|---|---|---|
| 1 | Cloudflare → **klimasun.com** → **Email → Email Routing → Get started** | ☐ |
| 2 | Custom address: `info` → Destination: `info@erdincklima.com` → Create. info@erdincklima.com'a gelen doğrulama postasındaki bağlantıyı Eşref Bey'e onaylat | ☐ |
| 3 | "Add records and enable" → Yandex MX (`mx.yandex.net`) silinsin, Cloudflare MX'leri (route1/2/3.mx.cloudflare.net) eklensin | ☐ |
| 4 | **Routing rules → Catch-all → Action: Send to email** `info@erdincklima.com` → **Enable** (diğer tüm adresler de merkeze gelsin) | ☐ |
| 5 | Kök SPF kaydı **tek kayıt** olsun: `v=spf1 include:_spf.mx.cloudflare.net ~all` | ☐ |
| 6 | **Email → DMARC Management → Enable**. Oluşan `_dmarc` kaydının sonuna `; np=reject` ekle (p=none kalsın) | ☐ |
| 7 | `mail._domainkey` TXT kaydını sil (eski Yandex DKIM, artık kullanılmayacak) | ☐ |
| 7a | DNS'e TXT ekle: ad `_smtp._tls`, değer `v=TLSRPTv1; rua=mailto:info@erdincklima.com` (TLS hata raporları) | ☐ |
| 7b | **DNS → Settings → DNSSEC → Enable**. Çıkan DS kaydını (Key tag, Algorithm 13, Digest type 2, Digest) Eşref Bey'e ilet; alan adının kayıt firmasına girilecek | ☐ |
| 8 | Test: dışarıdan bir adresten `info@klimasun.com` ve `deneme@klimasun.com`'a posta at; ikisinin de info@erdincklima.com'a düştüğünü teyit et | ☐ |
| 9 | 8. adım başarılıysa bu daldaki PR'ı `main`'e merge et (sitedeki adres `info@klimasun.com` olur) | ☐ |

**Not:** klimasun.com'dan posta **gönderilmeyecek**; yalnız gelen posta yönlendirilecek.

## Mevcut durum (09.10.2026, canlı DNS)

| Kayıt | Değer | Sorun |
|---|---|---|
| MX | `mx.yandex.net` | Yandex 360 hesabı bakiye yetersiz → kısıtlı mod |
| SPF | `v=spf1 ip4:IP-1 ip4:IP-2 ip4:IP-3 include:_spf.yandex.net ~all` | **Bozuk** — `IP-1/2/3` yer tutucu, gerçek IP değil; kayıt geçersiz (permerror) |
| DMARC | yok | |
| DKIM | `mail._domainkey` (Yandex, 1024 bit) | |

## Geri alma (değiştirmeden önce doldur)

- MX: `10 mx.yandex.net`
- SPF: `v=spf1 ip4:IP-1 ip4:IP-2 ip4:IP-3 include:_spf.yandex.net ~all`
- `mail._domainkey`: (silmeden önce değeri buraya kopyala)

## Bu daldaki kod değişikliği

Sitedeki 5 yerde `info@klimasun.com.tr` → `info@klimasun.com`:
`SiteHeader.jsx`, `SiteFooter.jsx`, `iletisim/page.js`, `ProductDetail.jsx`, `klimasun-2026/data/meta.json`.
**Yönlendirme çalışmadan merge etme**, yoksa formdan/siteden gelen müşteriler cevapsız kalır.

İş bitince bu dosyayı sil ya da durumu ✓ ile işaretleyip bırak.
