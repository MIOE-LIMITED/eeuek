/**
 * klimasun.com eski URL'ler için gerçek 301 yönlendirme worker'ı.
 *  - /urun/<slug>.html (düz)            -> /urun/<ana-kategori>/<alt-kategori>/<slug>.html
 *  - /kategori/<bayat-slug>.html (ölü)  -> /kategoriler.html
 * Eşleşmeyen her istek origin'e (statik site) aynen geçer.
 * Haritalar scripts/seo-product-urls.mjs ve scripts/olu-linkleri-temizle.mjs tarafından üretilir.
 */
import URUN from './redirects.json';
import KATEGORI from './kategori-redirects.json';

const HOST = 'https://klimasun.com';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    let m = url.pathname.match(/^\/urun\/([a-z0-9-]+)\.html$/);
    if (m && URUN[m[1]]) {
      return Response.redirect(`${HOST}/urun/${URUN[m[1]]}/${m[1]}.html${url.search}`, 301);
    }

    m = url.pathname.match(/^\/kategori\/([a-z0-9-]+)\.html$/);
    if (m && KATEGORI[m[1]]) {
      return Response.redirect(`${HOST}${KATEGORI[m[1]]}${url.search}`, 301);
    }

    return fetch(request);
  }
};
