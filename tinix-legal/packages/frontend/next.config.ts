import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // A plain array here is checked BEFORE this app's own dynamic API routes
      // (step 6 vs step 7 in Next's route resolution order — see
      // node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/rewrites.md).
      // That silently swallowed every request under /api/admin-proxy/[...path],
      // since the catch-all below matched first and forwarded the literal
      // "/api/admin-proxy/..." path straight to the backend, which has no such
      // route. `fallback` is checked only after this app's own routes, so admin
      // routes are handled locally and everything else still proxies through.
      fallback: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4001/api/:path*', // Proxy to Backend API
        },
      ],
    };
  },
};

export default nextConfig;
