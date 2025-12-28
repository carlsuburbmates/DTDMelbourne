/**
 * Next.js configuration with performance optimization
 * Includes code splitting, tree shaking, minification, and image optimization
 */

const TerserPlugin = require('terser-webpack-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode
  reactStrictMode: true,

  // SWC Minification (faster than Terser)
  swcMinify: true,

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    // Enable remote image domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Image formats
    formats: ['image/avif', 'image/webp'],
    // Device sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimum cache TTL (in seconds)
    minimumCacheTTL: 60,
    // Maximum cache TTL (in seconds)
    dangerouslyAllowSVG: true,
  },

  // Code splitting
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Production optimizations
    if (!isServer) {
      config.optimization.minimize = true;
      config.optimization.minimizer = [
        // Terser for JS minification
        new TerserPlugin(),
      ];
    }

    return config;
  },

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Compression
  compress: true,

  // Powered by header
  poweredByHeader: false,

  // ETag generation
  generateEtags: true,

  // Output mode
  output: 'standalone',

  // Headers for caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'mdx'],

  // Experimental features
  experimental: {
    // Optimize server components
    serverComponentsExternalPackages: [],
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
};

module.exports = nextConfig;
