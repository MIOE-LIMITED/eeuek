import ProductDetail from './ProductDetail';
import { SAMPLE_DETAIL, findProduct } from '@/lib/catalog';

// Kataloğda kod bulunursa başlık/marka gerçek üründen; teknik detaylar örnek üründen gelir.
function resolveProduct(rawCode) {
  const code = decodeURIComponent(rawCode);
  const found = findProduct(code);
  if (!found) return { ...SAMPLE_DETAIL };
  return {
    ...SAMPLE_DETAIL,
    code: found.code,
    name: found.name,
    brand: found.brand,
    badge: found.badge === 'Stoktan Teslim' ? 'STOKTAN TESLİM' : 'TEMİN EDİLEBİLİR',
  };
}

export async function generateMetadata({ params }) {
  const { code } = await params;
  const p = resolveProduct(code);
  return {
    title: p.name,
    description: p.description.slice(0, 155),
  };
}

export default async function ProductPage({ params }) {
  const { code } = await params;
  const product = resolveProduct(code);
  return <ProductDetail product={product} />;
}
