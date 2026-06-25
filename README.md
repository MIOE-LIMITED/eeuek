# 🌳 Soyağacım

MyHeritage tarzı, ücretsiz barındırılabilen bir aile ağacı / soyağacı
uygulaması. **İki modda** çalışır:

- **Demo modu (varsayılan):** Kurulum gerektirmez. Tamamen tarayıcıda çalışır,
  veriler `localStorage`'da saklanır. Tek kullanıcı, tek cihaz.
- **Bulut modu:** `config.js`'e ücretsiz bir **Supabase** projesi
  bağlandığında devreye girer. **Üyelik, giriş, yönetici onayı, e-posta
  bildirimi ve resim yükleme** açılır; her üyenin verisi kendine özeldir.
  Kurulum: **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)**.

## Özellikler

- 👤 Kişi ekleme/düzenleme/silme (ad, soyad, cinsiyet, doğum/vefat tarihi,
  doğum yeri, fotoğraf URL'si, notlar)
- 🌳 Otomatik **aile ağacı görselleştirmesi** (eş ve çocuk bağlantıları)
- 🔗 Ebeveyn, eş, çocuk ve kardeş ilişkileri
- 🖼️ **Albümler ve resim yükleme** (bulut modunda Supabase Storage'a,
  demo modunda tarayıcıya)
- 🔐 **Üyelik & giriş** + **yönetici onay paneli** (bulut modu)
- 📧 Yeni kayıtta yöneticiye **e-posta bildirimi** (EmailJS, opsiyonel)
- 🔍 Kişi arama ve liste görünümü
- 📊 İstatistik paneli (kişi sayısı, nesil, cinsiyet dağılımı vb.)
- 🔎 Yakınlaştırma/uzaklaştırma ve kök kişi seçimi
- 💾 JSON olarak **dışa/içe aktarma** (yedekleme & taşıma)
- 🧪 Tek tıkla örnek aile yükleme
- 📱 Mobil uyumlu

## Üyelik & onay akışı (bulut modu)

1. Ziyaretçi **Üye ol** der → hesabı **"onay bekliyor"** durumunda açılır.
2. Yöneticiye (size) e-posta gider (EmailJS kuruluysa).
3. Siz **Üyeler** panelinden **Onayla** dersiniz → üye kendi soyağacına ve
   albümlerine erişir. Onaylanana dek hiçbir veriye erişemez.
4. İlk kaydolan kişi otomatik **yönetici** olur (yani siz).

## Yerel Çalıştırma

Herhangi bir kurulum gerekmez. Dosyaları açın:

```bash
# Basit bir yerel sunucu (Python yüklüyse)
python3 -m http.server 8000
# Tarayıcıda: http://localhost:8000
```

Ya da `index.html` dosyasına çift tıklayarak doğrudan açabilirsiniz.

## Ücretsiz Yayınlama

Bu bir statik sitedir; aşağıdaki servislerin hepsinde **ücretsiz** barındırılır.

### GitHub Pages
1. Bu depoyu GitHub'a gönderin.
2. **Settings → Pages → Branch** kısmından ana dalı (`main`) ve `/ (root)`
   klasörünü seçin.
3. Birkaç dakika içinde `https://<kullanıcı-adınız>.github.io/<depo>/`
   adresinde yayında olur.

### Netlify
- [netlify.com](https://www.netlify.com) → "Add new site" → bu depoyu seçin.
  Build komutu **yok**, publish dizini: `.` (kök). `netlify.toml` hazırdır.

### Vercel
- [vercel.com](https://vercel.com) → "Import Project" → bu depo. Framework:
  **Other**. `vercel.json` hazırdır.

### Cloudflare Pages
- Pages → "Connect to Git" → bu depo. Build komutu yok, çıktı dizini: `/`.

## Veri Gizliliği

Tüm veriler yalnızca sizin tarayıcınızda kalır; hiçbir sunucuya gönderilmez.
Yedek almak için menüden **Dışa aktar (JSON)** seçeneğini kullanın. Başka bir
cihaza taşımak için bu JSON dosyasını **İçe aktar** ile yükleyin.

## Dosya Yapısı

```
index.html          # Arayüz (giriş, ağaç, albümler, yönetici)
config.js           # Supabase / EmailJS anahtarları (boşsa demo modu)
css/style.css       # Stiller
js/data.js          # Veri katmanı (Supabase ↔ localStorage soyutlaması)
js/app.js           # Uygulama mantığı (ağaç, albümler, formlar, kimlik)
supabase/schema.sql # Bulut modu için veritabanı + RLS + storage
SUPABASE_SETUP.md   # Bulut modu kurulum rehberi
netlify.toml        # Netlify yapılandırması
vercel.json         # Vercel yapılandırması
```

## Lisans

MIT
