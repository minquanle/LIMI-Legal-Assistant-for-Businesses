import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{source: '/:path*', headers: [
      {key: 'X-Content-Type-Options', value: 'nosniff'},
      {key: 'X-Frame-Options', value: 'DENY'},
      {key: 'Referrer-Policy', value: 'same-origin'},
      {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
      {key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains'},
    ]},
    // Images and icons rarely change and carry a ?v= version; scripts and styles keep revalidating (ETag)
    // because their version numbers are maintained by hand.
    {source: '/prototype/:file(.*\\.(?:png|svg|ico))', headers: [{key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400'}]}];
  },
};

export default nextConfig;
