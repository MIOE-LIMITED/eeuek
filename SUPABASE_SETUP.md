# Bulut Modu Kurulumu (üyelik, onay, resim yükleme)

Demo modunda site hemen çalışır ama veriler tek cihazda kalır. **Paylaşımlı
üyelik, giriş, yönetici onayı, e-posta bildirimi ve resim yükleme** için
ücretsiz bir Supabase projesi bağlamanız yeterli. Tahmini süre: ~10 dakika.

## 1) Supabase projesi oluştur

1. https://supabase.com → ücretsiz hesap aç → **New project**.
2. Bir isim ve güçlü bir veritabanı şifresi belirle, bölge olarak sana yakın
   olanı seç. Proje hazırlanınca devam et.

## 2) Veritabanı şemasını kur

1. Sol menü → **SQL Editor** → **New query**.
2. Bu depodaki `supabase/schema.sql` dosyasının **tamamını** yapıştır ve
   **Run** ile çalıştır. Bu; tabloları, güvenlik kurallarını (RLS),
   `photos` adlı depolama alanını ve "ilk kaydolan = yönetici" tetikleyicisini
   oluşturur.

## 3) API anahtarlarını al ve config.js'e yaz

1. Sol menü → **Project Settings → API**.
2. **Project URL** ve **anon public** anahtarını kopyala.
3. Depodaki `config.js` dosyasını düzenle:

```js
supabaseUrl: "https://xxxx.supabase.co",
supabaseAnonKey: "eyJhbGciOi...",   // anon public
ownerEmail: "senin@eposta.com",     // yönetici e-postan
```

## 4) E-posta yetkilendirmesi (giriş için)

Supabase varsayılan olarak yeni kayıtlara **e-posta doğrulama** linki
gönderir. İki seçenek:

- **Hızlı test için:** Authentication → **Providers → Email** altında
  *"Confirm email"* seçeneğini kapatabilirsin (kayıt sonrası doğrulama
  gerekmez; yine de yönetici onayı sizin akışınızda devrede kalır).
- **Üretim için:** açık bırak; Authentication → **URL Configuration**
  kısmında **Site URL**'i yayınladığın adres yap (ör.
  `https://kullanici.github.io/eeuek/`).

> Not: Üyelik onayı sizin kuralınızdır (RLS). Bir kişi kaydolsa bile,
> siz **Üyeler** panelinden onaylamadıkça hiçbir veriye erişemez.

## 5) (Opsiyonel) Yeni kayıt e-posta bildirimi — EmailJS

Yeni biri kaydolunca **size e-posta** gitmesi için ücretsiz EmailJS:

1. https://www.emailjs.com → hesap aç.
2. **Email Services** → bir servis ekle (Gmail/Outlook vb.) → *Service ID*.
3. **Email Templates** → yeni şablon. Şu değişkenleri kullan:
   `{{to_email}}`, `{{user_email}}`, `{{user_name}}`, `{{app_url}}`.
   Örnek konu: *"Yeni üyelik onay bekliyor"*, içerik:
   *"{{user_name}} ({{user_email}}) kaydoldu. Onaylamak için: {{app_url}}"*.
   Şablonda "To Email" alanını `{{to_email}}` yap.
4. **Account → API Keys → Public Key**.
5. Bu üçünü `config.js` içine yaz:

```js
emailjs: { publicKey: "...", serviceId: "...", templateId: "..." },
```

EmailJS aynı şablonu, onaylanan üyeye "üyeliğiniz onaylandı" bilgisi için de
kullanır.

## 6) Yayınla

`config.js` dolu haliyle siteyi GitHub Pages / Netlify / Vercel'e gönder
(bkz. `README.md`). İlk kez **sen** kaydol → otomatik olarak **yönetici +
onaylı** olursun. Sonradan kaydolanlar **Üyeler** panelinde "Bekliyor"
görünür; **Onayla** dediğinde hesapları etkinleşir.

## Akış özeti

| Adım | Ne olur |
|------|---------|
| Biri "Üye ol" der | Supabase'de hesap açılır, durum **pending** olur |
| Sana e-posta gider | (EmailJS kuruluysa) `ownerEmail` adresine bildirim |
| Sen **Üyeler → Onayla** | Durum **approved** olur, kişi kendi ağacına erişir |
| Onaylanmadıkça | RLS sayesinde hiçbir veriye erişemez |

## Güvenlik notu

`anon public` anahtarı tarayıcıda görünür — bu normaldir. Gerçek koruma
veritabanındaki **RLS politikalarıdır**: her üye yalnızca kendi kişilerini,
albümlerini ve fotoğraflarını görebilir; yalnız yönetici üye durumlarını
değiştirebilir. `service_role` anahtarını **asla** `config.js`'e koymayın.
