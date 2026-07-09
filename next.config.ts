import './src/libs/Env';
import withBundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Allow next/image to load property photos served from the media host(s). The media files live on
// the public site domain (NEXT_PUBLIC_APP_URL) and/or the API host (NEXT_PUBLIC_API_URL); allow both
// hosts over either scheme so the optimizer accepts the URL regardless of how the backend builds it.
function mediaRemotePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const sources = [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_API_URL].filter(
    Boolean,
  );
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [];
  const seen = new Set<string>();
  for (const src of sources) {
    try {
      const { hostname, port } = new URL(src!);
      for (const protocol of ['http', 'https'] as const) {
        const key = `${protocol}//${hostname}:${port}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        patterns.push({ protocol, hostname, port: port || undefined, pathname: '/media/**' });
      }
    } catch {
      // ignore unparseable URLs
    }
  }
  return patterns;
}

// Production-only optimizations. In dev (`next dev`) these are skipped so iteration stays fast
// (Turbopack + Fast Refresh, no optimized standalone bundle).
const isProd = process.env.NODE_ENV === 'production';

// The backend origin the /api/v1 rewrite proxies to (server-side only). Keeps
// the browser same-origin so httpOnly auth cookies flow and the middleware can
// read them. Falls back to the public API URL's origin, then localhost.
function backendOrigin(): string {
  if (process.env.BACKEND_ORIGIN) {
    return process.env.BACKEND_ORIGIN.replace(/\/$/u, '');
  }
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').origin;
  } catch {
    return 'http://localhost:8000';
  }
}

const baseConfig: NextConfig = {
  output: isProd ? 'standalone' : undefined,
  // The Django API requires trailing slashes (and POST can't follow an
  // APPEND_SLASH redirect). Don't let Next strip the slash before the rewrite.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const backend = await Promise.resolve(backendOrigin());
    return [
      { source: '/api/v1/:path*/', destination: `${backend}/api/v1/:path*/` },
      { source: '/api/v1/:path*', destination: `${backend}/api/v1/:path*` },
    ];
  },
  devIndicators: {
    position: 'bottom-right',
  },
  poweredByHeader: false,
  reactStrictMode: isProd,
  reactCompiler: isProd,
  images: {
    remotePatterns: mediaRemotePatterns(),
    // Next 16 refuses to optimize images served from private/localhost IPs (SSRF guard). Allow it in
    // dev so the local backend's `/media` photos render; prod fetches from a public domain.
    dangerouslyAllowLocalIP: !isProd,
  },
  logging: {
    browserToTerminal: process.env.BROWSER_TO_TERMINAL_DISABLED !== 'true',
  },
  turbopack: {
    root: import.meta.dirname,
  },
};

let configWithPlugins = createNextIntlPlugin('./src/libs/I18n.ts')(baseConfig);

if (process.env.ANALYZE === 'true') {
  configWithPlugins = withBundleAnalyzer()(configWithPlugins);
}

const nextConfig = configWithPlugins;
export default nextConfig;
