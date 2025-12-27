/**
 * Next.js configuration with performance optimization
 * Includes code splitting, tree shaking, minification, and image optimization
 */

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
    // Optimize CSS
    optimizeCss: true,
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Tree shaking
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: true,
      providedExports: true,
    };

    // Code splitting
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        // Framework chunk
        framework: {
          name: 'framework',
          chunks: 'all',
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types)[\\/]/,
          priority: 40,
          enforce: true,
        },
        // Lib chunk
        lib: {
          test: /[\\/]node_modules[\\/](@babel|@emotion|@mui|@redux|@swc|@tanstack)[\\/]/,
          name: 'lib',
          priority: 30,
        },
        // Commons chunk
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 20,
          reuseExistingChunk: true,
        },
      },
    };

    // Production optimizations
    if (!isServer) {
      config.optimization.minimize = true;
      config.optimization.minimizer = [
        // Terser for JS minification
        require('terser-webpack-plugin'),
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
    // Optimize CSS
    optimizeCss: true,
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@heroicons/react'],
  },
};

module.exports = nextConfig;
