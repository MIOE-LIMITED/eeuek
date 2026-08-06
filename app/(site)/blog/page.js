import Link from 'next/link';
import { POSTS, trDate } from '@/lib/blog';
import BlogList from './BlogList';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://klimasun.vercel.app';

export const metadata = {
  title: 'Blog & Teknik Rehberler | Klimasun',
  description:
    'Pano iklimlendirme, soğutucu akışkanlar, kompresör seçimi, evaporatif soğutma ve F-Gaz mevzuatı üzerine teknik rehberler ve karşılaştırmalar.',
  alternates: { canonical: '/blog' },
};

function groupOf(cat) {
  const c = (cat || '').toLowerCase();
  if (/evaporatif|adyabat/.test(c)) return 'Evaporatif';
  if (/f-gaz|mevzuat/.test(c)) return 'Mevzuat';
  if (/servis|bakım|arıza/.test(c)) return 'Servis';
  if (/haber|yangın|güvenlik/.test(c)) return 'Haber';
  if (/teknik/.test(c)) return 'Teknik';
  return 'Rehber';
}

export default function BlogPage() {
  const light = POSTS.map((p) => ({
    s: p.s,
    t: p.t,
    ex: p.ex,
    date: trDate(p.d),
    read: p.read || null,
    g: groupOf(p.cat),
  }));
  const order = ['Rehber', 'Teknik', 'Evaporatif', 'Mevzuat', 'Servis', 'Haber'];
  const present = order.filter((g) => light.some((p) => p.g === g));
  const tabs = ['Tümü', ...present];

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Klimasun Blog',
    url: `${SITE_URL}/blog`,
    blogPost: POSTS.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.t,
      datePublished: p.d,
      url: `${SITE_URL}/blog/${p.s}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="ks-pagehero">
        <div className="ks-wrap">
          <div className="ks-crumb">
            <Link href="/">Ana Sayfa</Link> / <span className="ks-crumb-cur">Blog</span>
          </div>
          <h1>Blog &amp; Teknik Rehberler</h1>
          <p>
            Pano iklimlendirme, soğutucu akışkanlar, kompresör seçimi, evaporatif soğutma ve F-Gaz
            mevzuatı üzerine teknik rehberler, karşılaştırmalar ve sektör haberleri.
          </p>
        </div>
      </div>

      <BlogList posts={light} tabs={tabs} />
    </>
  );
}
