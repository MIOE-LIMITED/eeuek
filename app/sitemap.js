import { POPULAR } from '@/lib/popular';
import PRODUCT_SLUGS from '@/lib/catalog-slugs.json';
import { recentSlugs } from '@/lib/store';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://klimasun.vercel.app';

const STATIC_PATHS = [
  ['/', 1, 'daily'],
  ['/urunler', 0.9, 'daily'],
  ['/kategoriler', 0.8, 'weekly'],
  ['/markalar', 0.8, 'weekly'],
  ['/cozumler', 0.7, 'monthly'],
  ['/blog', 0.7, 'weekly'],
  ['/iletisim', 0.6, 'monthly'],
  ['/asistan', 0.6, 'weekly'],
];

export default async function sitemap() {
  const now = new Date();

  const entries = STATIC_PATHS.map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  for (const slug of PRODUCT_SLUGS) {
    entries.push({
      url: `${SITE_URL}/urun/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  const slugs = new Set(POPULAR.map((p) => p.slug));
  try {
    for (const s of await recentSlugs(200)) slugs.add(s);
  } catch {
    // KV yoksa yalnızca popüler sorular listelenir.
  }
  for (const slug of slugs) {
    entries.push({
      url: `${SITE_URL}/soru/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  return entries;
}
