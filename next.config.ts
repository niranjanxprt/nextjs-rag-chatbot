import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Vercel deployment optimizations
  experimental: {
    // Optimize bundle size and performance
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'react-markdown'],
  },

  // Bundle optimization
  compiler: {
    // Remove console logs in production
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Image optimization for Vercel
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Webpack optimizations for serverless
  webpack: (config, { dev, isServer }) => {
    // Resolve aliases for problematic packages
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false

    // Optimize bundle size in production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 244000, // 244KB chunks for better loading
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
            maxSize: 244000,
          },
        },
      }
    }

    // Serverless optimizations
    if (isServer) {
      // Externalize packages that should not be bundled
      config.externals = config.externals || []
      config.externals.push({
        'pdf-parse': 'commonjs pdf-parse',
        'sharp': 'commonjs sharp',
      })
    }

    return config
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Compression
  compress: true,

  // External packages that should not be bundled
  serverExternalPackages: ['pdf-parse', 'sharp'],

  // Static optimization
  trailingSlash: false,
  
  // Environment variable validation (disable for deployment)
  env: {
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION || 'false',
  },
}

export default nextConfig
