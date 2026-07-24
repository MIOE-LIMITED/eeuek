import { notFound } from 'next/navigation';
import ProductDetail from './ProductDetail';
import { getProduct } from '@/lib/catalog-server';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProduct(decodeURIComponent(slug));
  if (!p) return { title: 'Ürün bulunamadı' };
  return {
    title: `${p.n} | Klimasun`,
    description: (p.desc || `${p.n} — ${p.b}. Kurumsal teklif için ürünü sepete ekleyin.`).slice(0, 155),
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const p = await getProduct(decodeURIComponent(slug));
  if (!p) notFound();

  const product = {
    code: p.c,
    name: p.n,
    brand: p.b,
    category: p.cat,
    categoryHref: p.catSlug ? `/kategori/${p.catSlug}` : '/kategoriler',
    badge: p.stok ? 'STOKTAN TESLİM' : 'TEMİN EDİLEBİLİR',
    stok: Boolean(p.stok),
    cond: p.cond,
    description: p.desc,
    img: p.img,
    specs: Object.entries(p.f || {}),
    related: p.rel || [],
  };
  return <ProductDetail product={product} />;
}
