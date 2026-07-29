import Link from 'next/link';
import { getBrands } from '@/lib/catalog-server';
import BrandsBrowser from '@/app/components/site/BrandsBrowser';

export const metadata = {
  title: 'Markalar',
  description:
    'Çözüm ortağı markalarımız — RITTAL, Cosmotec, FORM, Carrier. Listede olmayan tüm markaların orijinal ürün ve yedek parçalarını da tedarik ediyoruz.',
};

export default async function MarkalarPage() {
  const brands = await getBrands();

  return (
    <>
      <div className="ks-pagehero">
        <div className="ks-wrap">
          <div className="ks-crumb">
            <Link href="/">Ana Sayfa</Link> / <span className="ks-crumb-cur">Markalar</span>
          </div>
          <h1>Markalar</h1>
          <p>
            Öne çıkan çözüm ortağı markalarımız. Kendi stoğumuz ve Avrupa&apos;daki uzman tedarikçi
            ağımızla, listede olmayan tüm markaların da orijinal ürün ve yedek parçalarını tek
            noktadan tedarik ediyoruz — parça kodunuzu iletmeniz yeterli.
          </p>
        </div>
      </div>

      <BrandsBrowser brands={brands} />
    </>
  );
}
