// Hızlı teklif taleplerinin kalıcı deposu — geçmişe dönük takip için.
// Her talep bağımsız bir referans numarasıyla (ör. TK-260806-K3X9) ve zaman
// damgasıyla saklanır. Depo önceliği (lib/store.js ile aynı desen):
//   1. Cloudflare KV binding (QA_KV)     — Workers'ta kalıcı depo.
//   2. Upstash/Vercel KV (REST)          — KV_REST_API_URL + TOKEN tanımlıysa.
//   3. Süreç-içi Map (ephemeral)         — hiçbiri yoksa (kalıcı olmaz).

const MEM = new Map();
const MEM_RECENT = [];

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const HAS_REST_KV = Boolean(KV_URL && KV_TOKEN);

const RECENT_KEY = 'quote:recent';
const RECENT_MAX = 1000;

async function cfKV() {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = getCloudflareContext();
    return env?.QA_KV || null;
  } catch {
    return null;
  }
}

async function rest(command) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`KV hatası ${res.status}`);
  return (await res.json()).result;
}

export async function saveQuote(record) {
  const ref = record.ref;
  if (!ref) throw new Error('ref gerekli');

  const kv = await cfKV();
  if (kv) {
    await kv.put(`quote:${ref}`, JSON.stringify(record));
    let recent = [];
    try {
      const raw = await kv.get(RECENT_KEY);
      if (raw) recent = JSON.parse(raw);
    } catch {
      recent = [];
    }
    recent = [ref, ...recent.filter((r) => r !== ref)].slice(0, RECENT_MAX);
    await kv.put(RECENT_KEY, JSON.stringify(recent));
    return;
  }

  if (HAS_REST_KV) {
    await rest(['SET', `quote:${ref}`, JSON.stringify(record)]);
    await rest(['LREM', RECENT_KEY, '0', ref]);
    await rest(['LPUSH', RECENT_KEY, ref]);
    await rest(['LTRIM', RECENT_KEY, '0', String(RECENT_MAX - 1)]);
    return;
  }

  MEM.set(ref, record);
  MEM_RECENT.unshift(ref);
  if (MEM_RECENT.length > RECENT_MAX) MEM_RECENT.length = RECENT_MAX;
}

export async function getQuote(ref) {
  if (!ref) return null;
  const kv = await cfKV();
  if (kv) {
    const raw = await kv.get(`quote:${ref}`);
    return raw ? JSON.parse(raw) : null;
  }
  if (HAS_REST_KV) {
    const raw = await rest(['GET', `quote:${ref}`]);
    return raw ? JSON.parse(raw) : null;
  }
  return MEM.get(ref) || null;
}

export async function recentQuoteRefs(limit = 100) {
  const kv = await cfKV();
  if (kv) {
    const raw = await kv.get(RECENT_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.slice(0, limit) : [];
  }
  if (HAS_REST_KV) {
    const list = await rest(['LRANGE', RECENT_KEY, '0', String(limit - 1)]);
    return Array.isArray(list) ? list : [];
  }
  return MEM_RECENT.slice(0, limit);
}

export async function recentQuotes(limit = 100) {
  const refs = await recentQuoteRefs(limit);
  const out = [];
  for (const ref of refs) {
    const q = await getQuote(ref);
    if (q) out.push(q);
  }
  return out;
}
