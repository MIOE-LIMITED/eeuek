import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POSTS, bySlug, trDate } from '@/lib/blog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://klimasun.vercel.app';

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.s }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) return { title: 'Yazı bulunamadı | Klimasun' };
  return {
    title: `${p.t} | Klimasun Blog`,
    description: (p.ex || '').slice(0, 155),
    alternates: { canonical: `/blog/${p.s}` },
    openGraph: { title: p.t, description: (p.ex || '').slice(0, 155), type: 'article' },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) notFound();

  const url = `${SITE_URL}/blog/${p.s}`;
  const related = POSTS.filter((x) => x.s !== p.s && x.cat === p.cat).slice(0, 3);
  const more = related.length ? related : POSTS.filter((x) => x.s !== p.s).slice(0, 3);

  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: p.t,
      description: p.ex || '',
      datePublished: p.d,
      dateModified: p.d,
      inLanguage: 'tr-TR',
      author: { '@type': 'Organization', name: 'Klimasun' },
      publisher: { '@type': 'Organization', name: 'Klimasun' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      articleSection: p.cat,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: p.t, item: url },
      ],
    },
    ...(p.faq?.length
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: p.faq.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          },
        ]
      : []),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="ks-pagehero">
        <div className="ks-wrap">
          <div className="ks-crumb">
            <Link href="/">Ana Sayfa</Link> / <Link href="/blog">Blog</Link> /{' '}
            <span className="ks-crumb-cur">{p.t}</span>
          </div>
          <div className="ks-post-meta">
            <span className="ks-tag rehber">{(p.cat || 'REHBER').toUpperCase()}</span>
            <span className="d">
              {trDate(p.d)}
              {p.read ? ` · ${p.read} DK` : ''}
            </span>
          </div>
          <h1>{p.t}</h1>
          {p.ex ? <p>{p.ex}</p> : null}
        </div>
      </div>

      <div className="ks-page-body">
        <article
          className="ks-article"
          dangerouslySetInnerHTML={{ __html: p.body || '' }}
        />

        {p.faq?.length ? (
          <section className="ks-article ks-faq">
            <h2>Sık Sorulan Sorular</h2>
            {p.faq.map((f, i) => (
              <div className="ks-faq-item" key={i}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>
        ) : null}

        {more.length ? (
          <section className="ks-post-more">
            <h2>İlgili yazılar</h2>
            <div className="ks-grid-3">
              {more.map((m) => (
                <Link className="ks-blogcard" href={`/blog/${m.s}`} key={m.s}>
                  <div className="ks-blogcard-body">
                    <div className="ks-blogcard-meta">
                      <span className="ks-tag rehber">{(m.cat || 'REHBER').toUpperCase()}</span>
                      <span className="d">{trDate(m.d)}</span>
                    </div>
                    <h3>{m.t}</h3>
                    <p>{m.ex}</p>
                    <span className="ks-readmore">
                      DEVAMINI OKU <span>→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
