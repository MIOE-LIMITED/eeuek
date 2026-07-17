import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;

// `next dev` sırasında Cloudflare bağlamını (env, bindings) sağlar.
// Yalnızca geliştirmede etkilidir; production build'i etkilemez.
initOpenNextCloudflareForDev();
