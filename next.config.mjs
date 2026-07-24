import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;

// Cloudflare bağlamını (env, bindings) yalnızca `next dev` sırasında sağlar.
// Sadece geliştirmede çağrılır; `next build`/`next start` sırasında miniflare
// başlatmaya çalışıp (workerd) gereksiz yere takılmasını önler.
if (process.env.NODE_ENV === 'development') {
  initOpenNextCloudflareForDev();
}
