// Ürünün SEO uyumlu adresi: /urun/<ana-kategori>/<alt-kategori>/<slug>
// path: build-catalog.mjs'in ürettiği "ana-kategori/alt-kategori" dizesi.
// Eski düz /urun/<slug> adresleri, urun/[...path] rotasında buraya 301'lenir.
export function purl(path, slug) {
  return path ? `/urun/${path}/${slug}` : `/urun/${slug}`;
}
