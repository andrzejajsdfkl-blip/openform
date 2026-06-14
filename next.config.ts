import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Configuration Options */
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Performance and optimization
  compress: true,
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['@genkit-ai/core', 'genkit', '@opentelemetry/sdk-node', '@opentelemetry/exporter-jaeger'],

  // Security headers via middleware
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects for legacy paths
  async redirects() {
    return [
      {
        source: '/documents',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
