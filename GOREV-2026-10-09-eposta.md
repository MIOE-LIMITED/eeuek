# GÖREV — klimasun.com e-posta kurulumu (09.10.2026)

**Kime:** İbrahim (klimasun.com'un bağlı olduğu Cloudflare hesabına erişimi olan kişi)
**Kimden:** Eşref Erdinç Uslu (hazırlayan: Claude)
**Neden:** IdeaSoft'tan (info@klimasun.com.tr) ve Yandex 360'tan (info@klimasun.com) çıkıyoruz; ikisine de bu yıl ücret ödenmeyecek. klimasun.com'a gelen tüm postalar **ücretsiz Cloudflare Email Routing** ile merkez kutuya, **info@erdincklima.com**'a yönlendirilecek.

> ⚠️ **Siteye dokunma.** Worker, A/AAAA, CNAME ve site kayıtları aynen kalacak. Yalnız aşağıdaki e-posta kayıtları değişecek.
> Her değişiklikten önce eski değeri bu dosyanın sonundaki "Geri alma" bölümüne not et.

## Yapılacaklar

| # | İş | ✓ |
|---|---|---|
| 1 | Cloudflare → **klimasun.com** → **Email → Email Routing → Get started** | ✓ |
| 2 | Custom address: `info` → Destination: `info@erdincklima.com` → Create. info@erdincklima.com'a gelen doğrulama postasındaki bağlantıyı Eşref Bey'e onaylat | ☐ |
| 3 | "Add records and enable" → Yandex MX (`mx.yandex.net`) silinsin, Cloudflare MX'leri (route1/2/3.mx.cloudflare.net) eklensin | ✓ |
| 4 | **Routing rules → Catch-all → Action: Send to email** `info@erdincklima.com` → **Enable** (diğer tüm adresler de merkeze gelsin) | ✓ |
| 5 | Kök SPF kaydı **tek kayıt** olsun: `v=spf1 include:_spf.mx.cloudflare.net ~all` | ✓ |
| 6 | **Email → DMARC Management → Enable**. Oluşan `_dmarc` kaydının sonuna `; np=reject` ekle (p=none kalsın) | ☐ |
| 7 | `mail._domainkey` TXT kaydını sil (eski Yandex DKIM, artık kullanılmayacak) | ✓ |
| 7a | DNS'e TXT ekle: ad `_smtp._tls`, değer `v=TLSRPTv1; rua=mailto:info@erdincklima.com` (TLS hata raporları) | ✓ |
| 7b | **DNS → Settings → DNSSEC → Enable**. Çıkan DS kaydını (Key tag, Algorithm 13, Digest type 2, Digest) Eşref Bey'e ilet; alan adının kayıt firmasına girilecek | ✓ |
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
- `mail._domainkey`: `v=DKIM1; k=rsa; t=s; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDE4FjlRaexJoB/aqwwlr+t8uW9XJpdrHerpuuQgNlidHi8tfIDej4AhYrE3ejal3uDr0kiWnZyuFJQDGwvN4FOw+tGcUo7jwvDPEk/MbCzYORP1iGXlMNUSPof97V1ghclD2hwEBYmJTaief1FTtT1RtyTaSlHMHFl4YtGH6fQbQIDAQAB`
- DNSSEC: Cloudflare'de kapat (önce Natro'dan DS kaydı kaldırılmalı, yoksa alan adı çözülmez)

## İlerleme (09.10.2026, İbrahim)

- 2: Hedef adres `info@erdincklima.com` Cloudflare'e eklendi, doğrulama postası gönderildi — **Eşref Bey onaylayacak**.
- 5, 7, 7a, 7b yapıldı.
- 7b DS kaydı (Natro'ya girilecek): Key tag `2371`, Algorithm `13`, Digest type `2`, Digest `4E2D51E2BDDCBE04180760B4BE172897E0B83FC2E0E1C11DB8EF7B94FDE191BB`
- 1, 3, 4 yapıldı (10.10): Email Routing açık, MX `route1/2/3.mx.cloudflare.net`, catch-all → `info@erdincklima.com`. Yanlış adla duran eski DKIM kopyası `mail.klimasun.com` TXT de silindi.
- **Bekleyen:** 2 (hedef adres doğrulaması — onaylanana kadar klimasun.com'a gelen posta teslim edilmez), 6 (DMARC), DS'nin Natro'ya girilmesi, 8 (test), 9 (merge).

## Bu daldaki kod değişikliği

Sitedeki 5 yerde `info@klimasun.com.tr` → `info@klimasun.com`:
`SiteHeader.jsx`, `SiteFooter.jsx`, `iletisim/page.js`, `ProductDetail.jsx`, `klimasun-2026/data/meta.json`.
**Yönlendirme çalışmadan merge etme**, yoksa formdan/siteden gelen müşteriler cevapsız kalır.

İş bitince bu dosyayı sil ya da durumu ✓ ile işaretleyip bırak.
