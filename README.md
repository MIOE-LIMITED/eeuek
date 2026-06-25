# 🌳 Soyağacım

MyHeritage tarzı, **tamamen tarayıcıda çalışan** ücretsiz bir aile ağacı /
soyağacı uygulaması. Sunucu, veritabanı veya kayıt gerektirmez — bütün
veriler tarayıcınızın `localStorage` belleğinde saklanır. Bu sayede herhangi
bir **statik barındırma servisinde bedava** yayınlanabilir.

## Özellikler

- 👤 Kişi ekleme/düzenleme/silme (ad, soyad, cinsiyet, doğum/vefat tarihi,
  doğum yeri, fotoğraf URL'si, notlar)
- 🌳 Otomatik **aile ağacı görselleştirmesi** (eş ve çocuk bağlantıları)
- 🔗 Ebeveyn, eş, çocuk ve kardeş ilişkileri
- 🔍 Kişi arama ve liste görünümü
- 📊 İstatistik paneli (kişi sayısı, nesil, cinsiyet dağılımı vb.)
- 🔎 Yakınlaştırma/uzaklaştırma ve kök kişi seçimi
- 💾 JSON olarak **dışa/içe aktarma** (yedekleme & taşıma)
- 🧪 Tek tıkla örnek aile yükleme
- 📱 Mobil uyumlu, bağımlılıksız (saf HTML/CSS/JS)

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
index.html        # Arayüz
css/style.css     # Stiller
js/app.js         # Uygulama mantığı (veri, ağaç, formlar)
netlify.toml      # Netlify yapılandırması
vercel.json       # Vercel yapılandırması
```

## Lisans

MIT
