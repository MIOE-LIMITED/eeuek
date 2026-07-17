// Ürün detayı sunucu tarafı erişimi.
// Detay verisi public/veri/detay/N.json parçalarında durur (N = slug hash % 64).
// - Build / `next dev` / `next start`: dosya sisteminden okunur.
// - Cloudflare Workers: ASSETS binding'i üzerinden statik varlık olarak çekilir.

const SHARDS = 64;
const cache = new Map();

// scripts/build-catalog.mjs içindeki shardOf ile birebir aynı olmalı.
function shardOf(slug) {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) h = ((h * 33) ^ slug.charCodeAt(i)) >>> 0;
  return h % SHARDS;
}

async function loadShard(n) {
  if (cache.has(n)) return cache.get(n);
  let data;
  try {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    data = JSON.parse(readFileSync(join(process.cwd(), 'public/veri/detay', `${n}.json`), 'utf8'));
  } catch {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = getCloudflareContext();
    const res = await env.ASSETS.fetch(`https://assets.local/veri/detay/${n}.json`);
    if (!res.ok) throw new Error(`Detay parçası ${n} okunamadı (${res.status})`);
    data = await res.json();
  }
  cache.set(n, data);
  return data;
}

export async function getProduct(slug) {
  if (!slug) return null;
  const shard = await loadShard(shardOf(slug));
  return shard[slug] || null;
}
