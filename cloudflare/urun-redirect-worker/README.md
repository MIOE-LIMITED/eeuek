# klimasun-urun-redirect

Eski URL'lerden yenilerine **gerçek HTTP 301** döndüren Cloudflare Worker'ı:

- `/urun/<slug>.html` → `/urun/<ana-kategori>/<alt-kategori>/<slug>.html` (9.799 ürün)
- Katalogdan kalkmış 20 bayat kategori sayfası → `/kategoriler.html`

Worker deploy edilmese de site çalışır (eski adreslerde meta-refresh + canonical
içeren yönlendirme stub'ları var); worker bunları SEO açısından ideal olan
gerçek 301'e çevirir. Route'lar sadece `/urun/*` ve `/kategori/*` yollarını
kapsar, sitenin geri kalanı worker'a uğramaz.

## Deploy

```bash
cd cloudflare/urun-redirect-worker
npx wrangler deploy
```

Gereksinim: `klimasun.com` zone'unun bulunduğu Cloudflare hesabında
`Workers Scripts:Edit` + `Workers Routes:Edit` yetkili bir API token
(`CLOUDFLARE_API_TOKEN` ortam değişkeni) veya `npx wrangler login`.

GitHub Actions ile otomatik deploy için mevcut workflow'a eklenebilecek adım:

```yaml
- name: Deploy redirect worker
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    workingDirectory: cloudflare/urun-redirect-worker
```

## Haritaların güncellenmesi

`src/redirects.json` → `node scripts/seo-product-urls.mjs`,
`src/kategori-redirects.json` → `node scripts/olu-linkleri-temizle.mjs`
tarafından üretilir; katalog yeniden oluşturulduğunda iki script'i çalıştırıp
worker'ı yeniden deploy etmek yeterli.
