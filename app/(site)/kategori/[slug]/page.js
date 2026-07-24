import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findCategory } from '@/lib/catalog-server';
import CategoryProducts from './CategoryProducts';

const TR = 'tr-TR';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = await findCategory(decodeURIComponent(slug));
  if (!cat) return { title: 'Kategori bulunamadı' };
  return {
    title: `${cat.name} | Klimasun`,
    description: `${cat.name} kategorisinde ${cat.count.toLocaleString(TR)} ürün — fiyat için teklif sepetine ekleyin, aynı gün dönüş yapalım.`,
  };
}

export default async function KategoriPage({ params }) {
  const { slug } = await params;
  const cat = await findCategory(decodeURIComponent(slug));
  if (!cat) notFound();

  return (
    <>
      <div className="ks-pagehero">
        <div className="ks-wrap">
          <div className="ks-crumb">
            <Link href="/">Ana Sayfa</Link> / <Link href="/kategoriler">Kategoriler</Link>
            {cat.parent && (
              <>
                {' '}/ <Link href={`/kategori/${cat.parent.slug}`}>{cat.parent.name}</Link>
              </>
            )}{' '}
            / <span className="ks-crumb-cur">{cat.name}</span>
          </div>
          <h1>{cat.name}</h1>
          <p>
            Bu kategoride {cat.count.toLocaleString(TR)} ürün listeleniyor. Fiyat görmek için
            ürünleri teklif sepetine ekleyin — teklifiniz aynı gün hazırlanır.
          </p>
        </div>
      </div>

      {cat.children.length > 0 && (
        <div className="ks-crumb-bar">
          <div className="ks-wrap ks-subcat-bar">
            <span className="ks-subcat-lbl">ALT KATEGORİLER:</span>
            {cat.children.map((c) => (
              <Link href={`/kategori/${c.slug}`} className="ks-subtag" key={c.slug}>
                {c.name} ({c.count.toLocaleString(TR)})
              </Link>
            ))}
          </div>
        </div>
      )}

      <CategoryProducts slug={cat.slug} />
    </>
  );
}
