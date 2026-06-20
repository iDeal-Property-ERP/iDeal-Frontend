import './src/libs/Env';
import withBundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Allow next/image to load property photos served from the backend media host.
function mediaRemotePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8009/api/v1';
  try {
    const { protocol, hostname, port } = new URL(apiUrl);
    return [
      {
        protocol: protocol.replace(':', '') as 'http' | 'https',
        hostname,
        port: port || undefined,
        pathname: '/media/**',
      },
    ];
  } catch {
    return [];
  }
}

const baseConfig: NextConfig = {
  output: 'standalone',
  devIndicators: {
    position: 'bottom-right',
  },
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: process.env.NODE_ENV === 'production',
  images: {
    remotePatterns: mediaRemotePatterns(),
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
